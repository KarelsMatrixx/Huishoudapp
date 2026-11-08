import React, { useEffect, useState } from "react";
import { Repeat, X, Plus, Star, ExternalLink, Heart, Check, ChevronDown, Pencil, Search, Undo2 } from "lucide-react";
import { Kop, Kaart, Label, Segment, Chip, Leeg, Avatar, Knop, Pil, kleurVan, Notities, Schakelaar } from "../ui";
import KlusRegel from "./KlusRegel";
import { staatOpen, groepVan, vervaldatumVan, maandagVan, vanSleutel, isVoorMij, PUNTOPTIES, ritmeTekst, id, euro, oordeelVan } from "../logica";

export const BALK_ONDER = "max(12px, calc(env(safe-area-inset-bottom) - 6px))";

export default function Lijsten(p) {
  const { seg, zetSeg, klussen, ik } = p;
  const goedkeuren = klussen.filter((k) => k.status === "wacht" && k.door !== ik.pid).length;
  return (
    <>
      <Kop titel="Lijsten" />
      <div style={{ margin: "12px 16px 0" }}>
        <Segment label="Soort lijst" waarde={seg} kies={zetSeg} opties={[
          { v: "klussen", l: "Klussen", stip: goedkeuren > 0 },
          { v: "boodschappen", l: "Boodschappen" },
          { v: "wensen", l: "Wensen" },
        ]} />
      </div>
      <div style={{ marginTop: 14 }}>
        {seg === "klussen" && <Klussen {...p} />}
        {seg === "boodschappen" && <Boodschappen {...p} />}
        {seg === "wensen" && <Wensen {...p} />}
      </div>
    </>
  );
}

