import React from "react";
import { ChevronDown, Plus } from "lucide-react";
import { staatOpen, ritmeTekst } from "../logica";
import { Vinkrondje, Pil, kleurVan } from "../ui";

export function wieLabel(wie, ik, personen) {
  if (wie === "beiden") return "Samen";
  if (wie === "samen") return "Wie eerst";
  if (wie === ik.pid) return "Jij";
  return personen.find((p) => p.pid === wie)?.naam || "?";
}

/* Eén klus in een lijst: rondje, titel, wie en ritme, punten, eventueel stappen. */
export default function KlusRegel({ k, ik, personen, nu, vinkAf, pop, toonPop, uitgeklapt, klap, wisselStap, bewerk, compact }) {
  const open = staatOpen(k, nu);
  const samen = k.wie === "beiden";
  const vinkjes = k.vinkjes || {};
  const ander = personen.find((p) => p.pid !== ik.pid);
  const mijnVink = samen && open && !!vinkjes[ik.pid];
  const anderVink = samen && open && ander && !!vinkjes[ander.pid];
  const stand = !open ? "klaar" : mijnVink || anderVink ? "half" : "open";
  const laatste = (k.geschiedenis || [])[(k.geschiedenis || []).length - 1];
  const doener = !open && laatste ? laatste.door : ik.pid;
  const subs = k.subs || [];
  const klaarSubs = subs.filter((s) => s.af).length;
  const punten = k.punten ?? 1;

  let meta = `${wieLabel(k.wie, ik, personen)} · ${ritmeTekst(k)}${k.tijd && k.ritme !== "weekvrij" ? " · " + k.tijd : ""}`;
  if (!open) meta = samen ? `Samen afgerond · allebei +${punten}` : `Gedaan door ${doener === ik.pid ? "jou" : personen.find((p) => p.pid === doener)?.naam || "?"}`;
  else if (mijnVink) meta = `Jij bent klaar · wacht op ${ander?.naam || "de ander"}`;
  else if (anderVink) meta = `${ander.naam} is al klaar · nu jij`;

  const tik = () => {
    const wordtKlaar = open && !(samen && mijnVink);
    vinkAf(k.id);
    if (wordtKlaar && toonPop) toonPop(k.id, "+" + punten);
  };
  const regelTik = () => (subs.length && klap ? klap() : bewerk && bewerk());

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 4, padding: compact ? "4px 14px 4px 6px" : "6px 14px 6px 6px" }}>
        <Vinkrondje stand={stand} samen={samen} kleur={kleurVan(personen, doener)} onClick={tik}
          label={(open ? (mijnVink ? "Vinkje terugzetten: " : "Afvinken: ") : "Terugzetten: ") + k.titel} />
        <button type="button" onClick={regelTik} aria-expanded={subs.length ? !!uitgeklapt : undefined}
          style={{ flex: 1, minWidth: 0, minHeight: 44, border: 0, background: "transparent", padding: "3px 0", textAlign: "left", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: open ? "var(--ink)" : "var(--zacht)", textDecoration: open ? "none" : "line-through", overflowWrap: "anywhere" }}>{k.titel}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--zacht)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", flex: "none", background: kleurVan(personen, k.wie) }} />
            <span style={{ minWidth: 0 }}>{meta}</span>
          </span>
          {subs.length > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <span style={{ width: 64, height: 5, borderRadius: 3, background: "var(--linnen)", overflow: "hidden", display: "flex" }}>
                <span className="balkgroei" style={{ width: `${(klaarSubs / subs.length) * 100}%`, background: "var(--p0)", borderRadius: 3 }} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--zacht)" }}>{klaarSubs} van {subs.length} stappen</span>
              <ChevronDown size={14} color="var(--zacht)" style={{ transform: uitgeklapt ? "rotate(180deg)" : "none" }} />
            </span>
          )}
        </button>
        <span style={{ position: "relative", marginTop: 10 }}>
          <Pil vol={!open} samen={samen && open}>+{punten}</Pil>
          {pop && pop.sleutel === k.id && (
            <span key={pop.n} className="stijg display" style={{ position: "absolute", right: 6, top: -8, fontWeight: 800, fontSize: 19, color: "var(--honing-tekst)" }}>{pop.tekst}</span>
          )}
        </span>
      </div>

      {uitgeklapt && subs.length > 0 && (
        <div style={{ margin: "-2px 14px 8px 54px", padding: "4px 12px", borderRadius: 14, background: "var(--bg)" }}>
          {subs.map((s) => (
            <button key={s.id} type="button" onClick={() => wisselStap(k, s)} aria-pressed={!!s.af}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, minHeight: 44, border: 0, background: "transparent", padding: 0, textAlign: "left" }}>
              <span style={{ width: 22, height: 22, flex: "none", borderRadius: 7, boxSizing: "border-box", border: s.af ? 0 : "2px solid var(--ring)", background: s.af ? "var(--p0)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.af && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--op-kleur)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
              </span>
              <span style={{ fontSize: 15, color: s.af ? "var(--zacht)" : "var(--ink)", textDecoration: s.af ? "line-through" : "none" }}>{s.tekst}</span>
            </button>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", minHeight: 44, alignItems: "center" }}>
            <button type="button" onClick={bewerk} style={{ height: 34, padding: "0 12px", border: 0, borderRadius: 17, background: "var(--kaart)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> Stappen en details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
