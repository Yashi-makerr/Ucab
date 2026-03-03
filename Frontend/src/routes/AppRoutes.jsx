import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import PrivateRoute from "../components/PrivateRoute";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import BookRide from "../pages/BookRide";
import LiveTracking from "../pages/LiveTracking";
import DriverPanel from "../pages/DriverPanel";
import AdminPanel from "../pages/AdminPanel";
import RideHistory from "../pages/RideHistory";
import Receipt from "../pages/Receipt";

const toastOpts = {
  duration: 3500,
  style: {
    background: "#1e1e2e",
    color: "#f1f5f9",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
  },
  success: { iconTheme: { primary: "#4ade80", secondary: "#1e1e2e" } },
  error: { iconTheme: { primary: "#f87171", secondary: "#1e1e2e" } },
};

const AppRoutes = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={toastOpts} />
      <Routes>
        {/* ── Public ─────────────────────────────────────────────── */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Any authenticated user ──────────────────────────────── */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/track" element={<PrivateRoute><LiveTracking /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><RideHistory /></PrivateRoute>} />
        <Route path="/receipt/:rideId" element={<PrivateRoute><Receipt /></PrivateRoute>} />

        {/* ── User & Admin only (not driver) ──────────────────────── */}
        <Route path="/book" element={
          <PrivateRoute roles={["user", "admin"]}>
            <BookRide />
          </PrivateRoute>
        } />

        {/* ── Driver + Admin ───────────────────────────────────────── */}
        <Route path="/driver" element={
          <PrivateRoute roles={["driver", "admin"]}>
            <DriverPanel />
          </PrivateRoute>
        } />

        {/* ── Admin only ───────────────────────────────────────────── */}
        <Route path="/admin" element={
          <PrivateRoute roles={["admin"]}>
            <AdminPanel />
          </PrivateRoute>
        } />

        {/* ── Fallback ─────────────────────────────────────────────── */}
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default AppRoutes;