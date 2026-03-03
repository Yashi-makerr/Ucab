const Payment = require("../models/Payment");
const Ride = require("../models/Ride");

// ─── CREATE / PROCESS PAYMENT ────────────────────────────────────────────────
const createPayment = async (req, res) => {
  try {
    const { rideId, paymentMethod } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // Prevent duplicate payments
    const existing = await Payment.findOne({ rideId, status: "completed" });
    if (existing) {
      return res.status(400).json({ message: "Payment already completed for this ride" });
    }

    const taxRate = 0.05;
    const convFee = 2;
    const total = Math.round(ride.fare + ride.fare * taxRate) + convFee;

    const payment = await Payment.create({
      rideId,
      amount: total,
      paymentMethod: paymentMethod || "cash",
      status: "completed",
    });

    // Mark ride as completed after payment
    if (ride.status !== "completed") {
      ride.status = "completed";
      await ride.save();
    }

    res.status(201).json({ message: "Payment successful", payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET PAYMENT FOR A RIDE ──────────────────────────────────────────────────
const getPayment = async (req, res) => {
  try {
    const { rideId } = req.params;
    const payment = await Payment.findOne({ rideId });
    if (!payment) return res.status(404).json({ message: "No payment found for this ride" });
    res.json({ payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET ALL PAYMENTS (Admin) ────────────────────────────────────────────────
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }).populate("rideId", "pickup drop fare");
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPayment, getPayment, getAllPayments };