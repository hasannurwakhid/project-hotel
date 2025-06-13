'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Reservation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Reservation.init({
    roomId: DataTypes.UUID,
    checkInDate: DataTypes.DATEONLY,
    checkOutDate: DataTypes.DATEONLY,
    totalAmount: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'Reservation',
  });
  return Reservation;
};