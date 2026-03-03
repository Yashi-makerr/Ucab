const Driver = require("../models/Driver");

// CREATE DRIVER
exports.createDriver = async (req, res) => {
  try {
    const { name, location } = req.body;

    const driver = await Driver.create({
      name,
      location,
      isAvailable: true
    });

    res.status(201).json({
      message: "Driver created successfully",
      driver
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};