/* ---------- klussen ---------- */
function Klussen({ klussen, zetKlussen, ik, personen, vinkAf, meld, openKlus, pop, toonPop }) {
  const nu = new Date();
  const [filter, zetFilter] = useState("alles");
  const [uit, zetUit] = useState(null);
  const ander = personen.find((x) => x.pid !== ik.pid);

  const pas = (k, velden) => zetKlussen(klussen.map((x) => (x.id === k.id ? { ...x, ...velden } : x)));
  const volgendePunten = (k) => PUNTOPTIES[(PUNTOPTIES.indexOf(k.punten ?? 1) + 1) % PUNTOPTIES.length];
  const accepteer = (k) => {
    pas(k, { status: "actief" });
    meld(k.door, "Klus geaccepteerd", `${ik.naam} ging akkoord: ${k.titel} · ${k.punten ?? 1} punten`);
  };
  const weiger = (k) => {
    zetKlussen(klussen.filter((x) => x.id !== k.id));
    meld(k.door, "Klus geweigerd", `${ik.naam} wees af: ${k.titel}`);
  };
  const wisselStap = (k, s) => pas(k, { subs: (k.subs || []).map((x) => (x.id === s.id ? { ...x, af: !x.af } : x)) });

  const vanAnder = klussen.filter((k) => k.status === "wacht" && k.door !== ik.pid);
  const vanMij = klussen.filter((k) => k.status === "wacht" && k.door === ik.pid);
  const maandag = maandagVan(nu).getTime();
  const actief = klussen.filter((k) => (k.status ?? "actief") === "actief").filter((k) =>
    filter === "alles" ? true
      : filter === "ik" ? isVoorMij(k, ik.pid)
        : filter === "ander" ? (k.wie === ander?.pid || k.wie === "samen" || k.wie === "beiden")
          : (k.wie === "samen" || k.wie === "beiden"));
  // Open klussen, plus wat deze week al is afgerond (zo kun je een vergissing terugdraaien).
  const zichtbaar = actief.filter((k) => staatOpen(k, nu) || (k.laatst && maandagVan(vanSleutel(k.laatst)).getTime() === maandag));
  const sorteer = (a, b) => {
    const oa = staatOpen(a, nu) ? 0 : 1, ob = staatOpen(b, nu) ? 0 : 1;
    if (oa !== ob) return oa - ob;
    return (vervaldatumVan(a, nu) || "9999").localeCompare(vervaldatumVan(b, nu) || "9999") || (b.punten ?? 1) - (a.punten ?? 1);
  };
  const groepen = [
    { k: "vandaag", l: "Vandaag" }, { k: "week", l: "Deze week" }, { k: "later", l: "Later" },
  ].map((g) => ({ ...g, items: zichtbaar.filter((k) => groepVan(k, nu) === g.k).sort(sorteer) })).filter((g) => g.items.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="geen-balk" style={{ display: "flex", gap: 8, padding: "0 16px", overflowX: "auto" }}>
        {[
          { v: "alles", l: "Alles", stip: "var(--ink)" },
          { v: "ik", l: "Jij", stip: kleurVan(personen, ik.pid) },
          ...(ander ? [{ v: "ander", l: ander.naam, stip: kleurVan(personen, ander.pid) }] : []),
          { v: "samen", l: "Samen", stip: "var(--honing)" },
        ].map((o) => <Chip key={o.v} actief={filter === o.v} stip={o.stip} onClick={() => zetFilter(o.v)}>{o.l}</Chip>)}
      </div>

      {vanAnder.map((k) => (
        <Kaart key={k.id} style={{ margin: "0 16px", padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar persoon={personen.find((x) => x.pid === k.door)} personen={personen} maat={28} />
            <p style={{ margin: 0, flex: 1, fontSize: 13, fontWeight: 600, color: "var(--zacht)" }}>
              {personen.find((x) => x.pid === k.door)?.naam || "De ander"} {k.wie === k.door ? "wil punten voor een eigen klus" : k.wie === ik.pid ? "stelt een klus voor jou voor" : "stelt een klus voor"}
            </p>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 17, fontWeight: 600 }}>{k.titel}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 13, color: "var(--zacht)" }}>{ritmeTekst(k)}{(k.subs || []).length ? ` · ${k.subs.length} stappen` : ""}</span>
            <button type="button" onClick={() => pas(k, { punten: volgendePunten(k) })} aria-label={`Punten aanpassen, nu ${k.punten ?? 1}`}
              style={{ marginLeft: "auto", height: 34, padding: "0 12px", borderRadius: 17, border: "1.5px solid var(--honing)", background: "transparent", color: "var(--honing-tekst)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              +{k.punten ?? 1} <ChevronDown size={14} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Knop soort="tint" onClick={() => weiger(k)} style={{ flex: 1, height: 46, fontSize: 16 }}>Liever niet</Knop>
            <Knop onClick={() => accepteer(k)} style={{ flex: 1, height: 46, fontSize: 16 }}>Accepteren</Knop>
          </div>
        </Kaart>
      ))}

      {vanMij.length > 0 && (
        <Kaart style={{ margin: "0 16px", padding: "12px 16px" }}>
          <Label>Wacht op {ander?.naam || "de ander"}</Label>
          {vanMij.map((k) => (
            <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}>
              <span style={{ flex: 1, fontSize: 15, color: "var(--zacht)" }}>{k.titel} · +{k.punten ?? 1}</span>
              <button type="button" onClick={() => zetKlussen(klussen.filter((x) => x.id !== k.id))}
                style={{ height: 34, padding: "0 12px", border: 0, borderRadius: 17, background: "var(--linnen)", fontSize: 13, fontWeight: 600 }}>Intrekken</button>
            </div>
          ))}
        </Kaart>
      )}

      {groepen.map((g) => (
        <div key={g.k}>
          <Label style={{ margin: "6px 20px 8px" }}>{g.l}</Label>
          <Kaart style={{ margin: "0 16px", padding: "4px 0" }}>
            {g.items.map((k) => (
              <KlusRegel key={k.id} k={k} ik={ik} personen={personen} nu={nu} vinkAf={vinkAf} pop={pop} toonPop={toonPop}
                uitgeklapt={uit === k.id} klap={() => zetUit(uit === k.id ? null : k.id)} wisselStap={wisselStap} bewerk={() => openKlus(k)} />
            ))}
          </Kaart>
        </div>
      ))}

      {groepen.length === 0 && (
        <div style={{ margin: "0 16px" }}>
          <Leeg titel={filter === "alles" ? "Nog geen klussen" : "Niets voor dit filter"}>Tik op de plusknop om een klus toe te voegen.</Leeg>
        </div>
      )}
    </div>
  );
}

