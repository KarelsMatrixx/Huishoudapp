import React from "react";
import { Crown, Check, Utensils } from "lucide-react";
import { Kop, Kaart, Label, Avatar, Knop, SamenAvatar } from "../ui";
import { MAANDEN, DAGEN, maandSleutel, puntenVan, aantalVan, maandagVan, plusDagen, sleutelVan, vanSleutel } from "../logica";
import { standTekst } from "./Thuis";

const maandNaam = (mk) => MAANDEN[Number(mk.slice(5, 7)) - 1];
const vorigeMaand = (mk, n = 1) => { const d = new Date(Number(mk.slice(0, 4)), Number(mk.slice(5, 7)) - 1 - n, 1); return maandSleutel(d); };

function uitslag(personen, klussen, mk) {
  const scores = personen.map((p) => puntenVan(klussen, p.pid, (d) => d.startsWith(mk)));
  if (personen.length < 2 || scores[0] === scores[1]) return { scores, winnaar: null, verliezer: null };
  const w = scores[0] > scores[1] ? 0 : 1;
  return { scores, winnaar: personen[w], verliezer: personen[1 - w] };
}

/* Inzet van een maand: voorstellen, akkoord geven, of wijzigen. */
function InzetKaart({ mk, titel, ik, personen, rondes, zetRondes, meld, openInzet }) {
  const ronde = rondes[mk];
  const ander = personen.find((p) => p.pid !== ik.pid);
  const akkoord = ronde?.akkoord || [];
  const beide = ronde?.voorstel && personen.length === 2 && personen.every((p) => akkoord.includes(p.pid));
  const vanMij = ronde?.voorstel?.door === ik.pid;
  const gaAkkoord = () => {
    zetRondes({ ...rondes, [mk]: { ...ronde, akkoord: [...akkoord, ik.pid] } });
    if (ronde.voorstel.door !== ik.pid) meld(ronde.voorstel.door, "Inzet afgesproken", `${ik.naam} gaat akkoord: ${ronde.voorstel.tekst}`);
  };
  const intrekken = () => zetRondes({ ...rondes, [mk]: { voorstel: null, akkoord: [] } });

  return (
    <Kaart style={{ margin: "14px 16px 0", padding: 18, borderRadius: 24 }}>
      <Label rechts={beide ? (
        <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px 3px 4px", borderRadius: 999, background: "var(--honing-tint)", fontSize: 12, fontWeight: 700, color: "var(--honing-tekst)" }}>
          <span style={{ display: "flex" }}><span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--p0)", border: "1.5px solid var(--honing-tint)" }} /><span style={{ width: 18, height: 18, marginLeft: -5, borderRadius: "50%", background: "var(--p1)", border: "1.5px solid var(--honing-tint)" }} /></span>
          allebei akkoord
        </span>
      ) : null}>{titel}</Label>

      {!ronde?.voorstel ? (
        <>
          <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.45, color: "var(--zacht)" }}>Nog niets afgesproken. Wie aan het eind van de maand achter staat, voert de inzet uit.</p>
          <Knop soort="honing" onClick={() => openInzet(mk)} style={{ width: "100%", marginTop: 14, height: 50 }}>Inzet voorstellen</Knop>
        </>
      ) : (
        <>
          <p className="display" style={{ margin: "12px 0 0", fontSize: 24, lineHeight: 1.15, fontWeight: 800 }}>{ronde.voorstel.tekst}</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--zacht)" }}>
            voorgesteld door {vanMij ? "jou" : personen.find((p) => p.pid === ronde.voorstel.door)?.naam || "de ander"}
            {!beide && (akkoord.includes(ik.pid) ? ` · wacht op ${ander?.naam || "de ander"}` : " · wacht op jouw akkoord")}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {!beide && !akkoord.includes(ik.pid) && <Knop soort="honing" onClick={gaAkkoord} style={{ flex: 1, height: 46, fontSize: 16 }}>Akkoord</Knop>}
            {!beide && vanMij && <Knop soort="tint" onClick={intrekken} style={{ flex: 1, height: 46, fontSize: 16 }}>Intrekken</Knop>}
            {(beide || !vanMij) && <Knop soort="tint" onClick={() => openInzet(mk)} style={{ flex: 1, height: 46, fontSize: 16 }}>Ander voorstel</Knop>}
          </div>
        </>
      )}
    </Kaart>
  );
}

