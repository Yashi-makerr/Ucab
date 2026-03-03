import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import RideCard from "../components/RideCard";
import Loader from "../components/Loader";
import Button from "../components/Button";
import API from "../services/api";
import toast from "react-hot-toast";

/* ═══════════════════════════════════════════════════════════════════
   DRIVER DASHBOARD
═══════════════════════════════════════════════════════════════════ */
const DriverDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null); // rideId being accepted
  const [completing, setCompleting] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([
        API.get("/rides/driver/stats"),
        API.get("/rides/pending"),
      ]);
      setStats(s.data);
      setPending(p.data.rides || []);
    } catch {
      // stats might be empty on first use
      setStats({ totalRides: 0, completedRides: 0, activeRides: 0, totalEarnings: 0, rides: [] });
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const acceptRide = async (rideId) => {
    setAccepting(rideId);
    try {
      const { data } = await API.put(`/rides/accept/${rideId}`);
      toast.success("✅ Ride accepted! Head to pickup.");
      setPending((p) => p.filter((r) => r._id !== rideId));
      setStats((s) => s ? { ...s, activeRides: s.activeRides + 1, totalRides: s.totalRides + 1 } : s);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept");
    } finally {
      setAccepting(null);
    }
  };

  const completeRide = async (rideId) => {
    setCompleting(rideId);
    try {
      await API.put(`/rides/complete/${rideId}`);
      toast.success("🎉 Ride completed!");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete");
    } finally {
      setCompleting(null);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "Driver";

  if (loading) return <div className="flex justify-center py-20"><Loader fullScreen={false} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 page-enter">
      {/* ── Hero status banner ───────────────────────────────────────────── */}
      <div className={`relative rounded-3xl overflow-hidden p-7 sm:p-10 shadow-card transition-all duration-500 ${isOnline
        ? "bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800"
        : "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900"
        }`}>
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.15),_transparent_70%)]" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-emerald-100/80 text-sm font-medium mb-1">{greeting} 👋</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{firstName}!</h1>
            <p className={`text-sm font-medium ${isOnline ? "text-emerald-100/80" : "text-slate-400"}`}>
              {isOnline
                ? `${pending.length} pending ride${pending.length !== 1 ? "s" : ""} waiting for you`
                : "You are offline — go online to start accepting rides"}
            </p>
          </div>

          {/* Online/Offline toggle */}
          <div className="flex flex-col items-start sm:items-end gap-3">
            <button
              onClick={() => { setIsOnline(o => !o); toast(isOnline ? "🔴 You're now offline" : "🟢 You're now online!"); }}
              className={`relative flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300 font-semibold text-sm ${isOnline
                ? "bg-emerald-500/20 border-emerald-400/40 text-white"
                : "bg-white/8 border-white/15 text-slate-300"
                }`}
            >
              <span className={`relative flex h-3 w-3`}>
                {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? "bg-emerald-400" : "bg-slate-500"}`} />
              </span>
              {isOnline ? "ONLINE — Accepting Rides" : "OFFLINE"}
            </button>
            <Link to="/driver" className="text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors">
              📡 Share Location →
            </Link>
          </div>
        </div>

        {/* Decorative taxi */}
        <div className="absolute bottom-4 right-10 text-7xl opacity-10 hidden sm:block select-none">🚕</div>
      </div>

      {/* ── Earnings stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: "💰", label: "Today's Earnings", value: `₹${stats?.totalEarnings || 0}`, color: "from-amber-500/20 to-amber-800/5 border-amber-500/20", iconCls: "bg-amber-500/15 text-amber-400" },
          { icon: "✅", label: "Rides Completed", value: stats?.completedRides ?? 0, color: "from-emerald-500/20 to-emerald-800/5 border-emerald-500/20", iconCls: "bg-emerald-500/15 text-emerald-400" },
          { icon: "🚗", label: "Active Rides", value: stats?.activeRides ?? 0, color: "from-blue-500/20 to-blue-800/5 border-blue-500/20", iconCls: "bg-blue-500/15 text-blue-400" },
          { icon: "⭐", label: "Rating", value: "4.8", color: "from-violet-500/20 to-violet-800/5 border-violet-500/20", iconCls: "bg-violet-500/15 text-violet-400" },
        ].map((s) => (
          <div key={s.label} className={`relative rounded-2xl border bg-gradient-to-br p-5 shadow-card overflow-hidden ${s.color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs mb-1 leading-tight">{s.label}</p>
                <p className="text-3xl font-black text-white">{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${s.iconCls}`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pending ride requests ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              🔔 Ride Requests
              {pending.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center animate-bounce">
                  {pending.length}
                </span>
              )}
            </h2>
            <p className="text-slate-400 text-sm">
              {isOnline ? "Accept a ride to start earning" : "Go online to see ride requests"}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={loadData} icon="🔄">Refresh</Button>
        </div>

        {!isOnline ? (
          <div className="glass rounded-2xl p-10 text-center border border-white/8">
            <div className="text-5xl mb-4">🔴</div>
            <p className="text-slate-300 font-semibold mb-1">You're offline</p>
            <p className="text-slate-500 text-sm">Toggle online above to start accepting rides</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center border border-blue-500/10">
            <div className="text-5xl mb-4 animate-pulse-slow">🚖</div>
            <p className="text-slate-300 font-semibold mb-1">No pending rides right now</p>
            <p className="text-slate-500 text-sm">New ride requests will appear here automatically</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((ride) => (
              <PendingRideCard
                key={ride._id}
                ride={ride}
                accepting={accepting === ride._id}
                onAccept={() => acceptRide(ride._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Active rides (driver's accepted rides needing completion) ────────── */}
      {stats?.rides?.filter(r => r.status === "accepted").length > 0 && (
        <div>
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            🚀 Active Ride
          </h2>
          <div className="flex flex-col gap-3">
            {stats.rides.filter(r => r.status === "accepted").map((ride) => (
              <PendingRideCard
                key={ride._id}
                ride={ride}
                isActive
                completing={completing === ride._id}
                onComplete={() => completeRide(ride._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── My completed trips ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white">My Trips</h2>
        </div>
        {!stats?.rides?.length ? (
          <div className="glass rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-slate-400 text-sm">Your completed rides will appear here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {stats.rides.filter(r => r.status === "completed").slice(0, 5).map((ride) => (
              <RideCard key={ride._id} ride={ride} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Pending ride request card (bigger, more prominent) ─────────────────────── */
const PendingRideCard = ({ ride, onAccept, onComplete, accepting, completing, isActive }) => {
  return (
    <div className={`rounded-2xl p-5 border shadow-card transition-all duration-200 ${isActive
      ? "bg-gradient-to-r from-blue-500/12 to-violet-500/8 border-blue-500/25"
      : "glass border-amber-500/20 bg-gradient-to-r from-amber-500/8 to-transparent"
      }`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Route */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? "bg-blue-500/20 text-blue-400" : "badge-pending"}`}>
              {isActive ? "🚀 Active" : "⏳ New Request"}
            </span>
          </div>
          <div className="flex items-start gap-2.5 mt-2">
            <div className="flex flex-col items-center gap-0.5 mt-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
              <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-400 to-blue-400 opacity-40" />
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{ride.pickup}</p>
              <p className="text-sm text-slate-400 truncate">{ride.drop}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="text-xs text-slate-400 flex items-center gap-1"><span>📏</span>{ride.distance} km</span>
            <span className="text-xs text-slate-400 flex items-center gap-1"><span>🚗</span>{ride.vehicleType || "mini"}</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span>🕐</span>{new Date(ride.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Fare + action */}
        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-2xl font-black text-white">₹{ride.fare}</p>
            <p className="text-xs text-slate-400">Estimated fare</p>
          </div>
          {isActive ? (
            <Button
              size="sm"
              variant="success"
              loading={completing}
              onClick={onComplete}
              icon="✅"
            >
              Complete Ride
            </Button>
          ) : (
            <Button
              size="sm"
              loading={accepting}
              onClick={onAccept}
              icon="🚗"
            >
              Accept Ride
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════
   USER DASHBOARD
═══════════════════════════════════════════════════════════════════ */

/* Mini Activity Bar Chart (last 7 days) */
const ActivityChart = ({ rides }) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      date: d.toDateString(),
      count: rides.filter(r => new Date(r.createdAt).toDateString() === d.toDateString()).length,
    };
  });
  const max = Math.max(...days.map(d => d.count), 1);
  return (
    <div>
      <div className="flex items-end justify-between gap-1.5 h-16">
        {days.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-sm bg-white/6 relative overflow-hidden" style={{ height: "100%" }}>
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-gradient-to-t from-blue-500 to-violet-500 transition-all duration-700"
                style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? "4px" : "0" }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-1.5">
        {days.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[10px] text-slate-500">{d.label}</span>
        ))}
      </div>
    </div>
  );
};

