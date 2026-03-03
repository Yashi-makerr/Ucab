const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",       // drivers are Users with role=driver
      default: null,
    },
    pickup: { type: String, required: true },
    drop: { type: String, required: true },
    distance: { type: Number, required: true },
    fare: { type: Number, required: true },
    vehicleType: {
      type: String,
      enum: ["mini", "sedan", "suv", "auto"],
      default: "mini",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "cancelled"],
      default: "pending",
    },

    // ── GPS coordinates (stored from booking) ─────────────────────────────────
    pickupLat: { type: Number, default: null },
    pickupLng: { type: Number, default: null },
    dropLat: { type: Number, default: null },
    dropLng: { type: Number, default: null },

    // ── Coupon / Discount ──────────────────────────────────────────────────────
    couponCode: { type: String, default: null },
    discountAmt: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ride", rideSchema);