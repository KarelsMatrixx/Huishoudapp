import React, { useState } from "react";
import { aanmelden, registreren, wachtwoordVergeten } from "./opslag";

const INK = "#16241F";
const ZACHT = "#5C6B64";
const PAPIER = "#EDF0EA";
const KAART = "#FFFFFF";
const LIJN = "#DCE2D9";
const GEEL = "#E8B33D";
const DISPLAY = "'Bricolage Grotesque', 'Trebuchet MS', sans-serif";
const BODY = "'Instrument Sans', system-ui, sans-serif";
const MONO = "'Space Mono', ui-monospace, monospace";

export default function Inlog() {
  const [modus, zetModus] = useState("aanmelden");
  const [email, zetEmail] = useState("");
  const [wachtwoord, zetWachtwoord] = useState("");
  const [bezig, zetBezig] = useState(false);
  const [melding, zetMelding] = useState(null);

  const verstuur = async () => {
    if (!email.trim() || wachtwoord.length < 8) {
      zetMelding({ soort: "fout", tekst: "Vul een adres in en een wachtwoord van minstens acht tekens." });
      return;
    }
    zetBezig(true);
    zetMelding(null);
    const { error, data } = modus === "aanmelden"
      ? await aanmelden(email.trim(), wachtwoord)
      : await registreren(email.trim(), wachtwoord);
    zetBezig(false);

    if (error) {
      zetMelding({ soort: "fout", tekst: vertaal(error.message) });
    } else if (modus === "registreren" && !data.session) {
      zetMelding({ soort: "goed", tekst: "Account aangemaakt. Bevestig je adres via de mail die je net kreeg." });
    }
  };

  const herstel = async () => {
    if (!email.trim()) {
      zetMelding({ soort: "fout", tekst: "Vul eerst je adres in." });
      return;
    }
    const { error } = await wachtwoordVergeten(email.trim());
    zetMelding(error
      ? { soort: "fout", tekst: vertaal(error.message) }
      : { soort: "goed", tekst: "Er is een herstelmail onderweg." });
  };

  return (
    <div className="flex min-h-screen flex-col justify-center p-6" style={{ background: PAPIER, fontFamily: BODY }}>
      <div className="mx-auto w-full" style={{ maxWidth: 380 }}>
        <h1 className="text-4xl leading-tight" style={{ fontFamily: DISPLAY, fontWeight: 800, color: INK }}>Ons huis</h1>
        <p className="mt-2 mb-6 text-sm" style={{ color: ZACHT }}>
          {modus === "aanmelden"
            ? "Meld je aan om jullie lijsten, punten en berichten te zien."
            : "Maak een account. Doe dit allebei een keer, daarna deelt de app alles tussen jullie."}
        </p>

        <div className="rounded-2xl p-4" style={{ background: KAART, border: `1px solid ${LIJN}` }}>
          <label className="text-xs uppercase tracking-widest" style={{ fontFamily: MONO, color: ZACHT }}>mailadres</label>
          <input type="email" autoComplete="email" value={email} onChange={(e) => zetEmail(e.target.value)}
            className="mt-1 mb-3 w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: PAPIER, border: `1px solid ${LIJN}`, color: INK }} />

          <label className="text-xs uppercase tracking-widest" style={{ fontFamily: MONO, color: ZACHT }}>wachtwoord</label>
          <input type="password" autoComplete={modus === "aanmelden" ? "current-password" : "new-password"}
            value={wachtwoord} onChange={(e) => zetWachtwoord(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") verstuur(); }}
            className="mt-1 w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: PAPIER, border: `1px solid ${LIJN}`, color: INK }} />

          <button onClick={verstuur} disabled={bezig}
            className="mt-4 w-full rounded-full py-3 text-sm font-semibold"
            style={{ background: bezig ? ZACHT : INK, color: "#fff" }}>
            {bezig ? "Even geduld" : modus === "aanmelden" ? "Aanmelden" : "Account aanmaken"}
          </button>

          {melding && (
            <p className="mt-3 rounded-xl px-3 py-2 text-sm"
              style={{ background: melding.soort === "fout" ? "#F7E4E9" : GEEL, color: INK }}>
              {melding.tekst}
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-between text-xs">
          <button onClick={() => { zetModus(modus === "aanmelden" ? "registreren" : "aanmelden"); zetMelding(null); }}
            style={{ color: INK, textDecoration: "underline" }}>
            {modus === "aanmelden" ? "Nog geen account" : "Ik heb al een account"}
          </button>
          {modus === "aanmelden" && (
            <button onClick={herstel} style={{ color: ZACHT, textDecoration: "underline" }}>Wachtwoord vergeten</button>
          )}
        </div>
      </div>
    </div>
  );
}

function vertaal(bericht) {
  const b = bericht.toLowerCase();
  if (b.includes("invalid login")) return "Dat adres en wachtwoord horen niet bij elkaar.";
  if (b.includes("already registered")) return "Dit adres heeft al een account. Meld je aan.";
  if (b.includes("email not confirmed")) return "Bevestig eerst je adres via de mail die je kreeg.";
  if (b.includes("signups not allowed")) return "Registreren staat uit. Vraag of de andere bewoner het weer aanzet.";
  return bericht;
}
