import React, { useState } from "react";
import { aanmelden, registreren, wachtwoordVergeten } from "./opslag";
import { Knop } from "./ui";

function Invoer({ label, ...rest }) {
  return (
    <label style={{ display: "block" }}>
      <span className="label" style={{ display: "block", marginBottom: 6 }}>{label}</span>
      <input {...rest} style={{ width: "100%", boxSizing: "border-box", height: 52, padding: "0 16px", border: 0, borderRadius: 16, background: "var(--linnen)", outline: "none" }} />
    </label>
  );
}

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
    if (error) zetMelding({ soort: "fout", tekst: vertaal(error.message) });
    else if (modus === "registreren" && !data.session) zetMelding({ soort: "goed", tekst: "Account aangemaakt. Bevestig je adres via de mail die je net kreeg." });
  };

  const herstel = async () => {
    if (!email.trim()) { zetMelding({ soort: "fout", tekst: "Vul eerst je adres in." }); return; }
    const { error } = await wachtwoordVergeten(email.trim());
    zetMelding(error ? { soort: "fout", tekst: vertaal(error.message) } : { soort: "goed", tekst: "Er is een herstelmail onderweg." });
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "calc(env(safe-area-inset-top) + 24px) 20px calc(env(safe-area-inset-bottom) + 24px)", maxWidth: 420, margin: "0 auto", boxSizing: "border-box" }}>
      <h1 className="display" style={{ margin: 0, fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" }}>Ons huis</h1>
      <p style={{ margin: "8px 0 24px", fontSize: 16, lineHeight: 1.5, color: "var(--zacht)" }}>
        {modus === "aanmelden" ? "Meld je aan om jullie lijsten, punten en berichten te zien." : "Maak een account. Daarna deelt de app alles tussen jullie."}
      </p>
      <form className="kaart" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }} onSubmit={(e) => { e.preventDefault(); verstuur(); }}>
        <Invoer label="Mailadres" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => zetEmail(e.target.value)} />
        <Invoer label="Wachtwoord" type="password" autoComplete={modus === "aanmelden" ? "current-password" : "new-password"} value={wachtwoord} onChange={(e) => zetWachtwoord(e.target.value)} />
        <Knop type="submit" disabled={bezig} style={{ width: "100%", marginTop: 4 }}>{bezig ? "Even geduld" : modus === "aanmelden" ? "Aanmelden" : "Account aanmaken"}</Knop>
        {melding && (
          <p role="status" style={{ margin: 0, padding: "12px 14px", borderRadius: 14, fontSize: 15, background: melding.soort === "fout" ? "var(--terra-tint)" : "var(--honing-tint)", color: melding.soort === "fout" ? "var(--terra)" : "var(--honing-tekst)" }}>{melding.tekst}</p>
        )}
      </form>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
        <button type="button" onClick={() => { zetModus(modus === "aanmelden" ? "registreren" : "aanmelden"); zetMelding(null); }}
          style={{ minHeight: 44, border: 0, background: "transparent", color: "var(--ink)", fontSize: 15, fontWeight: 600, textDecoration: "underline" }}>
          {modus === "aanmelden" ? "Nog geen account" : "Ik heb al een account"}
        </button>
        {modus === "aanmelden" && (
          <button type="button" onClick={herstel} style={{ minHeight: 44, border: 0, background: "transparent", color: "var(--zacht)", fontSize: 15, textDecoration: "underline" }}>Wachtwoord vergeten</button>
        )}
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
