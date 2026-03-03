const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "driver", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      default: "",
    },
    // ── Driver-specific fields ────────────────────────────────────────────────
    vehicle: {
      type: { type: String, enum: ["mini", "sedan", "suv", "auto"], default: "mini" },
      model: { type: String, default: "" },   // e.g. "Maruti Swift"
      color: { type: String, default: "" },   // e.g. "White"
      plate: { type: String, default: "" },   // e.g. "DL 3C AB 1234"
    },
    rating: { type: Number, default: 4.8 },
    totalTrips: { type: Number, default: 0 },
    // Avatar: initials color (generated) or a URL
    avatarColor: { type: String, default: "" },
    profilePhotoUrl: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);