/* Rekenwerk en hulpjes zonder schermen. Het datamodel in Supabase blijft ongewijzigd. */

export const DAGEN = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
export const WEEKDAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];
export const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
export const PUNTOPTIES = [1, 2, 3, 5, 8];
export const RITMES = { dag: "Elke dag", week: "Vaste dag", weekvrij: "Vrij in de week", maand: "Elke maand", eenmalig: "Eenmalig" };

export const id = () => Math.random().toString(36).slice(2, 9);
export const sleutelVan = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const maandSleutel = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const plusDagen = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const zelfdeDag = (a, b) => sleutelVan(a) === sleutelVan(b);
export const vanSleutel = (s) => new Date(s + "T12:00:00");

export function maandagVan(d) {
  const n = new Date(d);
  n.setDate(n.getDate() - ((n.getDay() + 6) % 7));
  n.setHours(0, 0, 0, 0);
  return n;
}

/* Staat een klus in de huidige periode nog open? */
export function staatOpen(klus, nu) {
  if (!klus.laatst) return true;
  const d = vanSleutel(klus.laatst);
  if (klus.ritme === "eenmalig") return false;
  if (klus.ritme === "dag") return !zelfdeDag(d, nu);
  if (klus.ritme === "week" || klus.ritme === "weekvrij") return maandagVan(d).getTime() !== maandagVan(nu).getTime();
  return d.getMonth() !== nu.getMonth() || d.getFullYear() !== nu.getFullYear();
}

export function vervaldatumVan(klus, nu) {
  if (klus.ritme === "dag") return sleutelVan(nu);
  if (klus.ritme === "weekvrij") return null;
  if (klus.ritme === "eenmalig") return klus.dag || null;
  if (klus.ritme === "week") return sleutelVan(plusDagen(maandagVan(nu), klus.dag ?? 6));
  const d = Math.min(klus.dag ?? 1, 28);
  return `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/* In welke groep hoort een klus: vandaag, week of later. */
export function groepVan(klus, nu) {
  const vandaag = sleutelVan(nu);
  const eindWeek = sleutelVan(plusDagen(maandagVan(nu), 6));
  if (klus.ritme === "dag") return "vandaag";
  if (klus.ritme === "weekvrij") return "week";
  const v = vervaldatumVan(klus, nu);
  if (!v) return "later";
  if (v <= vandaag) return "vandaag";
  if (v <= eindWeek) return "week";
  return "later";
}

export function puntenVan(klussen, pid, test) {
  return klussen.reduce((n, k) => n + (k.geschiedenis || [])
    .filter((g) => g.door === pid && test(String(g.datum)))
    .reduce((s, g) => s + (g.punten ?? 1), 0), 0);
}
export function aantalVan(klussen, pid, test) {
  return klussen.reduce((n, k) => n + (k.geschiedenis || []).filter((g) => g.door === pid && test(String(g.datum))).length, 0);
}

export function ritmeTekst(k) {
  if (k.ritme === "week") return `elke ${DAGEN[k.dag ?? 6]}`;
  if (k.ritme === "weekvrij") return "vrij in de week";
  if (k.ritme === "maand") return `de ${k.dag ?? 1}e van de maand`;
  if (k.ritme === "eenmalig") {
    if (!k.dag) return "eenmalig";
    const d = vanSleutel(k.dag);
    return `eenmalig · ${d.getDate()} ${MAANDEN[d.getMonth()]}`;
  }
  return "elke dag";
}

export const isVoorMij = (k, pid) => k.wie === pid || k.wie === "samen" || k.wie === "beiden";

/* Kort bevestigingstoontje bij het afvinken. */
export function piep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    osc.start(); osc.stop(ctx.currentTime + 0.24);
    setTimeout(() => ctx.close(), 400);
  } catch (e) { /* geluid is bijzaak */ }
}

/* Maakt van een gekozen of gemaakte foto een klein vierkant plaatje. */
export function fotoUit(bestand) {
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

/* Lichte opslag per toestel, voor gemakjes zoals "chat gelezen tot". */
export function lokaal(sleutel, waarde) {
  try {
    if (waarde === undefined) return JSON.parse(localStorage.getItem("onshuis-" + sleutel));
    localStorage.setItem("onshuis-" + sleutel, JSON.stringify(waarde));
  } catch (e) { return null; }
  return waarde;
}

export const euro = (n) => "€" + Math.round(Number(n) || 0).toLocaleString("nl-NL");

/* ---------- oordeel over Marktplaats-vondsten (huis_data, sleutel "deals_oordeel") ---------- */
export const OORDEEL_DAGEN = 30;
// Een oordeel geldt 30 dagen. Daarna telt het niet meer en wordt het bij het opslaan opgeruimd.
export const oordeelGeldt = (o, nu = Date.now()) => !!o && Number(o.moment) > 0 && nu - Number(o.moment) < OORDEEL_DAGEN * 864e5;
export const oordeelVan = (oordeel, d) => {
  const o = oordeel?.[d.id];
  return oordeelGeldt(o) ? o.oordeel : null; // "goed", "fout" of null
};
