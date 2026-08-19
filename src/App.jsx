import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Home, ShoppingBasket, Sparkles, UtensilsCrossed, Heart,
  Plus, Check, X, RefreshCw, Trash2, ArrowLeftRight, ChevronLeft, ChevronRight, Bell, BellOff, MessageCircle, Send, Camera, ChevronDown, LogOut
} from "lucide-react";
import { laad, bewaar, luister, meldingenAanzetten, meldingStand, afmelden } from "./opslag";

/* ---------- tokens ---------- */
const INK = "#16241F";
const ZACHT = "#5C6B64";
const PAPIER = "#EDF0EA";
const KAART = "#FFFFFF";
const LIJN = "#DCE2D9";
const GEEL = "#E8B33D";
const KLEUREN = ["#1F6F62", "#B4436C"];
const SAMEN = "#6B5BA8";

const DISPLAY = "'Bricolage Grotesque', 'Trebuchet MS', sans-serif";
const BODY = "'Instrument Sans', system-ui, sans-serif";
const MONO = "'Space Mono', ui-monospace, monospace";

/* ---------- opslag: zie src/opslag.js (Supabase + meldingen) ---------- */

/* ---------- datum ---------- */
const DAGEN = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const sleutelVan = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function maandagVan(d) {
  const n = new Date(d);
  const v = (n.getDay() + 6) % 7;
  n.setDate(n.getDate() - v);
  n.setHours(0, 0, 0, 0);
  return n;
}
const plusDagen = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const zelfdeDag = (a, b) => sleutelVan(a) === sleutelVan(b);
const id = () => Math.random().toString(36).slice(2, 9);

/* ---------- klusritme ---------- */
function staatOpen(klus, nu) {
  if (!klus.laatst) return true;
  const d = new Date(klus.laatst + "T12:00:00");
  if (klus.ritme === "eenmalig") return false;
  if (klus.ritme === "dag") return !zelfdeDag(d, nu);
  if (klus.ritme === "week") return maandagVan(d).getTime() !== maandagVan(nu).getTime();
  return d.getMonth() !== nu.getMonth() || d.getFullYear() !== nu.getFullYear();
}
const RITMES = { dag: "elke dag", week: "elke week", maand: "elke maand", eenmalig: "eenmalig" };

/* ---------- punten ---------- */
const PUNTOPTIES = [1, 2, 3, 5, 8];
const maandSleutel = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
function puntenVan(klussen, pid, test) {
  return klussen.reduce((n, k) => n + (k.geschiedenis || [])
    .filter((g) => g.door === pid && test(g.datum))
    .reduce((s, g) => s + (g.punten ?? 1), 0), 0);
}