/* De inzet van vorige maand: wie verloor, en is het al gedaan? */
function StrafKaart({ ik, personen, klussen, rondes, zetRondes, meld }) {
  const vk = vorigeMaand(maandSleutel(new Date()));
  const ronde = rondes[vk];
  if (!ronde?.voorstel) return null;
  const { scores, winnaar, verliezer } = uitslag(personen, klussen, vk);
  if (!verliezer) return null;
  const uit = ronde.uitgevoerd || {};
  if (uit.bevestigd) return null;
  const ikVerloor = verliezer.pid === ik.pid;
  const zet = (velden) => zetRondes({ ...rondes, [vk]: { ...ronde, uitgevoerd: { ...uit, ...velden } } });
  const vandaag = sleutelVan(new Date());
  const tekst = ronde.voorstel.tekst;

  return (
    <Kaart style={{ margin: "14px 16px 0", padding: 18, borderRadius: 24 }}>
      <Label rechts={<span style={{ fontSize: 12, color: "var(--zacht)", textTransform: "none", letterSpacing: 0 }}>{winnaar.naam} won {Math.max(...scores)} tegen {Math.min(...scores)}</span>}>
        <span style={{ color: "var(--terra)" }}>Nog te doen van {maandNaam(vk)}</span>
      </Label>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <span style={{ width: 44, height: 44, flex: "none", borderRadius: 14, background: "var(--terra-tint)", color: "var(--terra)", display: "flex", alignItems: "center", justifyContent: "center" }}><Utensils size={22} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--zacht)" }}>{ikVerloor ? "Jij verloor, dus jij regelt" : `${verliezer.naam} verloor en regelt`}</p>
          <p className="display" style={{ margin: "1px 0 0", fontSize: 22, fontWeight: 800 }}>{tekst}</p>
        </div>
      </div>
      {ikVerloor && !uit.gemeld && (
        <Knop onClick={() => { zet({ gemeld: { door: ik.pid, datum: vandaag } }); meld(winnaar.pid, "Inzet uitgevoerd?", `${ik.naam} zegt dat dit gedaan is: ${tekst}. Bevestig je het in de app?`); }}
          style={{ width: "100%", marginTop: 14, height: 50, fontSize: 16 }}>Het is gedaan</Knop>
      )}
      {ikVerloor && !uit.gemeld && <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--zacht)", textAlign: "center" }}>{winnaar.naam} krijgt een melding om te bevestigen.</p>}
      {ikVerloor && uit.gemeld && (
        <div role="status" style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 16, background: "var(--linnen)" }}>
          <Avatar persoon={winnaar} personen={personen} maat={24} rand={1.5} />
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Wacht op {winnaar.naam}. Die krijgt een melding om te bevestigen.</span>
          <button type="button" onClick={() => zet({ gemeld: null })} style={{ height: 34, padding: "0 8px", border: 0, background: "transparent", color: "var(--p0)", fontSize: 13, fontWeight: 600 }}>Ongedaan</button>
        </div>
      )}
      {!ikVerloor && uit.gemeld && (
        <>
          <p style={{ margin: "12px 0 0", fontSize: 14, color: "var(--zacht)" }}>{verliezer.naam} zegt dat het gedaan is.</p>
          <Knop soort="honing" onClick={() => { zet({ bevestigd: { door: ik.pid, datum: vandaag } }); meld(verliezer.pid, "Inzet afgerond", `${ik.naam} bevestigt: ${tekst} is gedaan. Quitte.`); }}
            style={{ width: "100%", marginTop: 10, height: 50, fontSize: 16 }}>Klopt, bevestigen</Knop>
        </>
      )}
      {!ikVerloor && !uit.gemeld && (
        <Knop soort="tint" onClick={() => meld(verliezer.pid, "Niet vergeten", `Je moet nog: ${tekst}`)} style={{ width: "100%", marginTop: 14, height: 46, fontSize: 15 }}>
          {verliezer.naam} er even aan herinneren
        </Knop>
      )}
    </Kaart>
  );
}

