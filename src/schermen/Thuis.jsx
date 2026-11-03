import React, { useState } from "react";
import { Bell, BellRing, ChevronRight, ShoppingBasket, Heart, Trophy, Plus, Lock } from "lucide-react";
import { Kop, Kaart, Label, Avatar, RondeKnop, Leeg } from "../ui";
import KlusRegel from "./KlusRegel";
import { DAGEN, MAANDEN, maandSleutel, puntenVan, staatOpen, groepVan, isVoorMij, sleutelVan, id, euro } from "../logica";

export function Scorebord({ personen, klussen, ik, compact }) {
  const nu = new Date();
  const mk = maandSleutel(nu);
  const scores = personen.map((p) => puntenVan(klussen, p.pid, (d) => d.startsWith(mk)));
  const totaal = scores.reduce((a, b) => a + b, 0);
  const pct = totaal ? (scores[0] / totaal) * 100 : 50;
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
        {personen.map((p, i) => (
          <React.Fragment key={p.pid}>
            {i === 1 && <span style={{ flex: 1, textAlign: "center", fontSize: 13, color: "var(--zacht)" }}>tegen</span>}
            {i === 0 && <Avatar persoon={p} personen={personen} maat={40} rand={2.5} />}
            <p className="display cijfers" style={{ margin: 0, fontSize: compact ? 42 : 56, lineHeight: 1, fontWeight: 800, color: `var(--p${i})` }}>{scores[i]}</p>
            {i === 1 && <Avatar persoon={p} personen={personen} maat={40} rand={2.5} />}
          </React.Fragment>
        ))}
      </div>
      {personen.length === 2 && (
        <div style={{ display: "flex", gap: 3, height: 12, marginTop: 14 }} role="img" aria-label={`${personen[0].naam} ${scores[0]} punten, ${personen[1].naam} ${scores[1]} punten`}>
          <span className="balkgroei" style={{ width: `${pct}%`, background: "var(--p0)", borderRadius: 6 }} />
          <span style={{ flex: 1, background: "var(--p1)", borderRadius: 6 }} />
        </div>
      )}
    </>
  );
}

export function standTekst(personen, klussen, ik) {
  const mk = maandSleutel(new Date());
  const ander = personen.find((p) => p.pid !== ik.pid);
  if (!ander) return "Nodig je huisgenoot uit om te beginnen.";
  const mijn = puntenVan(klussen, ik.pid, (d) => d.startsWith(mk));
  const zijn = puntenVan(klussen, ander.pid, (d) => d.startsWith(mk));
  if (mijn === zijn) return mijn === 0 ? "Nog geen punten deze maand. Wie begint?" : "Gelijke stand. Alles is nog open.";
  const v = Math.abs(mijn - zijn);
  const p = v === 1 ? "punt" : "punten";
  return mijn > zijn ? `Je staat ${v} ${p} voor. Ga zo door.` : `Je staat ${v} ${p} achter. Tijd voor een klus.`;
}

