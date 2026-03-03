import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Card from "../components/Card";
import socket from "../services/socket";
import API from "../services/api";

const DriverPanel = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const [autoLocate, setAutoLocate] = useState(false);
  const [activeRides, setActiveRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [completing, setCompleting] = useState({});
  const watchRef = useRef(null);
  const autoIntervalRef = useRef(null);

  useEffect(() => {
    setConnected(socket.connected);
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  // Load accepted rides for this driver
  useEffect(() => {
    fetchActiveRides();
  }, []);

  const fetchActiveRides = async () => {
    setLoadingRides(true);
    try {
      const { data } = await API.get("/rides/driver/stats");
      const accepted = (data.rides || []).filter(r => r.status === "accepted");
      setActiveRides(accepted);
    } catch {
      // Not a driver or not logged in - ignore silently
    } finally {
      setLoadingRides(false);
    }
  };

  // ── Real GPS watch ────────────────────────────────────────────────
  const startGPSWatch = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    if (watchRef.current) return; // already watching

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newLat = pos.coords.latitude.toFixed(6);
        const newLng = pos.coords.longitude.toFixed(6);
        setLat(newLat);
        setLng(newLng);
        // Auto-broadcast if autoLocate is on
        if (autoLocate) {
          socket.emit("driverLocationUpdate", { lat: Number(newLat), lng: Number(newLng) });
          setUpdateCount(c => c + 1);
        }
      },
      (err) => {
        toast.error("Could not get GPS: " + (err.message || "Check permissions"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    );
    toast.success("📡 GPS watching started");
  };

  const stopGPSWatch = () => {
    if (watchRef.current) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  };

  // ── One-shot "get my location" ────────────────────────────────────
  const getMyLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        toast.success("📍 Location detected!");
      },
      () => toast.error("Could not get location. Check browser permissions.")
    );
  };

  const sendLocation = (latVal = lat, lngVal = lng) => {
    if (!latVal || !lngVal) { toast.error("Enter latitude and longitude first"); return; }
    setSending(true);
    socket.emit("driverLocationUpdate", { lat: Number(latVal), lng: Number(lngVal) });
    setUpdateCount((c) => c + 1);
    setTimeout(() => setSending(false), 400);
  };

  // ── Toggle auto-broadcast via GPS ─────────────────────────────────
  const toggleAutoSend = () => {
    if (autoLocate) {
      // Stop
      clearInterval(autoIntervalRef.current);
      stopGPSWatch();
      setAutoLocate(false);
      toast("🔴 Auto GPS broadcast stopped");
    } else {
      // Start real GPS watch + broadcast every 3s
      startGPSWatch();
      clearInterval(autoIntervalRef.current);
      autoIntervalRef.current = setInterval(() => {
        if (lat && lng) {
          socket.emit("driverLocationUpdate", { lat: Number(lat), lng: Number(lng) });
          setUpdateCount(c => c + 1);
        }
      }, 3000);
      setAutoLocate(true);
      toast.success("🟢 Auto-broadcasting real GPS every 3s");
    }
  };

  useEffect(() => {
    // Keep the interval's reference to current lat/lng
    if (autoLocate && lat && lng) {
      // The interval callback uses the closed-over lat/lng. We need to restart on change.
      clearInterval(autoIntervalRef.current);
      autoIntervalRef.current = setInterval(() => {
        socket.emit("driverLocationUpdate", { lat: Number(lat), lng: Number(lng) });
        setUpdateCount(c => c + 1);
      }, 3000);
    }
  }, [lat, lng, autoLocate]);

  useEffect(() => {
    return () => {
      clearInterval(autoIntervalRef.current);
      stopGPSWatch();
    };
  }, []);

  // ── Mark Ride as Completed ────────────────────────────────────────
  const completeRide = async (rideId) => {
    setCompleting(prev => ({ ...prev, [rideId]: true }));
    try {
      await API.put(`/rides/complete/${rideId}`);
      // Emit socket event so user panel gets notified immediately
      socket.emit("rideCompletedByDriver", { rideId });
      toast.success("✅ Ride marked as completed! Passenger notified.");
      fetchActiveRides();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete ride");
    } finally {
      setCompleting(prev => ({ ...prev, [rideId]: false }));
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 page-enter">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white mb-1">Driver Panel</h1>
            <p className="text-slate-400 text-sm">Manage rides and broadcast your GPS location</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${connected
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            {connected ? "Socket Connected" : "Disconnected"}
          </div>
        </div>

        {/* Online toggle */}
        <div className={`rounded-3xl p-6 border transition-all duration-500 ${isOnline
          ? "bg-emerald-500/10 border-emerald-500/25 shadow-[0_0_30px_rgba(52,211,153,0.1)]"
          : "glass border-white/8"
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-white mb-0.5">
                {isOnline ? "🟢 You're Online" : "🔴 You're Offline"}
              </p>
              <p className="text-slate-400 text-sm">
                {isOnline ? "Riders can see you and book rides" : "Go online to start accepting rides"}
              </p>
            </div>
            <button
              onClick={() => { setIsOnline((o) => !o); toast(isOnline ? "You're now offline" : "You're now online! 🚗"); }}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-dark-500 ${isOnline ? "bg-emerald-500" : "bg-slate-700"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${isOnline ? "translate-x-7" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {/* Active Rides — Mark Complete */}
        {!loadingRides && activeRides.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              🚗 Active Rides
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{activeRides.length}</span>
            </h2>
            {activeRides.map(ride => (
              <div key={ride._id} className="glass rounded-2xl border border-blue-500/20 overflow-hidden">
                <div className="h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500" />
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
                        <p className="text-xs text-slate-400">Pickup</p>
                      </div>
                      <p className="text-sm text-white font-medium line-clamp-1 ml-4">{ride.pickup}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0"></span>
                        <p className="text-xs text-slate-400">Drop</p>
                      </div>
                      <p className="text-sm text-white font-medium line-clamp-1 ml-4">{ride.drop}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-black text-blue-400">₹{ride.fare}</p>
                      <p className="text-xs text-slate-400">{ride.distance} km</p>
                    </div>
                  </div>
                  {ride.userId && (
                    <div className="flex items-center gap-2 bg-white/3 rounded-xl px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">
                        {(ride.userId?.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{ride.userId?.name || "Passenger"}</p>
                        {ride.userId?.phone && <p className="text-xs text-slate-400">{ride.userId.phone}</p>}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => completeRide(ride._id)}
                    disabled={completing[ride._id]}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-95 disabled:opacity-60 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    {completing[ride._id] ? (
                      <>🔄 Completing...</>
                    ) : (
                      <>✅ Mark as Reached — Ride Completed</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GPS Location sender */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <span>📡</span> Share Live GPS Location
          </h2>

          {/* Current GPS Display */}
          {lat && lng && (
            <div className="mb-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-emerald-400 text-lg">📍</span>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Current GPS</p>
                <p className="text-emerald-300 font-mono text-sm font-bold">{lat}, {lng}</p>
              </div>
              {autoLocate && (
                <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Latitude</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 17.385044"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Longitude</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 78.486671"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" onClick={getMyLocation} icon="📍" fullWidth>
              Detect My GPS
            </Button>
            <Button onClick={() => sendLocation()} loading={sending} icon="📡" fullWidth>
              Send Once
            </Button>
          </div>
        </Card>

        {/* Auto-send GPS */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">Auto-Broadcast Real GPS</p>
              <p className="text-xs text-slate-400 mt-0.5">Continuously watches your device GPS and broadcasts every 3s to all riders</p>
            </div>
            <Button
              variant={autoLocate ? "danger" : "success"}
              size="sm"
              onClick={toggleAutoSend}
            >
              {autoLocate ? "⏹ Stop" : "▶ Start"}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-dark-300 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-white">{updateCount}</p>
              <p className="text-xs text-slate-400">Updates Sent</p>
            </div>
            <div className="bg-dark-300 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-white">{autoLocate ? "3s" : "—"}</p>
              <p className="text-xs text-slate-400">Interval</p>
            </div>
            <div className="bg-dark-300 rounded-xl p-3 text-center">
              <p className={`text-sm font-black ${autoLocate ? "text-emerald-400" : "text-slate-500"}`}>
                {autoLocate ? "● Live" : "Paused"}
              </p>
              <p className="text-xs text-slate-400">GPS Status</p>
            </div>
          </div>
        </Card>

        {/* Info tip */}
        <div className="glass-blue rounded-2xl p-4 text-sm text-blue-300 flex items-start gap-3">
          <span className="text-xl mt-0.5">💡</span>
          <div>
            <p className="font-semibold text-blue-200 mb-0.5">How it works</p>
            <p className="text-blue-300/70 text-xs leading-relaxed">
              When you click <strong>▶ Start</strong>, your real device GPS is tracked and broadcast via Socket.io every 3 seconds. Open the <strong>Live Tracking</strong> page in another tab to see the driver icon move in real-time. When you mark a ride as <strong>Completed</strong>, the passenger is instantly notified and the admin dashboard updates too.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DriverPanel;