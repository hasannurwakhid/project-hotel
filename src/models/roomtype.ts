import { DataTypes, Model, Sequelize } from "sequelize";

export class RoomType extends Model {
  public id!: string;
  public name!: string;
}

export function initRoomType(sequelize: Sequelize) {
  RoomType.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "RoomType",
      tableName: "RoomTypes",
      timestamps: true,
      paranoid: true,
    }
  );
}
