import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import Input from "../components/Input";
import Button from "../components/Button";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "user",
    phone: "",
    vehicleType: "mini", vehicleModel: "", vehicleColor: "", vehiclePlate: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    return e;
  };

  const handleRegister = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role, {
        phone: form.phone,
        vehicleType: form.vehicleType,
        vehicleModel: form.vehicleModel,
        vehicleColor: form.vehicleColor,
        vehiclePlate: form.vehiclePlate,
      });
      toast.success("Account created! Please sign in.");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: "user", label: "Rider", icon: "🧍", desc: "Book rides" },
    { value: "driver", label: "Driver", icon: "🚗", desc: "Accept rides & earn" },
    { value: "admin", label: "Admin", icon: "🛡️", desc: "Manage platform" },
  ];

  return (
    <div className="min-h-screen bg-dark-500 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-hero-gradient justify-center items-center p-12 text-center">
        <div className="absolute inset-0 bg-blue-glow opacity-50 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 justify-center mb-12">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-glow">
              <span className="text-white font-black text-xl">U</span>
            </div>
            <span className="text-white font-black text-3xl tracking-tight">UCab</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4">
            Join <span className="gradient-text">500K+</span><br />happy riders
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Start your journey with UCab. Safe, fast, and affordable rides — anytime, anywhere.
          </p>
          <div className="grid grid-cols-1 gap-4 text-left">
            {[
              { icon: "✅", text: "Real-time driver tracking" },
              { icon: "✅", text: "Transparent fare pricing" },
              { icon: "✅", text: "24/7 customer support" },
              { icon: "✅", text: "Multiple payment options" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 glass-blue rounded-xl px-4 py-3 text-sm text-slate-300">
                <span>{f.icon}</span> {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-1 lg:max-w-md xl:max-w-lg items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-sm page-enter">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-glow">
              <span className="text-white font-black">U</span>
            </div>
            <span className="text-white font-black text-xl">UCab</span>
          </div>

          <h2 className="text-3xl font-black text-white mb-1">Create account</h2>
          <p className="text-slate-400 mb-8">Join UCab and start riding today</p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                className={`
                  flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all duration-200
                  ${form.role === r.value
                    ? "bg-blue-500/15 border-blue-500/40 shadow-glow-sm"
                    : "glass border-white/10 hover:border-white/20"}
                `}
              >
                <span className="text-2xl">{r.icon}</span>
                <span className={`text-sm font-semibold ${form.role === r.value ? "text-blue-400" : "text-white"}`}>
                  {r.label}
                </span>
                <span className="text-xs text-slate-400">{r.desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <Input label="Full name" placeholder="John Doe" value={form.name}
              onChange={set("name")} icon="👤" error={errors.name} required />
            <Input label="Email address" type="email" placeholder="you@example.com"
              value={form.email} onChange={set("email")} icon="✉️" error={errors.email} required />
            <Input label="Phone number" type="tel" placeholder="+91 9876543210"
              value={form.phone} onChange={set("phone")} icon="📞" />
            <Input label="Password" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={set("password")} icon="🔒" error={errors.password} required />

            {/* ── Vehicle details for drivers ───────────────────────────── */}
            {form.role === "driver" && (
              <div className="space-y-3 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">🚗 Vehicle Details</p>

                {/* Vehicle type */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "mini", icon: "🚗", label: "Mini" },
                    { id: "sedan", icon: "🚙", label: "Sedan" },
                    { id: "suv", icon: "🚕", label: "SUV" },
                    { id: "auto", icon: "🛺", label: "Auto" },
                  ].map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, vehicleType: v.id }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${form.vehicleType === v.id
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                          : "border-white/8 text-slate-400 hover:border-white/20"
                        }`}
                    >
                      <span className="text-lg">{v.icon}</span>
                      <span className="text-[10px] font-semibold">{v.label}</span>
                    </button>
                  ))}
                </div>

                <Input label="Vehicle Model" placeholder="e.g. Maruti Swift"
                  value={form.vehicleModel} onChange={set("vehicleModel")} icon="🚘" />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Colour" placeholder="e.g. White"
                    value={form.vehicleColor} onChange={set("vehicleColor")} icon="🎨" />
                  <Input label="Plate Number" placeholder="DL 3C AB 1234"
                    value={form.vehiclePlate} onChange={set("vehiclePlate")} icon="🔢" />
                </div>
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              Create Account →
            </Button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;