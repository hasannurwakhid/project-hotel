import express from "express";
import {
  getReservationsByDate,
  createReservation,
  addPaymentToReservation,
} from "../controllers/reservationController";

const router = express.Router();

router.post("/", createReservation);
router.get("/", getReservationsByDate);
router.post("/:id/payments", addPaymentToReservation);

export default router;
