import { DataTypes, Model, Sequelize } from "sequelize";
import { Reservation } from "./reservation";

export class Payment extends Model {
  public id!: string;
  public reservationId!: string;
  public amount!: number;
  public paidAt!: Date;

  public Reservation?: Reservation;
}

export function initPayment(sequelize: Sequelize) {
  Payment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      reservationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Payment",
      tableName: "Payments",
      timestamps: true,
      paranoid: true,
    }
  );
}
