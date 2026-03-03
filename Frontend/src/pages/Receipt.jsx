import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import Loader from "../components/Loader";
import API from "../services/api";
import toast from "react-hot-toast";

const VEHICLE_LABEL = { mini: "Mini 🚗", sedan: "Sedan 🚙", suv: "SUV 🚕", auto: "Auto 🛺" };

/* ── UPI QR SVG (simulated) ──────────────────────────────────────── */
const UPIQRCode = ({ amount }) => (
    <div className="flex flex-col items-center gap-2 py-4">
        <div className="w-40 h-40 bg-white rounded-2xl p-2 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Simulated QR pattern */}
                {[0, 1, 2, 3, 4, 5, 6].map(row =>
                    [0, 1, 2, 3, 4, 5, 6].map(col => {
                        const isCorner = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2);
                        const isDot = (row === 0 || row === 6 || col === 0 || col === 6) && isCorner;
                        const rand = ((row * 7 + col) * 31 + 17) % 3 === 0;
                        const fill = isCorner || rand ? "#111" : "#fff";
                        return (
                            <rect key={`${row}-${col}`} x={10 + col * 11} y={10 + row * 11} width={9} height={9} fill={fill} rx={1} />
                        );
                    })
                )}
                <text x="50" y="92" textAnchor="middle" fontSize="7" fill="#333" fontWeight="bold">UCab Pay</text>
            </svg>
        </div>
        <p className="text-xs text-slate-400">Scan with any UPI app</p>
        <p className="text-white font-bold text-lg">₹{amount}</p>
        <div className="flex items-center gap-3 flex-wrap justify-center text-2xl">
            {["GPay", "PhonePe", "Paytm", "BHIM"].map(app => (
                <span key={app} className="flex flex-col items-center gap-0.5">
                    <span>{app === "GPay" ? "💙" : app === "PhonePe" ? "💜" : app === "Paytm" ? "💛" : "🇮🇳"}</span>
                    <span className="text-[9px] text-slate-500 font-medium">{app}</span>
                </span>
            ))}
        </div>
    </div>
);

