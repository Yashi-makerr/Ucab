import Loader from "./Loader";

const Button = ({
    children,
    onClick,
    type = "button",
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    fullWidth = false,
    icon = null,
    className = "",
}) => {
    const base =
        "relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-500 select-none overflow-hidden";

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-base",
    };

    const variants = {
        primary:
            "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 focus:ring-blue-500 shadow-glow-sm hover:shadow-glow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
        secondary:
            "glass border border-white/10 text-slate-200 hover:bg-white/8 hover:border-white/20 focus:ring-slate-500 active:scale-[0.98]",
        ghost:
            "text-slate-400 hover:text-white hover:bg-white/6 focus:ring-slate-600 active:scale-[0.98]",
        danger:
            "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 focus:ring-red-500 shadow-sm hover:shadow-red-500/30 active:scale-[0.98]",
        success:
            "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-400 hover:to-green-500 focus:ring-emerald-500 shadow-sm active:scale-[0.98]",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`
        ${base}
        ${sizes[size]}
        ${variants[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
        >
            {/* Shimmer effect on primary */}
            {variant === "primary" && !disabled && !loading && (
                <span className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            )}
            {loading ? (
                <span className="flex items-center gap-2">
                    <Loader fullScreen={false} size="sm" />
                    <span>Loading...</span>
                </span>
            ) : (
                <>
                    {icon && <span className="text-lg leading-none">{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
