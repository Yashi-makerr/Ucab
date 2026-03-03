const express = require("express");
const { validateCoupon, getActiveCoupons } = require("../controllers/couponController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/validate", protect, validateCoupon);
router.get("/active", protect, getActiveCoupons);

module.exports = router;
