cat > components/OpenAcreApp.js <<'EOF'
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Fish, Shield, CalendarCheck, DollarSign, Users, CheckCircle, Mail, Phone, Globe2, Clock, Ban, Map } from "lucide-react";
import maplibregl from "maplibre-gl";

/* ---------- Demo data ---------- */
const initialListings = [
  { id: "acres-kingsville", name: "Kingsville Whitetail & Turkey", species: ["Whitetail","Turkey"], pricePerDay: 85, lng: -82.7169, lat: 42.0370 },
  { id: "cedar-creek-bass", name: "Cedar Creek Bass Access", species: ["Bass","Panfish"], pricePerDay: 35, lng: -82.765, lat: 42.146 },
  { id: "harrow-waterfowl", name: "Harrow Waterfowl Field", species: ["Waterfowl"], pricePerDay: 60, lng: -82.918, lat: 42.043 }
];

const faq = [
  { q: "Do I need a hunting/fishing license?", a: "Yes—local regulations apply. We verify that hunters have valid ID, license, and (where applicable) insurance before booking." },
  { q: "How do payouts work for owners?", a: "Funds are released 24 hours after the booked day ends (minus OpenAcre fees). You can choose direct deposit or Interac e-Transfer." },
  { q: "What if a guest breaks the rules?", a: "Properties have clear rules: Zones & Hours, No-Transfer, Check-in/Check-out. Violations may trigger warnings, fees, or account removal." },
  { q: "What are the fees?", a: "Day-pass bookings include a 12% platform fee from the guest and a 5% owner fee (min $2). Memberships can reduce fees." },
  { q: "Is there insurance?", a: "OpenAcre requires proof of personal liability coverage where required by law. Owners should maintain property liability coverage as recommended by their insurer." }
];

/* ---------- Utils ---------- */
const saveLocal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const loadLocal = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } };

/* ---------- Small UI helpers ---------- */
const Section = ({ id, eyebrow, title, subtitle, children, pad = true }) => (
  <section id={id} className={pad ? "py-14 md:py-20" : ""}>
    <div className="max-w-6xl mx-auto px-4">
      {(eyebrow || title || subtitle) && (
        <header className="mb-8 md:mb-10">
          {eyebrow && <div className="text-xs uppercase tracking-wider text-green-700/80 font-semibold">{eyebrow}</div>}
          {title && <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-green-900 mt-1">{title}</h2>}
          {subtitle && <p className="text-green-900/70 mt-2 max-w-3xl">{subtitle}</p>}
        </header>
      )}
      {children}
    </div>
  </section>
);

const Field = ({ label, children, required }) => (
  <label className="block mb-3">
    <span className="block text-sm font-medium text-green-900/90 mb-1">
      {label} {required && <span className="text-red-600">*</span>}
    </span>
    {children}
  </label>
);

const TextInput = (p) => <input {...p} className={`w-full rounded-xl border border-green-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green-500/30 ${p.className||''}`} />;
const TextArea = (p) => <textarea {...p} className={`w-full rounded-xl border border-green-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green-500/30 ${p.className||''}`} />;
const Select = (p) => <select {...p} className={`w-full rounded-xl border border-green-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green-500/30 ${p.className||''}`} />;
const Pill = ({ children }) => <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-3 py-1 text-sm text-green-900/90">{children}</span>;

/* ---------- Map ---------- */
function ListingsMap({ listings }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const bounds = useMemo(() => {
    if (!listings?.length) return null;
    let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
    listings.forEach(l => { minLng = Math.min(minLng,l.lng); maxLng = Math.max(maxLng,l.lng); minLat = Math.min(minLat,l.lat); maxLat = Math.max(maxLat,l.lat); });
    return [[minLng, minLat], [maxLng, maxLat]];
  }, [listings]);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-82.75, 42.08],
      zoom: 9,
      attributionControl: true
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    listings.forEach(l => {
      const el = document.createElement("div");
      el.className = "rounded-full bg-green-600 shadow-lg text-white grid place-items-center";
      el.style.width = "28px"; el.style.height = "28px"; el.style.border = "2px solid white";
      el.innerHTML = "📍";
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([l.lng, l.lat])
        .setPopup(new maplibregl.Popup({ offset: 16 }).setHTML(
          `<div style="font-weight:600;margin-bottom:4px;">${l.name}</div>
           <div style="font-size:12px;opacity:.8">${(l.species||[]).join(', ')}</div>
           <div style="font-size:12px;margin-top:6px;">$${l.pricePerDay}/day</div>`
        ))
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (bounds) {
      try { map.fitBounds(bounds, { padding: 60, duration: 600 }); } catch {}
    }
  }, [listings, bounds]);

  return <div ref={ref} className="w-full h-[420px] rounded-2xl overflow-hidden border border-green-200" />;
}

