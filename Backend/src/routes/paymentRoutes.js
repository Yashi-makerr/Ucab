const express = require("express");
const { createPayment, getPayment, getAllPayments } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/pay", protect, createPayment);
router.get("/:rideId", protect, getPayment);
router.get("/admin/all", protect, authorize("admin"), getAllPayments);

module.exports = router;