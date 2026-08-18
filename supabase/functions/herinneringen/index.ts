// Supabase Edge Function: verstuurt alle meldingen van de huishoudapp.
// Draait elke 5 minuten via pg_cron (zie schema.sql).
//
// Drie soorten berichten:
//   1. Klusherinnering: de dag ervoor en op de dag zelf, op het ingestelde tijdstip.
//   2. Weekstand: elke zondag om 19:00, met de stand in de maandronde.
//   3. Maanduitslag: de eerste van de maand om 09:00.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

webpush.setVapidDetails(
  "mailto:" + (Deno.env.get("CONTACT_EMAIL") ?? "huis@example.com"),
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

const ZONE = "Europe/Amsterdam";
const VENSTER = 15; // minuten
const STAND_TIJD = "19:00";   // zondagavond
const UITSLAG_TIJD = "09:00"; // eerste van de maand

/* ---------- tijd in Nederland ---------- */
function nuNL() {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false,
  }).formatToParts(new Date());
  const g = (t: string) => f.find((p) => p.type === t)!.value;
  const datum = `${g("year")}-${g("month")}-${g("day")}`;
  const minuten = Number(g("hour")) * 60 + Number(g("minute"));
  const weekdag = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(g("weekday")); // 0 = maandag
  return { datum, minuten, weekdag, dagnummer: Number(g("day")), maand: datum.slice(0, 7) };
}

