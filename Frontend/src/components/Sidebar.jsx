import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
    const location = useLocation();
    const { user } = useAuth();

    // ── Role-specific nav links ───────────────────────────────────────────────
    const userLinks = [
        { label: "Dashboard", path: "/dashboard", icon: "🏠" },
        { label: "Book a Ride", path: "/book", icon: "🚗" },
        { label: "Live Tracking", path: "/track", icon: "📍" },
        { label: "Ride History", path: "/history", icon: "📋" },
    ];

    const driverLinks = [
        { label: "Dashboard", path: "/dashboard", icon: "🏠" },
        { label: "Share Location", path: "/driver", icon: "📡" },
        { label: "Live Tracking", path: "/track", icon: "📍" },
    ];

    const adminLinks = [
        { label: "Dashboard", path: "/dashboard", icon: "🏠" },
        { label: "Admin Panel", path: "/admin", icon: "⚙️" },
        { label: "Live Tracking", path: "/track", icon: "📍" },
    ];

    const links =
        user?.role === "driver" ? driverLinks :
            user?.role === "admin" ? adminLinks :
                userLinks;

    const roleColors = {
        user: "from-blue-500 to-violet-500",
        driver: "from-emerald-500 to-teal-500",
        admin: "from-rose-500 to-orange-500",
    };

    const roleBadgeText = {
        user: "Rider",
        driver: "Driver",
        admin: "Admin",
    };

    return (
        <aside className="hidden lg:flex flex-col w-60 min-h-[calc(100vh-4rem)] glass border-r border-white/8 px-3 py-6 gap-1 flex-shrink-0">
            {/* Role label */}
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">
                Navigation
            </p>

            {links.map((link) => {
                const active = location.pathname === link.path;
                return (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
              ${active
                                ? "bg-blue-500/15 text-blue-400 border border-blue-500/20 shadow-glow-sm"
                                : "text-slate-400 hover:text-white hover:bg-white/6"}
            `}
                    >
                        <span className={`text-xl transition-transform duration-150 ${active ? "scale-110" : "group-hover:scale-105"}`}>
                            {link.icon}
                        </span>
                        <span>{link.label}</span>
                        {active && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                        )}
                    </Link>
                );
            })}

            {/* Driver: quick-access pending count */}
            {user?.role === "driver" && (
                <div className="mt-4 mx-3 glass-blue rounded-xl px-3 py-2.5 text-xs text-blue-300 flex items-center gap-2">
                    <span className="animate-pulse">🔔</span>
                    Check dashboard for ride requests
                </div>
            )}

            {/* User badge at bottom */}
            <div className="mt-auto px-3 pt-4 border-t border-white/8">
                <div className="flex items-center gap-2 glass-blue rounded-xl px-3 py-2.5">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleColors[user?.role] || roleColors.user} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <p className={`text-xs capitalize font-medium ${user?.role === "driver" ? "text-emerald-400" :
                            user?.role === "admin" ? "text-rose-400" :
                                "text-blue-400"
                            }`}>
                            {roleBadgeText[user?.role] || user?.role}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
