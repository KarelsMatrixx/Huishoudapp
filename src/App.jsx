import React, { useState, useEffect, useCallback, useRef } from "react";
import { Home, ListChecks, Plus, Trophy, MessageCircle, Camera } from "lucide-react";
import { laad, bewaar, luister, meldingenAanzetten, meldingStand, afmelden } from "./opslag";
import { id, sleutelVan, staatOpen, piep, lokaal } from "./logica";
import { Knop, Avatar, FotoKnop, Veld, useOpstijg } from "./ui";
import Thuis from "./schermen/Thuis";
import Lijsten, { BALK_ONDER } from "./schermen/Lijsten";
import Stand from "./schermen/Stand";
import Chat, { ongelezen } from "./schermen/Chat";
import KlusSheet from "./schermen/KlusSheet";
import { SnelToevoegen, InzetSheet, ProfielSheet } from "./schermen/Sheets";

/* ---------- de onderste balk ---------- */
function Tabbalk({ tab, kies, plus, badgeChat, stipLijsten }) {
  const Tab = ({ k, l, I, badge, stip }) => {
    const actief = tab === k;
    return (
      <button type="button" aria-label={badge ? `${l}, ${badge} ongelezen` : l} aria-current={actief ? "page" : undefined} onClick={() => kies(k)}
        style={{ position: "relative", width: 62, height: 52, border: 0, borderRadius: 26, background: actief ? "var(--linnen)" : "transparent",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: actief ? "var(--ink)" : "var(--zacht)" }}>
        <I size={22} strokeWidth={actief ? 2.3 : 2} />
        <span style={{ fontSize: 10.5, fontWeight: actief ? 700 : 600 }}>{l}</span>
        {badge > 0 && (
          <span style={{ position: "absolute", top: 3, right: 10, minWidth: 18, height: 18, padding: "0 5px", boxSizing: "border-box", borderRadius: 9, background: "var(--p1)", color: "var(--op-kleur)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--kaart)" }}>{badge > 9 ? "9+" : badge}</span>
        )}
        {stip && <span style={{ position: "absolute", top: 6, right: 16, width: 9, height: 9, borderRadius: "50%", background: "var(--honing)", border: "2px solid var(--kaart)" }} />}
      </button>
    );
  };
  return (
    <nav aria-label="Hoofdmenu" style={{
      position: "fixed", left: 14, right: 14, bottom: BALK_ONDER, zIndex: 40, height: 66, borderRadius: 33, maxWidth: 532, margin: "0 auto",
      background: "var(--balk)", backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)",
      border: "1px solid var(--kaartrand)", boxShadow: "var(--schaduw-balk)", display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 6px",
    }}>
      <Tab k="thuis" l="Thuis" I={Home} />
      <Tab k="lijsten" l="Lijsten" I={ListChecks} stip={stipLijsten} />
      <button type="button" aria-label="Snel toevoegen" onClick={plus} className="druk"
        style={{ width: 54, height: 54, border: 0, borderRadius: "50%", background: "var(--knop)", color: "var(--knop-tekst)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(43,36,32,0.3)", flex: "none" }}>
        <Plus size={26} strokeWidth={2.6} />
      </button>
      <Tab k="stand" l="Stand" I={Trophy} />
      <Tab k="chat" l="Chat" I={MessageCircle} badge={badgeChat} />
    </nav>
  );
}

function Midden({ children }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "calc(env(safe-area-inset-top) + 24px) 20px calc(env(safe-area-inset-bottom) + 24px)", maxWidth: 440, margin: "0 auto", boxSizing: "border-box" }}>
      {children}
    </div>
  );
}

