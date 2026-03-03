import { forwardRef, useState } from "react";

const Input = forwardRef(({
    label,
    type = "text",
    placeholder = "",
    value,
    onChange,
    error = "",
    icon = null,
    rightIcon = null,
    disabled = false,
    className = "",
    required = false,
    ...rest
}, ref) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-slate-300">
                    {label} {required && <span className="text-blue-400">*</span>}
                </label>
            )}

            <div
                className={`
          relative flex items-center rounded-xl border transition-all duration-200
          ${focused
                        ? "border-blue-500 bg-blue-500/5 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                        : error
                            ? "border-red-500/60 bg-red-500/5"
                            : "border-white/10 bg-white/4 hover:border-white/20"
                    }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
            >
                {/* Left icon */}
                {icon && (
                    <span className="pl-3.5 text-slate-400 text-lg flex-shrink-0 pointer-events-none">
                        {icon}
                    </span>
                )}

                <input
                    ref={ref}
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`
            w-full bg-transparent py-3 text-sm text-white placeholder-slate-500
            focus:outline-none
            ${icon ? "pl-2.5 pr-4" : "px-4"}
            ${isPassword || rightIcon ? "pr-11" : ""}
            ${disabled ? "cursor-not-allowed" : ""}
          `}
                    {...rest}
                />

                {/* Right: toggle password OR custom right icon */}
                {isPassword ? (
                    <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3.5 text-slate-400 hover:text-white transition-colors text-lg"
                        tabIndex={-1}
                    >
                        {showPassword ? "🙈" : "👁️"}
                    </button>
                ) : rightIcon ? (
                    <span className="absolute right-3.5 text-slate-400 text-lg pointer-events-none">
                        {rightIcon}
                    </span>
                ) : null}
            </div>

            {/* Error message */}
            {error && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                    <span>⚠️</span> {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = "Input";
export default Input;
