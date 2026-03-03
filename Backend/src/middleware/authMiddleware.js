const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[AUTH] No token or missing Bearer prefix in Authorization header");
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // ✅ Log BEFORE verify — so the secret prints even when verify fails
    console.log("[AUTH] Token received:", token.substring(0, 20) + "...");
    console.log("[AUTH] Using JWT_SECRET:", process.env.JWT_SECRET ? `'${process.env.JWT_SECRET}'` : "⚠️  UNDEFINED — .env not loaded!");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("[AUTH] Token verified successfully for user:", decoded.id, "| role:", decoded.role);

    req.user = decoded;
    next();

  } catch (error) {
    // Specific error classification makes debugging much easier
    if (error.name === "TokenExpiredError") {
      console.log("[AUTH] ❌ Token has EXPIRED at:", error.expiredAt);
      return res.status(401).json({ message: "Token expired, please login again" });
    }

    if (error.name === "JsonWebTokenError") {
      console.log("[AUTH] ❌ Invalid token signature — JWT_SECRET mismatch or tampered token");
      console.log("[AUTH]    Error detail:", error.message);
      return res.status(401).json({ message: "Invalid token" });
    }

    console.log("[AUTH] ❌ Unknown JWT error:", error.message);
    return res.status(401).json({ message: "Not authorized" });
  }
};

module.exports = { protect };