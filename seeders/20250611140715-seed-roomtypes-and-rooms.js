"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const deluxeId = uuidv4();
    const standardId = uuidv4();

    // Seed RoomTypes
    await queryInterface.bulkInsert("RoomTypes", [
      {
        id: deluxeId,
        name: "Deluxe",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: standardId,
        name: "Standard",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Seed Rooms
    await queryInterface.bulkInsert("Rooms", [
      {
        id: uuidv4(),
        roomNumber: "101",
        roomTypeId: deluxeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        roomNumber: "102",
        roomTypeId: deluxeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        roomNumber: "201",
        roomTypeId: standardId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Hapus Rooms dulu karena FK ke RoomTypes
    await queryInterface.bulkDelete("Rooms", null, {});
    await queryInterface.bulkDelete("RoomTypes", null, {});
  },
};