/* ---------- kleine bouwstenen ---------- */
function Kaart({ children, style }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: KAART, border: `1px solid ${LIJN}`, ...style }}>
      {children}
    </div>
  );
}
function Kop({ children, extra }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-xs uppercase tracking-widest" style={{ fontFamily: MONO, color: ZACHT }}>{children}</h2>
      {extra}
    </div>
  );
}
function Leeg({ children }) {
  return <p className="text-sm py-6 text-center" style={{ color: ZACHT }}>{children}</p>;
}
function Knop({ children, onClick, kleur = INK, vol = true, klein }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full font-semibold transition-opacity ${klein ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"}`}
      style={{
        background: vol ? kleur : "transparent",
        color: vol ? "#fff" : kleur,
        border: vol ? "none" : `1.5px solid ${kleur}`,
        fontFamily: BODY,
      }}
    >
      {children}
    </button>
  );
}
function Invoer({ waarde, zet, plaats, opEnter, style }) {
  return (
    <input
      value={waarde}
      placeholder={plaats}
      onChange={(e) => zet(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter" && opEnter) opEnter(); }}
      className="w-full rounded-xl px-3 py-2 text-sm outline-none"
      style={{ background: PAPIER, border: `1px solid ${LIJN}`, color: INK, fontFamily: BODY, ...style }}
    />
  );
}

/* ---------- profielfoto ---------- */
function Avatar({ persoon, kleur, maat = 24, rand = "#fff" }) {
  const stijl = { width: maat, height: maat, borderRadius: "50%", border: `2px solid ${rand}`, objectFit: "cover" };
  if (persoon?.foto) return <img src={persoon.foto} alt={persoon.naam} style={stijl} />;
  return (
    <span className="flex items-center justify-center" style={{ ...stijl, background: kleur, color: "#fff", fontSize: maat * 0.5, fontFamily: MONO, fontWeight: 700 }}>
      {(persoon?.naam || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

// Maakt van een gekozen of gemaakte foto een klein vierkant plaatje.
function fotoUit(bestand) {
  return new Promise((klaar) => {
    const lezer = new FileReader();
    lezer.onload = () => {
      const im = new Image();
      im.onload = () => {
        const z = 160;
        const c = document.createElement("canvas");
        c.width = z; c.height = z;
        const k = Math.min(im.width, im.height);
        c.getContext("2d").drawImage(im, (im.width - k) / 2, (im.height - k) / 2, k, k, 0, 0, z, z);
        klaar(c.toDataURL("image/jpeg", 0.7));
      };
      im.src = lezer.result;
    };
    lezer.readAsDataURL(bestand);
  });
}

function FotoKnop({ opFoto, children, style }) {
  const ref = useRef(null);
  return (
    <>
      <button onClick={() => ref.current?.click()} style={style}>{children}</button>
      <input ref={ref} type="file" accept="image/*" capture="user" className="hidden"
        onChange={async (e) => { const b = e.target.files?.[0]; if (b) opFoto(await fotoUit(b)); e.target.value = ""; }} />
    </>
  );
}

/* ---------- chat ---------- */
function Chat({ chat, zetChat, ik, personen, meld, sluit }) {
  const [tekst, zetTekst] = useState("");
  const onder = useRef(null);
  const ander = personen.find((p) => p.pid !== ik.pid);
  useEffect(() => { onder.current?.scrollIntoView({ behavior: "smooth" }); }, [chat.length]);

  const versturen = () => {
    if (!tekst.trim()) return;
    zetChat([...chat, { id: id(), door: ik.pid, tekst: tekst.trim(), moment: Date.now() }].slice(-200));
    if (ander) meld(ander.pid, ik.naam, tekst.trim());
    zetTekst("");
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: PAPIER }}>
      <header className="flex items-center gap-3 px-5 pb-4" style={{ background: KAART, borderBottom: `1px solid ${LIJN}`, paddingTop: "calc(16px + env(safe-area-inset-top))" }}>
        <button onClick={sluit} style={{ color: ZACHT }}><ChevronLeft size={22} /></button>
        <Avatar persoon={ander} kleur={KLEUREN[personen.findIndex((p) => p.pid === ander?.pid)] || ZACHT} maat={32} rand={LIJN} />
        <p className="text-lg" style={{ fontFamily: DISPLAY, fontWeight: 700, color: INK }}>{ander ? ander.naam : "Chat"}</p>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {chat.length === 0 && <Leeg>Nog geen berichten. Begin het gesprek.</Leeg>}
        {chat.map((b) => {
          const vanMij = b.door === ik.pid;
          const i = personen.findIndex((p) => p.pid === b.door);
          return (
            <div key={b.id} className={`flex ${vanMij ? "justify-end" : "justify-start"}`}>
              <div className="max-w-xs rounded-2xl px-3 py-2" style={{ background: vanMij ? KLEUREN[i] || INK : KAART, border: vanMij ? "none" : `1px solid ${LIJN}` }}>
                <p className="text-sm" style={{ color: vanMij ? "#fff" : INK }}>{b.tekst}</p>
                <p className="mt-1 text-right text-xs" style={{ fontFamily: MONO, color: vanMij ? "rgba(255,255,255,.6)" : LIJN }}>
                  {new Date(b.moment).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={onder} />
      </div>

      <div className="flex gap-2 px-4 pt-3" style={{ background: KAART, borderTop: `1px solid ${LIJN}`, paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
        <Invoer waarde={tekst} zet={zetTekst} plaats="Bericht" opEnter={versturen} />
        <button onClick={versturen} className="shrink-0 rounded-xl px-4" style={{ background: INK, color: "#fff" }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

/* ---------- signatuur: de weegschaal ---------- */
function Weegschaal({ personen, klussen }) {
  const nu = new Date();
  const grens = plusDagen(nu, -7);
  const telling = personen.map((p) =>
    puntenVan(klussen, p.pid, (d) => new Date(d + "T12:00:00") >= grens)
  );
  const totaal = telling[0] + (telling[1] || 0);
  const links = totaal ? telling[0] / totaal : 0.5;
  const hoek = totaal ? (0.5 - links) * 14 : 0;

  return (
    <Kaart>
      <Kop>de weegschaal · punten in 7 dagen</Kop>
      <div className="relative pt-2 pb-6">
        <div
          className="flex h-9 overflow-hidden rounded-lg weegbalk"
          style={{ transform: `rotate(${hoek}deg)`, transformOrigin: "50% 50%" }}
        >
          <div className="flex items-center justify-start px-3" style={{ width: `${(totaal ? links : 0.5) * 100}%`, background: KLEUREN[0] }}>
            <span className="text-xs font-bold text-white" style={{ fontFamily: MONO }}>{telling[0]}</span>
          </div>
          <div className="flex items-center justify-end px-3" style={{ flex: 1, background: personen[1] ? KLEUREN[1] : LIJN }}>
            <span className="text-xs font-bold text-white" style={{ fontFamily: MONO }}>{telling[1] || 0}</span>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2" style={{
          bottom: 8, width: 0, height: 0,
          borderLeft: "9px solid transparent", borderRight: "9px solid transparent",
          borderBottom: `14px solid ${INK}`
        }} />
      </div>
      <div className="flex justify-between text-sm">
        {personen.map((p, i) => (
          <span key={p.pid} className="font-semibold" style={{ color: KLEUREN[i] }}>{p.naam}</span>
        ))}
      </div>
      {!totaal && <p className="mt-2 text-xs" style={{ color: ZACHT }}>Nog geen klussen afgevinkt deze week.</p>}
    </Kaart>
  );
}

/* ---------- jouw klussen deze week en maand ---------- */
function vervaldatumVan(klus, nu) {
  if (klus.ritme === "dag") return sleutelVan(nu);
  if (klus.ritme === "eenmalig") return klus.dag || null;
  if (klus.ritme === "week") return sleutelVan(plusDagen(maandagVan(nu), klus.dag ?? 6));
  const d = Math.min(klus.dag ?? 1, 28);
  return `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function MijnOverzicht({ ik, klussen, vinkAf, kleur }) {
  const [bereik, zetBereik] = useState("week");
  const nu = new Date();
  const inWeek = bereik === "week";
  const start = inWeek ? maandagVan(nu) : new Date(nu.getFullYear(), nu.getMonth(), 1);
  const eind = inWeek ? plusDagen(maandagVan(nu), 6) : new Date(nu.getFullYear(), nu.getMonth() + 1, 0);
  const vanStart = sleutelVan(start), totEind = sleutelVan(eind);

  const mijn = klussen.filter((k) => (k.status ?? "actief") === "actief" && (k.wie === ik.pid || k.wie === "samen"));
  const lijst = mijn.filter((k) => {
    if (k.ritme === "dag" || k.ritme === "week") return true;
    const v = vervaldatumVan(k, nu);
    return v && v >= vanStart && v <= totEind;
  }).sort((a, b) => (vervaldatumVan(a, nu) || "9") .localeCompare(vervaldatumVan(b, nu) || "9"));

  const open = lijst.filter((k) => staatOpen(k, nu));
  const gedaan = lijst.length - open.length;
  const teVerdienen = open.reduce((s, k) => s + (k.punten ?? 1), 0);
  const verdiend = puntenVan(klussen, ik.pid, (d) => d >= vanStart && d <= totEind);

  const dagLabel = (k) => {
    if (k.ritme === "dag") return "elke dag";
    const v = vervaldatumVan(k, nu);
    if (!v) return "";
    const d = new Date(v + "T12:00:00");
    return `${DAGEN[(d.getDay() + 6) % 7].slice(0, 2)} ${d.getDate()}`;
  };

  return (
    <Kaart>
      <Kop extra={
        <div className="flex gap-1">
          {[{ v: "week", l: "week" }, { v: "maand", l: "maand" }].map((o) => (
            <button key={o.v} onClick={() => zetBereik(o.v)} className="rounded-full px-2 py-1 text-xs"
              style={{ background: bereik === o.v ? INK : PAPIER, color: bereik === o.v ? "#fff" : ZACHT, fontFamily: MONO }}>{o.l}</button>
          ))}
        </div>
      }>
        jouw klussen deze {bereik}
      </Kop>

      <div className="mb-3 flex items-baseline gap-4">
        <p className="text-2xl" style={{ fontFamily: MONO, fontWeight: 700, color: INK }}>
          {gedaan}<span style={{ color: LIJN }}>/{lijst.length}</span>
        </p>
        <p className="text-xs" style={{ color: ZACHT }}>
          {verdiend} punten verdiend{teVerdienen > 0 ? ` · nog ${teVerdienen} te pakken` : ""}
        </p>
      </div>

      {lijst.length === 0 ? <Leeg>Geen klussen op jouw naam deze {bereik}.</Leeg> : (
        <ul className="space-y-2">
          {lijst.map((k) => {
            const af = !staatOpen(k, nu);
            return (
              <li key={k.id} className="flex items-center gap-3">
                <button onClick={() => vinkAf(k.id)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                  style={{ border: `1.5px solid ${af ? LIJN : kleur}`, background: af ? LIJN : "transparent" }}
                  aria-label={`${k.titel} afvinken`}>
                  {af && <Check size={12} color="#fff" />}
                </button>
                <span className="flex-1 text-sm" style={{ color: af ? ZACHT : INK, textDecoration: af ? "line-through" : "none" }}>
                  {k.titel}
                </span>
                <span className="text-xs" style={{ color: ZACHT, fontFamily: MONO }}>{dagLabel(k)}</span>
                <span className="text-xs" style={{ color: af ? LIJN : INK, fontFamily: MONO, fontWeight: 700 }}>{k.punten ?? 1}p</span>
              </li>
            );
          })}
        </ul>
      )}
    </Kaart>
  );
}

/* ---------- maandronde ---------- */
function Maandprijs({ personen, klussen, ik, rondes, zetRondes }) {
  const nu = new Date();
  const mk = maandSleutel(nu);
  const vorigeDatum = new Date(nu.getFullYear(), nu.getMonth() - 1, 1);
  const vk = maandSleutel(vorigeDatum);
  const ronde = rondes[mk] || { voorstel: null, akkoord: [] };
  const [tekst, zetTekst] = useState("");

  const akkoord = ronde.akkoord || [];
  const ander = personen.find((p) => p.pid !== ik.pid);
  const beide = ronde.voorstel && personen.length === 2 && personen.every((p) => akkoord.includes(p.pid));
  const ikAkkoord = akkoord.includes(ik.pid);

  const scores = personen.map((p) => puntenVan(klussen, p.pid, (d) => d.startsWith(mk)));
  const hoogste = Math.max(1, ...scores);
  const laatsteDag = new Date(nu.getFullYear(), nu.getMonth() + 1, 0).getDate();
  const resterend = laatsteDag - nu.getDate();
  const gelijk = scores[0] === scores[1];
  const achterstand = personen.length === 2 ? Math.abs(scores[0] - scores[1]) : 0;
  const verliestNu = personen.length === 2 && !gelijk ? personen[scores[0] < scores[1] ? 0 : 1] : null;

  const stelVoor = () => {
    if (!tekst.trim()) return;
    zetRondes({ ...rondes, [mk]: { voorstel: { tekst: tekst.trim(), door: ik.pid }, akkoord: [ik.pid] } });
    zetTekst("");
  };
  const gaAkkoord = () => zetRondes({ ...rondes, [mk]: { ...ronde, akkoord: [...akkoord, ik.pid] } });
  const opnieuw = () => zetRondes({ ...rondes, [mk]: { voorstel: null, akkoord: [] } });

  const vRonde = rondes[vk];
  const vScores = personen.map((p) => puntenVan(klussen, p.pid, (d) => d.startsWith(vk)));
  const vVerliezer = vRonde?.voorstel && personen.length === 2 && vScores[0] !== vScores[1]
    ? personen[vScores[0] < vScores[1] ? 0 : 1] : null;

  return (
    <Kaart style={{ borderColor: GEEL, borderWidth: 2 }}>
      <Kop extra={<span className="text-xs" style={{ fontFamily: MONO, color: GEEL }}>nog {resterend} dagen</span>}>
        de inzet · {MAANDEN[nu.getMonth()]}
      </Kop>

      {/* de gezamenlijke inzet */}
      {!ronde.voorstel && (
        <div>
          <p className="mb-2 text-sm" style={{ color: ZACHT }}>
            Waar spelen jullie deze maand om? Stel iets voor, {ander ? ander.naam : "de ander"} gaat akkoord.
          </p>
          <div className="flex gap-2">
            <Invoer waarde={tekst} zet={zetTekst} plaats="Bijvoorbeeld: date night betalen" opEnter={stelVoor} />
            <button onClick={stelVoor} className="shrink-0 rounded-xl px-3 text-sm font-semibold" style={{ background: GEEL, color: INK }}>
              Voorstellen
            </button>
          </div>
        </div>
      )}

      {ronde.voorstel && (
        <div className="rounded-xl p-3" style={{ background: beide ? GEEL : PAPIER }}>
          <p className="text-xs uppercase tracking-widest" style={{ fontFamily: MONO, color: beide ? INK : ZACHT }}>
            {beide ? "afgesproken" : "voorstel"}
          </p>
          <p className="mt-1 text-xl leading-snug" style={{ fontFamily: DISPLAY, fontWeight: 800, color: INK }}>
            {ronde.voorstel.tekst}
          </p>
          <p className="mt-1 text-xs" style={{ color: beide ? INK : ZACHT }}>
            Wie deze maand de minste punten heeft, doet dit.
          </p>

          {!beide && !ikAkkoord && (
            <div className="mt-3 flex gap-2">
              <Knop onClick={gaAkkoord} kleur={INK} klein>Akkoord</Knop>
              <Knop onClick={opnieuw} kleur={ZACHT} vol={false} klein>Ander voorstel</Knop>
            </div>
          )}
          {!beide && ikAkkoord && (
            <p className="mt-2 text-xs" style={{ color: ZACHT, fontFamily: MONO }}>
              wacht op akkoord van {ander ? ander.naam : "de ander"}
            </p>
          )}
          {beide && (
            <button onClick={opnieuw} className="mt-2 text-xs underline" style={{ color: INK }}>
              inzet wijzigen
            </button>
          )}
        </div>
      )}

      {/* de stand */}
      <div className="mt-4 space-y-3">
        {personen.map((p, i) => (
          <div key={p.pid}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold" style={{ color: KLEUREN[i] }}>
                {p.naam}{verliestNu?.pid === p.pid && ronde.voorstel ? " · staat achter" : ""}
              </span>
              <span className="text-xl" style={{ fontFamily: MONO, fontWeight: 700, color: INK }}>{scores[i]}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full" style={{ background: PAPIER }}>
              <div style={{ width: `${(scores[i] / hoogste) * 100}%`, height: "100%", background: KLEUREN[i] }} />
            </div>
          </div>
        ))}
      </div>

      {personen.length === 2 && (
        <p className="mt-3 text-xs" style={{ color: ZACHT }}>
          {gelijk ? "Gelijkspel. Bij gelijk aan het einde vervalt de inzet." : `${achterstand} punten verschil.`}
        </p>
      )}

      {vVerliezer && (
        <div className="mt-3 rounded-xl px-3 py-2" style={{ background: PAPIER }}>
          <p className="text-xs" style={{ fontFamily: MONO, color: ZACHT }}>{MAANDEN[vorigeDatum.getMonth()]}</p>
          <p className="text-sm" style={{ color: INK }}>
            <strong>{vVerliezer.naam}</strong> verloor en doet: {vRonde.voorstel.tekst}
          </p>
        </div>
      )}
    </Kaart>
  );
}

/* ---------- scherm: vandaag ---------- */
function Vandaag({ ik, personen, klussen, vinkAf, boodschappen, weekmenu, wensen, prive, zetPrive, gaNaar, rondes, zetRondes }) {
  const nu = new Date();
  const [nieuw, zetNieuw] = useState("");
  const mijnKlussen = klussen.filter((k) => (k.status ?? "actief") === "actief" && staatOpen(k, nu) && (k.wie === ik.pid || k.wie === "samen"));
  const teKeuren = klussen.filter((k) => k.status === "wacht" && k.door !== ik.pid).length;
  const eten = weekmenu[sleutelVan(nu)];
  const teKopen = boodschappen.filter((b) => !b.af).length;
  const wensTotaal = wensen.filter((w) => !w.gekocht).reduce((s, w) => s + (Number(w.prijs) || 0), 0);

  const voegPriveToe = () => {
    if (!nieuw.trim()) return;
    zetPrive([...prive, { id: id(), tekst: nieuw.trim(), af: false }]);
    zetNieuw("");
  };

  return (
    <div className="space-y-4">
      <Maandprijs personen={personen} klussen={klussen} ik={ik} rondes={rondes} zetRondes={zetRondes} />
      <Weegschaal personen={personen} klussen={klussen} />

      <Kaart>
        <Kop>vanavond eten</Kop>
        {eten?.gerecht ? (
          <div>
            <p className="text-2xl leading-tight" style={{ fontFamily: DISPLAY, fontWeight: 800, color: INK }}>{eten.gerecht}</p>
            {eten.kok && <p className="mt-1 text-sm" style={{ color: ZACHT }}>Kookt: {personen.find((p) => p.pid === eten.kok)?.naam || "samen"}</p>}
          </div>
        ) : (
          <button onClick={() => gaNaar("eten")} className="text-left w-full">
            <p className="text-lg" style={{ fontFamily: DISPLAY, fontWeight: 700, color: ZACHT }}>Nog niets gepland. Vul het weekmenu.</p>
          </button>
        )}
      </Kaart>

      <Kaart>
        <Kop extra={<button onClick={() => gaNaar("klussen")} style={{ color: ZACHT }}><ChevronRight size={16} /></button>}>
          jouw klussen vandaag
        </Kop>
        {mijnKlussen.length === 0 ? <Leeg>Niks meer open. Geniet ervan.</Leeg> : (
          <ul className="space-y-2">
            {mijnKlussen.map((k) => (
              <li key={k.id} className="flex items-center gap-3">
                <button
                  onClick={() => vinkAf(k.id)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                  style={{ border: `1.5px solid ${k.wie === "samen" ? SAMEN : KLEUREN[personen.findIndex((p) => p.pid === k.wie)] || LIJN}` }}
                  aria-label={`${k.titel} afvinken`}
                />
                <span className="text-sm" style={{ color: INK }}>{k.titel}</span>
                {k.wie === "samen" && <span className="text-xs" style={{ color: SAMEN, fontFamily: MONO }}>samen</span>}
              </li>
            ))}
          </ul>
        )}
      </Kaart>

      <MijnOverzicht ik={ik} klussen={klussen} vinkAf={vinkAf}
        kleur={KLEUREN[personen.findIndex((p) => p.pid === ik.pid)] || INK} />

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => gaNaar("boodschappen")} className="rounded-2xl p-4 text-left" style={{ background: KAART, border: `1px solid ${LIJN}` }}>
          <p className="text-3xl" style={{ fontFamily: MONO, fontWeight: 700, color: INK }}>{teKopen}</p>
          <p className="text-xs" style={{ color: ZACHT }}>op de boodschappenlijst</p>
        </button>
        <button onClick={() => gaNaar("wensen")} className="rounded-2xl p-4 text-left" style={{ background: KAART, border: `1px solid ${LIJN}` }}>
          <p className="text-3xl" style={{ fontFamily: MONO, fontWeight: 700, color: INK }}>€{Math.round(wensTotaal)}</p>
          <p className="text-xs" style={{ color: ZACHT }}>aan wensen voor het huis</p>
        </button>
      </div>

      <Kaart style={{ background: INK }}>
        <Kop>alleen voor jou</Kop>
        <p className="-mt-2 mb-3 text-xs" style={{ color: "#9FB0A8" }}>Deze lijst ziet alleen jij.</p>
        <div className="flex gap-2">
          <Invoer waarde={nieuw} zet={zetNieuw} plaats="Eigen taak of notitie" opEnter={voegPriveToe}
            style={{ background: "#22332C", border: "1px solid #33463D", color: "#fff" }} />
          <button onClick={voegPriveToe} className="shrink-0 rounded-xl px-3" style={{ background: GEEL, color: INK }}>
            <Plus size={18} />
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {prive.filter((p) => !p.af).map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <button onClick={() => zetPrive(prive.filter((x) => x.id !== p.id))}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ border: "1.5px solid #4E6459" }}
                aria-label="Afronden" />
              <span className="text-sm text-white">{p.tekst}</span>
            </li>
          ))}
        </ul>
      </Kaart>
    </div>
  );
}

/* ---------- scherm: boodschappen ---------- */
const CATS = ["vers", "voorraad", "huis", "anders"];
function Boodschappen({ lijst, zetLijst, ik }) {
  const [tekst, zetTekst] = useState("");
  const [cat, zetCat] = useState("vers");
  const open = lijst.filter((b) => !b.af);
  const af = lijst.filter((b) => b.af);

  const voegToe = () => {
    if (!tekst.trim()) return;
    zetLijst([...lijst, { id: id(), tekst: tekst.trim(), cat, af: false, door: ik.pid }]);
    zetTekst("");
  };

  return (
    <div className="space-y-4">
      <Kaart>
        <div className="flex gap-2">
          <Invoer waarde={tekst} zet={zetTekst} plaats="Wat is er nodig?" opEnter={voegToe} />
          <button onClick={voegToe} className="shrink-0 rounded-xl px-3" style={{ background: INK, color: "#fff" }}><Plus size={18} /></button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button key={c} onClick={() => zetCat(c)} className="rounded-full px-3 py-1 text-xs"
              style={{ background: cat === c ? INK : PAPIER, color: cat === c ? "#fff" : ZACHT, fontFamily: MONO }}>{c}</button>
          ))}
        </div>
      </Kaart>

      {CATS.map((c) => {
        const items = open.filter((b) => b.cat === c);
        if (!items.length) return null;
        return (
          <Kaart key={c}>
            <Kop>{c}</Kop>
            <ul className="space-y-2">
              {items.map((b) => (
                <li key={b.id} className="flex items-center gap-3">
                  <button onClick={() => zetLijst(lijst.map((x) => x.id === b.id ? { ...x, af: true } : x))}
                    className="h-6 w-6 shrink-0 rounded-md" style={{ border: `1.5px solid ${LIJN}` }} aria-label={`${b.tekst} afvinken`} />
                  <span className="flex-1 text-sm" style={{ color: INK }}>{b.tekst}</span>
                  <button onClick={() => zetLijst(lijst.filter((x) => x.id !== b.id))} style={{ color: LIJN }}><X size={16} /></button>
                </li>
              ))}
            </ul>
          </Kaart>
        );
      })}

      {open.length === 0 && <Kaart><Leeg>De lijst is leeg. Typ hierboven wat er nodig is.</Leeg></Kaart>}

      {af.length > 0 && (
        <Kaart>
          <Kop extra={<button onClick={() => zetLijst(open)} className="text-xs" style={{ color: KLEUREN[1], fontFamily: MONO }}>wissen</button>}>
            in de kar ({af.length})
          </Kop>
          <ul className="space-y-1">
            {af.map((b) => (
              <li key={b.id}>
                <button onClick={() => zetLijst(lijst.map((x) => x.id === b.id ? { ...x, af: false } : x))}
                  className="flex items-center gap-2 text-sm line-through" style={{ color: ZACHT }}>
                  <Check size={14} /> {b.tekst}
                </button>
              </li>
            ))}
          </ul>
        </Kaart>
      )}
    </div>
  );
}

/* ---------- scherm: klussen ---------- */
const WEEKDAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];
function ritmeTekst(k) {
  if (k.ritme === "week") return `elke ${DAGEN[k.dag ?? 6]}`;
  if (k.ritme === "maand") return `de ${k.dag ?? 1}e van de maand`;
  if (k.ritme === "eenmalig") return k.dag ? `op ${k.dag}` : "eenmalig";
  return "elke dag";
}

function Klussen({ klussen, zetKlussen, personen, ik, vinkAf, meld, zetHuisgenoten }) {
  const nu = new Date();
  const [titel, zetTitel] = useState("");
  const [wie, zetWie] = useState(ik.pid);
  const [ritme, zetRitme] = useState("week");
  const [punten, zetPunten] = useState(2);
  const [tijd, zetTijd] = useState("19:00");
  const [weekdag, zetWeekdag] = useState(6);
  const [maanddag, zetMaanddag] = useState(1);
  const [datum, zetDatum] = useState("");
  const [filter, zetFilter] = useState("alles");
  const [uitgeklapt, zetUitgeklapt] = useState(null);
  const [subTekst, zetSubTekst] = useState("");
  const [nieuweNaam, zetNieuweNaam] = useState("");
  const [toevoegen, zetToevoegen] = useState(false);

  const ander = personen.find((p) => p.pid !== ik.pid);
  const dagWaarde = ritme === "week" ? weekdag : ritme === "maand" ? maanddag : ritme === "eenmalig" ? datum : null;
  const kleurVan = (w) => w === "samen" ? SAMEN : KLEUREN[personen.findIndex((p) => p.pid === w)] || ZACHT;
  const naamVan = (w) => w === "samen" ? "samen" : personen.find((p) => p.pid === w)?.naam || "?";
  const persoonVan = (w) => personen.find((p) => p.pid === w);

  const voegToe = () => {
    if (!titel.trim()) return;
    const nieuw = {
      id: id(), titel: titel.trim(), wie, ritme, punten, tijd, dag: dagWaarde, subs: [],
      status: ander ? "wacht" : "actief", door: ik.pid, laatst: null, geschiedenis: [],
    };
    zetKlussen([...klussen, nieuw]);
    if (ander) {
      const bericht = wie === ander.pid
        ? { titel: `${ik.naam} stelt een klus voor`, tekst: `${nieuw.titel} · ${punten} punten. Accepteren of weigeren?` }
        : wie === "samen"
          ? { titel: "Nieuwe klus voor samen", tekst: `${nieuw.titel} · ${punten} punten. Ga je akkoord?` }
          : { titel: "Punten goedkeuren", tekst: `${ik.naam} wil ${punten} punten voor: ${nieuw.titel}` };
      meld(ander.pid, bericht.titel, bericht.tekst);
    }
    zetTitel("");
  };

  const voegHuisgenootToe = () => {
    if (!nieuweNaam.trim() || personen.length >= 2) return;
    const nieuw = { pid: id(), naam: nieuweNaam.trim() };
    zetHuisgenoten([...personen, nieuw]);
    zetWie(nieuw.pid);
    zetNieuweNaam("");
    zetToevoegen(false);
  };

  const pas = (k, velden) => zetKlussen(klussen.map((x) => x.id === k.id ? { ...x, ...velden } : x));
  const wijzigPunten = (k) => {
    const i = PUNTOPTIES.indexOf(k.punten ?? 1);
    pas(k, { punten: PUNTOPTIES[(i + 1) % PUNTOPTIES.length] });
  };
  const wissel = (k) => {
    const volgorde = [...personen.map((p) => p.pid), "samen"];
    const i = volgorde.indexOf(k.wie);
    pas(k, { wie: volgorde[(i + 1) % volgorde.length] });
  };
  const voegSubToe = (k) => {
    if (!subTekst.trim()) return;
    pas(k, { subs: [...(k.subs || []), { id: id(), tekst: subTekst.trim(), af: false }] });
    zetSubTekst("");
  };
  const wisselSub = (k, sub) =>
    pas(k, { subs: (k.subs || []).map((s) => s.id === sub.id ? { ...s, af: !s.af } : s) });

  const accepteer = (k) => {
    pas(k, { status: "actief" });
    meld(k.door, "Klus geaccepteerd", `${ik.naam} ging akkoord: ${k.titel} · ${k.punten ?? 1} punten`);
  };
  const weiger = (k) => {
    zetKlussen(klussen.filter((x) => x.id !== k.id));
    meld(k.door, "Klus geweigerd", `${ik.naam} wees af: ${k.titel}`);
  };

  const teKeuren = klussen.filter((k) => k.status === "wacht");
  const vanAnder = teKeuren.filter((k) => k.door !== ik.pid);
  const vanMij = teKeuren.filter((k) => k.door === ik.pid);
  const actief = klussen.filter((k) => (k.status ?? "actief") === "actief");
  const zichtbaar = actief.filter((k) =>
    filter === "alles" ? true : filter === "ik" ? (k.wie === ik.pid || k.wie === "samen") : (k.wie === ander?.pid || k.wie === "samen"));
  const open = zichtbaar.filter((k) => staatOpen(k, nu));
  const gedaan = zichtbaar.filter((k) => !staatOpen(k, nu));

  const Regel = ({ k, af }) => {
    const subs = k.subs || [];
    const klaar = subs.filter((s) => s.af).length;
    const uit = uitgeklapt === k.id;
    return (
      <li className="py-2">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <button onClick={() => vinkAf(k.id)} className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ border: `1.5px solid ${af ? LIJN : kleurVan(k.wie)}`, background: af ? LIJN : "transparent" }}
              aria-label={`${k.titel} afvinken`}>
              {af && <Check size={14} color="#fff" />}
            </button>
            <span className="absolute -bottom-1 -left-1">
              {k.wie === "samen"
                ? <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ background: SAMEN, color: "#fff", fontSize: 8, fontFamily: MONO, border: "2px solid #fff" }}>2</span>
                : <Avatar persoon={persoonVan(k.wie)} kleur={kleurVan(k.wie)} maat={16} />}
            </span>
          </div>

          <button onClick={() => zetUitgeklapt(uit ? null : k.id)} className="flex-1 text-left">
            <p className="text-sm" style={{ color: af ? ZACHT : INK, textDecoration: af ? "line-through" : "none" }}>{k.titel}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs" style={{ color: ZACHT, fontFamily: MONO }}>{ritmeTekst(k)}</span>
              {k.tijd && <span className="text-xs" style={{ color: ZACHT, fontFamily: MONO }}>{k.tijd}</span>}
              {subs.length > 0 && (
                <span className="text-xs" style={{ color: klaar === subs.length ? kleurVan(k.wie) : ZACHT, fontFamily: MONO }}>
                  {klaar}/{subs.length} stappen
                </span>
              )}
            </div>
          </button>

          <button onClick={() => wijzigPunten(k)} className="shrink-0 rounded-full px-2 py-1 text-xs"
            style={{ background: PAPIER, color: INK, fontFamily: MONO, fontWeight: 700 }} aria-label="Punten wijzigen">
            {k.punten ?? 1}p
          </button>
          <button onClick={() => zetUitgeklapt(uit ? null : k.id)} style={{ color: ZACHT }} aria-label="Details">
            <ChevronDown size={16} style={{ transform: uit ? "rotate(180deg)" : "none" }} />
          </button>
        </div>

        {uit && (
          <div className="ml-10 mt-2 space-y-2">
            {subs.map((s) => (
              <button key={s.id} onClick={() => wisselSub(k, s)} className="flex w-full items-center gap-2 text-left">
                <span className="flex h-4 w-4 items-center justify-center rounded" style={{ border: `1.5px solid ${LIJN}`, background: s.af ? kleurVan(k.wie) : "transparent" }}>
                  {s.af && <Check size={10} color="#fff" />}
                </span>
                <span className="text-sm" style={{ color: s.af ? ZACHT : INK, textDecoration: s.af ? "line-through" : "none" }}>{s.tekst}</span>
              </button>
            ))}
            <div className="flex gap-2">
              <Invoer waarde={subTekst} zet={zetSubTekst} plaats="Stap toevoegen" opEnter={() => voegSubToe(k)} />
              <button onClick={() => voegSubToe(k)} className="shrink-0 rounded-xl px-3" style={{ background: PAPIER, color: INK }}><Plus size={16} /></button>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {k.ritme === "week" && (
                <select value={k.dag ?? 6} onChange={(e) => pas(k, { dag: Number(e.target.value) })}
                  className="rounded-full px-2 py-1 text-xs" style={{ color: INK, fontFamily: MONO, background: PAPIER, border: `1px solid ${LIJN}` }}>
                  {WEEKDAGEN.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
              )}
              <input type="time" value={k.tijd || ""} onChange={(e) => pas(k, { tijd: e.target.value })}
                className="rounded-full px-2 py-1 text-xs" style={{ color: INK, fontFamily: MONO, background: PAPIER, border: `1px solid ${LIJN}` }}
                aria-label="Meldingstijd" />
              <button onClick={() => wissel(k)} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs"
                style={{ color: kleurVan(k.wie), border: `1px solid ${kleurVan(k.wie)}` }}>
                {naamVan(k.wie)} <ArrowLeftRight size={11} />
              </button>
              <button onClick={() => zetKlussen(klussen.filter((x) => x.id !== k.id))} style={{ color: LIJN }}><Trash2 size={15} /></button>
            </div>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-4">
      {vanAnder.length > 0 && (
        <Kaart style={{ borderColor: SAMEN, borderWidth: 2 }}>
          <Kop>ter goedkeuring · {vanAnder.length}</Kop>
          <ul className="space-y-3">
            {vanAnder.map((k) => (
              <li key={k.id}>
                <p className="text-sm font-semibold" style={{ color: INK }}>{k.titel}</p>
                <p className="text-xs" style={{ color: ZACHT, fontFamily: MONO }}>
                  {naamVan(k.door)} stelt voor · voor {naamVan(k.wie)} · {ritmeTekst(k)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button onClick={() => wijzigPunten(k)} className="rounded-full px-3 py-1 text-xs"
                    style={{ background: GEEL, color: INK, fontFamily: MONO, fontWeight: 700 }}>
                    {k.punten ?? 1} punten · aanpassen
                  </button>
                  <Knop onClick={() => accepteer(k)} kleur={SAMEN} klein>Accepteren</Knop>
                  <Knop onClick={() => weiger(k)} kleur={ZACHT} vol={false} klein>Weigeren</Knop>
                </div>
              </li>
            ))}
          </ul>
        </Kaart>
      )}

      {vanMij.length > 0 && (
        <Kaart>
          <Kop>wacht op {ander ? ander.naam : "de ander"}</Kop>
          <ul className="space-y-1">
            {vanMij.map((k) => (
              <li key={k.id} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: ZACHT }}>{k.titel}</span>
                <button onClick={() => zetKlussen(klussen.filter((x) => x.id !== k.id))}
                  className="text-xs" style={{ color: LIJN }}>intrekken</button>
              </li>
            ))}
          </ul>
        </Kaart>
      )}

      <Kaart>
        <div className="flex gap-2">
          <Invoer waarde={titel} zet={zetTitel} plaats="Nieuwe klus" opEnter={voegToe} />
          <button onClick={voegToe} className="shrink-0 rounded-xl px-3" style={{ background: INK, color: "#fff" }}><Plus size={18} /></button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[...personen.map((p) => ({ v: p.pid, l: p.naam })), { v: "samen", l: "samen" }].map((o) => (
            <button key={o.v} onClick={() => zetWie(o.v)} className="rounded-full px-3 py-1 text-xs"
              style={{ background: wie === o.v ? kleurVan(o.v) : PAPIER, color: wie === o.v ? "#fff" : ZACHT, fontFamily: MONO }}>{o.l}</button>
          ))}
          {!ander && (
            <button onClick={() => zetToevoegen(!toevoegen)} className="rounded-full px-3 py-1 text-xs"
              style={{ border: `1px dashed ${SAMEN}`, color: SAMEN, fontFamily: MONO }}>
              + huisgenoot
            </button>
          )}
        </div>

        {toevoegen && !ander && (
          <div className="mt-2">
            <div className="flex gap-2">
              <Invoer waarde={nieuweNaam} zet={zetNieuweNaam} plaats="Naam van je huisgenoot" opEnter={voegHuisgenootToe} />
              <button onClick={voegHuisgenootToe} className="shrink-0 rounded-xl px-3 text-sm font-semibold"
                style={{ background: SAMEN, color: "#fff" }}>Toevoegen</button>
            </div>
            <p className="mt-2 text-xs" style={{ color: ZACHT }}>
              Zij logt straks in met haar eigen account en kiest deze naam. Vanaf nu kun je haar al klussen sturen.
            </p>
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-2">
          {Object.keys(RITMES).map((r) => (
            <button key={r} onClick={() => zetRitme(r)} className="rounded-full px-3 py-1 text-xs"
              style={{ background: ritme === r ? INK : PAPIER, color: ritme === r ? "#fff" : ZACHT, fontFamily: MONO }}>{RITMES[r]}</button>
          ))}
        </div>

        {ritme === "week" && (
          <div className="mt-2 flex flex-wrap gap-1">
            {WEEKDAGEN.map((d, i) => (
              <button key={d} onClick={() => zetWeekdag(i)} className="rounded-full px-3 py-1 text-xs"
                style={{ background: weekdag === i ? SAMEN : PAPIER, color: weekdag === i ? "#fff" : ZACHT, fontFamily: MONO }}>{d}</button>
            ))}
          </div>
        )}
        {ritme === "maand" && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs" style={{ color: ZACHT, fontFamily: MONO }}>dag van de maand</span>
            <input type="number" min="1" max="28" value={maanddag} onChange={(e) => zetMaanddag(Number(e.target.value))}
              className="w-16 rounded-full px-3 py-1 text-xs" style={{ background: PAPIER, color: INK, fontFamily: MONO, border: `1px solid ${LIJN}` }} />
          </div>
        )}
        {ritme === "eenmalig" && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs" style={{ color: ZACHT, fontFamily: MONO }}>datum</span>
            <input type="date" value={datum} onChange={(e) => zetDatum(e.target.value)}
              className="rounded-full px-3 py-1 text-xs" style={{ background: PAPIER, color: INK, fontFamily: MONO, border: `1px solid ${LIJN}` }} />
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: ZACHT, fontFamily: MONO }}>punten</span>
          {PUNTOPTIES.map((p) => (
            <button key={p} onClick={() => zetPunten(p)} className="rounded-full px-3 py-1 text-xs"
              style={{ background: punten === p ? GEEL : PAPIER, color: INK, fontFamily: MONO, fontWeight: 700 }}>{p}</button>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Bell size={13} color={ZACHT} />
          <span className="text-xs" style={{ color: ZACHT, fontFamily: MONO }}>melding om</span>
          <input type="time" value={tijd} onChange={(e) => zetTijd(e.target.value)}
            className="rounded-full px-2 py-1 text-xs"
            style={{ background: PAPIER, color: INK, fontFamily: MONO, border: `1px solid ${LIJN}` }} />
          <span className="text-xs" style={{ color: ZACHT }}>dag ervoor en op de dag zelf</span>
        </div>

        {ander && (
          <p className="mt-3 text-xs" style={{ color: ZACHT }}>
            Elke nieuwe klus gaat eerst naar {ander.naam} ter goedkeuring. Tik een klus open voor stappen.
          </p>
        )}
      </Kaart>

      <div className="flex gap-2">
        {[{ v: "alles", l: "alles" }, { v: "ik", l: ik.naam }, { v: "ander", l: ander ? ander.naam : "ander" }].map((o) => (
          <button key={o.v} onClick={() => zetFilter(o.v)} className="rounded-full px-3 py-1 text-xs"
            style={{ background: filter === o.v ? INK : KAART, color: filter === o.v ? "#fff" : ZACHT, fontFamily: MONO, border: `1px solid ${LIJN}` }}>{o.l}</button>
        ))}
      </div>

      <Kaart>
        <Kop>open</Kop>
        {open.length === 0 ? <Leeg>Niets open in deze weergave.</Leeg> : <ul>{open.map((k) => <Regel key={k.id} k={k} />)}</ul>}
      </Kaart>

      {gedaan.length > 0 && (
        <Kaart>
          <Kop>gedaan</Kop>
          <ul>{gedaan.map((k) => <Regel key={k.id} k={k} af />)}</ul>
        </Kaart>
      )}
    </div>
  );
}

/* ---------- scherm: weekmenu ---------- */
function Weekmenu({ menu, zetMenu, personen, ik, boodschappen, zetBoodschappen, meld }) {
  const [offset, zetOffset] = useState(0);
  const start = plusDagen(maandagVan(new Date()), offset * 7);
  const [bewerk, zetBewerk] = useState(null);
  const [gerecht, zetGerecht] = useState("");
  const [ingredienten, zetIngredienten] = useState("");
  const [kok, zetKok] = useState("");
  const ander = personen.find((p) => p.pid !== ik.pid);

  const openen = (sl) => {
    const m = menu[sl] || {};
    zetGerecht(m.gerecht || ""); zetIngredienten(m.ingredienten || ""); zetKok(m.kok || "");
    zetBewerk(sl);
  };
  const opslaan = () => {
    const dagNaam = DAGEN[(new Date(bewerk + "T12:00:00").getDay() + 6) % 7];
    zetMenu({ ...menu, [bewerk]: {
      gerecht: gerecht.trim(), ingredienten: ingredienten.trim(), kok,
      status: ander ? "wacht" : "akkoord", door: ik.pid,
    } });
    if (ander && gerecht.trim()) {
      meld(ander.pid, "Voorstel voor het eten", `${dagNaam}: ${gerecht.trim()}. Ga je akkoord?`);
    }
    zetBewerk(null);
  };
  const beamen = (sl) => {
    zetMenu({ ...menu, [sl]: { ...menu[sl], status: "akkoord" } });
    meld(menu[sl].door, "Menu goedgekeurd", `${ik.naam} gaat akkoord met ${menu[sl].gerecht}`);
  };
  const afwijzen = (sl) => {
    const gerechtNaam = menu[sl].gerecht;
    const rest = { ...menu };
    delete rest[sl];
    zetMenu(rest);
    meld(menu[sl].door, "Menu afgewezen", `${ik.naam} ziet ${gerechtNaam} niet zitten. Kies samen iets anders.`);
  };
  const naarLijst = (sl) => {
    const m = menu[sl];
    if (!m?.ingredienten) return;
    const nieuw = m.ingredienten.split(",").map((s) => s.trim()).filter(Boolean)
      .map((t) => ({ id: id(), tekst: t, cat: "vers", af: false }));
    zetBoodschappen([...boodschappen, ...nieuw]);
    if (ander) meld(ander.pid, "Boodschappen toegevoegd", `${ik.naam} zette de ingredienten voor ${m.gerecht} op de lijst`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => zetOffset(offset - 1)} style={{ color: ZACHT }}><ChevronLeft size={20} /></button>
        <p className="text-sm" style={{ fontFamily: MONO, color: ZACHT }}>
          {offset === 0 ? "deze week" : offset === 1 ? "volgende week" : `${start.getDate()} ${MAANDEN[start.getMonth()]}`}
        </p>
        <button onClick={() => zetOffset(offset + 1)} style={{ color: ZACHT }}><ChevronRight size={20} /></button>
      </div>

      {DAGEN.map((dag, i) => {
        const d = plusDagen(start, i);
        const sl = sleutelVan(d);
        const m = menu[sl];
        const vandaag = zelfdeDag(d, new Date());
        const wacht = m?.gerecht && m.status === "wacht";
        const ikMoetKeuren = wacht && m.door !== ik.pid;
        return (
          <Kaart key={sl} style={vandaag ? { border: `2px solid ${GEEL}` } : wacht ? { border: `2px solid ${SAMEN}` } : {}}>
            <div className="flex items-start justify-between gap-3">
              <button onClick={() => openen(sl)} className="flex-1 text-left">
                <p className="text-xs uppercase tracking-widest" style={{ fontFamily: MONO, color: vandaag ? GEEL : ZACHT }}>
                  {dag} {d.getDate()}
                </p>
                <p className="mt-1 text-lg leading-snug" style={{ fontFamily: DISPLAY, fontWeight: 700, color: m?.gerecht ? INK : LIJN }}>
                  {m?.gerecht || "Tik om te plannen"}
                </p>
                {m?.kok && (
                  <p className="text-xs" style={{ color: KLEUREN[personen.findIndex((p) => p.pid === m.kok)] || ZACHT }}>
                    kookt: {personen.find((p) => p.pid === m.kok)?.naam}
                  </p>
                )}
              </button>
              {m?.ingredienten && m.status !== "wacht" && (
                <button onClick={() => naarLijst(sl)} className="shrink-0 rounded-full px-2 py-1 text-xs"
                  style={{ border: `1px solid ${LIJN}`, color: ZACHT, fontFamily: MONO }}>op lijst</button>
              )}
            </div>

            {wacht && (
              <div className="mt-2">
                {ikMoetKeuren ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs" style={{ color: SAMEN, fontFamily: MONO }}>
                      voorstel van {personen.find((p) => p.pid === m.door)?.naam}
                    </span>
                    <Knop onClick={() => beamen(sl)} kleur={SAMEN} klein>Lekker</Knop>
                    <Knop onClick={() => afwijzen(sl)} kleur={ZACHT} vol={false} klein>Liever niet</Knop>
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: ZACHT, fontFamily: MONO }}>
                    wacht op akkoord van {ander ? ander.naam : "de ander"}
                  </span>
                )}
              </div>
            )}
          </Kaart>
        );
      })}

      {bewerk && (
        <div className="fixed inset-0 z-30 flex items-end justify-center p-4" style={{ background: "rgba(22,36,31,.45)" }}
          onClick={() => zetBewerk(null)}>
          <div className="w-full max-w-md rounded-2xl p-4" style={{ background: KAART }} onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-xs uppercase tracking-widest" style={{ fontFamily: MONO, color: ZACHT }}>maaltijd voorstellen</p>
            <div className="space-y-2">
              <Invoer waarde={gerecht} zet={zetGerecht} plaats="Gerecht" />
              <Invoer waarde={ingredienten} zet={zetIngredienten} plaats="Ingredienten, gescheiden door komma" />
              <div className="flex flex-wrap gap-2 pt-1">
                {[...personen.map((p) => ({ v: p.pid, l: p.naam })), { v: "", l: "samen" }].map((o) => (
                  <button key={o.l} onClick={() => zetKok(o.v)} className="rounded-full px-3 py-1 text-xs"
                    style={{ background: kok === o.v ? INK : PAPIER, color: kok === o.v ? "#fff" : ZACHT, fontFamily: MONO }}>{o.l}</button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Knop onClick={() => zetBewerk(null)} vol={false} kleur={ZACHT}>Annuleren</Knop>
              <Knop onClick={opslaan}>{ander ? "Voorstellen" : "Opslaan"}</Knop>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- scherm: wenslijst ---------- */
function Wensen({ wensen, zetWensen, ik, personen }) {
  const [tekst, zetTekst] = useState("");
  const [ruimte, zetRuimte] = useState("");
  const [prijs, zetPrijs] = useState("");

  const voegToe = () => {
    if (!tekst.trim()) return;
    zetWensen([...wensen, { id: id(), tekst: tekst.trim(), ruimte: ruimte.trim(), prijs: Number(prijs) || 0, akkoord: [ik.pid], gekocht: false }]);
    zetTekst(""); zetRuimte(""); zetPrijs("");
  };
  const stem = (w) => zetWensen(wensen.map((x) => x.id === w.id
    ? { ...x, akkoord: x.akkoord.includes(ik.pid) ? x.akkoord.filter((a) => a !== ik.pid) : [...x.akkoord, ik.pid] }
    : x));

  const open = wensen.filter((w) => !w.gekocht);
  const totaal = open.reduce((s, w) => s + (Number(w.prijs) || 0), 0);
  const eens = open.filter((w) => w.akkoord.length >= personen.length);

  return (
    <div className="space-y-4">
      <Kaart style={{ background: INK }}>
        <p className="text-xs uppercase tracking-widest" style={{ fontFamily: MONO, color: "#9FB0A8" }}>wenslijst voor het huis</p>
        <p className="mt-1 text-4xl" style={{ fontFamily: MONO, fontWeight: 700, color: "#fff" }}>€{totaal.toLocaleString("nl-NL")}</p>
        <p className="text-xs" style={{ color: "#9FB0A8" }}>{eens.length} van {open.length} waar jullie het allebei over eens zijn</p>
      </Kaart>

      <Kaart>
        <Invoer waarde={tekst} zet={zetTekst} plaats="Wat willen jullie kopen?" opEnter={voegToe} />
        <div className="mt-2 flex gap-2">
          <Invoer waarde={ruimte} zet={zetRuimte} plaats="Ruimte" />
          <Invoer waarde={prijs} zet={zetPrijs} plaats="€" style={{ width: 90 }} />
          <button onClick={voegToe} className="shrink-0 rounded-xl px-3" style={{ background: INK, color: "#fff" }}><Plus size={18} /></button>
        </div>
      </Kaart>

      {open.length === 0 ? <Kaart><Leeg>Nog geen wensen. Voeg toe wat het huis nog mist.</Leeg></Kaart> : open.map((w) => {
        const beide = w.akkoord.length >= personen.length;
        return (
          <Kaart key={w.id} style={beide ? { border: `1.5px solid ${SAMEN}` } : {}}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-lg leading-snug" style={{ fontFamily: DISPLAY, fontWeight: 700, color: INK }}>{w.tekst}</p>
                <p className="text-xs" style={{ color: ZACHT, fontFamily: MONO }}>
                  {w.ruimte || "hele huis"} {w.prijs ? `· €${w.prijs}` : ""}
                </p>
                <div className="mt-2 flex gap-2">
                  {personen.map((p, i) => (
                    <span key={p.pid} className="rounded-full px-2 py-1 text-xs" style={{
                      fontFamily: MONO,
                      background: w.akkoord.includes(p.pid) ? KLEUREN[i] : PAPIER,
                      color: w.akkoord.includes(p.pid) ? "#fff" : ZACHT,
                    }}>{p.naam}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button onClick={() => stem(w)} aria-label="Stem">
                  <Heart size={20} fill={w.akkoord.includes(ik.pid) ? SAMEN : "none"} color={w.akkoord.includes(ik.pid) ? SAMEN : LIJN} />
                </button>
                <button onClick={() => zetWensen(wensen.map((x) => x.id === w.id ? { ...x, gekocht: true } : x))}
                  className="rounded-full px-2 py-1 text-xs" style={{ border: `1px solid ${LIJN}`, color: ZACHT, fontFamily: MONO }}>gekocht</button>
              </div>
            </div>
          </Kaart>
        );
      })}
    </div>
  );
}

/* ---------- app ---------- */
export default function Huishoudapp({ gebruiker }) {
  const [personen, zetPersonen] = useState([]);
  const [ikId, zetIkId] = useState(null);
  const [boodschappen, zetBoodschappenS] = useState([]);
  const [klussen, zetKlussenS] = useState([]);
  const [menu, zetMenuS] = useState({});
  const [wensen, zetWensenS] = useState([]);
  const [prive, zetPriveS] = useState([]);
  const [rondes, zetRondesS] = useState({});
  const [uitgaand, zetUitgaandS] = useState([]);
  const [chat, zetChatS] = useState([]);
  const [chatOpen, zetChatOpen] = useState(false);
  const [foto, zetFoto] = useState(null);
  const [tab, zetTab] = useState("vandaag");
  const [laden, zetLaden] = useState(true);
  const [meldingen, zetMeldingen] = useState(meldingStand());
  const [naam, zetNaam] = useState("");
  const laatsteSync = useRef(0);

  const haalOp = useCallback(async () => {
    const [hg, bo, kl, me, we, pr, ro, ui, ch] = await Promise.all([
      laad("huisgenoten", true), laad("boodschappen", true),
      laad("klussen", true), laad("weekmenu", true), laad("wensen", true), laad("prive", false),
      laad("maandrondes", true), laad("uitgaand", true), laad("chat", true),
    ]);
    zetRondesS(ro || {});
    zetUitgaandS(ui || []);
    zetChatS(ch || []);
    zetPersonen(hg || []);
    zetIkId((hg || []).find((p) => p.gebruiker === gebruiker.id)?.pid || null);
    zetBoodschappenS(bo || []);
    zetKlussenS(kl || []);
    zetMenuS(me || {});
    zetWensenS(we || []);
    zetPriveS(pr || []);
    laatsteSync.current = Date.now();
    zetLaden(false);
  }, [gebruiker.id]);

  useEffect(() => { haalOp(); }, [haalOp]);
  useEffect(() => luister(haalOp), [haalOp]);
  useEffect(() => {
    const bij = () => { if (document.visibilityState === "visible" && Date.now() - laatsteSync.current > 15000) haalOp(); };
    document.addEventListener("visibilitychange", bij);
    return () => document.removeEventListener("visibilitychange", bij);
  }, [haalOp]);

  const maak = (sleutel, zetter, gedeeld) => (waarde) => { zetter(waarde); bewaar(sleutel, waarde, gedeeld); };
  const zetBoodschappen = maak("boodschappen", zetBoodschappenS, true);
  const zetKlussen = maak("klussen", zetKlussenS, true);
  const zetMenu = maak("weekmenu", zetMenuS, true);
  const zetWensen = maak("wensen", zetWensenS, true);
  const zetPrive = maak("prive", zetPriveS, false);
  const zetRondes = maak("maandrondes", zetRondesS, true);
  const zetUitgaand = maak("uitgaand", zetUitgaandS, true);
  const zetChat = maak("chat", zetChatS, true);
  const zetHuisgenoten = maak("huisgenoten", zetPersonen, true);

  // Zet een bericht klaar. De meldingsfunctie pikt het op en stuurt de push.
  const meld = (aan, titel, tekst) => {
    const vers = (uitgaand || []).filter((b) => Date.now() - b.moment < 7 * 864e5);
    zetUitgaand([...vers, { id: id(), aan, titel, tekst, moment: Date.now() }].slice(-50));
  };

  const ik = personen.find((p) => p.pid === ikId);
  const bewaarFoto = (afbeelding) =>
    zetHuisgenoten(personen.map((p) => p.pid === ikId ? { ...p, foto: afbeelding } : p));

  const vinkAf = (klusId) => {
    const vandaag = sleutelVan(new Date());
    zetKlussen(klussen.map((k) => {
      if (k.id !== klusId) return k;
      const open = staatOpen(k, new Date());
      if (!open) return { ...k, laatst: null, geschiedenis: (k.geschiedenis || []).slice(0, -1) };
      return { ...k, laatst: vandaag, geschiedenis: [...(k.geschiedenis || []), { door: ikId, datum: vandaag, punten: k.punten ?? 1 }] };
    }));
  };

  const kies = async (pid) => {
    const bijgewerkt = personen.map((p) => p.pid === pid ? { ...p, gebruiker: gebruiker.id } : p);
    zetPersonen(bijgewerkt);
    zetIkId(pid);
    await bewaar("huisgenoten", bijgewerkt, true);
    zetPriveS((await laad("prive", false)) || []);
  };
  const maakPersoon = async () => {
    if (!naam.trim() || personen.length >= 2) return;
    const nieuw = [...personen, { pid: id(), naam: naam.trim(), foto, gebruiker: gebruiker.id }];
    zetPersonen(nieuw);
    await bewaar("huisgenoten", nieuw, true);
    zetIkId(nieuw[nieuw.length - 1].pid);
    zetNaam("");
  };

  const stijl = `
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
    .weegbalk { transition: transform .6s cubic-bezier(.34,1.4,.64,1); }
    button:focus-visible { outline: 2px solid ${GEEL}; outline-offset: 2px; }
    input:focus { border-color: ${INK} !important; }
    @media (prefers-reduced-motion: reduce) { .weegbalk { transition: none; } }
  `;

  if (laden) {
    return <div className="flex h-screen items-center justify-center" style={{ background: PAPIER, color: ZACHT, fontFamily: BODY }}>Even laden…</div>;
  }

  /* onboarding */
  if (!ik) {
    return (
      <div className="flex min-h-screen flex-col justify-center p-6" style={{ background: PAPIER, fontFamily: BODY }}>
        <style>{stijl}</style>
        <h1 className="text-4xl leading-tight" style={{ fontFamily: DISPLAY, fontWeight: 800, color: INK }}>Ons huis</h1>
        <p className="mt-2 mb-6 text-sm" style={{ color: ZACHT }}>
          Boodschappen, klussen, weekmenu en wensen op één plek. De gedeelde lijsten zijn zichtbaar voor iedereen met deze app.
        </p>
        {personen.length > 0 && (
          <div className="mb-4 space-y-2">
            {personen.filter((p) => !p.gebruiker).map((p, i) => (
              <button key={p.pid} onClick={() => kies(p.pid)} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold"
                style={{ background: KLEUREN[i], color: "#fff" }}>
                <Avatar persoon={p} kleur={KLEUREN[i]} maat={28} />
                Ik ben {p.naam}
              </button>
            ))}
          </div>
        )}
        {personen.length < 2 && (
          <Kaart>
            <p className="mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: MONO, color: ZACHT }}>
              {personen.length === 0 ? "wie zet dit op?" : "of voeg jezelf toe"}
            </p>
            <div className="flex items-center gap-3">
              <FotoKnop opFoto={zetFoto} style={{ borderRadius: "50%" }}>
                {foto
                  ? <img src={foto} alt="Jouw foto" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                  : <span className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: "50%", background: PAPIER, border: `1px dashed ${LIJN}`, color: ZACHT }}>
                      <Camera size={18} />
                    </span>}
              </FotoKnop>
              <Invoer waarde={naam} zet={zetNaam} plaats="Je naam" opEnter={maakPersoon} />
              <button onClick={maakPersoon} className="shrink-0 rounded-xl px-4" style={{ background: INK, color: "#fff" }}>Start</button>
            </div>
            <p className="mt-2 text-xs" style={{ color: ZACHT }}>Tik op de cirkel om een foto te maken. Die verschijnt bij jouw klussen.</p>
          </Kaart>
        )}
      </div>
    );
  }

  const nu = new Date();
  const titels = { vandaag: `Hoi ${ik.naam}`, boodschappen: "Boodschappen", klussen: "Klussen", eten: "Weekmenu", wensen: "Wensen" };
  const tabs = [
    { k: "vandaag", l: "Vandaag", I: Home },
    { k: "boodschappen", l: "Lijst", I: ShoppingBasket },
    { k: "klussen", l: "Klussen", I: Sparkles },
    { k: "eten", l: "Eten", I: UtensilsCrossed },
    { k: "wensen", l: "Wensen", I: Heart },
  ];

  return (
    <div className="relative flex flex-col" style={{ height: "100dvh", background: PAPIER, fontFamily: BODY, color: INK }}>
      <style>{stijl}</style>

      <header className="flex items-end justify-between px-5 pb-4" style={{ paddingTop: "calc(24px + env(safe-area-inset-top))" }}>
        <div className="flex items-end gap-3">
          <FotoKnop opFoto={bewaarFoto} style={{ borderRadius: "50%" }}>
            <Avatar persoon={ik} kleur={KLEUREN[personen.findIndex((p) => p.pid === ikId)] || INK} maat={40} rand={LIJN} />
          </FotoKnop>
          <div>
          <p className="text-xs uppercase tracking-widest" style={{ fontFamily: MONO, color: ZACHT }}>
            {DAGEN[(nu.getDay() + 6) % 7]} {nu.getDate()} {MAANDEN[nu.getMonth()]}
          </p>
          <h1 className="text-3xl leading-tight" style={{ fontFamily: DISPLAY, fontWeight: 800 }}>{titels[tab]}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => zetMeldingen(await meldingenAanzetten(ik.pid))}
            className="rounded-full p-2"
            style={{ background: meldingen === "aan" ? GEEL : KAART, border: `1px solid ${LIJN}`, color: meldingen === "aan" ? INK : ZACHT }}
            aria-label="Meldingen">
            {meldingen === "aan" ? <Bell size={16} /> : <BellOff size={16} />}
          </button>
          <button onClick={haalOp} className="rounded-full p-2" style={{ background: KAART, border: `1px solid ${LIJN}`, color: ZACHT }} aria-label="Ververs">
            <RefreshCw size={16} />
          </button>
          <button onClick={afmelden} className="rounded-full p-2" style={{ background: KAART, border: `1px solid ${LIJN}`, color: ZACHT }} aria-label="Afmelden">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-6">
        {tab === "vandaag" && (
          <Vandaag ik={ik} personen={personen} klussen={klussen} vinkAf={vinkAf} boodschappen={boodschappen}
            weekmenu={menu} wensen={wensen} prive={prive} zetPrive={zetPrive} gaNaar={zetTab}
            rondes={rondes} zetRondes={zetRondes} />
        )}
        {tab === "boodschappen" && <Boodschappen lijst={boodschappen} zetLijst={zetBoodschappen} ik={ik} />}
        {tab === "klussen" && <Klussen klussen={klussen} zetKlussen={zetKlussen} personen={personen} ik={ik} vinkAf={vinkAf} meld={meld} zetHuisgenoten={zetHuisgenoten} />}
        {tab === "eten" && <Weekmenu menu={menu} zetMenu={zetMenu} personen={personen} ik={ik} boodschappen={boodschappen} zetBoodschappen={zetBoodschappen} meld={meld} />}
        {tab === "wensen" && <Wensen wensen={wensen} zetWensen={zetWensen} ik={ik} personen={personen} />}
      </main>

      {!chatOpen && (
        <button onClick={() => zetChatOpen(true)}
          className="absolute right-5 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ bottom: "calc(88px + env(safe-area-inset-bottom))", background: INK, color: "#fff", boxShadow: "0 6px 20px rgba(22,36,31,.25)" }}
          aria-label="Chat openen">
          <MessageCircle size={22} />
        </button>
      )}

      {chatOpen && (
        <Chat chat={chat} zetChat={zetChat} ik={ik} personen={personen} meld={meld} sluit={() => zetChatOpen(false)} />
      )}

      <nav className="flex shrink-0 justify-around px-2 pt-2"
        style={{ background: KAART, borderTop: `1px solid ${LIJN}`, paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
        {tabs.map(({ k, l, I }) => (
          <button key={k} onClick={() => zetTab(k)} className="flex flex-col items-center gap-1 px-3 py-1"
            style={{ color: tab === k ? INK : ZACHT }}>
            <span className="relative">
              <I size={20} strokeWidth={tab === k ? 2.4 : 1.7} />
              {k === "klussen" && klussen.some((x) => x.status === "wacht" && x.door !== ikId) && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full" style={{ background: SAMEN }} />
              )}
            </span>
            <span className="text-xs" style={{ fontFamily: MONO, fontWeight: tab === k ? 700 : 400 }}>{l}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