/* ---------- Landing ---------- */
function Landing({ onGoOwners, onGoHunters, listings, setListings }) {
  const [nl, setNL] = useState({ name: "", lng: "", lat: "", species: "", pricePerDay: "" });
  const add = (e) => {
    e.preventDefault();
    const id = (nl.name || "listing").toLowerCase().replace(/[^a-z0-9]+/g,"-")+Date.now();
    const next = {
      id,
      name: nl.name || "New Listing",
      species: nl.species ? nl.species.split(",").map(s=>s.trim()) : [],
      pricePerDay: nl.pricePerDay ? Number(nl.pricePerDay) : 0,
      lng: Number(nl.lng), lat: Number(nl.lat)
    };
    if (Number.isFinite(next.lng) && Number.isFinite(next.lat)) {
      const updated = [...listings, next];
      setListings(updated); saveLocal("openacre_listings", updated);
      setNL({ name:"", lng:"", lat:"", species:"", pricePerDay:"" });
    }
  };

  return (
    <div>
      <div className="bg-green-50">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-green-900">OpenAcre</h1>
            <p className="mt-2 text-lg text-green-900/70">Hunt &amp; Fish Everywhere.</p>
            <p className="mt-6 text-green-900/80 max-w-xl">A clean, trusted marketplace connecting landowners and outdoorspeople for day-access. Simple rules. Clear boundaries. Instant bookings.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onGoOwners} className="rounded-xl bg-green-700 hover:bg-green-800 text-white px-5 py-3 font-medium inline-flex items-center gap-2"><Shield className="h-4 w-4"/>I’m an Owner</button>
              <button onClick={onGoHunters} className="rounded-xl bg-white hover:bg-green-50 text-green-900 border border-green-200 px-5 py-3 font-medium inline-flex items-center gap-2"><Fish className="h-4 w-4"/>I’m a Hunter</button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Pill><MapPin className="h-4 w-4" />Zones &amp; Hours</Pill>
              <Pill><Ban className="h-4 w-4" />No-Transfer</Pill>
              <Pill><Clock className="h-4 w-4" />Check-In / Out</Pill>
            </div>
          </div>
          <div className="rounded-2xl border border-green-200 bg-white p-2">
            <ListingsMap listings={listings} />
            <div className="p-3 text-xs text-green-900/70">Demo map. Add a listing below to see your marker instantly.</div>
          </div>
        </div>
      </div>

      <Section id="features" eyebrow="Why OpenAcre" title="Clean, safe access with rules that work" subtitle="Built like Airbnb—identity, reviews, clear fees, and reliable payouts.">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon:<Shield className="h-5 w-5"/>, title:"Verified access", text:"ID, license & (where required) insurance verifications." },
            { icon:<Map className="h-5 w-5"/>, title:"Clear boundaries", text:"Map zones, hours, and no-go areas." },
            { icon:<CalendarCheck className="h-5 w-5"/>, title:"Instant bookings", text:"Instant or request-to-book—your choice." },
            { icon:<DollarSign className="h-5 w-5"/>, title:"Simple fees", text:"12% guest + 5% owner (min $2)." },
            { icon:<Users className="h-5 w-5"/>, title:"Two-way reviews", text:"Ratings for hunters and owners build trust." },
            { icon:<CheckCircle className="h-5 w-5"/>, title:"Rule-first design", text:"Zones & Hours, No-Transfer, check-in/out photos." }
          ].map((f,i)=>(
            <div key={i} className="rounded-2xl border border-green-200 bg-white p-5">
              <div className="flex items-center gap-2 text-green-800 font-semibold">
                <span className="grid place-items-center h-8 w-8 rounded-full bg-green-100 border border-green-200">{f.icon}</span>{f.title}
              </div>
              <p className="text-green-900/70 mt-2">{f.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="experiences" eyebrow="Experiences" title="Browse access by species & season" subtitle="Add or edit locations anytime—this is your live map.">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ListingsMap listings={listings}/></div>
          <div className="rounded-2xl border border-green-200 bg-white p-5">
            <h3 className="font-semibold text-green-900 mb-3">Quick add a listing</h3>
            <form onSubmit={add} className="space-y-3">
              <Field label="Name" required><TextInput value={nl.name} onChange={e=>setNL(v=>({...v, name:e.target.value}))} required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Longitude" required><TextInput value={nl.lng} onChange={e=>setNL(v=>({...v, lng:e.target.value}))} placeholder="-82.75" required /></Field>
                <Field label="Latitude" required><TextInput value={nl.lat} onChange={e=>setNL(v=>({...v, lat:e.target.value}))} placeholder="42.08" required /></Field>
              </div>
              <Field label="Species (comma-separated)"><TextInput value={nl.species} onChange={e=>setNL(v=>({...v, species:e.target.value}))} placeholder="Whitetail, Turkey" /></Field>
              <Field label="Price per day ($)"><TextInput type="number" min={0} step={1} value={nl.pricePerDay} onChange={e=>setNL(v=>({...v, pricePerDay:e.target.value}))} placeholder="85" /></Field>
              <button className="w-full rounded-xl bg-green-700 hover:bg-green-800 text-white px-4 py-2 font-medium">Add to Map</button>
            </form>
            <p className="text-xs text-green-900/60 mt-3">Tip: Owners page has full property details + rules.</p>
          </div>
        </div>
      </Section>

      <Section id="pricing" eyebrow="Pricing" title="Transparent fees—no surprises" subtitle="Choose pay-as-you-go or memberships for savings.">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-green-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-green-900">Day-Pass</h3>
            <p className="text-sm text-green-900/70 mt-1">Great for occasional trips.</p>
            <div className="mt-4 text-3xl font-semibold text-green-900">12% <span className="text-base font-normal text-green-900/70">guest fee</span></div>
            <div className="text-green-900/70">+ 5% owner fee (min $2)</div>
            <ul className="mt-4 space-y-2 text-green-900/80 text-sm"><li>• No monthly commitment</li><li>• Two-way reviews</li><li>• Basic support</li></ul>
            <button className="mt-6 rounded-xl bg-green-700 hover:bg-green-800 text-white px-4 py-2">Book a Day</button>
          </div>
          <div className="rounded-2xl border-2 border-green-600 bg-green-50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-green-900">Priority Access</h3>
            <p className="text-sm text-green-900/70 mt-1">For frequent hunters & anglers.</p>
            <div className="mt-4 text-3xl font-semibold text-green-900">$12.99<span className="text-base font-normal">/mo</span></div>
            <ul className="mt-4 space-y-2 text-green-900/80 text-sm"><li>• Early booking windows</li><li>• 50% off guest fees</li><li>• Priority support</li></ul>
            <button className="mt-6 rounded-xl bg-green-700 hover:bg-green-800 text-white px-4 py-2">Join Membership</button>
          </div>
          <div className="rounded-2xl border border-green-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-green-900">Preferred Landowner</h3>
            <p className="text-sm text-green-900/70 mt-1">Boost your property income.</p>
            <div className="mt-4 text-3xl font-semibold text-green-900">$9.99<span className="text-base font-normal">/mo</span></div>
            <ul className="mt-4 space-y-2 text-green-900/80 text-sm"><li>• 50% off owner fees</li><li>• Featured placement</li><li>• Dedicated payouts line</li></ul>
            <button className="mt-6 rounded-xl bg-green-700 hover:bg-green-800 text-white px-4 py-2">Upgrade Owner</button>
          </div>
        </div>
      </Section>

      <Section id="faq" eyebrow="FAQ" title="Got questions? We’ve got answers.">
        <div className="grid md:grid-cols-2 gap-6">
          {faq.map((f, i) => (
            <details key={i} className="rounded-2xl border border-green-200 bg-white p-5">
              <summary className="cursor-pointer list-none font-semibold text-green-900">{f.q}</summary>
              <p className="mt-3 text-green-900/80">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ---------- Owners ---------- */
function OwnersPage() {
  const [form, setForm] = useState(loadLocal("openacre_owner_waitlist", {
    name:"", phone:"", email:"", propertyLocation:"", dayRate:"", rules:"",
    zonesHours:"Sunrise to 10:30 / 2:30 to sunset. North field closed.",
    noTransfer:true,
    checkin:"Photo at gate on arrival; photo of area on exit."
  }));
  const submit = (e)=>{ e.preventDefault(); saveLocal("openacre_owner_waitlist", form); alert("Owner waitlist saved (local demo)."); };

  return (
    <div>
      <Section eyebrow="For Landowners" title="Turn acres into income—without losing control" subtitle="Approve who comes on. Set rules and hours. Get paid automatically.">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon:<Shield className="h-5 w-5"/>, title:"You set the rules", text:"Zones & Hours, No-Transfer—enforced with check-in/out photos." },
            { icon:<DollarSign className="h-5 w-5"/>, title:"Predictable payouts", text:"Payouts 24 hours after the booked day completes (minus fees)." },
            { icon:<Users className="h-5 w-5"/>, title:"Vetted guests", text:"ID, license, and (if required) insurance." }
          ].map((c,i)=>(
            <div key={i} className="rounded-2xl border border-green-200 bg-white p-5">
              <div className="flex items-center gap-2 text-green-800 font-semibold">
                <span className="grid place-items-center h-8 w-8 rounded-full bg-green-100 border border-green-200">{c.icon}</span>{c.title}
              </div>
              <p className="text-green-900/70 mt-2">{c.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="How it works">
        <ol className="grid md:grid-cols-3 gap-6 list-decimal list-inside text-green-900/90">
          <li className="rounded-2xl border border-green-200 bg-white p-5">Verify owner ID.</li>
          <li className="rounded-2xl border border-green-200 bg-white p-5">Add boundaries + rules (Zones & Hours, No-Transfer).</li>
          <li className="rounded-2xl border border-green-200 bg-white p-5">Set day rate & dates; instant or request-to-book.</li>
          <li className="rounded-2xl border border-green-200 bg-white p-5">Guests book; you get paid after the day ends.</li>
          <li className="rounded-2xl border border-green-200 bg-white p-5">Two-way reviews build reputation.</li>
        </ol>
      </Section>

      <Section title="Join the Owner waitlist" subtitle="We’ll notify you when onboarding opens in your region.">
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-5">
          <Field label="Full name" required><TextInput value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required /></Field>
          <Field label="Phone" required><TextInput value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required /></Field>
          <Field label="Email" required><TextInput type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required /></Field>
          <Field label="Property location" required><TextInput value={form.propertyLocation} onChange={e=>setForm({...form, propertyLocation:e.target.value})} placeholder="address or lat,lng" required /></Field>
          <Field label="Day rate ($)" required><TextInput type="number" min={0} value={form.dayRate} onChange={e=>setForm({...form, dayRate:e.target.value})} required /></Field>
          <Field label="House rules"><TextArea rows={3} value={form.rules} onChange={e=>setForm({...form, rules:e.target.value})} /></Field>
          <Field label="Zones & Hours"><TextArea rows={2} value={form.zonesHours} onChange={e=>setForm({...form, zonesHours:e.target.value})} /></Field>
          <Field label="Check-in/out"><TextArea rows={2} value={form.checkin} onChange={e=>setForm({...form, checkin:e.target.value})} /></Field>
          <div className="md:col-span-2 flex items-center gap-2 text-sm text-green-900/90">
            <input type="checkbox" checked={form.noTransfer} onChange={e=>setForm({...form, noTransfer:e.target.checked})} className="h-4 w-4 rounded border-green-300 text-green-600" />
            No-Transfer (bookings cannot be transferred or resold)
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <button className="rounded-xl bg-green-700 hover:bg-green-800 text-white px-5 py-3 font-medium">Join waitlist</button>
            <span className="text-sm text-green-900/60">By joining, you accept our Terms, Privacy, and Waiver.</span>
          </div>
        </form>
      </Section>
    </div>
  );
}

/* ---------- Hunters ---------- */
function HuntersPage() {
  const [form, setForm] = useState(loadLocal("openacre_hunter_waitlist", {
    name:"", phone:"", email:"", species:"Turkey", insurance:"yes", licenseId:"", experience:"Beginner"
  }));
  const submit = (e)=>{ e.preventDefault(); saveLocal("openacre_hunter_waitlist", form); alert("Hunter waitlist saved (local demo)."); };

  return (
    <div>
      <Section eyebrow="For Hunters & Anglers" title="Access new ground the right way" subtitle="Real properties. Clear boundaries. Rules first.">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon:<MapPin className="h-5 w-5"/>, title:"Know before you go", text:"Zones & Hours, parking, rule highlights—visible pre-booking." },
            { icon:<Shield className="h-5 w-5"/>, title:"Stay compliant", text:"Upload ID, license, and insurance (if required)." },
            { icon:<CalendarCheck className="h-5 w-5"/>, title:"Book in minutes", text:"Instant confirmation or owner approval." }
          ].map((c,i)=>(
            <div key={i} className="rounded-2xl border border-green-200 bg-white p-5">
              <div className="flex items-center gap-2 text-green-800 font-semibold">
                <span className="grid place-items-center h-8 w-8 rounded-full bg-green-100 border border-green-200">{c.icon}</span>{c.title}
              </div>
              <p className="text-green-900/70 mt-2">{c.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Requirements">
        <ul className="grid md:grid-cols-3 gap-4 text-green-900/90">
          <li className="rounded-2xl border border-green-200 bg-white p-5">Government-issued photo ID</li>
          <li className="rounded-2xl border border-green-200 bg-white p-5">Valid hunting/fishing license</li>
          <li className="rounded-2xl border border-green-200 bg-white p-5">Liability insurance (if required)</li>
        </ul>
      </Section>

      <Section title="Steps">
        <ol className="grid md:grid-cols-3 gap-6 list-decimal list-inside text-green-900/90">
          <li className="rounded-2xl border border-green-200 bg-white p-5">Browse properties by species/season.</li>
          <li className="rounded-2xl border border-green-200 bg-white p-5">Review rules & upload required docs.</li>
          <li className="rounded-2xl border border-green-200 bg-white p-5">Book and receive directions + check-in.</li>
        </ol>
      </Section>

      <Section title="Join the Hunter waitlist" subtitle="We’ll ping you when access opens in your region.">
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-5">
          <Field label="Full name" required><TextInput value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required /></Field>
          <Field label="Phone" required><TextInput value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required /></Field>
          <Field label="Email" required><TextInput type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required /></Field>
          <Field label="Target species">
            <Select value={form.species} onChange={e=>setForm({...form, species:e.target.value})}>
              {["Whitetail","Turkey","Waterfowl","Bass","Walleye","Panfish"].map(s => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Insurance proof on file?">
            <Select value={form.insurance} onChange={e=>setForm({...form, insurance:e.target.value})}>
              <option value="yes">Yes</option><option value="no">No</option>
            </Select>
          </Field>
          <Field label="License ID (optional)"><TextInput value={form.licenseId} onChange={e=>setForm({...form, licenseId:e.target.value})} /></Field>
          <Field label="Experience level">
            <Select value={form.experience} onChange={e=>setForm({...form, experience:e.target.value})}>
              <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
            </Select>
          </Field>
          <div className="md:col-span-2 flex items-center gap-3">
            <button className="rounded-xl bg-green-700 hover:bg-green-800 text-white px-5 py-3 font-medium">Join waitlist</button>
            <span className="text-sm text-green-900/60">By joining, you accept our Terms, Privacy, and Waiver.</span>
          </div>
        </form>
      </Section>
    </div>
  );
}

/* ---------- App Shell ---------- */
export default function OpenAcreApp() {
  const [page, setPage] = useState("Landing");
  const [listings, setListings] = useState(() => loadLocal("openacre_listings", initialListings));
  useEffect(()=>{ saveLocal("openacre_listings", listings); }, [listings]);

  return (
    <div className="min-h-screen bg-white text-green-900">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b border-green-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-green-700 text-white grid place-items-center font-semibold">OA</div>
            <div className="text-xl md:text-2xl font-semibold tracking-tight">OpenAcre</div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {[
              {key:"Landing", label:"Home"},
              {key:"Owners", label:"Owners"},
              {key:"Hunters", label:"Hunters"},
              {key:"Legal", label:"Legal"},
              {key:"Contact", label:"Contact"}
            ].map(i=>(
              <button key={i.key} onClick={()=>setPage(i.key)} className={`px-3 py-2 rounded-xl text-sm font-medium ${page===i.key?'bg-green-700 text-white':'hover:bg-green-50 text-green-900'}`}>{i.label}</button>
            ))}
          </nav>
          <div className="md:hidden">
            <select value={page} onChange={e=>setPage(e.target.value)} className="rounded-xl border border-green-200 bg-white px-3 py-2">
              <option value="Landing">Home</option>
              <option value="Owners">Owners</option>
              <option value="Hunters">Hunters</option>
              <option value="Legal">Legal</option>
              <option value="Contact">Contact</option>
            </select>
          </div>
        </div>
      </header>

      {page==="Landing" && <Landing listings={listings} setListings={setListings} onGoOwners={()=>setPage("Owners")} onGoHunters={()=>setPage("Hunters")} />}
      {page==="Owners" && <OwnersPage/>}
      {page==="Hunters" && <HuntersPage/>}
      {page==="Legal" && (
        <Section eyebrow="Legal" title="Our policies" subtitle="Placeholders—replace with counsel-approved text.">
          <div className="rounded-2xl border border-green-200 bg-white p-6 text-green-900/85 space-y-4">
            <h3 className="font-semibold text-green-900 mb-2">Terms • Privacy • Waiver</h3>
            <p>OpenAcre is a marketplace connecting property owners with individuals seeking lawful recreational access (e.g., hunting, fishing). You agree to follow posted and in-app rules including Zones & Hours, No-Transfer, and Check-In/Out procedures.</p>
          </div>
        </Section>
      )}
      {page==="Contact" && (
        <Section eyebrow="Contact" title="We’re here to help" subtitle="Partnerships, onboarding, media.">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-green-200 bg-white p-5">
              <div className="flex items-center gap-2 font-semibold text-green-900"><Mail className="h-5 w-5"/>Email</div>
              <a className="text-green-700 underline" href="mailto:hello@openacre.co">hello@openacre.co</a>
            </div>
            <div className="rounded-2xl border border-green-200 bg-white p-5">
              <div className="flex items-center gap-2 font-semibold text-green-900"><Phone className="h-5 w-5"/>Phone</div>
              <div className="text-green-900/80">(555) 555-5555</div>
            </div>
            <div className="rounded-2xl border border-green-200 bg-white p-5">
              <div className="flex items-center gap-2 font-semibold text-green-900"><Globe2 className="h-5 w-5"/>Launch Regions</div>
              <div className="text-green-900/80">Southwestern Ontario (pilot) • Species: Whitetail, Turkey, Waterfowl, Bass, Walleye</div>
            </div>
          </div>
        </Section>
      )}

      <footer className="border-top border-green-100 mt-14">
        <div className="text-xs text-center text-green-900/60 pb-8">© {new Date().getFullYear()} OpenAcre. All rights reserved.</div>
      </footer>
    </div>
  );
}
EOF
