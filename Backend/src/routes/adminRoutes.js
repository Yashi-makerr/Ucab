const express = require("express");
const { getAdminStats, getAllUsers, getAllRides, getAllDrivers, createTestDriver } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// All admin routes: must be logged in AND be admin
router.use(protect, authorize("admin"));

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.get("/rides", getAllRides);
router.get("/drivers", getAllDrivers);
router.post("/drivers/seed", createTestDriver);  // creates a test driver for booking

module.exports = router;