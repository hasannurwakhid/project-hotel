import { DataTypes, Model, Sequelize } from "sequelize";

import { RoomType } from "./roomtype";


export class Room extends Model {
  public id!: string;
  public roomNumber!: string;
  public roomTypeId!: string;

  public RoomType?: RoomType;
}

export function initRoom(sequelize: Sequelize) {
  Room.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roomNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roomTypeId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Room",
      tableName: "Rooms",
      timestamps: true,
      paranoid: true,
    }
  );
}
