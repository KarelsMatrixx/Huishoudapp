// Dagelijkse Marktplaats-bot voor Ons huis, als Supabase Edge Function.
// Leest de wensenlijst, zoekt op Marktplaats en schrijft goede deals naar huis_data (sleutel "deals").
// Wordt elke ochtend aangeroepen door pg_cron. Gebruikt de ingebouwde service-sleutel van Supabase.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const POSTCODE = "6511AA";   // Nijmegen
const STRAAL_M = 30000;      // 30 km
const KORTING = 0.7;         // deal = prijs <= 70% van de richtprijs
const ONDERGRENS = 0.12;     // onder 12% is meestal een onderdeel of lokprijs
const MIN_TUSSEN_MS = 30 * 60 * 1000; // niet vaker dan eens per half uur, ook al roept iemand hem aan
const PER_WENS = 3;          // alleen de beste drie deals per wens

/* Past een advertentie bij de wens? Per wens kunnen "moet" en "niet" (regex, woorden gescheiden door |)
   worden vastgelegd. Zonder "moet" moet het eerste kernwoord van de zoekterm in de titel staan. */
function past(titel: string, w: any, term: string): boolean {
  const t = titel.toLowerCase();
  if (w.niet && new RegExp(w.niet, "i").test(t)) return false;
  if (w.moet) return new RegExp(w.moet, "i").test(t);
  const kern = term.toLowerCase().split(" ").find((x) => x.length >= 4) || term.toLowerCase();
  return t.includes(kern.slice(0, Math.min(kern.length, 6)));
}

async function lees(sleutel: string) {
  const { data, error } = await db.from("huis_data").select("waarde").eq("sleutel", sleutel).maybeSingle();
  if (error) throw new Error(`lezen ${sleutel}: ${error.message}`);
  return data?.waarde ?? null;
}
async function schrijf(sleutel: string, waarde: unknown) {
  const { error } = await db.from("huis_data").upsert({ sleutel, waarde, bijgewerkt: new Date().toISOString() }, { onConflict: "sleutel" });
  if (error) throw new Error(`schrijven ${sleutel}: ${error.message}`);
}

function zoekterm(w: any): string {
  return String(w.zoek || w.tekst)
    .replace(/\(.*?\)/g, "")
    .replace(/\b(nieuwe?|voor|aan|de|het|een|van|op|naast|links|rechts|volledig|plus|karel|marly)\b/gi, " ")
    .replace(/\s+/g, " ").trim();
}

async function zoek(term: string) {
  const p = new URLSearchParams({
    query: term, limit: "40", offset: "0", sortBy: "SORT_INDEX", sortOrder: "DECREASING",
    postcode: POSTCODE, distanceMeters: String(STRAAL_M),
  });
  const r = await fetch("https://www.marktplaats.nl/lrp/api/search?" + p, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      Accept: "application/json", "Accept-Language": "nl-NL,nl;q=0.9",
    },
  });
  if (!r.ok) throw new Error(`Marktplaats ${r.status} voor "${term}"`);
  const j = await r.json();
  return (j.listings || []).map((l: any) => ({
    id: String(l.itemId),
    titel: l.title,
    prijs: ["FIXED", "MIN_BID"].includes(l.priceInfo?.priceType) ? Math.round((l.priceInfo.priceCents || 0) / 100) : null,
    plaats: l.location?.cityName || "",
    afstandKm: l.location?.distanceMeters != null ? Math.round(l.location.distanceMeters / 1000) : null,
    url: l.vipUrl ? "https://www.marktplaats.nl" + l.vipUrl : null,
    foto: l.pictures?.[0]?.mediumUrl || l.imageUrls?.[0] || null,
  }));
}

Deno.serve(async () => {
  try {
    const oud = (await lees("deals")) || { items: [] };
    if (oud.status?.moment && Date.now() - new Date(oud.status.moment).getTime() < MIN_TUSSEN_MS) {
      return Response.json({ overgeslagen: "net al gezocht" });
    }
    const wensen = ((await lees("wensen")) || []).filter((w: any) => !w.gekocht && Number(w.prijs) > 0);
    const bekend = new Map<string, any>();
    const vorige = new Map((oud.items || []).map((d: any) => [d.id, d]));
    const nu = new Date().toISOString();
    const nieuw: any[] = [];
    const fouten: string[] = [];
    const log: string[] = [];

    for (const w of wensen) {
      const term = zoekterm(w);
      try {
        const res = await zoek(term);
        const budget = Number(w.prijs);
        const goed = res
          .filter((a: any) => a.url && a.prijs != null && a.prijs > 0)
          .filter((a: any) => a.prijs <= budget * KORTING && a.prijs >= budget * ONDERGRENS)
          .filter((a: any) => past(a.titel || "", w, term))
          .sort((a: any, b: any) => a.prijs - b.prijs)
          .slice(0, PER_WENS);
        for (const a of goed) {
          const vorig: any = vorige.get(a.id);
          const deal = { ...a, wensId: w.id, wens: w.tekst, richtprijs: budget, gezien: vorig?.gezien || nu, laatstGezien: nu, nieuw: !vorig };
          bekend.set(a.id, deal);
          if (!vorig) nieuw.push(deal);
        }
        log.push(`${term}: ${res.length} gevonden, ${goed.length} deal`);
      } catch (e) {
        fouten.push(`${w.tekst}: ${(e as Error).message}`);
      }
      await new Promise((r) => setTimeout(r, 1500)); // rustig tempo
    }

    if (wensen.length && fouten.length === wensen.length) {
      await schrijf("deals", { ...oud, status: { ok: false, moment: nu, fout: fouten[0] } });
      return Response.json({ ok: false, fouten }, { status: 502 });
    }

    const actueel = [...bekend.values()]
      .sort((a: any, b: any) => a.prijs / a.richtprijs - b.prijs / b.richtprijs);

    await schrijf("deals", { items: actueel, status: { ok: true, moment: nu, gezocht: wensen.length, fouten } });

    // Geen melding bij een eerste ronde of na leegmaken, anders zou elke deal als nieuw tellen.
    if (nieuw.length && vorige.size > 0) {
      const beste = nieuw.sort((a, b) => a.prijs / a.richtprijs - b.prijs / b.richtprijs)[0];
      const uitgaand = ((await lees("uitgaand")) || []).filter((b: any) => Date.now() - b.moment < 7 * 864e5);
      uitgaand.push({
        id: "deal-" + beste.id, aan: "beide", titel: `Marktplaats deal: ${beste.wens}`,
        tekst: `${beste.titel} voor €${beste.prijs} (richtprijs €${beste.richtprijs}) in ${beste.plaats}` + (nieuw.length > 1 ? ` · +${nieuw.length - 1} meer` : ""),
        moment: Date.now(),
      });
      await schrijf("uitgaand", uitgaand.slice(-50));
    }
    return Response.json({ ok: true, deals: actueel.length, nieuw: nieuw.length, fouten, log });
  } catch (e) {
    return Response.json({ ok: false, fout: (e as Error).message }, { status: 500 });
  }
});
