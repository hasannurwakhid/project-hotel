import express from "express";
import reservationRoutes from "./reservationRoutes";

const router = express.Router();

router.use("/reservations", reservationRoutes);

export default router;
