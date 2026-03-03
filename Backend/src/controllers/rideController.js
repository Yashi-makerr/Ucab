const Ride = require("../models/Ride");
const User = require("../models/User");
const Driver = require("../models/Driver");
const { findNearestDriver } = require("../services/driverMatchingService");

// ─── Safe driver projection ───────────────────────────────────────────────────
const DRIVER_SAFE_FIELDS = "name phone rating totalTrips vehicle avatarColor profilePhotoUrl isVerified";

// ─── CREATE RIDE ──────────────────────────────────────────────────────────────
exports.createRide = async (req, res) => {
  try {
    const {
      pickup, drop, distance,
      pickupLat, pickupLng, dropLat, dropLng,
      vehicleType, couponCode, discountAmt,
    } = req.body;

    if (!pickup || !drop || !distance) {
      return res.status(400).json({ message: "Pickup, drop, and distance are required" });
    }

    const baseFare = 50;
    const perKmRate = 10;
    const multipliers = { mini: 1, sedan: 1.3, suv: 1.6, auto: 0.7 };
    const multiplier = multipliers[vehicleType] || 1;
    const rawFare = Math.round((baseFare + distance * perKmRate) * multiplier);
    const discount = Number(discountAmt) || 0;
    const fare = Math.max(0, rawFare - discount);

    // Try to auto-assign nearest driver (non-blocking)
    let nearestDriver = null;
    let rideStatus = "pending";
    try {
      nearestDriver = await findNearestDriver({ lat: pickupLat || 0, lng: pickupLng || 0 });
      if (nearestDriver) {
        rideStatus = "accepted";
        nearestDriver.isAvailable = false;
        await nearestDriver.save();
      }
    } catch { /* driver matching failed silently — ride stays pending */ }

    const ride = await Ride.create({
      pickup,
      drop,
      distance,
      fare,
      vehicleType: vehicleType || "mini",
      status: rideStatus,
      driverId: nearestDriver?._id || null,
      userId: req.user?.id || null,
      couponCode: couponCode || null,
      discountAmt: discount,
      pickupLat: pickupLat != null ? Number(pickupLat) : null,
      pickupLng: pickupLng != null ? Number(pickupLng) : null,
      dropLat: dropLat != null ? Number(dropLat) : null,
      dropLng: dropLng != null ? Number(dropLng) : null,
    });

    res.status(201).json({
      message: nearestDriver
        ? "Ride assigned to a driver successfully!"
        : "Ride booked! Finding a driver for you...",
      ride,
      driver: nearestDriver || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET MY RIDES (user) — populate driver details ───────────────────────────
exports.getMyRides = async (req, res) => {
  try {
    const rides = await Ride.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("driverId", DRIVER_SAFE_FIELDS)
      .lean();
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET ALL RIDES (admin) ────────────────────────────────────────────────────
exports.getAllRides = async (req, res) => {
  try {
    const rides = await Ride.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("driverId", DRIVER_SAFE_FIELDS)
      .populate("userId", "name email phone")
      .lean();
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET SINGLE RIDE BY ID ────────────────────────────────────────────────────
exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate("driverId", DRIVER_SAFE_FIELDS)
      .lean();
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    res.json({ ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── COMPLETE RIDE ────────────────────────────────────────────────────────────
exports.completeRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    ride.status = "completed";
    await ride.save();

    // Free up Driver (legacy) entry if exists
    if (ride.driverId) {
      const driverDoc = await Driver.findById(ride.driverId);
      if (driverDoc) { driverDoc.isAvailable = true; await driverDoc.save(); }
      // Increment trip count on User model
      await User.findByIdAndUpdate(ride.driverId, { $inc: { totalTrips: 1 } }).catch(() => { });
    }

    const populated = await Ride.findById(rideId)
      .populate("driverId", DRIVER_SAFE_FIELDS)
      .populate("userId", "name email phone")
      .lean();
    res.json({ message: "Ride completed successfully", ride: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── CANCEL RIDE ──────────────────────────────────────────────────────────────
exports.cancelRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.status === "completed") {
      return res.status(400).json({ message: "Cannot cancel a completed ride" });
    }

    ride.status = "cancelled";
    await ride.save();

    if (ride.driverId) {
      const driverDoc = await Driver.findById(ride.driverId);
      if (driverDoc) { driverDoc.isAvailable = true; await driverDoc.save(); }
    }

    res.json({ message: "Ride cancelled", ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET PENDING RIDES (driver sees these to accept) ─────────────────────────
exports.getPendingRides = async (req, res) => {
  try {
    const rides = await Ride.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("userId", "name phone avatarColor")
      .lean();
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── ACCEPT RIDE ──────────────────────────────────────────────────────────────
exports.acceptRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.status !== "pending") {
      return res.status(400).json({ message: `Ride is already ${ride.status}` });
    }

    ride.status = "accepted";
    ride.driverId = req.user.id;
    await ride.save();

    const populated = await Ride.findById(rideId)
      .populate("driverId", DRIVER_SAFE_FIELDS)
      .populate("userId", "name phone avatarColor")
      .lean();

    res.json({ message: "Ride accepted! Head to pickup location.", ride: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── DRIVER STATS ─────────────────────────────────────────────────────────────
exports.getDriverStats = async (req, res) => {
  try {
    const driverId = req.user.id;
    const myRides = await Ride.find({ driverId }).sort({ createdAt: -1 });

    const completed = myRides.filter(r => r.status === "completed");
    const active = myRides.filter(r => r.status === "accepted");
    const earnings = completed.reduce((s, r) => s + (r.fare || 0), 0);

    res.json({
      totalRides: myRides.length,
      completedRides: completed.length,
      activeRides: active.length,
      totalEarnings: earnings,
      rides: myRides.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};