export default function Huishoudapp({ gebruiker }) {
  const [personen, zetPersonen] = useState([]);
  const [ikId, zetIkId] = useState(null);
  const [boodschappen, zetBoodschappenS] = useState([]);
  const [klussen, zetKlussenS] = useState([]);
  const [wensen, zetWensenS] = useState([]);
  const [prive, zetPriveS] = useState([]);
  const [rondes, zetRondesS] = useState({});
  const [uitgaand, zetUitgaandS] = useState([]);
  const [deals, zetDeals] = useState(null);
  const [chat, zetChatS] = useState([]);
  const [vast, zetVastS] = useState([]);
  const [tab, zetTabS] = useState(() => lokaal("tab") || "thuis");
  const [seg, zetSegS] = useState(() => lokaal("segment") || "klussen");
  const [laden, zetLaden] = useState(true);
  const [geladen, zetGeladen] = useState(false);
  const [laadFout, zetLaadFout] = useState(null);
  const [meldingen, zetMeldingen] = useState(meldingStand());
  const [naam, zetNaam] = useState("");
  const [foto, zetFoto] = useState(null);
  const [klusSheet, zetKlusSheet] = useState(null);   // null, of { klus } voor bewerken of een sjabloon
  const [snel, zetSnel] = useState(false);
  const [inzetMaand, zetInzetMaand] = useState(null);
  const [profiel, zetProfiel] = useState(false);
  const [pop, toonPop] = useOpstijg();
  const laatsteSync = useRef(0);
  const scroller = useRef(null);

  const haalOp = useCallback(async () => {
    try {
      const [hg, bo, kl, we, pr, ro, ui, ch, va, dl] = await Promise.all([
        laad("huisgenoten", true), laad("boodschappen", true), laad("klussen", true), laad("wensen", true),
        laad("prive", false), laad("maandrondes", true), laad("uitgaand", true), laad("chat", true),
        laad("vastelijst", true), laad("deals", true),
      ]);
      zetPersonen(hg || []);
      zetIkId((hg || []).find((p) => p.gebruiker === gebruiker.id)?.pid || null);
      zetBoodschappenS(bo || []);
      zetKlussenS(kl || []);
      zetWensenS(we || []);
      zetPriveS(pr || []);
      zetRondesS(ro || {});
      zetUitgaandS(ui || []);
      zetChatS(ch || []);
      zetVastS(va || []);
      zetDeals(dl || null);
      laatsteSync.current = Date.now();
      zetGeladen(true);
      zetLaadFout(null);
    } catch (e) {
      zetLaadFout(e?.message || String(e));
    }
    zetLaden(false);
  }, [gebruiker.id]);

  useEffect(() => { haalOp(); }, [haalOp]);
  useEffect(() => luister(haalOp), [haalOp]);
  useEffect(() => {
    const bij = () => { if (document.visibilityState === "visible" && Date.now() - laatsteSync.current > 15000) haalOp(); };
    document.addEventListener("visibilitychange", bij);
    return () => document.removeEventListener("visibilitychange", bij);
  }, [haalOp]);

  const maak = (sleutel, zetter, gedeeld) => (waarde) => {
    if (!geladen) return; // voorkomt dat lege lijsten over bestaande gegevens gaan
    zetter(waarde);
    bewaar(sleutel, waarde, gedeeld);
  };
  const zetBoodschappen = maak("boodschappen", zetBoodschappenS, true);
  const zetKlussen = maak("klussen", zetKlussenS, true);
  const zetWensen = maak("wensen", zetWensenS, true);
  const zetPrive = maak("prive", zetPriveS, false);
  const zetRondes = maak("maandrondes", zetRondesS, true);
  const zetUitgaand = maak("uitgaand", zetUitgaandS, true);
  const zetChat = maak("chat", zetChatS, true);
  const zetVast = maak("vastelijst", zetVastS, true);
  const zetHuisgenoten = maak("huisgenoten", zetPersonen, true);

  // Leest de huisgenoten vers uit de database, past ze aan en slaat ze op.
  const wijzigHuisgenoten = async (pasAan) => {
    const vers = (await laad("huisgenoten", true)) || [];
    const nieuw = pasAan(vers);
    if (!nieuw) return null;
    await bewaar("huisgenoten", nieuw, true);
    zetPersonen(nieuw);
    return nieuw;
  };

  const zetTab = (t, s) => {
    zetTabS(t); lokaal("tab", t);
    if (s) { zetSegS(s); lokaal("segment", s); }
    scroller.current?.scrollTo({ top: 0 });
  };
  const zetSeg = (s) => { zetSegS(s); lokaal("segment", s); };

  // Zet een bericht klaar. De meldingsfunctie pikt het op en stuurt de push.
  const meld = (aan, titel, tekst) => {
    const vers = (uitgaand || []).filter((b) => Date.now() - b.moment < 7 * 864e5);
    zetUitgaand([...vers, { id: id(), aan, titel, tekst, moment: Date.now() }].slice(-50));
  };

  const ik = personen.find((p) => p.pid === ikId);
  const ander = personen.find((p) => p.pid !== ikId);
  const bewaarFoto = (afbeelding) => zetHuisgenoten(personen.map((p) => (p.pid === ikId ? { ...p, foto: afbeelding } : p)));
  const meldingenAan = async () => { if (ik) zetMeldingen(await meldingenAanzetten(ik.pid)); };

  /* ---------- klussen ---------- */
  const vinkAf = (klusId) => {
    const vandaag = sleutelVan(new Date());
    const klus = klussen.find((k) => k.id === klusId);
    if (!klus) return;
    const open = staatOpen(klus, new Date());
    const waarde = klus.punten ?? 1;

    // Samen (beiden): allebei moeten afvinken voordat hij klaar is.
    if (klus.wie === "beiden" && open) {
      const vinkjes = { ...(klus.vinkjes || {}) };
      if (vinkjes[ikId]) {
        delete vinkjes[ikId];
        zetKlussen(klussen.map((k) => (k.id === klusId ? { ...k, vinkjes } : k)));
        return;
      }
      vinkjes[ikId] = vandaag;
      const compleet = personen.length > 0 && personen.every((p) => vinkjes[p.pid]);
      if (!compleet) {
        zetKlussen(klussen.map((k) => (k.id === klusId ? { ...k, vinkjes } : k)));
        piep();
        return;
      }
      const erbij = personen.map((p) => ({ door: p.pid, datum: vandaag, punten: waarde }));
      zetKlussen(klussen.map((k) => (k.id === klusId ? { ...k, vinkjes: {}, laatst: vandaag, geschiedenis: [...(k.geschiedenis || []), ...erbij] } : k)));
      piep();
      return;
    }

    zetKlussen(klussen.map((k) => {
      if (k.id !== klusId) return k;
      if (!open) {
        const historie = [...(k.geschiedenis || [])];
        const terug = k.wie === "beiden" ? personen.length : 1;
        historie.splice(-terug, terug);
        return { ...k, laatst: null, vinkjes: {}, geschiedenis: historie };
      }
      return { ...k, laatst: vandaag, geschiedenis: [...(k.geschiedenis || []), { door: ikId, datum: vandaag, punten: waarde }] };
    }));
    if (open) piep();
  };

  const voegKlusToe = (v) => {
    const nieuw = {
      id: id(), titel: v.titel, wie: v.wie, ritme: v.ritme, punten: v.punten, tijd: v.tijd, dag: v.dag ?? null,
      subs: v.subs || [], vinkjes: {}, status: ander ? "wacht" : "actief", door: ik.pid, laatst: null, geschiedenis: [],
    };
    zetKlussen([...klussen, nieuw]);
    if (ander) {
      const stappen = nieuw.subs.length ? ` · ${nieuw.subs.length} stappen` : "";
      const bericht = nieuw.wie === ander.pid
        ? { titel: `${ik.naam} stelt een klus voor`, tekst: `${nieuw.titel} · ${nieuw.punten} punten${stappen}. Accepteren of weigeren?` }
        : nieuw.wie === "samen" || nieuw.wie === "beiden"
          ? { titel: nieuw.wie === "beiden" ? "Nieuwe klus voor samen" : "Nieuwe klus voor wie eerst", tekst: `${nieuw.titel} · ${nieuw.punten} punten${stappen}. Ga je akkoord?` }
          : { titel: "Punten goedkeuren", tekst: `${ik.naam} wil ${nieuw.punten} punten voor: ${nieuw.titel}` };
      meld(ander.pid, bericht.titel, bericht.tekst);
    }
  };
  const bewaarKlus = (v, nieuw) => {
    if (nieuw) return voegKlusToe(v);
    zetKlussen(klussen.map((k) => {
      if (k.id !== v.id) return k;
      const velden = { titel: v.titel, wie: v.wie, ritme: v.ritme, dag: v.dag ?? null, tijd: v.tijd, punten: v.punten, subs: v.subs };
      return { ...k, ...velden, vinkjes: v.wie !== k.wie ? {} : k.vinkjes };
    }));
  };
  const verwijderKlus = (k) => zetKlussen(klussen.filter((x) => x.id !== k.id));

  const voegBoodschapToe = (tekst, ookVast) => {
    const zelfde = (a) => a.trim().toLowerCase() === tekst.trim().toLowerCase();
    if (!boodschappen.some((b) => !b.af && zelfde(b.tekst))) zetBoodschappen([...boodschappen, { id: id(), tekst, cat: "anders", af: false, door: ik.pid }]);
    if (ookVast && !vast.some((v) => zelfde(v.tekst))) zetVast([...vast, { id: id(), tekst, cat: "anders", door: ik.pid }]);
  };
  const voegWensToe = (w) => zetWensen([...wensen, { id: id(), ...w, akkoord: [ik.pid], gekocht: false }]);

  /* ---------- onboarding ---------- */
  const kies = async (pid) => {
    await wijzigHuisgenoten((lijst) => lijst.map((p) => (p.pid === pid ? { ...p, gebruiker: gebruiker.id } : p)));
    zetIkId(pid);
    zetPriveS((await laad("prive", false)) || []);
  };
  const maakPersoon = async () => {
    if (!naam.trim()) return;
    let mijnPid = null;
    const uitkomst = await wijzigHuisgenoten((lijst) => {
      // Bestaat er al iemand met deze naam? Dan claim je dat profiel, met alle punten erin.
      const bestaand = lijst.find((p) => p.naam.trim().toLowerCase() === naam.trim().toLowerCase());
      if (bestaand) {
        mijnPid = bestaand.pid;
        return lijst.map((p) => (p.pid === bestaand.pid ? { ...p, gebruiker: gebruiker.id, foto: foto || p.foto } : p));
      }
      if (lijst.length >= 2) { alert("Dit huishouden heeft al twee bewoners. Kies hierboven wie jij bent."); return null; }
      const verse = { pid: id(), naam: naam.trim(), foto, gebruiker: gebruiker.id };
      mijnPid = verse.pid;
      return [...lijst, verse];
    });
    if (uitkomst && mijnPid) { zetIkId(mijnPid); zetNaam(""); }
  };

  if (laden) {
    return <Midden><p className="display" style={{ textAlign: "center", fontSize: 22, fontWeight: 700, color: "var(--zacht)" }}>Ons huis</p></Midden>;
  }

  if (laadFout) {
    return (
      <Midden>
        <h1 className="display" style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Even niet gelukt</h1>
        <p style={{ margin: "8px 0 0", fontSize: 16, lineHeight: 1.5, color: "var(--zacht)" }}>De gegevens konden niet worden opgehaald, dus toont de app niets. Er is niets kwijt.</p>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--zacht)" }}>{laadFout}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <Knop onClick={() => { zetLaden(true); haalOp(); }} style={{ flex: 1 }}>Opnieuw proberen</Knop>
          <Knop soort="tint" onClick={afmelden}>Afmelden</Knop>
        </div>
      </Midden>
    );
  }

  if (!ik) {
    const vrij = personen.filter((p) => !p.gebruiker);
    return (
      <Midden>
        <h1 className="display" style={{ margin: 0, fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" }}>Ons huis</h1>
        <p style={{ margin: "8px 0 24px", fontSize: 16, lineHeight: 1.5, color: "var(--zacht)" }}>Klussen, boodschappen, punten en wensen op één plek.</p>
        {vrij.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {vrij.map((p) => (
              <button key={p.pid} type="button" onClick={() => kies(p.pid)} className="kaart druk"
                style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 64, padding: "0 16px", textAlign: "left", fontSize: 17, fontWeight: 600 }}>
                <Avatar persoon={p} personen={personen} maat={40} rand={2.5} />Ik ben {p.naam}
              </button>
            ))}
          </div>
        )}
        {personen.length < 2 && (
          <div className="kaart" style={{ padding: 16 }}>
            <p className="label" style={{ marginBottom: 12 }}>{personen.length === 0 ? "Wie zet dit op?" : "Of voeg jezelf toe"}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FotoKnop opFoto={zetFoto} label="Foto maken">
                {foto
                  ? <img src={foto} alt="Jouw foto" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />
                  : <span style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--linnen)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--zacht)" }}><Camera size={20} /></span>}
              </FotoKnop>
              <Veld waarde={naam} zet={zetNaam} plaats="Je naam" opEnter={maakPersoon} style={{ flex: 1 }} />
            </div>
            <Knop onClick={maakPersoon} disabled={!naam.trim()} style={{ width: "100%", marginTop: 12 }}>Start</Knop>
          </div>
        )}
      </Midden>
    );
  }

  const stipLijsten = klussen.some((k) => k.status === "wacht" && k.door !== ikId);
  const gemeenschappelijk = { ik, personen, klussen, zetKlussen, vinkAf, meld, pop, toonPop, openKlus: (k) => zetKlusSheet({ klus: k }) };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <main ref={scroller} className="scroll" style={{ flex: 1, paddingBottom: `calc(${BALK_ONDER} + 100px)` }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          {tab === "thuis" && (
            <Thuis {...gemeenschappelijk} boodschappen={boodschappen} wensen={wensen} deals={deals} rondes={rondes}
              prive={prive} zetPrive={zetPrive} gaNaar={zetTab} meldingen={meldingen} meldingenAan={meldingenAan} openProfiel={() => zetProfiel(true)} />
          )}
          {tab === "lijsten" && (
            <Lijsten {...gemeenschappelijk} seg={seg} zetSeg={zetSeg} boodschappen={boodschappen} zetBoodschappen={zetBoodschappen}
              vast={vast} zetVast={zetVast} wensen={wensen} zetWensen={zetWensen} deals={deals} />
          )}
          {tab === "stand" && <Stand ik={ik} personen={personen} klussen={klussen} rondes={rondes} zetRondes={zetRondes} meld={meld} openInzet={zetInzetMaand} />}
          {tab === "chat" && <Chat chat={chat} zetChat={zetChat} ik={ik} personen={personen} meld={meld} />}
        </div>
      </main>

      <Tabbalk tab={tab} kies={(t) => zetTab(t)} plus={() => zetSnel(true)} badgeChat={tab === "chat" ? 0 : ongelezen(chat, ik)} stipLijsten={stipLijsten} />

      <SnelToevoegen open={snel} sluit={() => zetSnel(false)} ik={ik} personen={personen}
        soortStart={tab === "lijsten" ? { klussen: "klus", boodschappen: "boodschap", wensen: "wens" }[seg] : "klus"}
        voegKlusToe={voegKlusToe} voegBoodschapToe={voegBoodschapToe} voegWensToe={voegWensToe}
        meerOpties={(sjabloon) => { zetSnel(false); zetKlusSheet({ klus: sjabloon }); }} />
      <KlusSheet open={!!klusSheet} sluit={() => zetKlusSheet(null)} klus={klusSheet?.klus} ik={ik} personen={personen} opslaan={bewaarKlus} verwijder={verwijderKlus} />
      <InzetSheet open={!!inzetMaand} sluit={() => zetInzetMaand(null)} mk={inzetMaand} ik={ik} personen={personen} rondes={rondes} zetRondes={zetRondes} meld={meld} />
      <ProfielSheet open={profiel} sluit={() => zetProfiel(false)} ik={ik} personen={personen} bewaarFoto={bewaarFoto}
        meldingen={meldingen} meldingenAan={meldingenAan} ververs={haalOp} afmelden={afmelden} />
    </div>
  );
}
