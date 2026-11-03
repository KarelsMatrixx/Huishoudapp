import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { fotoUit } from "./logica";

/* ---------- kleur per persoon: eerste huisgenoot p0, tweede p1 ---------- */
export function kleurVan(personen, pid) {
  if (pid === "beiden") return "var(--honing)";
  if (pid === "samen") return "linear-gradient(90deg, var(--p0) 50%, var(--p1) 50%)";
  const i = personen.findIndex((p) => p.pid === pid);
  return i >= 0 ? `var(--p${i})` : "var(--zacht)";
}
export function tintVan(personen, pid) {
  const i = personen.findIndex((p) => p.pid === pid);
  return i >= 0 ? `var(--p${i}-tint)` : "var(--linnen)";
}

export function Kaart({ children, style, className = "", ...rest }) {
  return <section className={"kaart " + className} style={style} {...rest}>{children}</section>;
}

export function Label({ children, style, rechts }) {
  if (!rechts) return <p className="label" style={style}>{children}</p>;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, ...style }}>
      <p className="label">{children}</p>
      {rechts}
    </div>
  );
}

export function Kop({ titel, sub, rechts }) {
  return (
    <header style={{ padding: "calc(env(safe-area-inset-top) + 14px) 20px 0", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        {sub && <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--zacht)" }}>{sub}</p>}
        <h1 className="display" style={{ margin: sub ? "2px 0 0" : 0, fontSize: 34, lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.01em" }}>{titel}</h1>
      </div>
      {rechts && <div style={{ display: "flex", gap: 8, flex: "none" }}>{rechts}</div>}
    </header>
  );
}

export function RondeKnop({ label, onClick, children, actief }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="druk"
      style={{
        width: 44, height: 44, border: "1px solid var(--kaartrand)", borderRadius: "50%",
        background: actief ? "var(--honing)" : "var(--kaart)", color: actief ? "#2B2420" : "var(--ink)",
        display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--schaduw)", padding: 0,
      }}>
      {children}
    </button>
  );
}

export function Avatar({ persoon, personen, maat = 32, rand = 2 }) {
  const kleur = persoon ? kleurVan(personen, persoon.pid) : "var(--zacht)";
  const basis = { width: maat, height: maat, borderRadius: "50%", flex: "none", boxSizing: "border-box", border: `${rand}px solid ${kleur}` };
  if (persoon?.foto) return <img src={persoon.foto} alt={persoon.naam} style={{ ...basis, objectFit: "cover" }} />;
  return (
    <span aria-hidden="true" className="display" style={{
      ...basis, background: persoon ? tintVan(personen, persoon.pid) : "var(--linnen)", color: kleur,
      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: Math.round(maat * 0.42),
    }}>
      {(persoon?.naam || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

export function SamenAvatar({ maat = 22 }) {
  return (
    <span aria-hidden="true" style={{
      width: maat, height: maat, borderRadius: "50%", flex: "none", background: "var(--honing-tint)",
      border: "2px solid var(--honing)", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(maat * 0.45), fontWeight: 800, color: "var(--honing-tekst)",
    }}>2</span>
  );
}

/* Het afvinkrondje met plop en tekenend vinkje. */
export function Vinkrondje({ stand, kleur = "var(--p0)", samen, onClick, label, maat = 28 }) {
  const klaar = stand === "klaar";
  const half = stand === "half";
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={klaar}
      style={{ width: 44, height: 44, border: 0, background: "transparent", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
      {klaar ? (
        <span className="plop" style={{ width: maat, height: maat, borderRadius: "50%", background: samen ? "var(--honing)" : kleur, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg className="vink" width={maat * 0.58} height={maat * 0.58} viewBox="0 0 24 24" fill="none"
            stroke={samen ? "#2B2420" : "var(--op-kleur)"} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      ) : (
        <span style={{
          display: "block", width: maat, height: maat, borderRadius: "50%", boxSizing: "border-box",
          border: samen ? "2.5px solid var(--honing)" : "2px solid var(--ring)",
          background: half ? "linear-gradient(90deg, var(--honing-tint) 50%, transparent 50%)" : "transparent",
        }} />
      )}
    </button>
  );
}

export function Pil({ children, vol, samen, style }) {
  return (
    <span className="cijfers" style={{
      flex: "none", display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999,
      fontSize: 13, fontWeight: 700, border: "1.5px solid var(--honing)",
      background: vol ? "var(--honing)" : samen ? "var(--honing-tint)" : "transparent",
      color: vol ? "#2B2420" : "var(--honing-tekst)", ...style,
    }}>{children}</span>
  );
}

export function Knop({ children, onClick, soort = "primair", style, disabled, type = "button", ...rest }) {
  const kleuren = {
    primair: { background: "var(--knop)", color: "var(--knop-tekst)" },
    honing: { background: "var(--honing)", color: "#2B2420" },
    tint: { background: "var(--linnen)", color: "var(--ink)" },
    gevaar: { background: "var(--terra-tint)", color: "var(--terra)" },
    tekst: { background: "transparent", color: "var(--p0)" },
  }[soort];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="druk" {...rest}
      style={{ height: 52, border: 0, borderRadius: 16, fontSize: 17, fontWeight: 600, padding: "0 18px", opacity: disabled ? 0.5 : 1, ...kleuren, ...style }}>
      {children}
    </button>
  );
}

export function Chip({ actief, onClick, children, stip, style, ...rest }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={!!actief} className="druk" {...rest}
      style={{
        flex: "none", height: 38, padding: stip ? "0 14px 0 12px" : "0 14px", borderRadius: 19,
        fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
        background: actief ? "var(--knop)" : "var(--kaart)", color: actief ? "var(--knop-tekst)" : "var(--ink)",
        border: actief ? "1.5px solid var(--knop)" : "1.5px solid var(--naad)", ...style,
      }}>
      {stip && <span style={{ width: 8, height: 8, borderRadius: "50%", background: actief && stip === "var(--ink)" ? "var(--knop-tekst)" : stip, flex: "none" }} />}
      {children}
    </button>
  );
}

export function Segment({ opties, waarde, kies, label }) {
  return (
    <div role="tablist" aria-label={label} style={{ display: "flex", padding: 3, borderRadius: 12, background: "var(--linnen)" }}>
      {opties.map((o) => {
        const actief = o.v === waarde;
        return (
          <button key={o.v} type="button" role="tab" aria-selected={actief} onClick={() => kies(o.v)}
            style={{
              flex: 1, height: 36, border: 0, borderRadius: 9, fontSize: 14, fontWeight: 600, position: "relative",
              background: actief ? "var(--kaart)" : "transparent", color: actief ? "var(--ink)" : "var(--zacht)",
              boxShadow: actief ? "0 1px 3px rgba(43,36,32,0.12)" : "none",
            }}>
            {o.l}
            {o.stip && <span style={{ position: "absolute", top: 7, right: 10, width: 7, height: 7, borderRadius: "50%", background: "var(--honing)" }} />}
          </button>
        );
      })}
    </div>
  );
}

export function Leeg({ titel, children }) {
  return (
    <div className="kaart" style={{ padding: "26px 20px", textAlign: "center" }}>
      <p className="display" style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{titel}</p>
      {children && <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.45, color: "var(--zacht)" }}>{children}</p>}
    </div>
  );
}

export function Veld({ label, waarde, zet, plaats, opEnter, type = "text", style, autoFocus, ...rest }) {
  return (
    <label style={{ display: "flex", alignItems: "center", minHeight: 52, padding: "0 16px", borderRadius: 16, background: "var(--linnen)", ...style }}>
      <span className="alleen-lezer">{label || plaats}</span>
      <input type={type} value={waarde} placeholder={plaats} autoFocus={autoFocus}
        onChange={(e) => zet(e.target.value)} enterKeyHint="done"
        onKeyDown={(e) => { if (e.key === "Enter" && opEnter) { e.preventDefault(); opEnter(); } }}
        style={{ width: "100%", border: 0, background: "transparent", outline: "none", padding: "14px 0" }} {...rest} />
    </label>
  );
}

/* Paneel dat van onderen opkomt. */
export function Sheet({ open, sluit, titel, children, voet, label }) {
  const paneel = useRef(null);
  useEffect(() => {
    if (!open) return;
    const toets = (e) => { if (e.key === "Escape") sluit(); };
    document.addEventListener("keydown", toets);
    return () => document.removeEventListener("keydown", toets);
  }, [open, sluit]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
      <div className="dimmer" onClick={sluit} style={{ position: "absolute", inset: 0, background: "var(--dim)" }} />
      <section ref={paneel} role="dialog" aria-modal="true" aria-label={label || titel} className="sheet"
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "92dvh", display: "flex", flexDirection: "column",
          background: "var(--kaart)", borderRadius: "28px 28px 0 0", boxShadow: "0 -10px 40px rgba(43,36,32,0.2)",
          maxWidth: 560, margin: "0 auto",
        }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
          <span style={{ width: 36, height: 5, borderRadius: 3, background: "var(--naad)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 10px 0 20px", gap: 8 }}>
          <h2 className="display" style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>{titel}</h2>
          <button type="button" aria-label="Sluiten" onClick={sluit}
            style={{ width: 44, height: 44, border: 0, borderRadius: "50%", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--zacht)" }}>
            <X size={22} />
          </button>
        </div>
        <div className="scroll" style={{ padding: "8px 20px 20px", display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
          {children}
        </div>
        {voet && (
          <div style={{ padding: "10px 20px calc(env(safe-area-inset-bottom) + 14px)", display: "flex", gap: 10, borderTop: "1px solid var(--linnen)" }}>
            {voet}
          </div>
        )}
        {!voet && <div style={{ height: "calc(env(safe-area-inset-bottom) + 8px)" }} />}
      </section>
    </div>
  );
}

export function FotoKnop({ opFoto, children, label = "Foto kiezen", style }) {
  const ref = useRef(null);
  return (
    <>
      <button type="button" aria-label={label} onClick={() => ref.current?.click()}
        style={{ border: 0, background: "transparent", padding: 0, borderRadius: "50%", ...style }}>{children}</button>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={async (e) => { const b = e.target.files?.[0]; if (b) opFoto(await fotoUit(b)); e.target.value = ""; }} />
    </>
  );
}

/* Puntenbolletje dat even opstijgt na afvinken. */
export function useOpstijg() {
  const [pop, zetPop] = useState(null);
  const toon = (sleutel, tekst) => {
    zetPop({ sleutel, tekst, n: Date.now() });
    setTimeout(() => zetPop((p) => (p && p.sleutel === sleutel ? null : p)), 950);
  };
  return [pop, toon];
}
