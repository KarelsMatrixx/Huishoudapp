import React, { useEffect, useState } from "react";
import { CircleCheck, ShoppingBasket, Heart, Bell, BellRing, RefreshCw, LogOut, Camera, Repeat, Search } from "lucide-react";
import { Sheet, Knop, Chip, Veld, Avatar, FotoKnop, Label, Notities, Schakelaar } from "../ui";
import { RITMES, PUNTOPTIES, MAANDEN } from "../logica";

/* ---------- snel toevoegen vanaf de plusknop ---------- */
export function SnelToevoegen({ open, sluit, soortStart, ik, personen, voegKlusToe, voegBoodschapToe, voegWensToe, meerOpties }) {
  const ander = personen.find((p) => p.pid !== ik.pid);
  const [soort, zetSoort] = useState("klus");
  const [tekst, zetTekst] = useState("");
  const [wie, zetWie] = useState(ik.pid);
  const [ritme, zetRitme] = useState("weekvrij");
  const [punten, zetPunten] = useState(2);
  const [ookVast, zetOokVast] = useState(false);
  const [ruimte, zetRuimte] = useState("");
  const [prijs, zetPrijs] = useState("");
  const [notities, zetNotities] = useState("");
  const [marktplaats, zetMarktplaats] = useState(false);

  useEffect(() => {
    if (open) { zetSoort(soortStart || "klus"); zetTekst(""); zetWie(ik.pid); zetRitme("weekvrij"); zetPunten(2); zetOokVast(false); zetRuimte(""); zetPrijs(""); zetNotities(""); zetMarktplaats(false); }
  }, [open, soortStart, ik.pid]);

  const wieOpties = [{ v: ik.pid, l: "Jij" }, ...(ander ? [{ v: ander.pid, l: ander.naam }] : []), { v: "samen", l: "Wie eerst" }, { v: "beiden", l: "Samen" }];
  const klaar = () => {
    if (!tekst.trim()) return;
    if (soort === "klus") voegKlusToe({ titel: tekst.trim(), wie, ritme, punten, tijd: "19:00", dag: ritme === "week" ? 6 : ritme === "maand" ? 1 : null, subs: [] });
    if (soort === "boodschap") voegBoodschapToe(tekst.trim(), ookVast);
    if (soort === "wens") voegWensToe({ tekst: tekst.trim(), ruimte: ruimte.trim(), prijs: Number(String(prijs).replace(",", ".")) || 0, notities: notities.trim(), marktplaats });
    sluit();
  };

  const soorten = [
    { v: "klus", l: "Klus", I: CircleCheck },
    { v: "boodschap", l: "Boodschap", I: ShoppingBasket },
    { v: "wens", l: "Wens", I: Heart },
  ];
  const plaats = { klus: "Wat moet er gebeuren?", boodschap: "Wat moet er in huis?", wens: "Wat willen jullie kopen?" }[soort];

  return (
    <Sheet open={open} sluit={sluit} titel="Toevoegen"
      voet={<Knop onClick={klaar} disabled={!tekst.trim()} style={{ flex: 1, height: 54 }}>
        {soort === "klus" && ander ? `Voorstellen aan ${ander.naam}` : "Toevoegen"}
      </Knop>}>
      <div role="radiogroup" aria-label="Wat voeg je toe" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        {soorten.map(({ v, l, I }) => {
          const actief = soort === v;
          return (
            <button key={v} type="button" role="radio" aria-checked={actief} onClick={() => zetSoort(v)} className="druk"
              style={{ height: 68, border: 0, borderRadius: 18, fontSize: 14, fontWeight: 600, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
                background: actief ? "var(--knop)" : "var(--linnen)", color: actief ? "var(--knop-tekst)" : "var(--ink)" }}>
              <I size={22} />{l}
            </button>
          );
        })}
      </div>

      <Veld waarde={tekst} zet={zetTekst} plaats={plaats} opEnter={klaar} autoFocus style={{ boxShadow: "inset 0 0 0 2px var(--knop)" }} />

      {soort === "klus" && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Label>Voor wie</Label>
            <div className="geen-balk" style={{ display: "flex", gap: 8, overflowX: "auto" }}>
              {wieOpties.map((o) => <Chip key={o.v} actief={wie === o.v} onClick={() => zetWie(o.v)}>{o.l}</Chip>)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Label>Hoe vaak</Label>
            <div className="geen-balk" style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -20px", padding: "0 20px" }}>
              {Object.keys(RITMES).map((r) => <Chip key={r} actief={ritme === r} onClick={() => zetRitme(r)}>{RITMES[r]}</Chip>)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Label>Punten</Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
              {PUNTOPTIES.map((p) => (
                <button key={p} type="button" aria-pressed={punten === p} onClick={() => zetPunten(p)} className="display druk"
                  style={{ height: 44, borderRadius: 14, border: "1.5px solid var(--honing)", fontSize: 18, fontWeight: 800, background: punten === p ? "var(--honing)" : "transparent", color: punten === p ? "#2B2420" : "var(--honing-tekst)" }}>{p}</button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => meerOpties({ titel: tekst, wie, ritme, punten, tijd: "19:00", dag: ritme === "week" ? 6 : ritme === "maand" ? 1 : null, subs: [] })}
            style={{ alignSelf: "flex-start", height: 40, padding: 0, border: 0, background: "transparent", color: "var(--p0)", fontSize: 15, fontWeight: 600 }}>
            Meer opties: dag, herinnering en stappen
          </button>
        </>
      )}

      {soort === "boodschap" && (
        <button type="button" role="switch" aria-checked={ookVast} onClick={() => zetOokVast(!ookVast)}
          style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 48, border: 0, background: "transparent", padding: 0, textAlign: "left" }}>
          <Repeat size={20} color={ookVast ? "var(--honing-tekst)" : "var(--zacht)"} />
          <span style={{ flex: 1, fontSize: 16 }}>Ook op de vaste bestelling</span>
          <span style={{ width: 50, height: 30, borderRadius: 15, background: ookVast ? "var(--p0)" : "var(--linnen)", position: "relative", transition: "background .2s" }}>
            <span style={{ position: "absolute", top: 3, left: ookVast ? 23 : 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)", transition: "left .2s" }} />
          </span>
        </button>
      )}

      {soort === "wens" && (
        <div style={{ display: "flex", gap: 8 }}>
          <Veld waarde={ruimte} zet={zetRuimte} plaats="Ruimte" style={{ flex: 1 }} />
          <Veld waarde={prijs} zet={zetPrijs} plaats="Richtprijs €" inputMode="decimal" style={{ width: 150 }} />
        </div>
      )}

      {soort === "wens" && (
        <>
          <Notities label="Wat moet het zijn?" waarde={notities} zet={zetNotities}
            plaats="Bijvoorbeeld: 2-persoons, hout of metaal, geen hoekbank, liefst donkere kleur" />
          <Schakelaar aan={marktplaats} zet={zetMarktplaats} icoon={<Search size={20} color={marktplaats ? "var(--honing-tekst)" : "var(--zacht)"} />}>
            Dagelijks zoeken op Marktplaats
          </Schakelaar>
          {marktplaats && !(Number(String(prijs).replace(",", ".")) > 0) && (
            <p style={{ margin: 0, fontSize: 13, color: "var(--terra)" }}>Vul een richtprijs in, anders kan de bot geen deal herkennen.</p>
          )}
        </>
      )}

      {soort === "klus" && ander && (
        <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--zacht)" }}>
          <Avatar persoon={ander} personen={personen} maat={20} rand={1.5} />
          {ander.naam} keurt de klus en de punten eerst goed
        </p>
      )}
    </Sheet>
  );
}

/* ---------- inzet voorstellen ---------- */
const IDEEEN = ["Ontbijt op bed", "Een week afwassen", "Date night betalen", "Massage van 30 minuten", "Film naar keuze", "Auto wassen"];

export function InzetSheet({ open, sluit, mk, ik, personen, rondes, zetRondes, meld }) {
  const [tekst, zetTekst] = useState("");
  const ander = personen.find((p) => p.pid !== ik.pid);
  useEffect(() => { if (open) zetTekst(""); }, [open]);
  if (!mk) return null;
  const maand = MAANDEN[Number(mk.slice(5, 7)) - 1];
  const huidig = mk === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const stuur = () => {
    if (!tekst.trim()) return;
    zetRondes({ ...rondes, [mk]: { ...(rondes[mk] || {}), voorstel: { tekst: tekst.trim(), door: ik.pid }, akkoord: [ik.pid] } });
    if (ander) meld(ander.pid, `Inzet voor ${maand}`, `${ik.naam} stelt voor: ${tekst.trim()}. Ga je akkoord?`);
    sluit();
  };
  return (
    <Sheet open={open} sluit={sluit} titel={`Inzet voor ${maand}`}
      voet={<Knop soort="honing" onClick={stuur} disabled={!tekst.trim()} style={{ flex: 1, height: 54, fontWeight: 700 }}>Voorstel sturen</Knop>}>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, color: "var(--zacht)" }}>
        Wie aan het eind van {maand} achter staat, voert dit uit.{huidig ? "" : ` Telt vanaf 1 ${maand}.`}
      </p>
      <div role="radiogroup" aria-label="Ideeën" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {IDEEEN.map((i) => (
          <button key={i} type="button" role="radio" aria-checked={tekst === i} onClick={() => zetTekst(i)} className="druk"
            style={{ height: 40, padding: "0 14px", borderRadius: 20, fontSize: 14, fontWeight: tekst === i ? 700 : 600,
              border: tekst === i ? "1.5px solid var(--honing)" : "1.5px solid var(--naad)", background: tekst === i ? "var(--honing)" : "var(--kaart)", color: tekst === i ? "#2B2420" : "var(--ink)" }}>{i}</button>
        ))}
      </div>
      <Veld waarde={IDEEEN.includes(tekst) ? "" : tekst} zet={zetTekst} plaats="Of bedenk zelf iets" opEnter={stuur} />
      {ander && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, background: "var(--bg)" }}>
          <Avatar persoon={ander} personen={personen} maat={32} />
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>{ander.naam} krijgt een melding. De inzet staat vast zodra {ander.naam} akkoord geeft.</p>
        </div>
      )}
    </Sheet>
  );
}

