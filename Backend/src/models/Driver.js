const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: String,
    location: {
      lat: Number,
      lng: Number
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);