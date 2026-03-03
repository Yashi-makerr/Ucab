const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi"],
      default: "cash"
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);