const STATUS_COLORS = {
  completed: "text-emerald-400 bg-emerald-500/10",
  pending: "text-amber-400  bg-amber-500/10",
  accepted: "text-blue-400   bg-blue-500/10",
  cancelled: "text-rose-400   bg-rose-500/10",
};

const VEHICLE_ICONS = { mini: "🚗", sedan: "🚙", suv: "🚕", auto: "🛺" };

const QUICK_COUPONS = [
  { code: "FIRST50", label: "50% OFF", bg: "from-blue-500/15 to-violet-500/10 border-blue-500/25" },
  { code: "UCAB20", label: "20% OFF", bg: "from-violet-500/15 to-purple-500/10 border-violet-500/25" },
  { code: "FLAT30", label: "₹30 OFF", bg: "from-emerald-500/15 to-teal-500/10 border-emerald-500/25" },
  { code: "WELCOME", label: "₹50 OFF", bg: "from-amber-500/15 to-orange-500/10 border-amber-500/25" },
];

const UserDashboard = ({ user }) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/rides/my")
      .then(({ data }) => setRides(data.rides || []))
      .catch(() => setRides([]))
      .finally(() => setLoading(false));
  }, []);

  const completed = rides.filter(r => r.status === "completed");
  const cancelled = rides.filter(r => r.status === "cancelled");
  const pending = rides.filter(r => r.status === "pending" || r.status === "accepted");
  const totalSpent = completed.reduce((s, r) => s + (r.fare || 0), 0);
  const totalSaved = rides.reduce((s, r) => s + (r.discountAmt || 0), 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-5xl mx-auto space-y-6 page-enter">
      {/* Hero CTA */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-violet-800 p-7 sm:p-10 shadow-glow">
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.15),_transparent_70%)]" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="relative">
          <p className="text-blue-200 text-sm font-medium mb-1">{greeting} 👋</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{user?.name?.split(" ")[0] || "Rider"}!</h1>
          <p className="text-blue-100/70 mb-6 text-sm">Auto-distance calculation. Real fare. Instant booking.</p>
          <Link to="/book" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm shadow-lg active:scale-95">
            🚗 Book a Ride Now
          </Link>
        </div>
        <div className="absolute bottom-4 right-8 text-7xl opacity-10 hidden sm:block select-none">🚕</div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: "🚗", label: "Total Rides", value: rides.length, vCls: "text-blue-400", bg: "from-blue-500/20 border-blue-500/20" },
          { icon: "✅", label: "Completed", value: completed.length, vCls: "text-emerald-400", bg: "from-emerald-500/20 border-emerald-500/20" },
          { icon: "💰", label: "Total Spent", value: `₹${totalSpent}`, vCls: "text-violet-400", bg: "from-violet-500/20 border-violet-500/20" },
          { icon: "🎟️", label: "Total Saved", value: `₹${totalSaved}`, vCls: "text-amber-400", bg: "from-amber-500/20 border-amber-500/20" },
        ].map(s => (
          <div key={s.label} className={`relative rounded-2xl border bg-gradient-to-br to-transparent p-5 shadow-card overflow-hidden ${s.bg}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                <p className={`text-3xl font-black ${s.vCls}`}>{s.value}</p>
              </div>
              <div className="text-2xl">{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity chart + quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">📊 Ride Activity</h2>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>
          {loading ? <div className="h-20 flex items-center justify-center text-slate-500 text-sm">Loading...</div>
            : <ActivityChart rides={rides} />}
          <div className="mt-4 pt-3 border-t border-white/8 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Done", val: completed.length, cls: "text-emerald-400" },
              { label: "Active", val: pending.length, cls: "text-amber-400" },
              { label: "Cancelled", val: cancelled.length, cls: "text-rose-400" },
            ].map(x => (
              <div key={x.label}>
                <p className={`font-black ${x.cls}`}>{x.val}</p>
                <p className="text-[10px] text-slate-500">{x.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-white/8">
          <h2 className="text-sm font-bold text-white mb-3">⚡ Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "🚗", label: "Book Ride", path: "/book", cls: "bg-blue-500/15 border-blue-500/25 text-blue-300" },
              { icon: "📍", label: "Live Tracking", path: "/track", cls: "bg-violet-500/15 border-violet-500/25 text-violet-300" },
              { icon: "📋", label: "Ride History", path: "/history", cls: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300" },
              { icon: "🎟️", label: "View Coupons", path: "/book", cls: "bg-amber-500/15 border-amber-500/25 text-amber-300" },
            ].map(a => (
              <Link key={a.path + a.label} to={a.path}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center hover:-translate-y-0.5 transition-all duration-200 group ${a.cls}`}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{a.icon}</span>
                <span className="text-xs font-semibold">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Coupon strip */}
      <div className="glass rounded-2xl p-5 border border-white/8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white">🎟️ Available Offers</h2>
          <Link to="/book" className="text-xs text-blue-400 hover:text-blue-300">Use now →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_COUPONS.map(c => (
            <div key={c.code} className={`flex flex-col gap-1 p-3 rounded-xl border bg-gradient-to-br ${c.bg}`}>
              <p className="text-xs font-black text-white">{c.label}</p>
              <p className="text-[10px] font-mono text-slate-300 tracking-widest">{c.code}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent rides */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Recent Rides</h2>
          <Link to="/history" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">View all →</Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader fullScreen={false} /></div>
        ) : rides.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <div className="text-5xl mb-4">🚖</div>
            <p className="text-slate-300 font-semibold mb-1">No rides yet</p>
            <p className="text-slate-500 text-sm mb-5">Book your first ride and it will appear here</p>
            <Link to="/book" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">Book Now →</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rides.slice(0, 5).map(ride => (
              <div key={ride._id} className="glass rounded-2xl p-4 border border-white/8 hover:border-blue-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="text-2xl w-10 flex-shrink-0 text-center">{VEHICLE_ICONS[ride.vehicleType] || "🚗"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[ride.status] || STATUS_COLORS.pending}`}>
                        {ride.status}
                      </span>
                      <span className="text-[10px] text-slate-500">{ride.distance} km</span>
                    </div>
                    <p className="text-sm font-medium text-white truncate">{ride.pickup} → {ride.drop}</p>
                    <p className="text-[11px] text-slate-500">{new Date(ride.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <p className="font-black text-white">₹{ride.fare}</p>
                    {ride.status === "completed" && (
                      <Link to={`/receipt/${ride._id}`} className="text-[10px] text-blue-400 hover:text-blue-300">🧾 Receipt</Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════
   MAIN DASHBOARD — role router
═══════════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { user } = useAuth();

  return (
    <Layout>
      {user?.role === "driver"
        ? <DriverDashboard user={user} />
        : <UserDashboard user={user} />
      }
    </Layout>
  );
};

export default Dashboard;