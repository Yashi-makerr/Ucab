import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import Loader from "../components/Loader";
import RideCard from "../components/RideCard";
import API from "../services/api";
import toast from "react-hot-toast";
import socket from "../services/socket";

const StatBadge = ({ icon, label, value, color = "blue" }) => {
    const ring = {
        blue: "from-blue-500/20 to-blue-800/5 border-blue-500/20",
        green: "from-emerald-500/20 to-emerald-800/5 border-emerald-500/20",
        violet: "from-violet-500/20 to-violet-800/5 border-violet-500/20",
        amber: "from-amber-500/20 to-amber-800/5 border-amber-500/20",
        rose: "from-rose-500/20 to-rose-800/5 border-rose-500/20",
    };
    const iconRing = {
        blue: "bg-blue-500/15 text-blue-400",
        green: "bg-emerald-500/15 text-emerald-400",
        violet: "bg-violet-500/15 text-violet-400",
        amber: "bg-amber-500/15 text-amber-400",
        rose: "bg-rose-500/15 text-rose-400",
    };
    return (
        <div className={`relative rounded-2xl border bg-gradient-to-br p-5 shadow-card overflow-hidden ${ring[color]}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-400 text-xs mb-1">{label}</p>
                    <p className="text-3xl font-black text-white">{value ?? "—"}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${iconRing[color]}`}>{icon}</div>
            </div>
        </div>
    );
};

const TABS = ["Overview", "Rides", "Users", "Drivers"];

