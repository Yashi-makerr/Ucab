const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const Payment = require("../models/Payment");
const User = require("../models/User");

// ─── ADMIN STATS ──────────────────────────────────────────────────────────────
const getAdminStats = async (req, res) => {
  try {
    const [totalRides, completedRides, pendingRides, cancelledRides,
      totalDrivers, availableDrivers, totalUsers, payments] = await Promise.all([
        Ride.countDocuments(),
        Ride.countDocuments({ status: "completed" }),
        Ride.countDocuments({ status: "pending" }),
        Ride.countDocuments({ status: "cancelled" }),
        Driver.countDocuments(),
        Driver.countDocuments({ isAvailable: true }),
        User.countDocuments({ role: "user" }),
        Payment.find({ status: "completed" }),
      ]);

    const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);

    res.json({
      totalRides, completedRides, pendingRides, cancelledRides,
      totalDrivers, availableDrivers,
      totalUsers, totalRevenue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET ALL USERS ────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET ALL RIDES ────────────────────────────────────────────────────────────
const getAllRides = async (req, res) => {
  try {
    const rides = await Ride.find().sort({ createdAt: -1 }).limit(100);
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET ALL DRIVERS ──────────────────────────────────────────────────────────
const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.json({ drivers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── CREATE TEST DRIVER (for seeding) ────────────────────────────────────────
const createTestDriver = async (req, res) => {
  try {
    const { name, lat = 17.385, lng = 78.4867 } = req.body;
    const driver = await Driver.create({
      name: name || "Test Driver",
      location: { lat: Number(lat), lng: Number(lng) },
      isAvailable: true,
    });
    res.status(201).json({ message: "Test driver created", driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAdminStats, getAllUsers, getAllRides, getAllDrivers, createTestDriver };