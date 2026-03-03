const Coupon = require("../models/Coupon");

// ─── SEED DEFAULT COUPONS (run once) ─────────────────────────────────────────
const seedCoupons = async () => {
    const defaults = [
        { code: "FIRST50", type: "percent", value: 50, maxDiscount: 100, minFare: 50, description: "50% off your first ride (max ₹100)" },
        { code: "UCAB20", type: "percent", value: 20, maxDiscount: 80, minFare: 100, description: "20% off on rides above ₹100" },
        { code: "FLAT30", type: "flat", value: 30, maxDiscount: 30, minFare: 80, description: "Flat ₹30 off on rides above ₹80" },
        { code: "RIDE10", type: "percent", value: 10, maxDiscount: 50, minFare: 0, description: "10% off any ride" },
        { code: "WELCOME", type: "flat", value: 50, maxDiscount: 50, minFare: 0, description: "Welcome bonus ₹50 off" },
    ];
    for (const c of defaults) {
        await Coupon.updateOne({ code: c.code }, { $setOnInsert: c }, { upsert: true });
    }
};

// ─── VALIDATE / APPLY COUPON ──────────────────────────────────────────────────
const validateCoupon = async (req, res) => {
    try {
        const { code, fare } = req.body;
        if (!code) return res.status(400).json({ message: "Coupon code is required" });

        const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true });
        if (!coupon) return res.status(404).json({ message: "Invalid or expired coupon code" });
        if (coupon.usedCount >= coupon.usageLimit)
            return res.status(400).json({ message: "Coupon usage limit reached" });
        if (new Date() > coupon.expiresAt)
            return res.status(400).json({ message: "This coupon has expired" });
        if (fare < coupon.minFare) return res.status(400).json({ message: `Minimum fare ₹${coupon.minFare} required for this coupon` });

        let discount = 0;
        if (coupon.type === "percent") {
            discount = Math.min(Math.round(fare * coupon.value / 100), coupon.maxDiscount);
        } else {
            discount = Math.min(coupon.value, coupon.maxDiscount);
        }

        res.json({
            valid: true,
            code: coupon.code,
            description: coupon.description,
            discount,
            finalFare: Math.max(0, fare - discount),
            message: `🎉 Coupon applied! You save ₹${discount}`,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── GET ALL ACTIVE COUPONS (for display) ────────────────────────────────────
const getActiveCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({ isActive: true }).select("-__v -usedCount");
        res.json({ coupons });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { validateCoupon, getActiveCoupons, seedCoupons };