const AdminPanel = () => {
    const [tab, setTab] = useState("Overview");
    const [stats, setStats] = useState(null);
    const [rides, setRides] = useState([]);
    const [users, setUsers] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [driverName, setDriverName] = useState("");
    const [recentlyCompleted, setRecentlyCompleted] = useState([]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [s, r, u, d] = await Promise.all([
                API.get("/admin/stats"),
                API.get("/admin/rides"),
                API.get("/admin/users"),
                API.get("/admin/drivers"),
            ]);
            setStats(s.data);
            setRides(r.data.rides || []);
            setUsers(u.data.users || []);
            setDrivers(d.data.drivers || []);
        } catch (err) {
            toast.error("Failed to load admin data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    // ── Real-time ride completion listener ────────────────────────────────────
    useEffect(() => {
        const handleRideCompleted = (data) => {
            toast.success(
                `✅ Rider successfully reached destination! (Ride: ...${data.rideId?.slice(-6) || "N/A"})`,
                { duration: 7000, icon: "🎉" }
            );
            setRecentlyCompleted(prev => [
                { rideId: data.rideId, message: data.message, ts: new Date().toLocaleTimeString("en-IN") },
                ...prev
            ].slice(0, 10));
            // Refresh stats
            fetchAll();
        };
        socket.on("rideCompleted", handleRideCompleted);
        return () => socket.off("rideCompleted", handleRideCompleted);
    }, []);

    const seedDriver = async () => {
        if (!driverName.trim()) { toast.error("Enter a driver name"); return; }
        setSeeding(true);
        try {
            await API.post("/admin/drivers/seed", {
                name: driverName,
                lat: 17.385044,
                lng: 78.486671,
            });
            toast.success(`✅ Driver "${driverName}" created and is now available!`);
            setDriverName("");
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create driver");
        } finally {
            setSeeding(false);
        }
    };

    const roleBadge = (role) => {
        const map = {
            admin: "bg-rose-500/15 text-rose-400 border-rose-500/20",
            driver: "bg-amber-500/15 text-amber-400 border-amber-500/20",
            user: "bg-blue-500/15 text-blue-400 border-blue-500/20",
        };
        return `text-xs font-medium px-2 py-0.5 rounded-full border ${map[role] || map.user}`;
    };

    if (loading) return <Layout><div className="flex justify-center py-20"><Loader fullScreen={false} /></div></Layout>;

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-6 page-enter">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white">Admin Panel</h1>
                        <p className="text-slate-400 text-sm">Manage the entire UCab platform</p>
                    </div>
                    <Button variant="secondary" onClick={fetchAll} icon="🔄" size="sm">Refresh</Button>
                </div>

                {/* Tab bar */}
                <div className="flex gap-1 glass rounded-xl p-1 w-fit">
                    {TABS.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${tab === t
                                ? "bg-blue-500 text-white shadow-glow-sm"
                                : "text-slate-400 hover:text-white"
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* ── OVERVIEW TAB ── */}
                {/* ── REAL-TIME COMPLETED RIDES FEED ── */}
                {recentlyCompleted.length > 0 && (
                    <div className="rounded-2xl overflow-hidden border border-emerald-500/30 bg-emerald-500/5">
                        <div className="px-5 py-3 border-b border-emerald-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <p className="text-sm font-bold text-emerald-400">Live Ride Completions</p>
                            </div>
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{recentlyCompleted.length} recent</span>
                        </div>
                        <div className="divide-y divide-emerald-500/10">
                            {recentlyCompleted.map((item, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-emerald-500/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">✅</div>
                                        <div>
                                            <p className="text-sm text-white font-semibold">Rider Successfully Reached</p>
                                            <p className="text-xs text-slate-400 font-mono">Ride #{item.rideId?.slice(-8)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">🎉 Reached</span>
                                        <p className="text-xs text-slate-500 mt-1">{item.ts}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === "Overview" && stats && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <StatBadge icon="🚗" label="Total Rides" value={stats.totalRides} color="blue" />
                            <StatBadge icon="✅" label="Completed" value={stats.completedRides} color="green" />
                            <StatBadge icon="⏳" label="Pending" value={stats.pendingRides} color="amber" />
                            <StatBadge icon="❌" label="Cancelled" value={stats.cancelledRides} color="rose" />
                            <StatBadge icon="🚕" label="Total Drivers" value={stats.totalDrivers} color="violet" />
                            <StatBadge icon="🟢" label="Online Drivers" value={stats.availableDrivers} color="green" />
                            <StatBadge icon="👤" label="Total Users" value={stats.totalUsers} color="blue" />
                            <StatBadge icon="💰" label="Revenue" value={`₹${stats.totalRevenue || 0}`} color="amber" />
                        </div>

                        {/* Seed a driver */}
                        <Card>
                            <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                                <span>🚗</span> Add Test Driver
                            </h2>
                            <p className="text-xs text-slate-400 mb-4">
                                No drivers in DB? Create one here so ride booking works immediately.
                            </p>
                            <div className="flex gap-3">
                                <input
                                    value={driverName}
                                    onChange={(e) => setDriverName(e.target.value)}
                                    placeholder="Driver name (e.g. Ravi Kumar)"
                                    className="flex-1 bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all"
                                />
                                <Button onClick={seedDriver} loading={seeding} icon="➕">
                                    Add Driver
                                </Button>
                            </div>
                        </Card>

                        {/* Quick stats bar */}
                        <div className="glass rounded-2xl p-5">
                            <h2 className="text-sm font-bold text-white mb-4">Platform Health</h2>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Ride Completion Rate</span>
                                        <span className="text-emerald-400">{stats.totalRides ? Math.round((stats.completedRides / stats.totalRides) * 100) : 0}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-700"
                                            style={{ width: `${stats.totalRides ? (stats.completedRides / stats.totalRides) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Driver Availability</span>
                                        <span className="text-blue-400">{stats.totalDrivers ? Math.round((stats.availableDrivers / stats.totalDrivers) * 100) : 0}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700"
                                            style={{ width: `${stats.totalDrivers ? (stats.availableDrivers / stats.totalDrivers) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── RIDES TAB ── */}
                {tab === "Rides" && (
                    <div className="space-y-3">
                        <p className="text-slate-400 text-sm">{rides.length} total rides</p>
                        {rides.length === 0
                            ? <Card><p className="text-center text-slate-400 py-6">No rides yet</p></Card>
                            : rides.map((r) => <RideCard key={r._id} ride={r} />)
                        }
                    </div>
                )}

                {/* ── USERS TAB ── */}
                {tab === "Users" && (
                    <div className="space-y-3">
                        <p className="text-slate-400 text-sm">{users.length} registered users</p>
                        <div className="glass rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/8 text-left">
                                        <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u, i) => (
                                        <tr key={u._id} className={`border-b border-white/5 hover:bg-white/4 transition-colors ${i % 2 === 0 ? "bg-white/2" : ""}`}>
                                            <td className="px-5 py-3 text-white font-medium">{u.name}</td>
                                            <td className="px-5 py-3 text-slate-400">{u.email}</td>
                                            <td className="px-5 py-3"><span className={roleBadge(u.role)}>{u.role}</span></td>
                                            <td className="px-5 py-3 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && <p className="text-center text-slate-400 py-8">No users found</p>}
                        </div>
                    </div>
                )}

                {/* ── DRIVERS TAB ── */}
                {tab === "Drivers" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-slate-400 text-sm">{drivers.length} drivers in system</p>
                        </div>
                        {drivers.length === 0 ? (
                            <Card>
                                <div className="text-center py-6">
                                    <div className="text-4xl mb-3">🚕</div>
                                    <p className="text-slate-300 font-semibold mb-1">No drivers yet</p>
                                    <p className="text-slate-500 text-sm mb-4">Go to Overview tab to add a test driver</p>
                                </div>
                            </Card>
                        ) : (
                            <div className="glass rounded-2xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/8 text-left">
                                            <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Driver</th>
                                            <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
                                            <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                            <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Added</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drivers.map((d, i) => (
                                            <tr key={d._id} className={`border-b border-white/5 hover:bg-white/4 transition-colors ${i % 2 === 0 ? "bg-white/2" : ""}`}>
                                                <td className="px-5 py-3 text-white font-medium flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                                                        {d.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    {d.name}
                                                </td>
                                                <td className="px-5 py-3 text-slate-400 font-mono text-xs">
                                                    {d.location?.lat?.toFixed(4)}, {d.location?.lng?.toFixed(4)}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${d.isAvailable
                                                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                                                        : "bg-slate-500/15 text-slate-400 border-slate-500/20"
                                                        }`}>
                                                        {d.isAvailable ? "🟢 Available" : "🔴 On Ride"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-slate-500 text-xs">
                                                    {new Date(d.createdAt).toLocaleDateString("en-IN")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AdminPanel;
