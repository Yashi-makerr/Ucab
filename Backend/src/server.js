const dotenv = require("dotenv");
dotenv.config();

// ─── Startup Diagnostics ─────────────────────────────────────────────────────
console.log("[STARTUP] JWT_SECRET loaded:", process.env.JWT_SECRET ? `'${process.env.JWT_SECRET}'` : "❌ UNDEFINED — check your .env file!");
console.log("[STARTUP] MONGO_URI loaded: ", process.env.MONGO_URI ? "✅ Present" : "❌ UNDEFINED — check your .env file!");
console.log("[STARTUP] NODE_ENV:", process.env.NODE_ENV || "development (default)");
// ─────────────────────────────────────────────────────────────────────────────

const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const app = require("./app");

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.FRONTEND_URL,     // https://ucab-frontend.onrender.com
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: false,
  }
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // ── Driver broadcasts real GPS location ──────────────────────────
  socket.on("driverLocationUpdate", (data) => {
    console.log("Driver location:", data);
    // Broadcast to all clients
    io.emit("receiveDriverLocation", data);
  });

  // ── Driver marks ride as completed ───────────────────────────────
  // Broadcasts to ALL clients: user panel shows "Ride Completed"
  // and admin panel shows "Successfully Reached"
  socket.on("rideCompletedByDriver", (data) => {
    console.log("Ride completed by driver:", data);
    io.emit("rideCompleted", {
      rideId: data.rideId,
      message: "Rider has successfully reached the destination!",
      timestamp: new Date().toISOString(),
    });
    console.log(`[Socket] rideCompleted broadcast for ride ${data.rideId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});