import { createClient } from "@supabase/supabase-js";
import { CONFIG } from "./config";

export const db = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

/* ---------- accounts ---------- */
export async function huidigeSessie() {
  const { data } = await db.auth.getSession();
  return data.session;
}
export function opSessieWijziging(terug) {
  const { data } = db.auth.onAuthStateChange((_gebeurtenis, sessie) => terug(sessie));
  return () => data.subscription.unsubscribe();
}
export const registreren = (email, wachtwoord) => db.auth.signUp({ email, password: wachtwoord });
export const aanmelden = (email, wachtwoord) => db.auth.signInWithPassword({ email, password: wachtwoord });
export const afmelden = () => db.auth.signOut();
export const wachtwoordVergeten = (email) =>
  db.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });

async function gebruikerId() {
  const { data } = await db.auth.getUser();
  return data.user?.id ?? null;
}

/* ---------- gegevens ----------
   gedeeld = true  : huis_data, zichtbaar voor jullie allebei
   gedeeld = false : prive_data, alleen voor het eigen account          */

export async function laad(sleutel, gedeeld) {
  if (gedeeld) {
    const { data, error } = await db.from("huis_data").select("waarde").eq("sleutel", sleutel).maybeSingle();
    if (error) { console.warn("Laden mislukt:", error.message); return null; }
    return data ? data.waarde : null;
  }
  const uid = await gebruikerId();
  if (!uid) return null;
  const { data, error } = await db.from("prive_data")
    .select("waarde").eq("gebruiker", uid).eq("sleutel", sleutel).maybeSingle();
  if (error) { console.warn("Laden mislukt:", error.message); return null; }
  return data ? data.waarde : null;
}

export async function bewaar(sleutel, waarde, gedeeld) {
  if (gedeeld) {
    const { error } = await db.from("huis_data")
      .upsert({ sleutel, waarde, bijgewerkt: new Date().toISOString() }, { onConflict: "sleutel" });
    if (error) console.warn("Opslaan mislukt:", error.message);
    return;
  }
  const uid = await gebruikerId();
  if (!uid) return;
  const { error } = await db.from("prive_data")
    .upsert({ gebruiker: uid, sleutel, waarde }, { onConflict: "gebruiker,sleutel" });
  if (error) console.warn("Opslaan mislukt:", error.message);
}

/* Live meeluisteren: zodra de ander iets wijzigt, haalt dit toestel opnieuw op. */
export function luister(opWijziging) {
  const kanaal = db.channel("huis")
    .on("postgres_changes", { event: "*", schema: "public", table: "huis_data" }, () => opWijziging())
    .subscribe();
  return () => db.removeChannel(kanaal);
}

/* ---------- meldingen ---------- */
export function meldingStand() {
  if (typeof Notification === "undefined") return "kan niet";
  return Notification.permission === "granted" ? "aan" : "uit";
}

function naarBytes(base64) {
  const net = base64.replace(/-/g, "+").replace(/_/g, "/");
  const vul = "=".repeat((4 - (net.length % 4)) % 4);
  const ruw = atob(net + vul);
  return Uint8Array.from([...ruw].map((c) => c.charCodeAt(0)));
}

export async function meldingenAanzetten(persoonId) {
  if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) {
    alert("Meldingen werken alleen als je deze app op je beginscherm zet.");
    return "kan niet";
  }
  const toestemming = await Notification.requestPermission();
  if (toestemming !== "granted") return "uit";

  const sw = await navigator.serviceWorker.ready;
  let abo = await sw.pushManager.getSubscription();
  if (!abo) {
    abo = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: naarBytes(CONFIG.vapidPublicKey),
    });
  }
  const j = abo.toJSON();
  await db.from("abonnementen").upsert({
    endpoint: j.endpoint,
    p256dh: j.keys.p256dh,
    auth: j.keys.auth,
    persoon: persoonId,
    gebruiker: await gebruikerId(),
  }, { onConflict: "endpoint" });

  return "aan";
}
