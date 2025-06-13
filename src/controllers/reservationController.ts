import { Request, Response } from "express";
import { Reservation, Payment, Room, RoomType } from "../models";
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

    const room = await Room.findByPk(roomId);
    if (!room) {
      res.status(404).json({
        message: "Room not found",
      });
      return;
    }

    // Cek konflik reservasi
    const conflictingReservations = await Reservation.findAll({
      where: {
        roomId: roomId,
        [Op.or]: [
          // Reservasi baru dimulai di tengah reservasi yang sudah ada
          {
            checkInDate: {
              [Op.lte]: checkInDate,
            },
            checkOutDate: {
              [Op.gt]: checkInDate,
            },
          },
          // Reservasi baru berakhir di tengah reservasi yang sudah ada
          {
            checkInDate: {
              [Op.lt]: checkOutDate,
            },
            checkOutDate: {
              [Op.gte]: checkOutDate,
            },
          },
          // Reservasi baru mencakup seluruh reservasi yang sudah ada
          {
            checkInDate: {
              [Op.gte]: checkInDate,
            },
            checkOutDate: {
              [Op.lte]: checkOutDate,
            },
          },
        ],
      },
    });

    if (conflictingReservations.length > 0) {
      res.status(409).json({
        message: "Room is not available for the selected dates",
        conflictingReservations: conflictingReservations.map((r) => ({
          id: r.id,
          checkInDate: r.checkInDate,
          checkOutDate: r.checkOutDate,
        })),
      });
      return;
    }

    // Buat reservasi jika tidak ada konflik
    const reservation = await Reservation.create({
      id: uuidv4(),
      roomId,
      checkInDate,
      checkOutDate,
      totalAmount,
    });

    // Buat pembayaran awal jika ada
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
    const reservations = await Reservation.findAll({
      where: {
        [Op.or]: [
          {
            checkInDate: {
              [Op.between]: [startDate, endDate],
            },
          },
          {
            checkOutDate: {
              [Op.between]: [startDate, endDate],
            },
          },
          {
            checkInDate: {
              [Op.lte]: startDate,
            },
            checkOutDate: {
              [Op.gte]: endDate,
            },
          },
        ],
      },
      include: [
        {
          model: Room,
          include: [RoomType],
        },
        {
          model: Payment,
        },
      ],
    });

    const result = reservations.map((resv) => {
      const totalPaid =
        resv.Payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const outstanding = resv.totalAmount - totalPaid;

      return {
        id: resv.id,
        checkInDate: resv.checkInDate,
        checkOutDate: resv.checkOutDate,
        totalAmount: resv.totalAmount,
        totalPaid,
        outstanding,
        room: {
          roomNumber: resv.Room?.roomNumber,
          roomType: resv.Room?.RoomType?.name,
        },
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const addPaymentToReservation = async (req: Request, res: Response) => {
  try {
    const { id: reservationId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({
        message: "Amount is required and must be greater than 0",
      });
      return;
    }

    const reservation = await Reservation.findByPk(reservationId, {
      include: [
        {
          model: Payment,
        },
      ],
    });

    if (!reservation) {
      res.status(404).json({
        message: "Reservation not found",
      });
      return;
    }

    const totalPaid =
      reservation.Payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const outstanding = reservation.totalAmount - totalPaid;

    if (amount > outstanding) {
      res.status(400).json({
        message: `Payment amount (${amount}) exceeds outstanding balance (${outstanding})`,
        outstandingBalance: outstanding,
      });
      return;
    }

    const payment = await Payment.create({
      id: uuidv4(),
      reservationId: reservationId,
      amount: amount,
      paidAt: new Date(),
    });

    const newOutstanding = outstanding - amount;
    const newTotalPaid = totalPaid + amount;

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
