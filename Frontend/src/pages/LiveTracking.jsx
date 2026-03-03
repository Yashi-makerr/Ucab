import { useEffect, useState, useRef, useCallback } from "react";
import Layout from "../components/Layout";
import socket from "../services/socket";
import toast from "react-hot-toast";
import API from "../services/api";

/* ── Map canvas renderer ──────────────────────────────────────────── */
const TrackingMap = ({ routePoints, driverGPS, userGPS, isCompleted }) => {
  const canvasRef = useRef(null);
  const animFrame = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // ── Background ──────────────────────────────────────────────────
    ctx.fillStyle = "#0d0d18";
    ctx.fillRect(0, 0, W, H);

    // ── Grid lines (city block feel) ────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // If we have no route points, show waiting state
    if (!routePoints || routePoints.length < 2) {
      ctx.font = "bold 16px Inter, sans-serif";
      ctx.fillStyle = "rgba(148,163,184,0.6)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("📡 Waiting for GPS signal...", W / 2, H / 2);
      ctx.font = "12px Inter, sans-serif";
      ctx.fillStyle = "rgba(100,116,139,0.5)";
      ctx.fillText("Allow location access to see your route", W / 2, H / 2 + 30);
      animFrame.current = requestAnimationFrame(draw);
      return;
    }

    const pad = 60;
    const allPts = [...routePoints];
    if (driverGPS) allPts.push(driverGPS);

    const minLat = Math.min(...allPts.map(p => p.lat));
    const maxLat = Math.max(...allPts.map(p => p.lat));
    const minLng = Math.min(...allPts.map(p => p.lng));
    const maxLng = Math.max(...allPts.map(p => p.lng));

    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;

    const toCanvas = (lat, lng) => ({
      x: pad + ((lng - minLng) / lngRange) * (W - pad * 2),
      y: H - pad - ((lat - minLat) / latRange) * (H - pad * 2),
    });

    const pts = routePoints.map(p => toCanvas(p.lat, p.lng));
    const pickup = pts[0];
    const drop = pts[pts.length - 1];

    // ── Dashed road (pickup → drop) ──────────────────────────────────
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Route line covered (pickup to driver) ────────────────────────
    if (driverGPS) {
      const driverCanvas = toCanvas(driverGPS.lat, driverGPS.lng);
      const grad = ctx.createLinearGradient(pickup.x, pickup.y, driverCanvas.x, driverCanvas.y);
      grad.addColorStop(0, "#3b82f6");
      grad.addColorStop(1, "#8b5cf6");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(pickup.x, pickup.y);
      ctx.lineTo(driverCanvas.x, driverCanvas.y);
      ctx.stroke();
    }

    // ── Pickup pin (green) ────────────────────────────────────────────
    const now = Date.now() / 1000;
    const pulseR = 16 + 8 * Math.sin(now * 3);
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(74,222,128,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#4ade80";
    ctx.shadowColor = "#22c55e";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#4ade80";
    ctx.fillText("📍 Pickup", pickup.x, pickup.y - 20);

    // ── Drop pin (red) ───────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = isCompleted ? "#4ade80" : "#f87171";
    ctx.shadowColor = isCompleted ? "#22c55e" : "#ef4444";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = isCompleted ? "#4ade80" : "#f87171";
    ctx.fillText(isCompleted ? "🏁 Arrived!" : "🏁 Drop", drop.x, drop.y - 20);

    // ── User position ────────────────────────────────────────────────
    if (userGPS) {
      const up = toCanvas(userGPS.lat, userGPS.lng);
      ctx.beginPath();
      ctx.arc(up.x, up.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fbbf24";
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText("You", up.x, up.y - 16);
    }

    // ── Driver taxi icon ─────────────────────────────────────────────
    if (driverGPS) {
      const dp = toCanvas(driverGPS.lat, driverGPS.lng);
      const glow = ctx.createRadialGradient(dp.x, dp.y, 0, dp.x, dp.y, 28);
      glow.addColorStop(0, "rgba(59,130,246,0.4)");
      glow.addColorStop(1, "rgba(59,130,246,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#2563eb";
      ctx.shadowColor = "#3b82f6";
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = "14px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🚕", dp.x, dp.y);
      ctx.textBaseline = "alphabetic";
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillStyle = "#60a5fa";
      ctx.fillText("Driver", dp.x, dp.y - 22);
    }

    animFrame.current = requestAnimationFrame(draw);
  }, [routePoints, driverGPS, userGPS, isCompleted]);

  useEffect(() => {
    animFrame.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrame.current);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-2xl"
      style={{ height: "340px", display: "block" }}
    />
  );
};

