import { Request, Response } from "express";
import { sequelize, Reservation, Payment, Room, RoomType } from "../models";
import { QueryTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

export const createReservation = async (req: Request, res: Response) => {
  try {
    const { roomId, checkInDate, checkOutDate, totalAmount, initialPayment } =
      req.body;

    if (!roomId || !checkInDate || !checkOutDate || !totalAmount) {
      res.status(400).json({
        message:
          "roomId, checkInDate, checkOutDate, and totalAmount are required",
      });
      return;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      res.status(400).json({
        message: "Check-out date must be after check-in date",
      });
      return;
    }

    if (checkIn < new Date()) {
      res.status(400).json({
        message: "Check-in date cannot be in the past",
      });
      return;
    }

    const [roomResult] = await sequelize.query(
      `SELECT * FROM "Rooms" WHERE id = :roomId LIMIT 1`,
      {
        replacements: { roomId },
        type: QueryTypes.SELECT,
      }
    );

    if (!roomResult) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    const conflicts = await sequelize.query(
      `
      SELECT id, "checkInDate", "checkOutDate" FROM "Reservations"
      WHERE "roomId" = :roomId AND (
        ("checkInDate" <= :checkInDate AND "checkOutDate" > :checkInDate)
        OR ("checkInDate" < :checkOutDate AND "checkOutDate" >= :checkOutDate)
        OR ("checkInDate" >= :checkInDate AND "checkOutDate" <= :checkOutDate)
      )
      `,
      {
        replacements: { roomId, checkInDate, checkOutDate },
        type: QueryTypes.SELECT,
      }
    );

    if (conflicts.length > 0) {
      res.status(409).json({
        message: "Room is not available for the selected dates",
        conflictingReservations: conflicts,
      });
      return;
    }

    const reservation = await Reservation.create({
      id: uuidv4(),
      roomId,
      checkInDate,
      checkOutDate,
      totalAmount,
    });

    if (initialPayment && initialPayment > 0) {
      if (initialPayment > totalAmount) {
        res.status(400).json({
          message: "Initial payment cannot exceed total amount",
        });
        return;
      }

      await Payment.create({
        id: uuidv4(),
        reservationId: reservation.id,
        amount: initialPayment,
        paidAt: new Date(),
      });
    }

    res.status(201).json({
      message: "Reservation created successfully",
      reservation,
      paymentSummary: {
        totalAmount: totalAmount,
        initialPayment: initialPayment || 0,
        outstanding: totalAmount - (initialPayment || 0),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating reservation" });
  }
};

export const getReservationsByDate = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    res.status(400).json({ message: "startDate and endDate are required" });
    return;
  }

  try {
    const reservations = await sequelize.query(
      `
      select r.id, r."checkInDate", r."checkOutDate", r."totalAmount", r2."roomNumber", rt."name" as "roomType", coalesce(sum(p.amount), 0) as "totalPaid", r."totalAmount"-coalesce(sum(p.amount), 0) as outstanding from "Reservations" r 
join "Rooms" r2 on r."roomId" = r2.id
join "RoomTypes" rt on r2."roomTypeId" = rt.id
left join "Payments" p on p."reservationId" = r.id
where 
r."checkInDate" BETWEEN :startDate AND :endDate or
r."checkOutDate" BETWEEN :startDate AND :endDate OR
(r."checkInDate" <= :startDate AND r."checkOutDate" >= :endDate)
group by r.id, r2.id, rt.id
order by r."checkInDate" asc
      `,
      {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      }
    );

    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const addPaymentToReservation = async (req: Request, res: Response) => {
  const { id: reservationId } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({
      message: "Amount is required and must be greater than 0",
    });
    return;
  }

  try {
    const reservationList = await sequelize.query(
      `
      SELECT r.*, COALESCE(SUM(p.amount), 0) AS "totalPaid"
      FROM "Reservations" r
      LEFT JOIN "Payments" p ON r.id = p."reservationId"
      WHERE r.id = :reservationId
      GROUP BY r.id
      `,
      {
        replacements: { reservationId },
        type: QueryTypes.SELECT,
      }
    );

    const reservation: any = reservationList[0];

    if (!reservation) {
      res.status(404).json({ message: "Reservation not found" });
      return;
    }

    const outstanding = reservation.totalAmount - reservation.totalPaid;

    if (amount > outstanding) {
      res.status(400).json({
        message: `Payment amount (${amount}) exceeds outstanding balance (${outstanding})`,
        outstandingBalance: outstanding,
      });
      return;
    }

    const payment = await Payment.create({
      id: uuidv4(),
      reservationId,
      amount,
      paidAt: new Date(),
    });

    const newTotalPaid = reservation.totalPaid + amount;
    const newOutstanding = reservation.totalAmount - newTotalPaid;

    res.status(201).json({
      message: "Payment added successfully",
      payment,
      paymentSummary: {
        totalAmount: reservation.totalAmount,
        totalPaid: newTotalPaid,
        outstanding: newOutstanding,
        isFullyPaid: newOutstanding === 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding payment to reservation" });
  }
};
