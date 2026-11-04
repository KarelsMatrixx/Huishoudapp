// Aanpassing voor de Supabase Edge Function "deals" (Marktplaats-bot).
// De live code staat in Supabase, niet in deze repo. Plak de onderdelen hieronder op de aangegeven plekken.
//
// Nieuw in de wensen (huis_data "wensen"):
//   marktplaats: true   -> alleen deze wensen worden dagelijks gezocht
//   notities: "..."     -> vrije tekst; elke nieuwe kandidaat wordt hierop beoordeeld
//
// Benodigd: secret ANTHROPIC_API_KEY in Supabase > Edge Functions > Secrets.
// Zet de sleutel daar zelf neer, nooit in een chat of in de code.

/* ---------- 1. Bij het inlezen van de wensen ---------- */
// Was ongeveer:  .filter((w) => !w.gekocht && Number(w.prijs) > 0)
// Wordt:
//   .filter((w) => !w.gekocht && w.marktplaats === true && Number(w.prijs) > 0)

/* ---------- 2. Beoordelen op notities ---------- */
const MODEL = "claude-haiku-5-5";

type Oordeel = { past: boolean; reden: string };

export async function pastBijNotities(
  wens: { tekst: string; notities?: string },
  adv: { titel: string; prijs: number | null; omschrijving?: string },
): Promise<Oordeel | null> {
  const notities = (wens.notities || "").trim();
  if (!notities) return { past: true, reden: "geen notities" };
  const sleutel = Deno.env.get("ANTHROPIC_API_KEY");
  if (!sleutel) return null;

  const vraag = [
    `Wens: ${wens.tekst}`,
    `Eisen van het huishouden:\n${notities}`,
    ``,
    `Marktplaats-advertentie:`,
    `Titel: ${adv.titel}`,
    `Prijs: ${adv.prijs ?? "onbekend"}`,
    adv.omschrijving ? `Omschrijving: ${adv.omschrijving.slice(0, 600)}` : "",
    ``,
    `Past deze advertentie bij de eisen? Een onderdeel, accessoire, ruil of "gezocht"-advertentie past niet.`,
    `Antwoord alleen met JSON: {"past": true of false, "reden": "korte reden"}. Bij twijfel: false.`,
  ].join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": sleutel, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 120, messages: [{ role: "user", content: vraag }] }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const m = String(j.content?.[0]?.text ?? "").match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch {
    return null;
  }
}

/* ---------- 3. In de lus over de zoekresultaten ---------- */
// Na de prijscheck en de moet/niet-check, vóór de deal wordt vastgelegd:
//
//   const vorig = bekend.get(a.id);
//   const sleutelAfgewezen = `${w.id}:${a.id}:${w.notities || ""}`;
//   if (!vorig) {
//     if (afgewezen.has(sleutelAfgewezen)) continue;      // eerder afgekeurd, niet opnieuw betalen
//     const oordeel = await pastBijNotities(w, a);
//     if (oordeel === null) continue;                     // beoordeling mislukt: morgen opnieuw
//     if (!oordeel.past) { afgewezen.add(sleutelAfgewezen); continue; }
//     a.reden = oordeel.reden;
//   }
//
// Bovenaan, na het lezen van de oude deals:
//   const afgewezen = new Set<string>(oud.afgewezen || []);
//
// En bij het wegschrijven van "deals" de lijst meegeven (laatste 500 is genoeg):
//   await schrijf("deals", { items: actueel, afgewezen: [...afgewezen].slice(-500), status: { ... } });
//
// Let op: deals die al in "deals" staan worden niet opnieuw beoordeeld.
// Wil je na het invullen van notities direct een schone lijst: zet "deals" eenmalig op { "items": [] }.
