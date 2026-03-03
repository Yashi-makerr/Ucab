import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully");
        navigate("/");
    };

    const navLinks =
        user?.role === "driver"
            ? [
                { label: "Dashboard", path: "/dashboard", icon: "🏠" },
                { label: "Share Location", path: "/driver", icon: "📡" },
                { label: "Tracking", path: "/track", icon: "📍" },
            ]
            : user?.role === "admin"
                ? [
                    { label: "Dashboard", path: "/dashboard", icon: "🏠" },
                    { label: "Admin Panel", path: "/admin", icon: "⚙️" },
                    { label: "Tracking", path: "/track", icon: "📍" },
                ]
                : [
                    { label: "Dashboard", path: "/dashboard", icon: "🏠" },
                    { label: "Book Ride", path: "/book", icon: "🚗" },
                    { label: "Tracking", path: "/track", icon: "📍" },
                ];

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    return (
        <nav className="sticky top-0 z-40 glass border-b border-white/8 px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow">
                    <span className="text-white font-black text-sm">U</span>
                </div>
                <span className="font-black text-xl gradient-text hidden sm:block">UCab</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`
              flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
              ${location.pathname === link.path
                                ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                                : "text-slate-400 hover:text-white hover:bg-white/6"}
            `}
                    >
                        <span className="text-base">{link.icon}</span>
                        {link.label}
                    </Link>
                ))}
            </div>

            {/* Right: user + logout */}
            <div className="flex items-center gap-3">
                {/* User avatar */}
                <div className="hidden sm:flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                        {initials}
                    </div>
                    <div className="hidden lg:block">
                        <p className="text-sm font-semibold text-white leading-none">{user?.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                    </div>
                </div>

                {/* Logout button */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                >
                    <span>🚪</span>
                    <span className="hidden sm:inline">Logout</span>
                </button>

                {/* Mobile hamburger */}
                <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
                >
                    <span className="text-xl">{menuOpen ? "✕" : "☰"}</span>
                </button>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="absolute top-16 left-0 right-0 glass border-b border-white/8 px-4 py-3 flex flex-col gap-1 md:hidden">
                    <div className="flex items-center gap-2 px-3 py-2 mb-2 border-b border-white/8">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                            {initials}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">{user?.name}</p>
                            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                        </div>
                    </div>
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setMenuOpen(false)}
                            className={`
                flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${location.pathname === link.path
                                    ? "bg-blue-500/15 text-blue-400"
                                    : "text-slate-300 hover:bg-white/6"}
              `}
                        >
                            <span>{link.icon}</span> {link.label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
