const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true },
        description: { type: String, default: "" },
        type: { type: String, enum: ["percent", "flat"], default: "percent" },
        value: { type: Number, required: true },   // % or flat ₹ amount
        maxDiscount: { type: Number, default: 500 },     // cap for percent coupons
        minFare: { type: Number, default: 0 },       // minimum fare required
        usageLimit: { type: Number, default: 100 },
        usedCount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