function WeekGrafiek({ personen, klussen }) {
  const nu = new Date();
  const mk = maandSleutel(nu);
  const eerste = new Date(nu.getFullYear(), nu.getMonth(), 1);
  const laatste = new Date(nu.getFullYear(), nu.getMonth() + 1, 0);
  const weken = [];
  for (let m = maandagVan(eerste); m <= laatste; m = plusDagen(m, 7)) {
    const van = sleutelVan(m), tot = sleutelVan(plusDagen(m, 6));
    const nr = weekNummer(m);
    const toekomst = m > nu;
    const waarden = personen.map((p) => puntenVan(klussen, p.pid, (d) => d.startsWith(mk) && d >= van && d <= tot));
    weken.push({ nr, toekomst, nu: !toekomst && nu <= plusDagen(m, 7), waarden });
  }
  const max = Math.max(4, ...weken.flatMap((w) => w.waarden));
  const omschrijving = weken.map((w) => `week ${w.nr}: ` + (w.toekomst ? "nog niet begonnen" : personen.map((p, i) => `${p.naam} ${w.waarden[i]}`).join(", "))).join(". ");

  return (
    <Kaart style={{ margin: "14px 16px 0", padding: 18, borderRadius: 24 }}>
      <Label rechts={
        <span style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--zacht)", textTransform: "none", letterSpacing: 0 }}>
          {personen.map((p, i) => <span key={p.pid} style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: `var(--p${i})` }} />{p.naam}</span>)}
        </span>}>Punten per week</Label>
      <div role="img" aria-label={omschrijving} style={{ display: "grid", gridTemplateColumns: `repeat(${weken.length}, minmax(0, 1fr))`, gap: 8, marginTop: 16, alignItems: "end" }}>
        {weken.map((w) => (
          <div key={w.nr} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 112 }}>
              {w.waarden.map((v, i) => w.toekomst ? (
                <span key={i} style={{ width: 16, height: 22, borderRadius: "5px 5px 2px 2px", border: "1.5px dashed var(--ring)", boxSizing: "border-box", opacity: 0.6 }} />
              ) : (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <span className="cijfers" style={{ fontSize: 11, fontWeight: 700, color: `var(--p${i})` }}>{v}</span>
                  <span className="balkgroei" style={{ width: 16, height: Math.max(3, (v / max) * 90), borderRadius: "5px 5px 2px 2px", background: `var(--p${i})` }} />
                </div>
              ))}
            </div>
            <span style={{ fontSize: 12, fontWeight: w.nu ? 700 : 400, color: w.nu ? "var(--ink)" : "var(--zacht)" }}>{w.nu ? "nu" : `wk ${w.nr}`}</span>
          </div>
        ))}
      </div>
    </Kaart>
  );
}

function weekNummer(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dag = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dag);
  const jaarStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - jaarStart) / 864e5 + 1) / 7);
}

function wanneer(datum) {
  const nu = new Date();
  if (datum === sleutelVan(nu)) return "vandaag";
  if (datum === sleutelVan(plusDagen(nu, -1))) return "gisteren";
  const d = vanSleutel(datum);
  if (nu - d < 6 * 864e5) return DAGEN[(d.getDay() + 6) % 7];
  return `${d.getDate()} ${MAANDEN[d.getMonth()]}`;
}

