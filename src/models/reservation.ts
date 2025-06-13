import { DataTypes, Model, Sequelize } from "sequelize";
import { Payment } from "./payment";
import { Room } from "./room";

export class Reservation extends Model {
  public id!: string;
  public roomId!: string;
  public checkInDate!: string;
  public checkOutDate!: string;
  public totalAmount!: number;

  public Payments?: Payment[];
  public Room?: Room;

  public static associate() {
    Reservation.belongsTo(Room, {
      foreignKey: "roomId",
      as: "Room",
    });

    Reservation.hasMany(Payment, {
      foreignKey: "reservationId",
      as: "Payments",
    });
  }
}

export function initReservation(sequelize: Sequelize) {
  Reservation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roomId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      checkInDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      checkOutDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Reservation",
      tableName: "Reservations",
      timestamps: true,
      paranoid: true,
    }
  );
}