const naarMinuten = (t: string) => {
  const [u, m] = (t || "19:00").split(":").map(Number);
  return u * 60 + m;
};
const raakt = (nu: number, doel: number) => nu >= doel && nu < doel + VENSTER;
const plusDagen = (datum: string, n: number) => {
  const d = new Date(datum + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const maandagVan = (datum: string) => {
  const d = new Date(datum + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

/* ---------- kluslogica, gelijk aan de app ---------- */
function staatOpen(klus: any, vandaag: string) {
  if (!klus.laatst) return true;
  if (klus.ritme === "eenmalig") return false;
  if (klus.ritme === "dag") return klus.laatst !== vandaag;
  if (klus.ritme === "week") return maandagVan(klus.laatst) !== maandagVan(vandaag);
  return klus.laatst.slice(0, 7) !== vandaag.slice(0, 7);
}

// Op welke datum valt deze klus deze periode?
function vervaldag(klus: any, t: ReturnType<typeof nuNL>): string | null {
  if (klus.ritme === "dag") return t.datum;
  if (klus.ritme === "eenmalig") return klus.dag || null;
  if (klus.ritme === "week") return plusDagen(maandagVan(t.datum), klus.dag ?? 6); // standaard zondag
  const dag = Math.min(klus.dag ?? 1, 28);
  return `${t.maand}-${String(dag).padStart(2, "0")}`;
}

const punten = (klussen: any[], pid: string, maand: string) =>
  klussen.reduce((n, k) => n + (k.geschiedenis || [])
    .filter((g: any) => g.door === pid && String(g.datum).startsWith(maand))
    .reduce((s: number, g: any) => s + (g.punten ?? 1), 0), 0);

/* ---------- versturen ---------- */
async function stuur(abos: any[], bericht: Record<string, string>) {
  let n = 0;
  for (const abo of abos) {
    try {
      await webpush.sendNotification(
        { endpoint: abo.endpoint, keys: { p256dh: abo.p256dh, auth: abo.auth } },
        JSON.stringify(bericht),
      );
      n++;
    } catch (e) {
      const s = String(e);
      if (s.includes("410") || s.includes("404")) {
        await db.from("abonnementen").delete().eq("endpoint", abo.endpoint);
      }
    }
  }
  return n;
}

// true als dit bericht nog niet eerder is verstuurd
async function nieuwBericht(kenmerk: string) {
  const { error } = await db.from("verzonden").insert({ kenmerk });
  return !error;
}

Deno.serve(async () => {
  const t = nuNL();
  const [{ data: rijen }, { data: abos }] = await Promise.all([
    db.from("huis_data").select("sleutel, waarde").in("sleutel", ["klussen", "huisgenoten", "maandrondes", "uitgaand"]),
    db.from("abonnementen").select("*"),
  ]);
  if (!abos?.length) return new Response("geen toestellen aangemeld");

  const pak = (s: string) => rijen?.find((r) => r.sleutel === s)?.waarde;
  const klussen: any[] = pak("klussen") ?? [];
  const personen: any[] = pak("huisgenoten") ?? [];
  const rondes: any = pak("maandrondes") ?? {};
  const uitgaand: any[] = pak("uitgaand") ?? [];
  const logboek: string[] = [];

  /* 0. Directe berichten uit de app: voorstel, geaccepteerd, geweigerd */
  for (const bericht of uitgaand) {
    if (!(await nieuwBericht(`bericht-${bericht.id}`))) continue;
    const doel = bericht.aan === "beide" ? abos : abos.filter((a) => a.persoon === bericht.aan);
    const n = await stuur(doel, { titel: bericht.titel, tekst: bericht.tekst, tag: "klusvoorstel" });
    logboek.push(`bericht: ${n}`);
  }

  /* 1. Klusherinneringen: de dag ervoor en op de dag zelf */
  for (const klus of klussen) {
    if (!klus.tijd || !staatOpen(klus, t.datum)) continue;
    const valt = vervaldag(klus, t);
    if (!valt) continue;

    const soort = valt === t.datum ? "vandaag" : valt === plusDagen(t.datum, 1) ? "morgen" : null;
    if (!soort || !raakt(t.minuten, naarMinuten(klus.tijd))) continue;
    if (!(await nieuwBericht(`${klus.id}-${t.datum}-${soort}`))) continue;

    const naam = personen.find((p) => p.pid === klus.wie)?.naam;
    const doel = klus.wie === "samen" ? abos : abos.filter((a) => a.persoon === klus.wie);
    const n = await stuur(doel.length ? doel : abos, {
      titel: soort === "morgen" ? `Morgen: ${klus.titel}` : klus.titel,
      tekst: soort === "morgen"
        ? `${klus.wie === "samen" ? "Samen" : naam ?? "Jij"} · ${klus.punten ?? 1} punten`
        : `Vandaag aan de beurt · ${klus.punten ?? 1} punten te pakken`,
      tag: `${klus.id}-${soort}`,
    });
    logboek.push(`${klus.titel} (${soort}): ${n}`);
  }

  /* 2. Weekstand, zondagavond */
  if (t.weekdag === 6 && raakt(t.minuten, naarMinuten(STAND_TIJD)) && personen.length === 2) {
    const inzet = rondes[t.maand]?.voorstel?.tekst;
    for (const persoon of personen) {
      if (!(await nieuwBericht(`stand-${t.datum}-${persoon.pid}`))) continue;
      const ander = personen.find((p) => p.pid !== persoon.pid)!;
      const mij = punten(klussen, persoon.pid, t.maand);
      const hem = punten(klussen, ander.pid, t.maand);
      const verschil = Math.abs(mij - hem);
      const titel = mij > hem ? "Ga zo door, je staat voor"
        : mij < hem ? "Let op, je staat achter"
        : "Gelijkspel";
      const tekst = mij === hem
        ? `Allebei ${mij} punten.${inzet ? ` Inzet: ${inzet}` : ""}`
        : `${verschil} punten ${mij > hem ? "voorsprong op" : "achterstand op"} ${ander.naam}.${inzet ? ` Inzet: ${inzet}` : ""}`;
      const n = await stuur(abos.filter((a) => a.persoon === persoon.pid), { titel, tekst, tag: "stand" });
      logboek.push(`stand ${persoon.naam}: ${n}`);
    }
  }

  /* 3. Uitslag, eerste van de maand */
  if (t.dagnummer === 1 && raakt(t.minuten, naarMinuten(UITSLAG_TIJD)) && personen.length === 2) {
    const vorige = plusDagen(t.datum, -1).slice(0, 7);
    if (await nieuwBericht(`uitslag-${vorige}`)) {
      const a = punten(klussen, personen[0].pid, vorige);
      const b = punten(klussen, personen[1].pid, vorige);
      const inzet = rondes[vorige]?.voorstel?.tekst;
      const bericht = a === b
        ? { titel: "Gelijkspel", tekst: `Allebei ${a} punten. De inzet vervalt.`, tag: "uitslag" }
        : {
            titel: `${personen[a > b ? 0 : 1].naam} wint de maand`,
            tekst: `${a} tegen ${b}. ${personen[a > b ? 1 : 0].naam} doet: ${inzet ?? "de afgesproken inzet"}`,
            tag: "uitslag",
          };
      const n = await stuur(abos, bericht);
      logboek.push(`uitslag ${vorige}: ${n}`);
    }
  }

  return new Response(
    `${t.datum} ${Math.floor(t.minuten / 60)}:${String(t.minuten % 60).padStart(2, "0")} · ` +
    (logboek.length ? logboek.join(" | ") : "niets te versturen"),
  );
});
