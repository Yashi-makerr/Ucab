const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const rideRoutes = require("./routes/rideRoutes");
const driverRoutes = require("./routes/driverRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const couponRoutes = require("./routes/couponRoutes");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { seedCoupons } = require("./controllers/couponController");

const app = express();

app.use(cors());
app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coupons", couponRoutes);

// ─── Seed default data ────────────────────────────────────────────────────────
seedCoupons().catch(err => console.warn("Coupon seed warning:", err.message));

// ─── Error Handling (MUST be last) ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;