export default function Thuis({ ik, personen, klussen, zetKlussen, vinkAf, boodschappen, wensen, deals, rondes, prive, zetPrive, gaNaar, meldingen, meldingenAan, openProfiel, openKlus, pop, toonPop }) {
  const nu = new Date();
  const vandaag = sleutelVan(nu);
  const [uit, zetUit] = useState(null);
  const [notitie, zetNotitie] = useState("");
  const mk = maandSleutel(nu);
  const ronde = rondes[mk];
  const akkoord = ronde?.voorstel && personen.length === 2 && personen.every((p) => (ronde.akkoord || []).includes(p.pid));
  const resterend = new Date(nu.getFullYear(), nu.getMonth() + 1, 0).getDate() - nu.getDate();

  const actief = klussen.filter((k) => (k.status ?? "actief") === "actief" && isVoorMij(k, ik.pid));
  const voorVandaag = actief.filter((k) => {
    const open = staatOpen(k, nu);
    if (open) return groepVan(k, nu) === "vandaag";
    return k.laatst === vandaag;
  }).sort((a, b) => (staatOpen(a, nu) ? 0 : 1) - (staatOpen(b, nu) ? 0 : 1));
  const nogOpen = voorVandaag.filter((k) => staatOpen(k, nu) && !(k.wie === "beiden" && (k.vinkjes || {})[ik.pid])).length;
  const dezeWeek = actief.filter((k) => staatOpen(k, nu) && groepVan(k, nu) === "week").length;
  const goedkeuren = klussen.filter((k) => k.status === "wacht" && k.door !== ik.pid).length;
  const wisselStap = (k, s) => zetKlussen(klussen.map((x) => (x.id === k.id ? { ...x, subs: (x.subs || []).map((y) => (y.id === s.id ? { ...y, af: !y.af } : y)) } : x)));

  const teKopen = boodschappen.filter((b) => !b.af).length;
  const openWensen = wensen.filter((w) => !w.gekocht);
  const aantalDeals = (deals?.items || []).filter((d) => openWensen.some((w) => w.id === d.wensId)).length;

  const voegNotitieToe = () => {
    if (!notitie.trim()) return;
    zetPrive([...prive, { id: id(), tekst: notitie.trim(), af: false }]);
    zetNotitie("");
  };

  return (
    <>
      <Kop sub={`${DAGEN[(nu.getDay() + 6) % 7]} ${nu.getDate()} ${MAANDEN[nu.getMonth()]}`} titel={`Hoi ${ik.naam}`} rechts={<>
        <RondeKnop label={meldingen === "aan" ? "Meldingen staan aan" : "Meldingen aanzetten"} actief={meldingen === "aan"} onClick={meldingenAan}>
          {meldingen === "aan" ? <BellRing size={20} /> : <Bell size={20} />}
        </RondeKnop>
        <button type="button" aria-label="Profiel en instellingen" onClick={openProfiel} style={{ border: 0, background: "transparent", padding: 0, borderRadius: "50%" }}>
          <Avatar persoon={ik} personen={personen} maat={44} rand={2.5} />
        </button>
      </>} />

      {goedkeuren > 0 && (
        <button type="button" onClick={() => gaNaar("lijsten", "klussen")} className="druk"
          style={{ margin: "14px 16px 0", width: "calc(100% - 32px)", minHeight: 52, border: 0, borderRadius: 18, background: "var(--honing-tint)", color: "var(--honing-tekst)", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", fontSize: 15, fontWeight: 700, textAlign: "left" }}>
          <span style={{ flex: 1 }}>{goedkeuren === 1 ? "1 klus wacht op jouw akkoord" : `${goedkeuren} klussen wachten op jouw akkoord`}</span>
          <ChevronRight size={18} />
        </button>
      )}

      <Kaart style={{ margin: "14px 16px 0", padding: "18px 18px 16px", borderRadius: 26 }}>
        <button type="button" onClick={() => gaNaar("stand")} aria-label="Naar de stand"
          style={{ display: "block", width: "100%", border: 0, background: "transparent", padding: 0, textAlign: "left" }}>
          <Label rechts={<span style={{ padding: "4px 10px", borderRadius: 999, background: "var(--linnen)", fontSize: 12, fontWeight: 600, color: "var(--zacht)" }}>nog {resterend} {resterend === 1 ? "dag" : "dagen"}</span>}>
            Stand {MAANDEN[nu.getMonth()]}
          </Label>
          <Scorebord personen={personen} klussen={klussen} ik={ik} compact />
          <p style={{ margin: "12px 0 0", fontSize: 15, fontWeight: 600 }}>{standTekst(personen, klussen, ik)}</p>
        </button>
        <button type="button" onClick={() => gaNaar("stand")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, marginTop: 14, padding: "14px 0 0", border: 0, borderTop: "1px solid var(--linnen)", background: "transparent", textAlign: "left" }}>
          <span style={{ width: 38, height: 38, flex: "none", borderRadius: 12, background: "var(--honing-tint)", color: "var(--honing-tekst)", display: "flex", alignItems: "center", justifyContent: "center" }}><Trophy size={20} /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 12, color: "var(--zacht)" }}>{akkoord ? "Inzet deze maand" : ronde?.voorstel ? "Voorstel voor de inzet" : "Inzet deze maand"}</span>
            <span style={{ display: "block", marginTop: 1, fontSize: 15, fontWeight: 600 }}>{ronde?.voorstel ? ronde.voorstel.tekst : "Nog niets afgesproken. Stel iets voor."}</span>
          </span>
          <ChevronRight size={18} color="var(--zacht)" />
        </button>
      </Kaart>

      <Label style={{ margin: "22px 20px 8px" }} rechts={<span style={{ fontSize: 13, fontWeight: 600, color: "var(--zacht)", textTransform: "none", letterSpacing: 0 }}>{nogOpen ? `${nogOpen} open` : voorVandaag.length ? "alles af" : ""}</span>}>
        Vandaag voor jou
      </Label>
      {voorVandaag.length === 0 ? (
        <div style={{ margin: "0 16px" }}>
          <Leeg titel="Niets meer voor vandaag">{dezeWeek ? `Er ${dezeWeek === 1 ? "staat nog 1 klus" : `staan nog ${dezeWeek} klussen`} open deze week.` : "Geniet ervan."}</Leeg>
        </div>
      ) : (
        <Kaart style={{ margin: "0 16px", padding: "4px 0" }}>
          {voorVandaag.map((k) => (
            <KlusRegel key={k.id} k={k} ik={ik} personen={personen} nu={nu} vinkAf={vinkAf} pop={pop} toonPop={toonPop}
              uitgeklapt={uit === k.id} klap={() => zetUit(uit === k.id ? null : k.id)} wisselStap={wisselStap} bewerk={() => openKlus(k)} />
          ))}
        </Kaart>
      )}

      <div style={{ margin: "12px 16px 0", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <button type="button" onClick={() => gaNaar("lijsten", "boodschappen")} className="kaart druk"
          style={{ textAlign: "left", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ width: 34, height: 34, borderRadius: 11, background: "var(--linnen)", display: "flex", alignItems: "center", justifyContent: "center" }}><ShoppingBasket size={18} /></span>
          <span className="display cijfers" style={{ fontSize: 26, lineHeight: 1, fontWeight: 800 }}>{teKopen}</span>
          <span style={{ fontSize: 13, color: "var(--zacht)" }}>{teKopen === 1 ? "boodschap" : "boodschappen"} op de lijst</span>
        </button>
        <button type="button" onClick={() => gaNaar("lijsten", "wensen")} className="kaart druk"
          style={{ textAlign: "left", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ width: 34, height: 34, borderRadius: 11, background: aantalDeals ? "var(--honing-tint)" : "var(--linnen)", color: aantalDeals ? "var(--honing-tekst)" : "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}><Heart size={18} /></span>
          <span className="display cijfers" style={{ fontSize: 26, lineHeight: 1, fontWeight: 800 }}>{aantalDeals || openWensen.length}</span>
          <span style={{ fontSize: 13, color: "var(--zacht)" }}>{aantalDeals ? (aantalDeals === 1 ? "deal op je wensen" : "deals op je wensen") : `wensen · ${euro(openWensen.reduce((s, w) => s + (Number(w.prijs) || 0), 0))}`}</span>
        </button>
      </div>

      <Kaart style={{ margin: "12px 16px 0", padding: 16 }}>
        <Label rechts={<Lock size={14} color="var(--zacht)" aria-hidden="true" />}>Alleen voor jou</Label>
        {prive.filter((x) => !x.af).map((x) => (
          <button key={x.id} type="button" onClick={() => zetPrive(prive.filter((y) => y.id !== x.id))} aria-label={"Afronden: " + x.tekst}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, minHeight: 44, border: 0, background: "transparent", padding: 0, textAlign: "left" }}>
            <span style={{ width: 22, height: 22, flex: "none", borderRadius: 7, border: "2px solid var(--ring)", boxSizing: "border-box" }} />
            <span style={{ fontSize: 16 }}>{x.tekst}</span>
          </button>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <label style={{ flex: 1, display: "flex", alignItems: "center", minHeight: 44, padding: "0 14px", borderRadius: 14, background: "var(--linnen)" }}>
            <span className="alleen-lezer">Eigen notitie</span>
            <input value={notitie} onChange={(e) => zetNotitie(e.target.value)} placeholder="Notitie die alleen jij ziet" enterKeyHint="done"
              onKeyDown={(e) => { if (e.key === "Enter") voegNotitieToe(); }} style={{ width: "100%", border: 0, background: "transparent", outline: "none" }} />
          </label>
          <button type="button" aria-label="Notitie toevoegen" onClick={voegNotitieToe}
            style={{ width: 44, height: 44, border: 0, borderRadius: 14, background: "var(--linnen)", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={20} /></button>
        </div>
      </Kaart>
    </>
  );
}
