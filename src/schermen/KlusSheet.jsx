import React, { useEffect, useState } from "react";
import { Bell, Plus, Trash2, X } from "lucide-react";
import { Sheet, Knop, Chip, Label, Veld, Avatar } from "../ui";
import { RITMES, WEEKDAGEN, PUNTOPTIES, id } from "../logica";

const leeg = (ik) => ({ titel: "", wie: ik.pid, ritme: "weekvrij", dag: 6, tijd: "19:00", punten: 2, subs: [] });

/* Klus aanmaken of bewerken: voor wie, hoe vaak, herinnering, punten, stappen. */
export default function KlusSheet({ open, sluit, klus, ik, personen, opslaan, verwijder }) {
  const nieuw = !klus?.id;
  const [v, zetV] = useState(leeg(ik));
  const [stap, zetStap] = useState("");
  const ander = personen.find((p) => p.pid !== ik.pid);

  useEffect(() => {
    if (open) { zetV({ ...leeg(ik), ...(klus || {}), subs: [...(klus?.subs || [])] }); zetStap(""); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, klus?.id]);

  const pas = (velden) => zetV((x) => ({ ...x, ...velden }));
  const kiesRitme = (r) => {
    if (r === "week") pas({ ritme: r, dag: typeof v.dag === "number" && v.dag <= 6 ? v.dag : 6 });
    else if (r === "maand") pas({ ritme: r, dag: typeof v.dag === "number" ? Math.max(1, Math.min(28, v.dag || 1)) : 1 });
    else if (r === "eenmalig") pas({ ritme: r, dag: typeof v.dag === "string" ? v.dag : "" });
    else pas({ ritme: r, dag: null });
  };
  const voegStapToe = () => {
    if (!stap.trim()) return;
    pas({ subs: [...v.subs, { id: id(), tekst: stap.trim(), af: false }] });
    zetStap("");
  };
  const bewaar = () => {
    if (!v.titel.trim()) return;
    opslaan({ ...v, titel: v.titel.trim() }, nieuw);
    sluit();
  };

  const wieOpties = [
    { v: ik.pid, l: "Jij", kleur: "var(--p" + personen.findIndex((p) => p.pid === ik.pid) + ")" },
    ...(ander ? [{ v: ander.pid, l: ander.naam, kleur: "var(--p" + personen.findIndex((p) => p.pid === ander.pid) + ")" }] : []),
    { v: "samen", l: "Wie eerst", kleur: "var(--knop)" },
    { v: "beiden", l: "Samen", kleur: "var(--honing)" },
  ];

  return (
    <Sheet open={open} sluit={sluit} titel={nieuw ? "Nieuwe klus" : "Klus"}
      voet={<>
        {!nieuw && (
          <button type="button" aria-label="Klus verwijderen" className="druk"
            onClick={() => { if (confirm(`"${klus.titel}" verwijderen?`)) { verwijder(klus); sluit(); } }}
            style={{ width: 54, height: 54, flex: "none", border: 0, borderRadius: 16, background: "var(--terra-tint)", color: "var(--terra)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trash2 size={22} />
          </button>
        )}
        <Knop onClick={bewaar} disabled={!v.titel.trim()} style={{ flex: 1, height: 54 }}>{nieuw ? (ander ? `Voorstellen aan ${ander.naam}` : "Toevoegen") : "Opslaan"}</Knop>
      </>}>

      <label style={{ display: "block" }}>
        <span className="alleen-lezer">Naam van de klus</span>
        <input value={v.titel} onChange={(e) => pas({ titel: e.target.value })} placeholder="Wat moet er gebeuren?"
          className="display" style={{ width: "100%", border: 0, padding: "4px 0", background: "transparent", fontSize: 26, fontWeight: 800, outline: "none", fontFamily: "var(--display)" }} />
      </label>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Label>Voor wie</Label>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${wieOpties.length}, minmax(0, 1fr))`, gap: 6 }}>
          {wieOpties.map((o) => {
            const actief = v.wie === o.v;
            return (
              <button key={o.v} type="button" aria-pressed={actief} onClick={() => pas({ wie: o.v, vinkjes: {} })} className="druk"
                style={{ height: 44, border: 0, borderRadius: 14, fontSize: 15, fontWeight: 600, padding: "0 4px",
                  background: actief ? o.kleur : "var(--linnen)", color: actief ? (o.v === "beiden" ? "#2B2420" : o.v === "samen" ? "var(--knop-tekst)" : "var(--op-kleur)") : "var(--ink)" }}>
                {o.l}
              </button>
            );
          })}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--zacht)" }}>
          {v.wie === "beiden" ? "Jullie vinken allebei af en krijgen allebei de punten."
            : v.wie === "samen" ? "Wie hem het eerst doet, krijgt de punten." : " "}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Label>Hoe vaak</Label>
        <div className="geen-balk" style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -20px", padding: "0 20px" }}>
          {Object.keys(RITMES).map((r) => <Chip key={r} actief={v.ritme === r} onClick={() => kiesRitme(r)}>{RITMES[r]}</Chip>)}
        </div>
        {v.ritme === "week" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 }}>
            {WEEKDAGEN.map((d, i) => (
              <button key={d} type="button" aria-pressed={v.dag === i} onClick={() => pas({ dag: i })}
                style={{ height: 42, border: 0, borderRadius: 12, fontSize: 14, fontWeight: 600, background: v.dag === i ? "var(--knop)" : "var(--linnen)", color: v.dag === i ? "var(--knop-tekst)" : "var(--ink)" }}>{d}</button>
            ))}
          </div>
        )}
        {v.ritme === "maand" && (
          <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}>
            <span style={{ flex: 1, fontSize: 15 }}>Dag van de maand</span>
            <select value={v.dag || 1} onChange={(e) => pas({ dag: Number(e.target.value) })}
              style={{ height: 40, padding: "0 12px", border: 0, borderRadius: 12, background: "var(--linnen)", fontWeight: 600 }}>
              {Array.from({ length: 28 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
            </select>
          </label>
        )}
        {v.ritme === "eenmalig" && (
          <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}>
            <span style={{ flex: 1, fontSize: 15 }}>Datum</span>
            <input type="date" value={v.dag || ""} onChange={(e) => pas({ dag: e.target.value })}
              style={{ height: 40, padding: "0 12px", border: 0, borderRadius: 12, background: "var(--linnen)", fontWeight: 600 }} />
          </label>
        )}
        {v.ritme === "weekvrij" ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--zacht)" }}>Staat de hele week open, zonder vaste dag en zonder herinnering.</p>
        ) : (
          <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}>
            <Bell size={20} aria-hidden="true" />
            <span style={{ flex: 1, fontSize: 15, lineHeight: 1.3 }}>Herinnering<br /><span style={{ fontSize: 13, color: "var(--zacht)" }}>dag ervoor en op de dag zelf</span></span>
            <input type="time" value={v.tijd || ""} onChange={(e) => pas({ tijd: e.target.value })} aria-label="Tijd van de herinnering"
              className="cijfers" style={{ height: 40, padding: "0 12px", border: 0, borderRadius: 12, background: "var(--linnen)", fontWeight: 600 }} />
          </label>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Label>Punten</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
          {PUNTOPTIES.map((p) => (
            <button key={p} type="button" aria-pressed={v.punten === p} onClick={() => pas({ punten: p })} className="display druk"
              style={{ height: 48, borderRadius: 16, border: "1.5px solid var(--honing)", fontSize: 20, fontWeight: 800,
                background: v.punten === p ? "var(--honing)" : "transparent", color: v.punten === p ? "#2B2420" : "var(--honing-tekst)" }}>{p}</button>
          ))}
        </div>
        {nieuw && ander && (
          <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--zacht)" }}>
            <Avatar persoon={ander} personen={personen} maat={20} rand={1.5} />
            {ander.naam} keurt de klus en de punten eerst goed
          </p>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Label style={{ marginBottom: 6 }}>Stappen{v.subs.length ? ` · ${v.subs.filter((s) => s.af).length} van ${v.subs.length}` : ""}</Label>
        {v.subs.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 44 }}>
            <button type="button" aria-pressed={!!s.af} aria-label={(s.af ? "Terugzetten: " : "Afvinken: ") + s.tekst}
              onClick={() => pas({ subs: v.subs.map((x) => x.id === s.id ? { ...x, af: !x.af } : x) })}
              style={{ width: 44, height: 44, margin: "0 -10px", border: 0, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <span style={{ width: 24, height: 24, borderRadius: 7, boxSizing: "border-box", border: s.af ? 0 : "2px solid var(--ring)", background: s.af ? "var(--p0)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.af && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--op-kleur)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
              </span>
            </button>
            <span style={{ flex: 1, fontSize: 17, color: s.af ? "var(--zacht)" : "var(--ink)", textDecoration: s.af ? "line-through" : "none" }}>{s.tekst}</span>
            <button type="button" aria-label={"Stap verwijderen: " + s.tekst} onClick={() => pas({ subs: v.subs.filter((x) => x.id !== s.id) })}
              style={{ width: 44, height: 44, border: 0, background: "transparent", color: "var(--zacht)", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <Veld waarde={stap} zet={zetStap} plaats="Stap toevoegen" opEnter={voegStapToe} style={{ flex: 1 }} />
          <button type="button" aria-label="Stap toevoegen" onClick={voegStapToe} className="druk"
            style={{ width: 52, height: 52, flex: "none", border: 0, borderRadius: 16, background: "var(--linnen)", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={22} /></button>
        </div>
      </div>
    </Sheet>
  );
}
