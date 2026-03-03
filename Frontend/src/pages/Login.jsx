import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import Input from "../components/Input";
import Button from "../components/Button";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email) e.email = "Email is required";
    if (!password) e.password = "Password is required";
    return e;
  };

  const handleLogin = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success(`Welcome back, ${data.user?.name?.split(" ")[0]}! 👋`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-500 flex">
      {/* Left hero panel */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-hero-gradient justify-between p-12">
        {/* Background glow */}
        <div className="absolute inset-0 bg-blue-glow opacity-60 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-glow">
            <span className="text-white font-black text-lg">U</span>
          </div>
          <span className="text-white font-black text-2xl tracking-tight">UCab</span>
        </div>

        {/* Hero content */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 glass-blue px-4 py-2 rounded-full text-sm text-blue-300 font-medium mb-6 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            10,000+ rides completed today
          </div>
          <h1 className="text-5xl font-black text-white leading-tight mb-4">
            Your ride,<br />
            <span className="gradient-text">your way.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Safe, affordable, and always on-time. Book your cab in seconds and track it in real-time.
          </p>
          {/* Stats row */}
          <div className="flex gap-6 mt-10">
            {[
              { label: "Cities", value: "50+" },
              { label: "Drivers", value: "25K+" },
              { label: "Happy Riders", value: "500K+" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-sm text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom ride cards decoration */}
        <div className="relative flex flex-col gap-3 opacity-60">
          {[
            { from: "Banjara Hills", to: "HITECH City", fare: "₹120", status: "active" },
            { from: "Jubilee Hills", to: "Gachibowli", fare: "₹95", status: "completed" },
          ].map((r, i) => (
            <div key={i} className="glass rounded-xl p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-emerald-400">●</span>
                {r.from}
                <span className="text-slate-500">→</span>
                <span className="text-blue-400">●</span>
                {r.to}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-white">{r.fare}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full badge-${r.status}`}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right login form */}
      <div className="flex flex-1 lg:max-w-md xl:max-w-lg items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm page-enter">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-glow">
              <span className="text-white font-black">U</span>
            </div>
            <span className="text-white font-black text-xl">UCab</span>
          </div>

          <h2 className="text-3xl font-black text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon="✉️"
              error={errors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon="🔒"
              error={errors.password}
              required
            />

            <div className="flex justify-end">
              <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                Forgot password?
              </a>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-1">
              Sign In →
            </Button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            New to UCab?{" "}
            <Link to="/register" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
              Create an account
            </Link>
          </p>

          {/* Test credentials hint */}
          <div className="mt-8 glass rounded-xl p-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">🧪 Test credentials</p>
            <p>Email: <span className="text-blue-400">postmantest@ucab.com</span></p>
            <p>Password: <span className="text-blue-400">test1234</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;