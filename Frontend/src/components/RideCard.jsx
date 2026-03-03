const RideCard = ({ ride, onAction, actionLabel, actionVariant = "primary" }) => {
    const statusClass = {
        pending: "badge-pending",
        active: "badge-active",
        completed: "badge-completed",
        cancelled: "badge-cancelled",
    }[ride?.status] || "badge-pending";

    return (
        <div className="glass rounded-2xl p-4 hover:bg-white/7 hover:border-white/15 transition-all duration-200 hover:-translate-y-0.5 shadow-card">
            <div className="flex items-start justify-between gap-4">
                {/* Route info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                        {/* Pickup dot */}
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                            <div className="w-0.5 h-5 bg-gradient-to-b from-emerald-400 to-blue-400 opacity-40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]" />
                        </div>
                        {/* Addresses */}
                        <div className="flex flex-col gap-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{ride?.pickup || "—"}</p>
                            <p className="text-sm text-slate-400 truncate">{ride?.drop || "—"}</p>
                        </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <span>📏</span>
                            <span>{ride?.distance ?? "—"} km</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <span>🕐</span>
                            <span>{ride?.createdAt ? new Date(ride.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}</span>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass}`}>
                            {ride?.status || "pending"}
                        </span>
                    </div>
                </div>

                {/* Fare + action */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right">
                        <p className="text-lg font-bold text-white">₹{ride?.fare ?? "—"}</p>
                        <p className="text-xs text-slate-400">Fare</p>
                    </div>
                    {onAction && (
                        <button
                            onClick={() => onAction(ride)}
                            className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95
                ${actionVariant === "danger"
                                    ? "bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20"
                                    : "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20"}
              `}
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RideCard;