export default function Stand({ ik, personen, klussen, rondes, zetRondes, meld, openInzet }) {
  const nu = new Date();
  const mk = maandSleutel(nu);
  const resterend = new Date(nu.getFullYear(), nu.getMonth() + 1, 0).getDate() - nu.getDate();
  const volgende = maandSleutel(new Date(nu.getFullYear(), nu.getMonth() + 1, 1));
  const { scores } = uitslag(personen, klussen, mk);
  const leider = personen.length === 2 && scores[0] !== scores[1] ? (scores[0] > scores[1] ? 0 : 1) : null;
  const totaal = scores.reduce((a, b) => a + b, 0);

  // recent verdiend; een gezamenlijke klus telt als één regel
  const recent = [];
  klussen.forEach((k) => (k.geschiedenis || []).forEach((g) => recent.push({ k, ...g })));
  recent.sort((a, b) => String(b.datum).localeCompare(String(a.datum)));
  const regels = [];
  recent.forEach((r) => {
    if (r.k.wie === "beiden") {
      const al = regels.find((x) => x.k.id === r.k.id && x.datum === r.datum && x.samen);
      if (al) return;
      regels.push({ ...r, samen: true });
    } else regels.push(r);
  });

  const eerder = [1, 2, 3, 4].map((n) => vorigeMaand(mk, n)).map((m) => {
    const u = uitslag(personen, klussen, m);
    const r = rondes[m];
    return { m, ...u, ronde: r, telt: u.scores.some((s) => s > 0) || r?.voorstel };
  }).filter((x) => x.telt);

  const kaartProps = { ik, personen, rondes, zetRondes, meld, openInzet };

  return (
    <>
      <Kop titel="Stand" rechts={<span style={{ alignSelf: "center", padding: "8px 14px", borderRadius: 20, background: "var(--kaart)", border: "1px solid var(--kaartrand)", boxShadow: "var(--schaduw)", fontSize: 15, fontWeight: 600 }}>{MAANDEN[nu.getMonth()]}</span>} />

      <Kaart style={{ margin: "16px 16px 0", padding: "20px 18px 18px", borderRadius: 28 }}>
        <Label rechts={<span style={{ padding: "4px 10px", borderRadius: 999, background: "var(--linnen)", fontSize: 12, fontWeight: 600, color: "var(--zacht)", textTransform: "none", letterSpacing: 0 }}>nog {resterend} {resterend === 1 ? "dag" : "dagen"}</span>}>Maandronde</Label>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${personen.length}, minmax(0, 1fr))`, gap: 12, marginTop: 10 }}>
          {personen.map((p, i) => (
            <div key={p.pid} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ height: 22, color: "var(--honing)" }}>{leider === i && <Crown size={24} fill="currentColor" aria-label="Staat voor" />}</span>
              <Avatar persoon={p} personen={personen} maat={60} rand={3} />
              <p className="display cijfers" style={{ margin: "4px 0 0", fontSize: 56, lineHeight: 1, fontWeight: 800, color: `var(--p${i})` }}>{scores[i]}</p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--zacht)" }}>{p.pid === ik.pid ? "Jij" : p.naam} · {aantalVan(klussen, p.pid, (d) => d.startsWith(mk))} klussen</p>
            </div>
          ))}
        </div>
        {personen.length === 2 && (
          <div style={{ display: "flex", gap: 3, height: 14, marginTop: 16 }} aria-hidden="true">
            <span className="balkgroei" style={{ width: `${totaal ? (scores[0] / totaal) * 100 : 50}%`, background: "var(--p0)", borderRadius: 7 }} />
            <span style={{ flex: 1, background: "var(--p1)", borderRadius: 7 }} />
          </div>
        )}
        <p style={{ margin: "12px 0 0", textAlign: "center", fontSize: 15, fontWeight: 600 }}>{standTekst(personen, klussen, ik)}</p>
      </Kaart>

      <InzetKaart mk={mk} titel={`Inzet ${MAANDEN[nu.getMonth()]}`} {...kaartProps} />
      {resterend <= 7 && <InzetKaart mk={volgende} titel={`Inzet ${maandNaam(volgende)}`} {...kaartProps} />}
      <StrafKaart {...kaartProps} klussen={klussen} />
      {personen.length > 0 && <WeekGrafiek personen={personen} klussen={klussen} />}

      <Label style={{ margin: "22px 20px 8px" }}>Recent verdiend</Label>
      {regels.length === 0 ? (
        <p style={{ margin: "0 20px", fontSize: 14, color: "var(--zacht)" }}>Nog niets afgevinkt.</p>
      ) : (
        <Kaart style={{ margin: "0 16px", padding: "4px 0" }}>
          {regels.slice(0, 6).map((r, n) => {
            const persoon = personen.find((p) => p.pid === r.door);
            return (
              <div key={r.k.id + r.datum + n} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 56, padding: "0 16px" }}>
                {r.samen ? <SamenAvatar maat={30} /> : <Avatar persoon={persoon} personen={personen} maat={30} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{r.k.titel}</p>
                  <p style={{ margin: "1px 0 0", fontSize: 13, color: "var(--zacht)" }}>{r.samen ? "samen · " : persoon && persoon.pid !== ik.pid ? persoon.naam + " · " : ""}{wanneer(r.datum)}</p>
                </div>
                <span className="cijfers" style={{ padding: "4px 10px", borderRadius: 999, background: r.samen ? "var(--honing-tint)" : "var(--honing)", color: r.samen ? "var(--honing-tekst)" : "#2B2420", fontSize: 13, fontWeight: 700 }}>+{r.punten ?? 1}{r.samen ? " elk" : ""}</span>
              </div>
            );
          })}
        </Kaart>
      )}

      {eerder.length > 0 && (
        <>
          <Label style={{ margin: "22px 20px 8px" }}>Eerdere maanden</Label>
          <Kaart style={{ margin: "0 16px", padding: "4px 0" }}>
            {eerder.map((x) => {
              const uit = x.ronde?.uitgevoerd || {};
              const status = !x.ronde?.voorstel ? "geen inzet" : !x.verliezer ? "gelijk" : uit.bevestigd ? "gedaan" : uit.gemeld ? "wacht op bevestiging" : "nog te doen";
              const goed = status === "gedaan";
              return (
                <div key={x.m} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 64, padding: "6px 16px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{maandNaam(x.m)[0].toUpperCase() + maandNaam(x.m).slice(1)} · {x.winnaar ? (x.winnaar.pid === ik.pid ? "jij won" : `${x.winnaar.naam} won`) : "gelijkspel"}</p>
                    <p style={{ margin: "1px 0 0", fontSize: 13, color: "var(--zacht)" }}>{Math.max(...x.scores)} tegen {Math.min(...x.scores)}{x.ronde?.voorstel ? " · " + x.ronde.voorstel.tekst : ""}</p>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, flex: "none",
                    background: status === "nog te doen" ? "var(--terra-tint)" : "var(--linnen)", color: status === "nog te doen" ? "var(--terra)" : "var(--ink)" }}>
                    {goed && <Check size={12} strokeWidth={3.4} color="var(--p0)" />}{status}
                  </span>
                </div>
              );
            })}
          </Kaart>
        </>
      )}
    </>
  );
}
