const express = require("express");
const {
    createRide, completeRide, cancelRide,
    getMyRides, getAllRides, getRideById,
    getPendingRides, acceptRide, getDriverStats,
} = require("../controllers/rideController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// ── User routes ───────────────────────────────────────────────────────────────
router.post("/create", protect, createRide);
router.get("/my", protect, getMyRides);
router.put("/cancel/:rideId", protect, cancelRide);

// ── Driver routes — MUST be defined BEFORE "/:rideId" wildcard ────────────────
router.get("/pending", protect, authorize("driver", "admin"), getPendingRides);
router.put("/accept/:rideId", protect, authorize("driver", "admin"), acceptRide);
router.put("/complete/:rideId", protect, authorize("driver", "admin"), completeRide);
router.get("/driver/stats", protect, authorize("driver", "admin"), getDriverStats);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get("/all", protect, authorize("admin"), getAllRides);

// ── Wildcard — MUST be LAST so it doesn't catch /pending, /all, /driver/* ─────
router.get("/:rideId", protect, getRideById);

module.exports = router;