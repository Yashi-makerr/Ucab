const Loader = ({ fullScreen = true, size = "lg" }) => {
    const sizeMap = {
        sm: "w-6 h-6 border-2",
        md: "w-10 h-10 border-2",
        lg: "w-14 h-14 border-3",
    };

    const spinner = (
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className={`${sizeMap[size]} rounded-full border-blue-500/20 border-solid`} />
                <div
                    className={`absolute inset-0 ${sizeMap[size]} rounded-full border-transparent border-t-blue-500 border-solid animate-spin`}
                />
                <div
                    className={`absolute inset-0 ${sizeMap[size]} rounded-full border-transparent border-r-violet-500/60 border-solid animate-spin`}
                    style={{ animationDuration: "0.6s" }}
                />
            </div>
            {fullScreen && (
                <span className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">
                    Loading...
                </span>
            )}
        </div>
    );

    if (!fullScreen) return spinner;

    return (
        <div className="fixed inset-0 bg-dark-500 flex flex-col items-center justify-center z-50">
            {/* Glow behind spinner */}
            <div className="absolute w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="relative">
                <span className="text-2xl font-black gradient-text mb-8 block text-center">
                    UCab
                </span>
                {spinner}
            </div>
        </div>
    );
};

export default Loader;
