// Dagelijkse Marktplaats bot voor Ons huis.
// Leest de wensenlijst uit Supabase, zoekt op Marktplaats en schrijft goede deals terug in huis_data (sleutel "deals").
// Benodigd: SUPABASE_URL en SUPABASE_SECRET_KEY (als GitHub secrets).

const URL_ = process.env.SUPABASE_URL;
const SLEUTEL = process.env.SUPABASE_SECRET_KEY;
const POSTCODE = process.env.POSTCODE || "6511AA"; // Nijmegen, aanpasbaar
const STRAAL_M = Number(process.env.STRAAL_M || 30000);
const KORTING = Number(process.env.KORTING || 0.7); // deal = prijs <= 70% van de richtprijs
const ONDERGRENS = 0.12; // onder 12% van richtprijs is meestal onderdeel/accessoire of lokprijs

if (!URL_ || !SLEUTEL) { console.error("SUPABASE_URL of SUPABASE_SECRET_KEY ontbreekt"); process.exit(1); }

const kop = { apikey: SLEUTEL, Authorization: `Bearer ${SLEUTEL}`, "Content-Type": "application/json" };

async function lees(sleutel) {
  const r = await fetch(`${URL_}/rest/v1/huis_data?sleutel=eq.${sleutel}&select=waarde`, { headers: kop });
  if (!r.ok) throw new Error(`lezen ${sleutel}: ${r.status} ${await r.text()}`);
  const rij = await r.json();
  return rij[0]?.waarde ?? null;
}
async function schrijf(sleutel, waarde) {
  const r = await fetch(`${URL_}/rest/v1/huis_data?on_conflict=sleutel`, {
    method: "POST",
    headers: { ...kop, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ sleutel, waarde, bijgewerkt: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(`schrijven ${sleutel}: ${r.status} ${await r.text()}`);
}

function zoekterm(w) {
  return (w.zoek || w.tekst).replace(/\(.*?\)/g, "").replace(/\b(voor|aan|de|het|een|van|op|naast|links|rechts|volledig|plus)\b/gi, " ").replace(/\s+/g, " ").trim();
}

async function zoek(term) {
  const p = new URLSearchParams({
    query: term, limit: "40", offset: "0",
    sortBy: "SORT_INDEX", sortOrder: "DECREASING",
    postcode: POSTCODE, distanceMeters: String(STRAAL_M),
    "attributesByKey[]": "offeredSince:Vandaag", // alleen nieuw; valt terug op alles als dit filter niet werkt
  });
  const bron = "https://www.marktplaats.nl/lrp/api/search?" + p;
  const r = await fetch(bron, { headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    Accept: "application/json", "Accept-Language": "nl-NL,nl;q=0.9",
  } });
  if (!r.ok) throw new Error(`Marktplaats ${r.status} voor "${term}"`);
  const j = await r.json();
  return (j.listings || []).map((l) => ({
    id: String(l.itemId),
    titel: l.title,
    prijs: l.priceInfo?.priceType === "FIXED" || l.priceInfo?.priceType === "MIN_BID" ? Math.round((l.priceInfo.priceCents || 0) / 100) : null,
    plaats: l.location?.cityName || "",
    afstandKm: l.location?.distanceMeters != null ? Math.round(l.location.distanceMeters / 1000) : null,
    url: l.vipUrl ? "https://www.marktplaats.nl" + l.vipUrl : null,
    foto: l.pictures?.[0]?.mediumUrl || l.imageUrls?.[0] || null,
    datum: l.date || null,
  }));
}

const wensen = ((await lees("wensen")) || []).filter((w) => !w.gekocht && Number(w.prijs) > 0);
const oud = (await lees("deals")) || { items: [] };
const bekend = new Map((oud.items || []).map((d) => [d.id, d]));
const nu = new Date().toISOString();
const nieuw = [];
const fouten = [];

for (const w of wensen) {
  const term = zoekterm(w);
  try {
    const resultaat = await zoek(term);
    const budget = Number(w.prijs);
    for (const a of resultaat) {
      if (!a.url || a.prijs == null || a.prijs <= 0) continue;
      if (a.prijs > budget * KORTING || a.prijs < budget * ONDERGRENS) continue;
      const vorig = bekend.get(a.id);
      const deal = { ...a, wensId: w.id, wens: w.tekst, richtprijs: budget, gezien: vorig?.gezien || nu, laatstGezien: nu, nieuw: !vorig };
      bekend.set(a.id, deal);
      if (!vorig) nieuw.push(deal);
    }
    console.log(`${w.tekst} -> "${term}": ${resultaat.length} resultaten`);
  } catch (e) {
    fouten.push(`${w.tekst}: ${e.message}`);
    console.error(e.message);
  }
  await new Promise((r) => setTimeout(r, 2500)); // vriendelijk tempo
}

// verlopen: niet meer gezien in 3 dagen, of wens inmiddels gekocht
const grens = Date.now() - 3 * 864e5;
const actueel = [...bekend.values()]
  .filter((d) => new Date(d.laatstGezien).getTime() > grens && wensen.some((w) => w.id === d.wensId))
  .map((d) => (d.laatstGezien === nu ? d : { ...d, nieuw: false }))
  .sort((a, b) => (a.prijs / a.richtprijs) - (b.prijs / b.richtprijs));

if (fouten.length === wensen.length && wensen.length > 0) {
  // alles mislukt (waarschijnlijk geblokkeerd): oude deals laten staan, status vastleggen
  await schrijf("deals", { ...oud, status: { ok: false, moment: nu, fout: fouten[0] } });
  console.error("Alle zoekopdrachten mislukt, geblokkeerd?");
  process.exit(1);
}

await schrijf("deals", { items: actueel, status: { ok: true, moment: nu, gezocht: wensen.length, fouten } });

if (nieuw.length) {
  const beste = nieuw.sort((a, b) => a.prijs / a.richtprijs - b.prijs / b.richtprijs)[0];
  const uitgaand = ((await lees("uitgaand")) || []).filter((b) => Date.now() - b.moment < 7 * 864e5);
  uitgaand.push({
    id: "deal-" + beste.id, aan: "beide", titel: `Marktplaats deal: ${beste.wens}`,
    tekst: `${beste.titel} voor €${beste.prijs} (richtprijs €${beste.richtprijs}) in ${beste.plaats}` + (nieuw.length > 1 ? ` · +${nieuw.length - 1} meer` : ""),
    moment: Date.now(),
  });
  await schrijf("uitgaand", uitgaand);
}
console.log(`Klaar: ${actueel.length} deals actief, ${nieuw.length} nieuw.`);
