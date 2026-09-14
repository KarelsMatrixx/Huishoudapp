import { createClient } from "@supabase/supabase-js";
import { webcrypto } from "node:crypto";

/* Vast adres voor Meta's WhatsApp-webhook: verandert nooit, dus eenmalig instellen bij Meta.
   GET  = verificatie bij het instellen van de webhook.
   POST = binnenkomend WhatsApp-bericht; wordt weggeschreven naar whatsapp_inkomend. */
export default async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    return afhandelenVerificatie(url);
  }
  if (req.method === "POST") {
    return afhandelenBericht(req);
  }
  return new Response("Methode niet toegestaan", { status: 405 });
};

function afhandelenVerificatie(url) {
  const modus = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const uitdaging = url.searchParams.get("hub.challenge");
  if (modus === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(uitdaging, { status: 200 });
  }
  return new Response("Verificatie mislukt", { status: 403 });
}

async function afhandelenBericht(req) {
  const ruweTekst = await req.text();
  const geldig = await controleerHandtekening(ruweTekst, req.headers.get("x-hub-signature-256"));
  if (!geldig) return new Response("Ongeldige handtekening", { status: 401 });

  const data = JSON.parse(ruweTekst);
  const bericht = haalBerichtEruit(data);
  if (bericht) {
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await db.from("whatsapp_inkomend").insert({
      van: bericht.van,
      tekst: bericht.tekst,
      ruw: data,
    });
    if (error) console.error("Opslaan whatsapp_inkomend mislukt:", error.message);
  }
  return new Response("OK", { status: 200 });
}

function haalBerichtEruit(data) {
  try {
    const verandering = data.entry?.[0]?.changes?.[0]?.value;
    const bericht = verandering?.messages?.[0];
    if (!bericht) return null;
    return { van: bericht.from, tekst: bericht.text?.body || `[${bericht.type}]` };
  } catch {
    return null;
  }
}

async function controleerHandtekening(ruweTekst, header) {
  const geheim = process.env.WHATSAPP_APP_SECRET;
  if (!geheim || !header) return false;
  const encoder = new TextEncoder();
  const sleutel = await webcrypto.subtle.importKey(
    "raw", encoder.encode(geheim), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const handtekening = await webcrypto.subtle.sign("HMAC", sleutel, encoder.encode(ruweTekst));
  const verwacht = "sha256=" + [...new Uint8Array(handtekening)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return timingVeiligGelijk(verwacht, header);
}

function timingVeiligGelijk(a, b) {
  if (a.length !== b.length) return false;
  let verschil = 0;
  for (let i = 0; i < a.length; i++) verschil |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return verschil === 0;
}
