import { Sequelize } from "sequelize";
import * as dotenv from "dotenv";
const dbConfigRaw = require("../../config/config.js");
import { RoomType, initRoomType } from "./roomtype";
import { Room, initRoom } from "./room";
import { Reservation, initReservation } from "./reservation";
import { Payment, initPayment } from "./payment";

dotenv.config(); // muat .env

const env = "development";
const dbConfig = dbConfigRaw[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
  }
);

// Init models
initRoomType(sequelize);
initRoom(sequelize);
initReservation(sequelize);
initPayment(sequelize);

// Relasi
Room.belongsTo(RoomType, { foreignKey: "roomTypeId" });
Reservation.belongsTo(Room, { foreignKey: "roomId" });
Reservation.hasMany(Payment, { foreignKey: "reservationId" });
Payment.belongsTo(Reservation, { foreignKey: "reservationId" });

export { sequelize, RoomType, Room, Reservation, Payment };