/* ── Card input form ─────────────────────────────────────────────── */
const CardForm = ({ cardData, setCardData }) => {
    const formatCardNum = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    const formatExpiry = (v) => {
        const d = v.replace(/\D/g, "").slice(0, 4);
        return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    };

    return (
        <div className="space-y-3 py-2">
            {/* Card preview */}
            <div className="relative h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 p-5 shadow-xl">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "10px 10px" }} />
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <p className="text-white/60 text-xs font-medium">UCAB CARD</p>
                        <span className="text-2xl">💳</span>
                    </div>
                    <p className="text-white font-mono text-base tracking-widest mt-4 drop-shadow">
                        {(cardData.number || "#### #### #### ####").padEnd(19, " ")}
                    </p>
                    <div className="flex justify-between items-end mt-3">
                        <div>
                            <p className="text-white/50 text-[9px]">CARD HOLDER</p>
                            <p className="text-white text-xs font-semibold uppercase truncate max-w-[120px]">
                                {cardData.name || "YOUR NAME"}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/50 text-[9px]">EXPIRES</p>
                            <p className="text-white text-xs">{cardData.expiry || "MM/YY"}</p>
                        </div>
                    </div>
                </div>
            </div>

            <input
                type="text"
                placeholder="Card number"
                value={cardData.number}
                onChange={e => setCardData(d => ({ ...d, number: formatCardNum(e.target.value) }))}
                className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-sm font-mono tracking-widest"
                maxLength={19}
            />
            <input
                type="text"
                placeholder="Cardholder name"
                value={cardData.name}
                onChange={e => setCardData(d => ({ ...d, name: e.target.value }))}
                className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
                <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardData.expiry}
                    onChange={e => setCardData(d => ({ ...d, expiry: formatExpiry(e.target.value) }))}
                    className="bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-sm font-mono"
                    maxLength={5}
                />
                <input
                    type="password"
                    placeholder="CVV"
                    value={cardData.cvv}
                    onChange={e => setCardData(d => ({ ...d, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                    className="bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-sm font-mono"
                    maxLength={3}
                />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>🔒</span> 256-bit SSL encrypted. Your card details are safe.
            </div>
        </div>
    );
};

/* ── Net Banking selector ────────────────────────────────────────── */
const BANKS = [
    { id: "sbi", name: "SBI", icon: "🏦", color: "from-blue-700 to-blue-900" },
    { id: "hdfc", name: "HDFC", icon: "🏛️", color: "from-red-700 to-red-900" },
    { id: "icici", name: "ICICI", icon: "🏧", color: "from-orange-700 to-red-800" },
    { id: "axis", name: "Axis", icon: "🏪", color: "from-rose-700 to-rose-900" },
    { id: "kotak", name: "Kotak", icon: "🏢", color: "from-red-700 to-orange-800" },
    { id: "pnb", name: "PNB", icon: "🏬", color: "from-indigo-700 to-blue-900" },
];

const NetBankingForm = ({ selectedBank, setSelectedBank }) => (
    <div className="py-2 space-y-3">
        <p className="text-xs text-slate-400">Select your bank</p>
        <div className="grid grid-cols-3 gap-2">
            {BANKS.map(b => (
                <button
                    key={b.id}
                    onClick={() => setSelectedBank(b.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${selectedBank === b.id
                            ? "bg-blue-500/15 border-blue-500/50"
                            : "border-white/8 hover:border-white/20 hover:bg-white/4"
                        }`}
                >
                    <span className="text-2xl">{b.icon}</span>
                    <span className={`text-xs font-semibold ${selectedBank === b.id ? "text-blue-300" : "text-slate-300"}`}>{b.name}</span>
                </button>
            ))}
        </div>
        {selectedBank && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-300">
                <span>🔗</span> You'll be redirected to {BANKS.find(b => b.id === selectedBank)?.name} net banking portal to complete payment.
            </div>
        )}
    </div>
);

/* ── MAIN RECEIPT PAGE ───────────────────────────────────────────── */
const Receipt = () => {
    const { rideId } = useParams();
    const [ride, setRide] = useState(null);
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [method, setMethod] = useState("upi");
    const [upiId, setUpiId] = useState("");
    const [cardData, setCardData] = useState({ number: "", name: "", expiry: "", cvv: "" });
    const [selectedBank, setSelectedBank] = useState("");
    const [step, setStep] = useState("details"); // "details" | "pay" | "done"
    const [countdown, setCountdown] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await API.get("/rides/my");
                const found = (data.rides || []).find(r => r._id === rideId);
                setRide(found || null);
                try {
                    const { data: pd } = await API.get(`/payments/${rideId}`);
                    setPayment(pd.payment || null);
                    if (pd.payment) setStep("done");
                } catch { /* no payment yet */ }
            } catch { toast.error("Could not load ride details"); }
            finally { setLoading(false); }
        };
        load();
    }, [rideId]);

    const TAX_RATE = 0.05;
    const CONV_FEE = 2;
    const baseFare = ride?.fare || 0;
    const tax = Math.round(baseFare * TAX_RATE);
    const total = baseFare + tax + CONV_FEE;

    const validatePayment = () => {
        if (method === "upi" && upiId && !upiId.includes("@")) {
            toast.error("Enter a valid UPI ID (e.g. name@upi)"); return false;
        }
        if (method === "card") {
            if (cardData.number.replace(/\s/g, "").length !== 16) { toast.error("Enter valid 16-digit card number"); return false; }
            if (!cardData.name.trim()) { toast.error("Enter cardholder name"); return false; }
            if (!cardData.expiry.includes("/")) { toast.error("Enter valid expiry MM/YY"); return false; }
            if (cardData.cvv.length !== 3) { toast.error("Enter 3-digit CVV"); return false; }
        }
        if (method === "netbanking" && !selectedBank) { toast.error("Select a bank"); return false; }
        return true;
    };

    const handlePay = async () => {
        if (!validatePayment()) return;
        setPaying(true);

        // Simulate payment processing countdown for card/netbanking
        if (method === "card" || method === "netbanking") {
            let t = 3;
            setCountdown(t);
            const cId = setInterval(() => {
                t--;
                setCountdown(t);
                if (t <= 0) clearInterval(cId);
            }, 1000);
            await new Promise(r => setTimeout(r, 3000));
            setCountdown(null);
        }

        try {
            const { data } = await API.post("/payments/pay", {
                rideId,
                paymentMethod: method === "upi" ? "upi" : method === "card" ? "card" : method === "netbanking" ? "card" : "cash",
            });
            setPayment(data.payment);
            setStep("done");
            toast.success(`✅ Payment of ₹${total} successful!`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Payment failed");
        } finally {
            setPaying(false);
        }
    };

    if (loading) return <Layout><div className="flex justify-center py-20"><Loader fullScreen={false} /></div></Layout>;
    if (!ride) return (
        <Layout>
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-6xl mb-4">🚫</div>
                <p className="text-xl font-bold text-white mb-2">Ride not found</p>
                <Link to="/history" className="text-blue-400 hover:text-blue-300 text-sm mt-2">← Back to History</Link>
            </div>
        </Layout>
    );

    const METHODS = [
        { id: "upi", label: "UPI", icon: "📱", desc: "GPay, PhonePe, Paytm..." },
        { id: "card", label: "Card", icon: "💳", desc: "Credit / Debit Card" },
        { id: "cash", label: "Cash", icon: "💵", desc: "Pay driver directly" },
        { id: "netbanking", label: "Net Banking", icon: "🏦", desc: "Internet banking" },
    ];

    return (
        <Layout>
            <div className="max-w-md mx-auto space-y-4 page-enter">
                <div className="flex items-center gap-3">
                    <Link to="/history" className="text-slate-400 hover:text-white transition-colors text-sm">← Back</Link>
                    <h1 className="text-2xl font-black text-white">
                        {step === "done" ? "Payment Complete" : "Pay for Ride"}
                    </h1>
                </div>

                {/* ── RIDE SUMMARY ─────────────────────────────────────────── */}
                <div className="glass rounded-2xl p-4 border border-white/8">
                    <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-0.5 mt-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                            <div className="w-0.5 h-7 bg-gradient-to-b from-emerald-400 to-blue-400 opacity-30" />
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <p className="text-sm font-semibold text-white">{ride.pickup}</p>
                            <p className="text-sm text-slate-400">{ride.drop}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="text-xs text-slate-500">{ride.distance} km · {VEHICLE_LABEL[ride.vehicleType]?.split(" ")[0]}</p>
                            <p className="text-sm font-bold text-white">₹{baseFare}</p>
                        </div>
                    </div>
                </div>

                {/* ── FARE BREAKDOWN ──────────────────────────────────────────── */}
                <div className="glass rounded-2xl p-4 border border-white/8 space-y-2 text-sm">
                    {[
                        { label: "Ride Fare", value: `₹${baseFare}`, cls: "text-white" },
                        { label: "GST (5%)", value: `₹${tax}`, cls: "text-slate-400" },
                        { label: "Convenience Fee", value: `₹${CONV_FEE}`, cls: "text-slate-400" },
                    ].map(r => (
                        <div key={r.label} className="flex justify-between">
                            <span className="text-slate-400">{r.label}</span>
                            <span className={r.cls}>{r.value}</span>
                        </div>
                    ))}
                    <div className="border-t border-white/10 pt-2 flex justify-between font-black text-base">
                        <span className="text-white">Total</span>
                        <span className="text-blue-400">₹{total}</span>
                    </div>
                </div>

                {/* ── DONE STATE ─────────────────────────────────────────────── */}
                {step === "done" ? (
                    <div className="glass rounded-2xl overflow-hidden border border-emerald-500/20">
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-center">
                            <div className="text-5xl mb-2">✅</div>
                            <p className="text-white font-black text-xl">₹{total} Paid!</p>
                            <p className="text-emerald-100/70 text-sm mt-1">
                                via {payment?.paymentMethod?.toUpperCase() || "UPI"} · {new Date(payment?.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                            </p>
                        </div>
                        <div className="p-4 flex gap-3">
                            <button onClick={() => window.print()} className="flex-1 glass border border-white/10 text-slate-300 font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                                🖨️ Print
                            </button>
                            <Link to="/book" className="flex-1 bg-blue-500/15 border border-blue-500/25 text-blue-400 font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                                🚗 Book Again
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── PAYMENT METHOD TABS ───────────────────────────────── */}
                        <div className="glass rounded-2xl p-4 border border-white/8 space-y-4">
                            <p className="text-sm font-semibold text-white">Choose Payment Method</p>
                            <div className="grid grid-cols-4 gap-2">
                                {METHODS.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMethod(m.id)}
                                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${method === m.id
                                                ? "bg-blue-500/15 border-blue-500/40 shadow-glow-sm"
                                                : "border-white/8 hover:border-white/20 hover:bg-white/4"
                                            }`}
                                    >
                                        <span className="text-xl">{m.icon}</span>
                                        <span className={`text-[11px] font-semibold leading-tight ${method === m.id ? "text-blue-300" : "text-slate-400"}`}>{m.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* ── UPI ────────────────────────────────────────────── */}
                            {method === "upi" && (
                                <div>
                                    <UPIQRCode amount={total} />
                                    <div className="border-t border-white/8 pt-3 mt-2">
                                        <p className="text-xs text-slate-400 mb-2">Or enter UPI ID manually</p>
                                        <input
                                            type="text"
                                            placeholder="yourname@upi"
                                            value={upiId}
                                            onChange={e => setUpiId(e.target.value)}
                                            className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── CARD ───────────────────────────────────────────── */}
                            {method === "card" && (
                                <CardForm cardData={cardData} setCardData={setCardData} />
                            )}

                            {/* ── CASH ───────────────────────────────────────────── */}
                            {method === "cash" && (
                                <div className="py-4 text-center space-y-3">
                                    <div className="text-5xl">💵</div>
                                    <p className="text-white font-semibold">Pay ₹{total} to driver</p>
                                    <p className="text-slate-400 text-sm">Please keep exact change ready. The driver will confirm receipt.</p>
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
                                        💡 Tip: Use exact change or UPI for a faster drop-off experience.
                                    </div>
                                </div>
                            )}

                            {/* ── NET BANKING ─────────────────────────────────────── */}
                            {method === "netbanking" && (
                                <NetBankingForm selectedBank={selectedBank} setSelectedBank={setSelectedBank} />
                            )}
                        </div>

                        {/* ── PAY BUTTON ─────────────────────────────────────────── */}
                        <button
                            onClick={handlePay}
                            disabled={paying}
                            className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white font-black py-4 rounded-2xl text-base transition-all disabled:opacity-60 active:scale-[0.98] shadow-glow"
                        >
                            {paying
                                ? countdown !== null
                                    ? `🔐 Verifying payment... ${countdown}s`
                                    : "⏳ Processing..."
                                : method === "cash"
                                    ? `✅ Confirm Cash Payment — ₹${total}`
                                    : method === "upi"
                                        ? `📱 Pay ₹${total} via UPI`
                                        : method === "card"
                                            ? `💳 Pay ₹${total} via Card`
                                            : `🏦 Pay ₹${total} via Net Banking`}
                        </button>

                        <p className="text-center text-xs text-slate-500">
                            🔒 Secured by 256-bit SSL encryption
                        </p>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default Receipt;