/* ---------- boodschappen ---------- */
function Boodschappen({ boodschappen: lijst, zetBoodschappen: zetLijst, vast, zetVast, ik, personen }) {
  const [tekst, zetTekst] = useState("");
  const [vastBewerken, zetVastBewerken] = useState(false);
  const [vastNieuw, zetVastNieuw] = useState("");
  const open = lijst.filter((b) => !b.af);
  const af = lijst.filter((b) => b.af);
  const zelfde = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const staatVast = (naam) => vast.some((v) => zelfde(v.tekst, naam));
  const staatOpLijst = (naam) => open.some((b) => zelfde(b.tekst, naam));

  const voegToe = () => {
    if (!tekst.trim()) return;
    if (!staatOpLijst(tekst)) zetLijst([...lijst, { id: id(), tekst: tekst.trim(), cat: "anders", af: false, door: ik.pid }]);
    zetTekst("");
  };
  const zetOpVast = (naam, cat = "anders") => {
    if (!naam.trim() || staatVast(naam)) return;
    zetVast([...vast, { id: id(), tekst: naam.trim(), cat, door: ik.pid }]);
  };
  const haalVanVast = (v) => {
    if (!confirm(`"${v.tekst}" van de vaste bestelling halen?`)) return;
    zetVast(vast.filter((x) => x.id !== v.id));
  };
  const opLijst = (v) => {
    if (staatOpLijst(v.tekst)) return;
    zetLijst([...lijst, { id: id(), tekst: v.tekst, cat: v.cat || "anders", af: false, door: ik.pid }]);
  };
  const allesOpLijst = () => {
    const nieuwe = vast.filter((v) => !staatOpLijst(v.tekst)).map((v) => ({ id: id(), tekst: v.tekst, cat: v.cat || "anders", af: false, door: ik.pid }));
    if (nieuwe.length) zetLijst([...lijst, ...nieuwe]);
  };
  const nietErop = vast.filter((v) => !staatOpLijst(v.tekst)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 72 }}>
      <Label style={{ margin: "0 20px" }}>Op de lijst · {open.length}</Label>
      {open.length === 0 ? (
        <div style={{ margin: "0 16px" }}><Leeg titel="Alles in huis">Typ hieronder wat op is, of pak iets uit de vaste bestelling.</Leeg></div>
      ) : (
        <Kaart style={{ margin: "0 16px", padding: "4px 0" }}>
          {open.map((b) => {
            const door = b.door && b.door !== ik.pid ? personen.find((x) => x.pid === b.door)?.naam : null;
            const isVast = staatVast(b.tekst);
            return (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 2, minHeight: 52, padding: "0 4px 0 6px" }}>
                <button type="button" aria-label={"In het mandje: " + b.tekst} onClick={() => zetLijst(lijst.map((x) => (x.id === b.id ? { ...x, af: true } : x)))}
                  style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, minHeight: 52, border: 0, background: "transparent", padding: 0, textAlign: "left" }}>
                  <span style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <span style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid var(--ring)", boxSizing: "border-box" }} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 17, overflowWrap: "anywhere" }}>{b.tekst}</span>
                  {door && <span style={{ fontSize: 13, color: "var(--zacht)", flex: "none" }}>van {door}</span>}
                </button>
                <button type="button" onClick={() => zetOpVast(b.tekst, b.cat)} aria-label={isVast ? b.tekst + " staat op de vaste bestelling" : b.tekst + " op de vaste bestelling zetten"} aria-pressed={isVast}
                  style={{ width: 44, height: 44, border: 0, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: isVast ? "var(--honing-tekst)" : "var(--ring)", flex: "none" }}>
                  <Repeat size={18} />
                </button>
                <button type="button" onClick={() => zetLijst(lijst.filter((x) => x.id !== b.id))} aria-label={b.tekst + " verwijderen"}
                  style={{ width: 44, height: 44, border: 0, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ring)", flex: "none" }}>
                  <X size={18} />
                </button>
              </div>
            );
          })}
        </Kaart>
      )}

      {af.length > 0 && (
        <>
          <Label style={{ margin: "14px 20px 0" }} rechts={
            <button type="button" onClick={() => zetLijst(open)} style={{ height: 34, padding: "0 12px", border: 0, borderRadius: 17, background: "var(--linnen)", fontSize: 13, fontWeight: 600 }}>Afronden</button>
          }>In het mandje · {af.length}</Label>
          <Kaart style={{ margin: "0 16px", padding: "4px 0" }}>
            {af.map((b) => (
              <button key={b.id} type="button" aria-label={"Terug op de lijst: " + b.tekst} onClick={() => zetLijst(lijst.map((x) => (x.id === b.id ? { ...x, af: false } : x)))}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, minHeight: 48, padding: "0 16px 0 6px", border: 0, background: "transparent", textAlign: "left" }}>
                <span style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <span className="plop" style={{ width: 26, height: 26, borderRadius: "50%", background: kleurVan(personen, ik.pid), display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={15} strokeWidth={3.2} color="var(--op-kleur)" />
                  </span>
                </span>
                <span style={{ flex: 1, fontSize: 17, color: "var(--zacht)", textDecoration: "line-through" }}>{b.tekst}</span>
              </button>
            ))}
          </Kaart>
        </>
      )}

      <Kaart style={{ margin: "14px 16px 0", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 38, height: 38, flex: "none", borderRadius: 12, background: "var(--linnen)", display: "flex", alignItems: "center", justifyContent: "center" }}><Repeat size={20} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Vaste bestelling</p>
            <p style={{ margin: "1px 0 0", fontSize: 13, color: "var(--zacht)" }}>
              {vast.length === 0 ? "Nog leeg" : nietErop ? `${nietErop} van ${vast.length} nog niet op de lijst` : "Alles staat op de lijst"}
            </p>
          </div>
          <button type="button" aria-label={vastBewerken ? "Klaar met bewerken" : "Vaste bestelling bewerken"} aria-pressed={vastBewerken} onClick={() => zetVastBewerken(!vastBewerken)}
            style={{ width: 40, height: 40, border: 0, borderRadius: 20, background: vastBewerken ? "var(--knop)" : "var(--linnen)", color: vastBewerken ? "var(--knop-tekst)" : "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            {vastBewerken ? <Check size={18} /> : <Pencil size={16} />}
          </button>
        </div>
        {vast.length === 0 && !vastBewerken && (
          <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.45, color: "var(--zacht)" }}>Tik op het pijltjesrondje achter een boodschap om hem hier vast te zetten.</p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: vast.length ? 14 : 0 }}>
          {vast.map((v) => {
            const erop = staatOpLijst(v.tekst);
            if (vastBewerken) {
              return (
                <button key={v.id} type="button" onClick={() => haalVanVast(v)} aria-label={v.tekst + " van de vaste bestelling halen"}
                  style={{ height: 38, padding: "0 10px 0 14px", borderRadius: 19, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, background: "var(--terra-tint)", color: "var(--terra)", border: 0 }}>
                  {v.tekst}<X size={15} />
                </button>
              );
            }
            return (
              <button key={v.id} type="button" onClick={() => opLijst(v)} aria-label={erop ? v.tekst + " staat al op de lijst" : v.tekst + " op de lijst zetten"} className="druk"
                style={{ height: 38, padding: "0 12px 0 9px", borderRadius: 19, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                  background: erop ? "var(--linnen)" : "var(--kaart)", color: erop ? "var(--zacht)" : "var(--ink)", border: erop ? "1.5px solid var(--linnen)" : "1.5px solid var(--naad)" }}>
                {erop ? <Check size={16} strokeWidth={3} color="var(--p0)" /> : <Plus size={16} strokeWidth={2.6} />}{v.tekst}
              </button>
            );
          })}
        </div>
        {!vastBewerken && nietErop > 0 && (
          <Knop onClick={allesOpLijst} style={{ width: "100%", marginTop: 14, height: 46, fontSize: 15 }}>
            {nietErop === vast.length ? "Alles op de lijst" : `De andere ${nietErop} ook op de lijst`}
          </Knop>
        )}
        {vastBewerken && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <label style={{ flex: 1, display: "flex", alignItems: "center", minHeight: 46, padding: "0 14px", borderRadius: 14, background: "var(--linnen)" }}>
              <span className="alleen-lezer">Vast artikel toevoegen</span>
              <input value={vastNieuw} onChange={(e) => zetVastNieuw(e.target.value)} placeholder="Vast artikel toevoegen" enterKeyHint="done"
                onKeyDown={(e) => { if (e.key === "Enter") { zetOpVast(vastNieuw); zetVastNieuw(""); } }}
                style={{ width: "100%", border: 0, background: "transparent", outline: "none" }} />
            </label>
            <button type="button" aria-label="Toevoegen aan vaste bestelling" onClick={() => { zetOpVast(vastNieuw); zetVastNieuw(""); }}
              style={{ width: 46, height: 46, border: 0, borderRadius: 14, background: "var(--knop)", color: "var(--knop-tekst)", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={20} /></button>
          </div>
        )}
      </Kaart>

      <div style={{ position: "fixed", left: 14, right: 14, bottom: `calc(${BALK_ONDER} + 76px)`, zIndex: 30, maxWidth: 532, margin: "0 auto" }}>
        <div style={{ height: 56, borderRadius: 20, background: "var(--kaart)", border: "1px solid var(--kaartrand)", boxShadow: "0 8px 28px rgba(43,36,32,0.16)", display: "flex", alignItems: "center", gap: 8, padding: "0 8px 0 16px" }}>
          <label style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <span className="alleen-lezer">Nieuwe boodschap</span>
            <input value={tekst} onChange={(e) => zetTekst(e.target.value)} placeholder="Wat moet er in huis?" enterKeyHint="done"
              onKeyDown={(e) => { if (e.key === "Enter") voegToe(); }}
              style={{ width: "100%", border: 0, background: "transparent", outline: "none" }} />
          </label>
          <button type="button" aria-label="Toevoegen" onClick={voegToe} className="druk"
            style={{ width: 40, height: 40, flex: "none", border: 0, borderRadius: 13, background: "var(--knop)", color: "var(--knop-tekst)", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={20} /></button>
        </div>
      </div>
    </div>
  );
}

/* ---------- wensen ---------- */
function Wensen({ wensen, zetWensen, ik, personen, deals, oordeel, geefOordeel }) {
  const [uit, zetUit] = useState(null);
  const [toonAfgekeurd, zetToonAfgekeurd] = useState(false);
  const open = wensen.filter((w) => !w.gekocht);
  const totaal = open.reduce((s, w) => s + (Number(w.prijs) || 0), 0);
  const eens = open.filter((w) => (w.akkoord || []).length >= personen.length).length;
  const alle = (deals?.items || []).filter((d) => open.some((w) => w.id === d.wensId));
  const items = alle.filter((d) => oordeelVan(oordeel, d) !== "fout");
  const afgekeurd = alle.filter((d) => oordeelVan(oordeel, d) === "fout");
  const st = deals?.status;
  const tijd = st?.moment ? new Date(st.moment).toLocaleString("nl-NL", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : null;
  const dealVoor = (w) => items.some((d) => d.wensId === w.id);

  const stem = (w) => zetWensen(wensen.map((x) => x.id === w.id
    ? { ...x, akkoord: (x.akkoord || []).includes(ik.pid) ? x.akkoord.filter((a) => a !== ik.pid) : [...(x.akkoord || []), ik.pid] } : x));
  const pas = (w, wijziging) => zetWensen(wensen.map((x) => (x.id === w.id ? { ...x, ...wijziging } : x)));
  const gekocht = (w) => zetWensen(wensen.map((x) => (x.id === w.id ? { ...x, gekocht: true } : x)));
  const weg = (w) => { if (confirm(`"${w.tekst}" van de wensenlijst halen?`)) zetWensen(wensen.filter((x) => x.id !== w.id)); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ margin: "0 20px", fontSize: 14, color: "var(--zacht)" }}>
        <strong style={{ color: "var(--ink)" }}>{euro(totaal)}</strong> aan wensen · {eens} waar jullie het over eens zijn
      </p>

      {deals && (
        <Kaart style={{ margin: "0 16px", padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 38, height: 38, flex: "none", borderRadius: 12, background: "var(--honing-tint)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--honing-tekst)" }}><Star size={20} fill="currentColor" /></span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{items.length ? `${items.length} ${items.length === 1 ? "deal" : "deals"} op Marktplaats` : "Geen deals vandaag"}</p>
              <p style={{ margin: "1px 0 0", fontSize: 13, color: st?.ok === false ? "var(--terra)" : "var(--zacht)" }}>
                {st?.ok === false ? `Laatste zoekronde mislukte${tijd ? " (" + tijd + ")" : ""}` : tijd ? `gezocht ${tijd}` : "nog niet gezocht"}
              </p>
            </div>
          </div>
          {items.slice(0, 6).map((d) => {
            const goed = oordeelVan(oordeel, d) === "goed";
            return (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10, padding: "8px 4px 8px 8px", borderRadius: 16, background: "var(--bg)" }}>
                <a href={d.url} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "var(--ink)" }}>
                  {d.foto
                    ? <img src={d.foto.startsWith("//") ? "https:" + d.foto : d.foto} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flex: "none" }} />
                    : <span style={{ width: 56, height: 56, borderRadius: 12, background: "var(--linnen)", flex: "none" }} />}
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.titel}</span>
                    <span style={{ fontSize: 13, color: "var(--zacht)" }}><strong style={{ color: "var(--ink)" }}>€{d.prijs}</strong> <s>€{d.richtprijs}</s> · {d.plaats}{d.afstandKm != null ? ` ${d.afstandKm} km` : ""}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--honing-tekst)" }}>voor: {d.wens}</span>
                  </span>
                  <ExternalLink size={16} color="var(--zacht)" aria-hidden="true" />
                </a>
                <button type="button" onClick={() => geefOordeel(d, goed ? null : "goed")} aria-pressed={goed}
                  aria-label={(goed ? "Goedkeuring weghalen: " : "Goedkeuren: ") + d.titel}
                  style={{ width: 44, height: 44, flex: "none", border: 0, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                    background: goed ? "var(--p0)" : "transparent", color: goed ? "var(--op-kleur)" : "var(--zacht)" }}>
                  <Check size={22} strokeWidth={goed ? 3 : 2.2} />
                </button>
                <button type="button" onClick={() => geefOordeel(d, "fout")} aria-label={"Afkeuren: " + d.titel}
                  style={{ width: 44, height: 44, flex: "none", border: 0, borderRadius: 14, background: "transparent", color: "var(--zacht)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={22} strokeWidth={2.2} />
                </button>
              </div>
            );
          })}
          {afgekeurd.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <button type="button" onClick={() => zetToonAfgekeurd(!toonAfgekeurd)} aria-expanded={toonAfgekeurd}
                style={{ minHeight: 44, width: "100%", border: 0, background: "transparent", padding: 0, fontSize: 13, fontWeight: 600, color: "var(--zacht)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                Afgekeurd ({afgekeurd.length}) {toonAfgekeurd ? "verbergen" : "tonen"}
                <ChevronDown size={14} style={{ transform: toonAfgekeurd ? "rotate(180deg)" : "none" }} />
              </button>
              {toonAfgekeurd && afgekeurd.map((d) => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px 6px 12px", borderRadius: 14, background: "var(--bg)", marginTop: 6 }}>
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--zacht)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.titel}</span>
                    <span style={{ fontSize: 12, color: "var(--zacht)" }}>€{d.prijs} · voor: {d.wens}</span>
                  </span>
                  <Knop soort="tint" onClick={() => geefOordeel(d, null)} style={{ height: 40, fontSize: 14, padding: "0 12px", flex: "none", display: "flex", alignItems: "center", gap: 6 }}>
                    <Undo2 size={16} /> Terugzetten
                  </Knop>
                </div>
              ))}
            </div>
          )}
        </Kaart>
      )}

      <Label style={{ margin: "8px 20px 0" }}>Wensen · {open.length}</Label>
      {open.length === 0 ? (
        <div style={{ margin: "0 16px" }}><Leeg titel="Nog geen wensen">Tik op de plusknop en kies Wens om iets toe te voegen.</Leeg></div>
      ) : (
        <Kaart style={{ margin: "0 16px", padding: "4px 0" }}>
          {open.map((w) => {
            const ik_ = (w.akkoord || []).includes(ik.pid);
            return (
              <div key={w.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 60, padding: "0 4px 0 16px" }}>
                  <button type="button" onClick={() => zetUit(uit === w.id ? null : w.id)} aria-expanded={uit === w.id}
                    style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", padding: "8px 0", textAlign: "left" }}>
                    <span style={{ display: "block", fontSize: 17, fontWeight: 600, overflowWrap: "anywhere" }}>{w.tekst}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, fontSize: 13, color: "var(--zacht)" }}>
                      {w.marktplaats && <Search size={13} color="var(--honing-tekst)" aria-label="Zoekt op Marktplaats" />}
                      {w.ruimte || "Hele huis"}{w.prijs ? ` · ${euro(w.prijs)}` : ""}
                    </span>
                    {w.notities && <span style={{ display: "block", marginTop: 2, fontSize: 13, color: "var(--zacht)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.notities}</span>}
                  </button>
                  {dealVoor(w) && <Pil samen style={{ fontSize: 12, padding: "2px 8px" }}>deal</Pil>}
                  <span style={{ display: "flex" }} aria-label={`Akkoord: ${personen.filter((x) => (w.akkoord || []).includes(x.pid)).map((x) => x.naam).join(" en ") || "nog niemand"}`}>
                    {personen.map((x, i) => {
                      const ja = (w.akkoord || []).includes(x.pid);
                      return <span key={x.pid} style={{ width: 22, height: 22, marginLeft: i ? -6 : 0, borderRadius: "50%", boxSizing: "border-box", border: "2px solid var(--kaart)", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", background: ja ? kleurVan(personen, x.pid) : "var(--linnen)", color: ja ? "var(--op-kleur)" : "var(--zacht)" }}>{x.naam.slice(0, 1)}</span>;
                    })}
                  </span>
                  <button type="button" onClick={() => stem(w)} aria-pressed={ik_} aria-label={(ik_ ? "Niet meer willen: " : "Ook willen: ") + w.tekst}
                    style={{ width: 44, height: 44, border: 0, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: ik_ ? "var(--p1)" : "var(--ring)" }}>
                    <Heart size={22} fill={ik_ ? "currentColor" : "none"} />
                  </button>
                </div>
                {uit === w.id && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 16px 12px" }}>
                    <WensGegevens w={w} pas={pas} />
                    <Notities label="Wat moet het zijn?" waarde={w.notities} opKlaar={(t) => pas(w, { notities: t })}
                      plaats="Bijvoorbeeld: 2-persoons, hout of metaal, geen hoekbank" />
                    <Schakelaar aan={!!w.marktplaats} zet={(aan) => pas(w, { marktplaats: aan })}
                      icoon={<Search size={20} color={w.marktplaats ? "var(--honing-tekst)" : "var(--zacht)"} />}>
                      Dagelijks zoeken op Marktplaats
                    </Schakelaar>
                    {w.marktplaats && !(Number(w.prijs) > 0) && (
                      <p style={{ margin: 0, fontSize: 13, color: "var(--terra)" }}>Zonder richtprijs slaat de bot deze wens over.</p>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <Knop soort="tint" onClick={() => gekocht(w)} style={{ flex: 1, height: 44, fontSize: 15 }}>Gekocht</Knop>
                      <Knop soort="gevaar" onClick={() => weg(w)} style={{ height: 44, fontSize: 15 }}>Verwijderen</Knop>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Kaart>
      )}
    </div>
  );
}

/* Titel, ruimte en richtprijs van een wens aanpassen. Bewaart bij het verlaten van een veld. */
function WensGegevens({ w, pas }) {
  const [tekst, zetTekst] = useState(w.tekst || "");
  const [ruimte, zetRuimte] = useState(w.ruimte || "");
  const [prijs, zetPrijs] = useState(w.prijs ? String(w.prijs) : "");
  const [zoek, zetZoek] = useState(w.zoek || "");
  useEffect(() => { zetTekst(w.tekst || ""); zetRuimte(w.ruimte || ""); zetPrijs(w.prijs ? String(w.prijs) : ""); zetZoek(w.zoek || ""); }, [w.tekst, w.ruimte, w.prijs, w.zoek]);

  const bewaarTekst = () => {
    const t = tekst.trim();
    if (!t) { zetTekst(w.tekst || ""); return; }
    if (t !== w.tekst) pas(w, { tekst: t });
  };
  // Nieuwe zoekterm: het oude "moet"-filter hoort bij de oude zoekterm en zou nieuwe resultaten blokkeren, dus dat vervalt.
  const bewaarZoek = () => { const z = zoek.trim(); if (z !== (w.zoek || "")) pas(w, { zoek: z, moet: "" }); };
  const bewaarRuimte = () => { if (ruimte.trim() !== (w.ruimte || "")) pas(w, { ruimte: ruimte.trim() }); };
  const bewaarPrijs = () => {
    const n = Number(String(prijs).replace(",", ".")) || 0;
    if (n !== (Number(w.prijs) || 0)) pas(w, { prijs: n });
  };
  const veld = { width: "100%", border: 0, background: "transparent", outline: "none", padding: 0, fontSize: 16, fontFamily: "inherit", color: "var(--ink)" };
  const vak = { display: "flex", flexDirection: "column", gap: 4, padding: "10px 16px", borderRadius: 16, background: "var(--linnen)", minWidth: 0 };
  const kop = { fontSize: 13, fontWeight: 600, color: "var(--zacht)" };
  const enter = (e) => { if (e.key === "Enter") e.currentTarget.blur(); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={vak}>
        <span style={kop}>Titel</span>
        <input value={tekst} onChange={(e) => zetTekst(e.target.value)} onBlur={bewaarTekst} onKeyDown={enter} enterKeyHint="done" style={veld} />
      </label>
      <label style={vak}>
        <span style={kop}>Zoekterm op Marktplaats</span>
        <input value={zoek} onChange={(e) => zetZoek(e.target.value)} onBlur={bewaarZoek} onKeyDown={enter} enterKeyHint="search" placeholder={tekst || "Zoekterm"} style={veld} />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <label style={{ ...vak, flex: 1 }}>
          <span style={kop}>Ruimte</span>
          <input value={ruimte} onChange={(e) => zetRuimte(e.target.value)} onBlur={bewaarRuimte} onKeyDown={enter} enterKeyHint="done" placeholder="Hele huis" style={veld} />
        </label>
        <label style={{ ...vak, width: 140, flex: "none" }}>
          <span style={kop}>Richtprijs €</span>
          <input value={prijs} onChange={(e) => zetPrijs(e.target.value)} onBlur={bewaarPrijs} onKeyDown={enter} enterKeyHint="done" inputMode="decimal" placeholder="0" style={veld} />
        </label>
      </div>
    </div>
  );
}
