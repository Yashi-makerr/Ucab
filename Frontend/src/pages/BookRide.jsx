import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import API from "../services/api";
import toast from "react-hot-toast";

/* ── Haversine distance formula ─────────────────────────────────── */
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
};

/* ── Geocode a location string via Nominatim (OpenStreetMap) ─────── */
const geocode = async (query) => {
  if (!query || query.trim().length < 3) return null;
  try {
    const encoded = encodeURIComponent(query + ", India");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=in`,
      { headers: { "Accept-Language": "en", "User-Agent": "UCabApp/1.0" } }
    );
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
  } catch { return null; }
};

/* ── Vehicle options ─────────────────────────────────────────────── */
const VEHICLES = [
  { id: "mini", label: "Mini", icon: "🚗", desc: "Compact & affordable", multiplier: 1.0, eta: "3 min" },
  { id: "sedan", label: "Sedan", icon: "🚙", desc: "Comfortable ride", multiplier: 1.3, eta: "5 min" },
  { id: "suv", label: "SUV", icon: "🚕", desc: "Spacious & premium", multiplier: 1.6, eta: "7 min" },
  { id: "auto", label: "Auto", icon: "🛺", desc: "Budget-friendly", multiplier: 0.7, eta: "2 min" },
];

const BASE_FARE = 50;
const PER_KM = 10;
const TAX_RATE = 0.05;
const CONV_FEE = 2;

const calcFare = (dist, multiplier) =>
  Math.round((BASE_FARE + dist * PER_KM) * multiplier);

/* ── Address suggestion box ──────────────────────────────────────── */
const AddressInput = ({ label, icon, value, onChange, onSelect, suggestions, loadingSug }) => (
  <div className="relative">
    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">{label}</label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg z-10">{icon}</span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={`Enter ${label.toLowerCase()}`}
        className="w-full pl-12 pr-4 py-3.5 bg-white/4 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all text-sm"
      />
      {loadingSug && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs animate-pulse">🔍</span>
      )}
    </div>
    {suggestions?.length > 0 && (
      <div className="absolute z-50 left-0 right-0 top-full mt-1 glass border border-white/10 rounded-xl overflow-hidden shadow-xl max-h-52 overflow-y-auto">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s)}
            className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/8 transition-colors border-b border-white/5 last:border-0 flex items-start gap-2"
          >
            <span className="mt-0.5 text-slate-500 flex-shrink-0">📍</span>
            <span className="line-clamp-2">{s.display_name}</span>
          </button>
        ))}
      </div>
    )}
  </div>
);

/* ── MAIN BookRide PAGE ──────────────────────────────────────────── */
const BookRide = () => {
  const navigate = useNavigate();

  // Address state
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [pickupGeo, setPickupGeo] = useState(null);
  const [dropGeo, setDropGeo] = useState(null);
  const [pickupSug, setPickupSug] = useState([]);
  const [dropSug, setDropSug] = useState([]);
  const [loadPSug, setLoadPSug] = useState(false);
  const [loadDSug, setLoadDSug] = useState(false);

  // Ride state
  const [distance, setDistance] = useState(null);
  const [calcError, setCalcError] = useState("");
  const [vehicle, setVehicle] = useState("mini");
  const [detecting, setDetecting] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponErr, setCouponErr] = useState("");
  const [applyingC, setApplyingC] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);

  // Booking state
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const debounceRef = useRef({});

  // ── Fare calculation ────────────────────────────────────────────
  const veh = VEHICLES.find(v => v.id === vehicle);
  const rawFare = distance ? calcFare(distance, veh.multiplier) : 0;
  const discount = coupon?.discount || 0;
  const discFare = Math.max(0, rawFare - discount);
  const tax = Math.round(discFare * TAX_RATE);
  const total = discFare + tax + CONV_FEE;

  // ── Auto-suggest addresses ──────────────────────────────────────
  const suggestAddress = useCallback(async (query, setSug, setLoading, key) => {
    clearTimeout(debounceRef.current[key]);
    if (query.length < 3) { setSug([]); return; }
    debounceRef.current[key] = setTimeout(async () => {
      setLoading(true);
      try {
        const encoded = encodeURIComponent(query + ", India");
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&countrycodes=in`,
          { headers: { "Accept-Language": "en", "User-Agent": "UCabApp/1.0" } }
        );
        const data = await res.json();
        setSug(data || []);
      } catch { setSug([]); }
      setLoading(false);
    }, 400);
  }, []);

  // ── Auto-calculate distance when both addresses are geocoded ────
  const recalcDistance = useCallback(async (pgeo, dgeo) => {
    if (!pgeo || !dgeo) return;
    setCalcError("");
    const d = haversine(pgeo.lat, pgeo.lng, dgeo.lat, dgeo.lng);
    if (d < 0.2) { setCalcError("Pickup and drop seem too close — please pick different locations."); setDistance(null); return; }
    setDistance(d);
    toast(`📏 Distance calculated: ${d} km`, { icon: "✅" });
  }, []);

  const onPickupChange = (val) => {
    setPickup(val); setPickupGeo(null); setDistance(null); setCoupon(null);
    suggestAddress(val, setPickupSug, setLoadPSug, "pickup");
  };

  const onDropChange = (val) => {
    setDrop(val); setDropGeo(null); setDistance(null); setCoupon(null);
    suggestAddress(val, setDropSug, setLoadDSug, "drop");
  };

  const selectPickup = (sug) => {
    const geo = { lat: parseFloat(sug.lat), lng: parseFloat(sug.lon), display: sug.display_name };
    setPickup(sug.display_name); setPickupGeo(geo); setPickupSug([]);
    recalcDistance(geo, dropGeo);
  };

  const selectDrop = (sug) => {
    const geo = { lat: parseFloat(sug.lat), lng: parseFloat(sug.lon), display: sug.display_name };
    setDrop(sug.display_name); setDropGeo(geo); setDropSug([]);
    recalcDistance(pickupGeo, geo);
  };

  // Use current GPS for pickup
  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const { latitude, longitude } = coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await res.json();
        const label = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        const geo = { lat: latitude, lng: longitude, display: label };
        setPickup(label); setPickupGeo(geo); setPickupSug([]);
        recalcDistance(geo, dropGeo);
      } catch { toast.error("Could not reverse-geocode your location"); }
      setDetecting(false);
    }, () => { toast.error("Location access denied"); setDetecting(false); });
  };

  // Swap pickup ↔ drop
  const swapLocations = () => {
    setPickup(drop); setDrop(pickup);
    setPickupGeo(dropGeo); setDropGeo(pickupGeo);
    setPickupSug([]); setDropSug([]);
    if (pickupGeo && dropGeo) recalcDistance(dropGeo, pickupGeo);
  };

  // ── Coupon validation ───────────────────────────────────────────
  const applyCoupon = async () => {
    if (!couponCode.trim()) { setCouponErr("Enter a coupon code"); return; }
    if (!rawFare) { setCouponErr("Please select pickup & drop first"); return; }
    setApplyingC(true); setCouponErr(""); setCoupon(null);
    try {
      const { data } = await API.post("/coupons/validate", { code: couponCode.trim().toUpperCase(), fare: rawFare });
      setCoupon(data); toast.success(data.message);
    } catch (err) {
      setCouponErr(err.response?.data?.message || "Invalid coupon");
    } finally { setApplyingC(false); }
  };

  const removeCoupon = () => { setCoupon(null); setCouponCode(""); setCouponErr(""); };

  // ── Book ride ───────────────────────────────────────────────────
  const handleBook = async () => {
    if (!pickup || !drop) { toast.error("Enter pickup and drop locations"); return; }
    if (!pickupGeo || !dropGeo) { toast.error("Select locations from the dropdown suggestions"); return; }
    if (!distance) { toast.error("Distance not calculated yet"); return; }
    setBooking(true);
    try {
      const { data } = await API.post("/rides/create", {
        pickup, drop, distance,
        pickupLat: pickupGeo.lat, pickupLng: pickupGeo.lng,
        dropLat:   dropGeo.lat,   dropLng:   dropGeo.lng,
        vehicleType: vehicle,
        couponCode: coupon?.code || null,
        discountAmt: discount,
      });
      setConfirmed(data);
      toast.success("🚗 Ride booked successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally { setBooking(false); }
  };

  // ── Confirmation screen ─────────────────────────────────────────
  if (confirmed) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto page-enter">
          <div className="glass rounded-3xl overflow-hidden border border-white/10 shadow-glow">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-center">
              <div className="text-6xl mb-3 animate-bounce">🎉</div>
              <h2 className="text-2xl font-black text-white mb-1">Ride Booked!</h2>
              <p className="text-emerald-100/80 text-sm">
                {confirmed.message}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Vehicle", value: VEHICLES.find(v => v.id === vehicle)?.label + " " + VEHICLES.find(v => v.id === vehicle)?.icon },
                  { label: "Distance", value: `${distance} km` },
                  { label: "Fare", value: `₹${rawFare}` },
                  { label: "Discount", value: discount > 0 ? `-₹${discount}` : "None" },
                  { label: "Tax (5%)", value: `₹${tax}` },
                  { label: "Total", value: `₹${total}` },
                ].map(r => (
                  <div key={r.label} className="bg-white/4 rounded-xl px-4 py-2.5">
                    <p className="text-xs text-slate-400">{r.label}</p>
                    <p className={`font-bold text-sm ${r.label === "Total" ? "text-blue-400" : r.label === "Discount" && discount > 0 ? "text-emerald-400" : "text-white"}`}>{r.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate("/history")} className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                  📋 View History
                </button>
                <button
                  onClick={() => navigate(`/receipt/${confirmed.ride._id}`)}
                  className="flex-1 glass border border-white/15 text-white font-bold py-3 rounded-xl text-sm transition-colors hover:bg-white/8"
                >
                  🧾 Pay & Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── AVAILABLE COUPONS PANEL ──────────────────────────────────────
  const COUPONS_LIST = [
    { code: "FIRST50", label: "50% OFF", desc: "50% off your first ride (max ₹100)", tag: "POPULAR" },
    { code: "UCAB20", label: "20% OFF", desc: "20% off on rides above ₹100", tag: "" },
    { code: "FLAT30", label: "₹30 OFF", desc: "Flat ₹30 off on rides above ₹80", tag: "" },
    { code: "RIDE10", label: "10% OFF", desc: "10% off any ride", tag: "" },
    { code: "WELCOME", label: "₹50 OFF", desc: "Welcome bonus — ₹50 off", tag: "NEW" },
  ];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-5 page-enter" onClick={() => { setPickupSug([]); setDropSug([]); }}>
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-white">Book a Ride</h1>
          <p className="text-slate-400 text-sm">Enter your route — distance & fare auto-calculated</p>
        </div>

        {/* ── ROUTE SECTION ──────────────────────────────────────── */}
        <div className="glass rounded-2xl p-5 space-y-4 border border-white/8" onClick={e => e.stopPropagation()}>
          <h2 className="font-bold text-white flex items-center gap-2 text-sm">📍 Your Route</h2>

          {/* Pickup */}
          <AddressInput
            label="Pickup Location"
            icon="🟢"
            value={pickup}
            onChange={e => onPickupChange(e.target.value)}
            onSelect={selectPickup}
            suggestions={pickupSug}
            loadingSug={loadPSug}
          />

          {/* Swap / GPS row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-white/8" />
            <button onClick={swapLocations} className="w-8 h-8 rounded-full glass border border-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-all hover:border-blue-500/40 active:scale-90">
              ⇅
            </button>
            <button
              onClick={useMyLocation}
              disabled={detecting}
              className="flex items-center gap-1.5 px-3 py-1.5 glass border border-white/10 rounded-xl text-xs text-slate-400 hover:text-white hover:border-blue-500/25 transition-all"
            >
              {detecting ? "📡 Locating..." : "📡 Use GPS"}
            </button>
            <div className="flex-1 border-t border-white/8" />
          </div>

          {/* Drop */}
          <AddressInput
            label="Drop Location"
            icon="🔴"
            value={drop}
            onChange={e => onDropChange(e.target.value)}
            onSelect={selectDrop}
            suggestions={dropSug}
            loadingSug={loadDSug}
          />

          {/* Distance result */}
          {distance ? (
            <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
              <span className="text-2xl">📏</span>
              <div>
                <p className="text-white font-bold text-lg">{distance} km</p>
                <p className="text-blue-300 text-xs">Auto-calculated via GPS coordinates</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm text-slate-400">Est. time</p>
                <p className="text-white font-semibold text-sm">~{Math.round(distance / 30 * 60)} min</p>
              </div>
            </div>
          ) : (pickupGeo || dropGeo) && !distance ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
              <span>⚠️</span> {calcError || "Select both locations from dropdown to auto-calculate distance"}
            </div>
          ) : null}
        </div>

        {/* ── VEHICLE SELECTION ───────────────────────────────────── */}
        <div className="glass rounded-2xl p-5 border border-white/8">
          <h2 className="font-bold text-white text-sm mb-3">🚗 Choose Vehicle</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {VEHICLES.map(v => {
              const fare = distance ? calcFare(distance, v.multiplier) : null;
              return (
                <button
                  key={v.id}
                  onClick={() => setVehicle(v.id)}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all duration-200 ${vehicle === v.id
                      ? "bg-blue-500/15 border-blue-500/50 shadow-glow-sm"
                      : "border-white/8 hover:border-white/20 hover:bg-white/4"
                    }`}
                >
                  <span className="text-3xl">{v.icon}</span>
                  <span className={`text-sm font-semibold ${vehicle === v.id ? "text-blue-300" : "text-white"}`}>{v.label}</span>
                  <span className="text-[10px] text-slate-500 text-center leading-tight">{v.desc}</span>
                  {fare ? (
                    <span className={`text-sm font-black mt-1 ${vehicle === v.id ? "text-blue-300" : "text-slate-300"}`}>₹{fare}</span>
                  ) : (
                    <span className="text-xs text-slate-600 mt-1">{v.eta} away</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── COUPON SECTION ──────────────────────────────────────── */}
        <div className="glass rounded-2xl p-5 border border-white/8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">🎟️ Coupon Code</h2>
            <button
              onClick={() => setShowCoupons(s => !s)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showCoupons ? "▲ Hide offers" : "▼ View offers"}
            </button>
          </div>

          {/* Available coupons */}
          {showCoupons && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COUPONS_LIST.map(c => (
                <button
                  key={c.code}
                  onClick={() => { setCouponCode(c.code); setShowCoupons(false); }}
                  className="text-left flex items-start gap-3 p-3 rounded-xl border border-dashed border-blue-500/30 hover:bg-blue-500/8 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-500/15 flex items-center justify-center text-xs font-black text-blue-400 flex-shrink-0 leading-tight text-center">
                    {c.label}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white font-mono">{c.code}</span>
                      {c.tag && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">{c.tag}</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{c.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Applied coupon display */}
          {coupon ? (
            <div className="flex items-center justify-between bg-emerald-500/12 border border-emerald-500/25 rounded-xl px-4 py-3">
              <div>
                <p className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">✅ {coupon.code}</p>
                <p className="text-emerald-300/70 text-xs">{coupon.description} — Save ₹{coupon.discount}</p>
              </div>
              <button onClick={removeCoupon} className="text-rose-400 hover:text-rose-300 text-xs font-semibold transition-colors">✕ Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponErr(""); }}
                onKeyDown={e => e.key === "Enter" && applyCoupon()}
                placeholder="Enter coupon code (e.g. FIRST50)"
                className="flex-1 bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-mono uppercase"
              />
              <button
                onClick={applyCoupon}
                disabled={applyingC || !couponCode.trim()}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 active:scale-95"
              >
                {applyingC ? "..." : "Apply"}
              </button>
            </div>
          )}
          {couponErr && <p className="text-rose-400 text-xs flex items-center gap-1">⚠️ {couponErr}</p>}
        </div>

        {/* ── FARE SUMMARY ────────────────────────────────────────── */}
        {distance && (
          <div className="glass rounded-2xl p-5 border border-blue-500/15 space-y-3">
            <h2 className="font-bold text-white text-sm">💰 Fare Summary</h2>
            <div className="space-y-2 text-sm">
              {[
                { label: "Base fare", value: `₹${rawFare}`, cls: "text-white" },
                ...(discount > 0 ? [{ label: `Discount (${coupon?.code})`, value: `-₹${discount}`, cls: "text-emerald-400" }] : []),
                { label: "Tax (5% GST)", value: `₹${tax}`, cls: "text-slate-300" },
                { label: "Convenience fee", value: `₹${CONV_FEE}`, cls: "text-slate-300" },
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
          </div>
        )}

        {/* ── BOOK BUTTON ─────────────────────────────────────────── */}
        <button
          onClick={handleBook}
          disabled={booking || !pickup || !drop || !distance}
          className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white font-black py-4 rounded-2xl text-base transition-all disabled:opacity-50 active:scale-[0.98] shadow-glow"
        >
          {booking ? "🔄 Booking..." : !pickup || !drop ? "Enter Pickup & Drop" : !distance ? "Select from suggestions to calc distance" : `🚗 Confirm Booking — ₹${total}`}
        </button>
      </div>
    </Layout>
  );
};

export default BookRide;