/* ── Contact Driver Modal ─────────────────────────────────────────── */
const ContactDriverModal = ({ driver, pin, onClose }) => {
  const [activeTab, setActiveTab] = useState("call");
  const [message, setMessage] = useState("");

  const handleCall = () => {
    if (!driver?.phone) { toast.error("Driver phone not available"); return; }
    window.open(`tel:${driver.phone}`);
    toast.success("📞 Opening phone dialer...");
  };

  const handleSMS = () => {
    if (!driver?.phone) { toast.error("Driver phone not available"); return; }
    const text = message.trim() || `Hi, I'm your UCab passenger. PIN: ${pin}`;
    window.open(`sms:${driver.phone}?body=${encodeURIComponent(text)}`);
    toast.success("💬 Opening SMS...");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass w-full max-w-md rounded-3xl border border-white/15 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-5 flex items-center justify-between">
          <div>
            <h3 className="text-white font-black text-lg">Contact Driver</h3>
            <p className="text-blue-200 text-xs mt-0.5">{driver?.name || "Your Driver"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-all">✕</button>
        </div>

        {/* PIN Display */}
        <div className="px-5 pt-5">
          <div className="bg-amber-500/12 border border-amber-500/30 rounded-2xl p-4 text-center mb-4">
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">🔑 Your Ride PIN</p>
            <p className="text-amber-300 font-black text-4xl tracking-[0.3em] font-mono">{pin}</p>
            <p className="text-amber-400/70 text-[11px] mt-1">Share this PIN with your driver to confirm your identity</p>
          </div>

          {/* Driver Info */}
          {driver?.phone && (
            <div className="flex items-center gap-3 bg-white/4 rounded-xl px-4 py-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                {(driver.name || "D").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{driver.name}</p>
                <p className="text-slate-400 text-xs font-mono">{driver.phone}</p>
              </div>
              <span className="text-2xl">{driver.vehicleIcon || "🚕"}</span>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-4">
            <button
              onClick={() => setActiveTab("call")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "call" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"}`}
            >
              📞 Call
            </button>
            <button
              onClick={() => setActiveTab("message")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "message" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"}`}
            >
              💬 Message
            </button>
          </div>

          {activeTab === "call" ? (
            <div className="space-y-3 pb-5">
              <p className="text-slate-400 text-xs text-center">Opens your phone dialer to call the driver directly</p>
              <button
                onClick={handleCall}
                disabled={!driver?.phone}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl text-base transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                📞 Call Driver
              </button>
              {!driver?.phone && <p className="text-rose-400 text-xs text-center">Driver phone number not available</p>}
            </div>
          ) : (
            <div className="space-y-3 pb-5">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={`Hi, I'm your UCab passenger. PIN: ${pin}`}
                rows={3}
                className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all resize-none"
              />
              <button
                onClick={handleSMS}
                disabled={!driver?.phone}
                className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 rounded-xl text-base transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                💬 Send Message
              </button>
              {!driver?.phone && <p className="text-rose-400 text-xs text-center">Driver phone number not available</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Main Live Tracking Page ──────────────────────────────────────── */
const LiveTracking = () => {
  const [connected, setConnected] = useState(false);
  const [driverGPS, setDriverGPS] = useState(null);
  const [userGPS, setUserGPS] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [rideStatus, setRideStatus] = useState("Locating your position...");
  const [isCompleted, setIsCompleted] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [ridePin, setRidePin] = useState("----");
  const [loadingRide, setLoadingRide] = useState(true);
  const watchRef = useRef(null);

  // ── Fetch active ride ─────────────────────────────────────────────
  useEffect(() => {
    const loadRide = async () => {
      try {
        const { data } = await API.get("/rides/my");
        const rides = data.rides || [];
        const active = rides.find(r => r.status === "accepted" || r.status === "pending");
        if (active) {
          setActiveRide(active);
          // Generate deterministic PIN from ride ID
          const pin = active._id.slice(-4).toUpperCase();
          setRidePin(pin);
          setRideStatus(active.status === "accepted" ? "Driver on the way 🚕" : "Finding a driver...");
        } else {
          const completed = rides.find(r => r.status === "completed");
          if (completed) {
            setActiveRide(completed);
            setIsCompleted(true);
            setRideStatus("Ride Completed ✅");
          } else {
            setRideStatus("No active ride");
          }
        }
      } catch {
        setRideStatus("Login to track your ride");
      } finally {
        setLoadingRide(false);
      }
    };
    loadRide();
  }, []);

  // ── GPS: get user's real location & build route ───────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }

    const successHandler = (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setUserGPS({ lat, lng });

      setRoutePoints(prev => {
        // Build route: user location → drop location (if we have ride data)
        // We'll update this when activeRide is set
        if (prev.length === 0) {
          return [{ lat, lng }];
        }
        return prev;
      });
    };

    const errorHandler = () => {
      toast.error("📡 Location access denied. Enable GPS for real tracking.", { duration: 5000 });
    };

    watchRef.current = navigator.geolocation.watchPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 3000,
    });

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  // ── Build route from userGPS + ride data ──────────────────────────
  useEffect(() => {
    if (!activeRide) return;
    const pts = [];

    if (userGPS) pts.push({ lat: userGPS.lat, lng: userGPS.lng });
    else if (activeRide.pickupLat && activeRide.pickupLng) {
      pts.push({ lat: activeRide.pickupLat, lng: activeRide.pickupLng });
    }

    if (activeRide.dropLat && activeRide.dropLng) {
      pts.push({ lat: activeRide.dropLat, lng: activeRide.dropLng });
    }

    if (pts.length >= 2) setRoutePoints(pts);
  }, [activeRide, userGPS]);

  // ── Socket.io ─────────────────────────────────────────────────────
  useEffect(() => {
    setConnected(socket.connected);
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("receiveDriverLocation", (data) => {
      setDriverGPS({ lat: data.lat, lng: data.lng });
      setHistory(h => [{ ...data, ts: new Date().toLocaleTimeString("en-IN") }, ...h].slice(0, 6));
    });

    // When driver marks ride complete, update user panel
    socket.on("rideCompleted", (data) => {
      setIsCompleted(true);
      setRideStatus("Ride Completed ✅");
      toast.success("🎉 You have reached your destination! Ride completed.", { duration: 6000 });
      if (data.rideId) {
        setActiveRide(prev => prev ? { ...prev, status: "completed" } : prev);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("receiveDriverLocation");
      socket.off("rideCompleted");
    };
  }, []);

  const driver = activeRide?.driverId;

  const haversineKm = (a, b) => {
    if (!a || !b) return null;
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))).toFixed(2);
  };

  const distToDriver = driverGPS && userGPS ? haversineKm(userGPS, driverGPS) : null;
  const distToDropKm = activeRide?.distance || null;

  const statusColor = isCompleted
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
    : rideStatus.includes("way") || rideStatus.includes("progress")
      ? "bg-violet-500/15 text-violet-400 border-violet-500/25"
      : rideStatus.includes("Finding")
        ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
        : "bg-blue-500/15 text-blue-400 border-blue-500/25";

  return (
    <Layout>
      {showContact && (
        <ContactDriverModal
          driver={typeof driver === "object" ? driver : null}
          pin={ridePin}
          onClose={() => setShowContact(false)}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-5 page-enter">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">Live Tracking</h1>
            <p className="text-slate-400 text-sm">Real-time GPS tracking via Socket.io</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${connected
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}>
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
              {connected ? "Live Connected" : "Disconnected"}
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${statusColor}`}>
              {rideStatus}
            </span>
          </div>
        </div>

        {/* ── Ride Completed Banner ──────────────────────────────────── */}
        {isCompleted && (
          <div className="bg-gradient-to-r from-emerald-600/30 to-teal-600/20 border border-emerald-500/40 rounded-3xl p-6 text-center shadow-[0_0_40px_rgba(16,185,129,0.15)]">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-black text-emerald-400 mb-1">Your Ride is Completed!</h2>
            <p className="text-emerald-300/70 text-sm">You have successfully reached your destination. Thank you for riding with UCab!</p>
            {activeRide?._id && (
              <a
                href={`/receipt/${activeRide._id}`}
                className="inline-block mt-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
              >
                🧾 View Receipt
              </a>
            )}
          </div>
        )}

        {/* ── Map ────────────────────────────────────────────────────── */}
        <div className="glass rounded-3xl overflow-hidden border border-white/8 shadow-card">
          <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_#4ade80]" />You (Pickup)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-400 inline-block shadow-[0_0_6px_#f87171]" />Drop</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block shadow-[0_0_8px_#60a5fa]" />Driver</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />Your GPS</span>
            </div>
            {userGPS && (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                GPS Active
              </span>
            )}
          </div>
          <div className="bg-dark-500 p-3">
            <TrackingMap
              routePoints={routePoints}
              driverGPS={driverGPS}
              userGPS={userGPS}
              isCompleted={isCompleted}
            />
          </div>
        </div>

        {/* ── Your Location & Route Info ────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">📍</div>
            <p className="text-sm font-black text-emerald-400 font-mono truncate">
              {userGPS ? `${userGPS.lat.toFixed(4)}° N` : "Locating..."}
            </p>
            <p className="text-xs text-slate-400">Your Latitude</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">🗺️</div>
            <p className="text-sm font-black text-blue-400 font-mono truncate">
              {userGPS ? `${userGPS.lng.toFixed(4)}° E` : "---"}
            </p>
            <p className="text-xs text-slate-400">Your Longitude</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">🚕</div>
            <p className="text-sm font-black text-violet-400">
              {distToDriver ? `${distToDriver} km` : "---"}
            </p>
            <p className="text-xs text-slate-400">Driver Distance</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">🏁</div>
            <p className="text-sm font-black text-amber-400">
              {distToDropKm ? `${distToDropKm} km` : "---"}
            </p>
            <p className="text-xs text-slate-400">Trip Distance</p>
          </div>
        </div>

        {/* ── Active Ride Details + Contact ─────────────────────────── */}
        {!loadingRide && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Ride Info */}
            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>🗺️</span> Your Route
              </h3>

              {activeRide ? (
                <div className="space-y-3">
                  {[
                    { icon: "🟢", label: "Pickup", value: activeRide.pickup, coord: activeRide.pickupLat ? `${activeRide.pickupLat?.toFixed(4)}°, ${activeRide.pickupLng?.toFixed(4)}°` : null },
                    { icon: "🔴", label: "Drop", value: activeRide.drop, coord: activeRide.dropLat ? `${activeRide.dropLat?.toFixed(4)}°, ${activeRide.dropLng?.toFixed(4)}°` : null },
                  ].map(item => (
                    <div key={item.label} className="flex gap-3 bg-white/3 rounded-xl px-4 py-3">
                      <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
                        <p className="text-sm text-white font-medium line-clamp-2">{item.value}</p>
                        {item.coord && <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.coord}</p>}
                      </div>
                    </div>
                  ))}

                  {/* Status Badge */}
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border ${statusColor}`}>
                    <span className={`w-2 h-2 rounded-full ${isCompleted ? "bg-emerald-400" : "bg-violet-400 animate-pulse"}`} />
                    {rideStatus}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">🚕</div>
                  <p className="text-slate-400 text-sm">No active ride found.</p>
                  <a href="/book" className="text-blue-400 text-xs hover:underline mt-1 inline-block">Book a ride →</a>
                </div>
              )}
            </div>

            {/* Contact Driver */}
            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                Driver & Contact
              </h3>

              {/* PIN Display */}
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 text-center">
                <p className="text-amber-400 text-xs font-semibold mb-1">🔑 Ride PIN</p>
                <p className="text-amber-300 font-black text-3xl tracking-[0.35em] font-mono">{ridePin}</p>
                <p className="text-amber-400/60 text-[10px] mt-0.5">Share with driver to verify identity</p>
              </div>

              {/* Driver Details */}
              {driver && typeof driver === "object" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-blue-500/8 border border-blue-500/15 rounded-xl px-3 py-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-sm flex-shrink-0 border-2 border-white/15"
                      style={{ background: driver.avatarColor || "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}
                    >
                      {(driver.name || "D").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold">{driver.name}</p>
                      <p className="text-slate-400 text-xs">{driver.phone || "Phone not available"}</p>
                      {driver.vehicle?.plate && (
                        <p className="text-yellow-300 text-xs font-mono font-bold mt-0.5">{driver.vehicle.plate}</p>
                      )}
                    </div>
                    <span className="text-2xl">🚕</span>
                  </div>

                  {/* Call & Message buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!driver?.phone) { toast.error("Driver phone not available"); return; }
                        window.open(`tel:${driver.phone}`);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-95"
                    >
                      📞 Call
                    </button>
                    <button
                      onClick={() => setShowContact(true)}
                      className="flex-1 flex items-center justify-center gap-2 glass border border-white/15 text-slate-300 hover:text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-95"
                    >
                      💬 Message
                    </button>
                    <button
                      onClick={() => setShowContact(true)}
                      className="w-12 h-12 glass border border-white/15 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-95"
                      title="Contact with PIN"
                    >
                      🔑
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {driverGPS ? (
                    <div className="bg-white/4 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">Driver Real-time GPS</p>
                      <p className="text-white font-mono font-bold">{driverGPS.lat.toFixed(6)}°</p>
                      <p className="text-white font-mono font-bold">{driverGPS.lng.toFixed(6)}°</p>
                      <p className="text-emerald-400 text-[10px] mt-1">Updated: {new Date().toLocaleTimeString("en-IN")}</p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-3xl mb-2 animate-bounce">🚕</div>
                      <p className="text-slate-400 text-sm">Waiting for driver GPS...</p>
                      <button
                        onClick={() => setShowContact(true)}
                        className="mt-3 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-xl hover:bg-blue-500/30 transition-all"
                      >
                        🔑 Show PIN & Contact Options
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Location History */}
              {history.length > 0 && (
                <div className="pt-3 border-t border-white/8">
                  <p className="text-xs text-slate-500 mb-2">Driver Location History</p>
                  <div className="space-y-1.5">
                    {history.map((h, i) => (
                      <div key={i} className={`flex justify-between items-center text-xs px-2 py-1.5 rounded-lg ${i === 0 ? "bg-blue-500/10 border border-blue-500/20" : "bg-white/3"}`}>
                        <span className="text-slate-400 font-mono">{Number(h.lat).toFixed(4)}, {Number(h.lng).toFixed(4)}</span>
                        <span className="text-slate-500">{h.ts}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Info tip ────────────────────────────────────────────────── */}
        <div className="glass-blue rounded-2xl p-4 text-sm flex items-start gap-3">
          <span className="text-xl mt-0.5">💡</span>
          <div>
            <p className="font-semibold text-blue-200 mb-0.5">How real-time tracking works</p>
            <p className="text-blue-300/70 text-xs leading-relaxed">
              Your GPS position is detected automatically — <strong>no manual input needed</strong>. The driver panel sends live coordinates via Socket.io. Allow browser location access for best results. The PIN shown above is unique to your ride.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LiveTracking;