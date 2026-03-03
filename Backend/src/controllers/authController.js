const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ── Avatar colour palette ─────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#ef4444", "#6366f1", "#14b8a6",
];
const randomColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

// ─── REGISTER ─────────────────────────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  try {
    const {
      name, email, password, role,
      phone,
      vehicleType, vehicleModel, vehicleColor, vehiclePlate,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const allowedRoles = ["user", "driver", "admin"];
    const assignedRole = allowedRoles.includes(role) ? role : "user";

    const userData = {
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
      phone: phone || "",
      avatarColor: randomColor(),
    };

    // Save vehicle info for drivers
    if (assignedRole === "driver") {
      userData.vehicle = {
        type: vehicleType || "mini",
        model: vehicleModel || "",
        color: vehicleColor || "",
        plate: vehiclePlate || "",
      };
    }

    const user = await User.create(userData);

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarColor: user.avatarColor,
    };

    res.status(201).json({
      message: "Account created successfully",
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarColor: user.avatarColor,
        vehicle: user.vehicle,
        rating: user.rating,
        totalTrips: user.totalTrips,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── UPDATE PROFILE (driver adds vehicle info after registration) ──────────────
exports.updateProfile = async (req, res) => {
  try {
    const { phone, vehicleType, vehicleModel, vehicleColor, vehiclePlate } = req.body;
    const updates = {};
    if (phone) updates.phone = phone;
    if (vehicleType || vehicleModel || vehicleColor || vehiclePlate) {
      updates.vehicle = {
        type: vehicleType || "",
        model: vehicleModel || "",
        color: vehicleColor || "",
        plate: vehiclePlate || "",
      };
    }
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json({ message: "Profile updated", user: { name: user.name, phone: user.phone, vehicle: user.vehicle } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};