/* ---------- profiel en instellingen ---------- */
export function ProfielSheet({ open, sluit, ik, personen, bewaarFoto, meldingen, meldingenAan, ververs, afmelden }) {
  return (
    <Sheet open={open} sluit={sluit} titel="Jij">
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <FotoKnop opFoto={bewaarFoto} label="Profielfoto wijzigen" style={{ position: "relative" }}>
          <Avatar persoon={ik} personen={personen} maat={72} rand={3} />
          <span style={{ position: "absolute", right: -2, bottom: -2, width: 28, height: 28, borderRadius: "50%", background: "var(--knop)", color: "var(--knop-tekst)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--kaart)" }}><Camera size={14} /></span>
        </FotoKnop>
        <div>
          <p className="display" style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{ik.naam}</p>
          <p style={{ margin: "2px 0 0", fontSize: 14, color: "var(--zacht)" }}>Tik op je foto om hem te wijzigen</p>
        </div>
      </div>
      <div className="kaart" style={{ padding: "4px 0", boxShadow: "none", background: "var(--bg)" }}>
        {[
          { I: meldingen === "aan" ? BellRing : Bell, l: meldingen === "aan" ? "Meldingen staan aan" : meldingen === "kan niet" ? "Meldingen: open de app via het beginscherm" : "Meldingen aanzetten", doe: meldingenAan },
          { I: RefreshCw, l: "Gegevens verversen", doe: () => { ververs(); sluit(); } },
          { I: LogOut, l: "Afmelden", doe: afmelden, gevaar: true },
        ].map(({ I, l, doe, gevaar }) => (
          <button key={l} type="button" onClick={doe}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, minHeight: 54, padding: "0 16px", border: 0, background: "transparent", textAlign: "left", fontSize: 16, color: gevaar ? "var(--terra)" : "var(--ink)" }}>
            <I size={20} />{l}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
