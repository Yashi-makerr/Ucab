import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Loader from "../components/Loader";
import DriverInfoCard from "../components/DriverInfoCard";
import API from "../services/api";
import toast from "react-hot-toast";

const STATUS_MAP = {
    completed: { label: "Completed", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
    pending: { label: "Pending", cls: "bg-amber-500/15  text-amber-400  border-amber-500/25" },
    accepted: { label: "Accepted", cls: "bg-blue-500/15   text-blue-400   border-blue-500/25" },
    cancelled: { label: "Cancelled", cls: "bg-rose-500/15   text-rose-400   border-rose-500/25" },
};

const VEHICLE_ICONS = { mini: "🚗", sedan: "🚙", suv: "🚕", auto: "🛺" };

/* ─── Single Ride Card ─────────────────────────────────────────────── */
const RideHistoryCard = ({ ride, onCancel, cancelling }) => {
    const s = STATUS_MAP[ride.status] || STATUS_MAP.pending;
    const driver = ride.driverId;           // populated from backend
    const isActive = ride.status === "accepted";

    return (
        <div className={`glass rounded-2xl p-5 border transition-all duration-200 group ${isActive ? "border-blue-500/30 shadow-glow-sm" : "border-white/8 hover:border-blue-500/15"}`}>
            {/* Active pulse banner */}
            {isActive && (
                <div className="flex items-center gap-2 mb-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 text-xs text-blue-300 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    Driver is on the way! Track your ride in real-time.
                    <Link to="/track" className="ml-auto underline text-blue-400 hover:text-blue-300">→ Track</Link>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Vehicle icon */}
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-2xl flex-shrink-0">
                    {VEHICLE_ICONS[ride.vehicleType] || "🚗"}
                </div>

                {/* Route */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
                        <span className="text-xs text-slate-500 capitalize">{ride.vehicleType || "mini"}</span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-500">{ride.distance} km</span>
                        {ride.discountAmt > 0 && (
                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                🎟️ −₹{ride.discountAmt} saved
                            </span>
                        )}
                    </div>

                    <div className="flex items-start gap-2.5">
                        <div className="flex flex-col items-center gap-0.5 mt-1 flex-shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
                            <div className="w-0.5 h-5 bg-gradient-to-b from-emerald-400 to-blue-400 opacity-40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.5)]" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate">{ride.pickup}</p>
                            <p className="text-sm text-slate-400 truncate">{ride.drop}</p>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        🕐 {new Date(ride.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                </div>

                {/* Fare + action */}
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <div className="text-right">
                        <p className="text-2xl font-black text-white">₹{ride.fare}</p>
                        <p className="text-xs text-slate-400">Total Fare</p>
                    </div>

                    {ride.status === "completed" && (
                        <Link to={`/receipt/${ride._id}`} className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                            🧾 View Receipt →
                        </Link>
                    )}

                    {(ride.status === "pending" || ride.status === "accepted") && (
                        <button
                            onClick={() => onCancel(ride._id)}
                            disabled={cancelling === ride._id}
                            className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                            {cancelling === ride._id ? "Cancelling..." : "✕ Cancel Ride"}
                        </button>
                    )}
                </div>
            </div>

            {/* ── DRIVER INFO (shown when driver is assigned) ──────────────── */}
            {driver && (ride.status === "accepted" || ride.status === "completed") && (
                <div className="mt-4 pt-4 border-t border-white/8">
                    {isActive ? (
                        /* Full card for active ride */
                        <DriverInfoCard driver={driver} rideStatus={ride.status} />
                    ) : (
                        /* Compact version for completed rides */
                        <DriverInfoCard driver={driver} rideStatus={ride.status} compact />
                    )}
                </div>
            )}

            {/* No driver yet — pending state */}
            {!driver && ride.status === "pending" && (
                <div className="mt-3 flex items-center gap-2 bg-amber-500/8 border border-amber-500/15 rounded-xl px-3 py-2.5 text-xs text-amber-300">
                    <span className="animate-spin">⌛</span>
                    Finding the nearest driver for you...
                </div>
            )}
        </div>
    );
};

/* ─── FILTERS ──────────────────────────────────────────────────────── */
const FILTERS = ["All", "Completed", "Pending", "Accepted", "Cancelled"];

/* ─── MAIN PAGE ────────────────────────────────────────────────────── */
const RideHistory = () => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [cancelling, setCancelling] = useState(null);

    const fetchRides = async () => {
        try {
            const { data } = await API.get("/rides/my");
            setRides(data.rides || []);
        } catch {
            setRides([]);
            toast.error("Failed to load ride history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRides(); }, []);

    const cancelRide = async (rideId) => {
        setCancelling(rideId);
        try {
            await API.put(`/rides/cancel/${rideId}`);
            toast.success("Ride cancelled");
            setRides(r => r.map(x => x._id === rideId ? { ...x, status: "cancelled" } : x));
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to cancel");
        } finally {
            setCancelling(null);
        }
    };

    const filtered = filter === "All" ? rides : rides.filter(r => r.status === filter.toLowerCase());
    const totalSpent = rides.filter(r => r.status === "completed").reduce((s, r) => s + (r.fare || 0), 0);
    const totalSaved = rides.reduce((s, r) => s + (r.discountAmt || 0), 0);
    const completedCount = rides.filter(r => r.status === "completed").length;
    const pendingCount = rides.filter(r => r.status === "pending" || r.status === "accepted").length;

    return (
        <Layout>
            <div className="max-w-3xl mx-auto space-y-6 page-enter">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-black text-white">Ride History</h1>
                    <p className="text-slate-400 text-sm">All your past and current rides in one place</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { icon: "🚗", label: "Total Rides", value: rides.length, cls: "text-blue-400" },
                        { icon: "✅", label: "Completed", value: completedCount, cls: "text-emerald-400" },
                        { icon: "💰", label: "Total Spent", value: `₹${totalSpent}`, cls: "text-violet-400" },
                        { icon: "🎟️", label: "Total Saved", value: `₹${totalSaved}`, cls: "text-amber-400" },
                    ].map(s => (
                        <div key={s.label} className="glass rounded-2xl p-4 text-center border border-white/6">
                            <p className="text-2xl mb-1">{s.icon}</p>
                            <p className={`text-xl font-black ${s.cls}`}>{s.value}</p>
                            <p className="text-xs text-slate-400">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1.5 flex-wrap">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? "bg-blue-500 text-white shadow-glow-sm" : "glass text-slate-400 hover:text-white border border-white/8"
                                }`}
                        >
                            {f}
                            {f === "Pending" && pendingCount > 0 && (
                                <span className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Ride list */}
                {loading ? (
                    <div className="flex justify-center py-12"><Loader fullScreen={false} /></div>
                ) : filtered.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <div className="text-5xl mb-4">🚖</div>
                        <p className="text-slate-300 font-semibold mb-1">
                            {filter === "All" ? "No rides yet" : `No ${filter.toLowerCase()} rides`}
                        </p>
                        <p className="text-slate-500 text-sm mb-5">
                            {filter === "All" ? "Your trip history will appear here after you book a ride" : "Try a different filter"}
                        </p>
                        {filter === "All" && (
                            <Link to="/book" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
                                🚗 Book Your First Ride
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {filtered.map(ride => (
                            <RideHistoryCard
                                key={ride._id}
                                ride={ride}
                                onCancel={cancelRide}
                                cancelling={cancelling}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default RideHistory;
