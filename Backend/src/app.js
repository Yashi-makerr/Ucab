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

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL,        // set in Render dashboard: https://ucab-frontend.onrender.com
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, mobile apps, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, true); // Permissive for now — tighten in production if needed
    },
    credentials: true,
}));
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