import { useState } from "react";
import toast from "react-hot-toast";

const VEHICLE_ICONS = { mini: "🚗", sedan: "🚙", suv: "🚕", auto: "🛺" };
const VEHICLE_LABELS = { mini: "Mini", sedan: "Sedan", suv: "SUV", auto: "Auto Rickshaw" };

/* ── Star Rating ──────────────────────────────────────────────────── */
const Stars = ({ rating = 4.8 }) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={`text-sm ${i < full ? "text-amber-400" : i === full && half ? "text-amber-300" : "text-slate-600"}`}>
                    {i < full ? "★" : i === full && half ? "⯨" : "☆"}
                </span>
            ))}
            <span className="text-xs text-amber-400 font-bold ml-1">{rating?.toFixed(1)}</span>
        </div>
    );
};

/* ── Avatar: initials with colour or photo URL ───────────────────── */
const DriverAvatar = ({ driver, size = "lg" }) => {
    const initials = (driver?.name || "DR")
        .split(" ")
        .map(w => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const sizeMap = {
        lg: "w-20 h-20 text-2xl",
        md: "w-14 h-14 text-lg",
        sm: "w-10 h-10 text-sm",
    };

    if (driver?.profilePhotoUrl) {
        return (
            <img
                src={driver.profilePhotoUrl}
                alt={driver.name}
                className={`${sizeMap[size]} rounded-full object-cover border-2 border-white/20 shadow-lg`}
            />
        );
    }

    return (
        <div
            className={`${sizeMap[size]} rounded-full flex items-center justify-center font-black text-white border-2 border-white/20 shadow-lg flex-shrink-0`}
            style={{ background: driver?.avatarColor || "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}
        >
            {initials}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════════
   DRIVER INFO CARD
   Props:
     driver     — populated User object (name/phone/vehicle/rating/etc.)
     rideStatus — "accepted" | "completed" | "pending"
     compact    — boolean, use a smaller inline version
══════════════════════════════════════════════════════════════════════ */
const DriverInfoCard = ({ driver, rideStatus, compact = false }) => {
    const [calling, setCalling] = useState(false);

    if (!driver) return null;

    const vehicle = driver.vehicle || {};
    const vehicleIcon = VEHICLE_ICONS[vehicle.type] || "🚗";
    const vehicleName = VEHICLE_LABELS[vehicle.type] || "Mini";

    const handleCall = () => {
        if (!driver.phone) { toast("📵 Driver phone not set"); return; }
        setCalling(true);
        setTimeout(() => setCalling(false), 2000);
        window.open(`tel:${driver.phone}`);
    };

    const handleChat = () => toast("💬 In-app chat coming soon!");

    /* ── COMPACT version (used inside ride cards) ─────────────────── */
    if (compact) {
        return (
            <div className="mt-3 flex items-center gap-3 bg-blue-500/8 border border-blue-500/20 rounded-xl px-3 py-2.5">
                <DriverAvatar driver={driver} size="sm" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{driver.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Stars rating={driver.rating} />
                        {vehicle.plate && (
                            <span className="text-[10px] text-slate-400 font-mono bg-white/6 px-1.5 py-0.5 rounded">
                                {vehicle.plate}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xl" title={vehicleName}>{vehicleIcon}</span>
                    {driver.phone && (
                        <button
                            onClick={handleCall}
                            className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-all active:scale-90"
                            title="Call driver"
                        >
                            📞
                        </button>
                    )}
                </div>
            </div>
        );
    }

    /* ── FULL CARD ────────────────────────────────────────────────── */
    return (
        <div className="glass rounded-2xl border border-blue-500/20 overflow-hidden shadow-glow-sm">
            {/* Top accent */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500" />

            <div className="p-5 space-y-4">
                {/* Header row */}
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                        {rideStatus === "accepted" ? "🚗 Your Driver" : "✅ Trip Driver"}
                    </span>
                    {driver.isVerified && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ✓ Verified
                        </span>
                    )}
                </div>

                {/* Driver profile */}
                <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                        <DriverAvatar driver={driver} size="lg" />
                        {/* Online indicator */}
                        {rideStatus === "accepted" && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#0d0d18] shadow-[0_0_6px_rgba(74,222,128,0.7)] animate-pulse" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-black text-white">{driver.name}</h3>
                        <Stars rating={driver.rating} />
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <span>🏁</span> {driver.totalTrips || 0} trips
                            </span>
                            {driver.phone && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <span>📞</span> {driver.phone}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/8" />

                {/* Vehicle details */}
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">🚗 Vehicle Details</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: "Type", value: `${vehicleIcon} ${vehicleName}`, highlight: true },
                            { label: "Number Plate", value: vehicle.plate || "Not set", mono: true, highlight: !!vehicle.plate },
                            { label: "Model", value: vehicle.model || "Not provided" },
                            { label: "Colour", value: vehicle.color || "Not provided" },
                        ].map(row => (
                            <div key={row.label} className="bg-white/4 rounded-xl px-3 py-2">
                                <p className="text-[10px] text-slate-500 mb-0.5">{row.label}</p>
                                <p className={`text-sm font-bold ${row.mono ? "font-mono tracking-wide text-yellow-300" : row.highlight ? "text-white" : "text-slate-300"}`}>
                                    {row.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Safety badge */}
                <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/15 rounded-xl px-3 py-2.5 text-xs text-emerald-300">
                    <span className="text-base">🛡️</span>
                    <span>This driver is background-verified and registered on UCab. You can share their details for safety.</span>
                </div>

                {/* Action buttons */}
                {rideStatus === "accepted" && (
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={handleCall}
                            disabled={!driver.phone}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                            {calling ? "📞 Calling..." : "📞 Call Driver"}
                        </button>
                        <button
                            onClick={handleChat}
                            className="flex-1 flex items-center justify-center gap-2 glass border border-white/15 text-slate-300 hover:text-white hover:border-white/25 font-bold py-3 rounded-xl text-sm transition-all active:scale-95"
                        >
                            💬 Message
                        </button>
                        <button
                            onClick={() => {
                                const txt = `My UCab driver: ${driver.name}, Vehicle: ${vehicle.model || vehicleName} ${vehicle.color || ""}, Plate: ${vehicle.plate || "N/A"}, Contact: ${driver.phone || "N/A"}`;
                                navigator.clipboard?.writeText(txt);
                                toast.success("📋 Driver info copied!");
                            }}
                            className="w-12 h-12 glass border border-white/15 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
                            title="Share driver details"
                        >
                            📤
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export { DriverInfoCard, DriverAvatar, Stars };
export default DriverInfoCard;
