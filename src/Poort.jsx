import React, { useEffect, useState } from "react";
import { huidigeSessie, opSessieWijziging } from "./opslag";
import Inlog from "./Inlog.jsx";
import Huishoudapp from "./App.jsx";

// Bewaakt de toegang: zonder geldige sessie zie je alleen het inlogscherm.
export default function Poort() {
  const [sessie, zetSessie] = useState(undefined);

  useEffect(() => {
    huidigeSessie().then((s) => zetSessie(s ?? null));
    return opSessieWijziging((s) => zetSessie(s ?? null));
  }, []);

  if (sessie === undefined) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="display" style={{ fontSize: 22, fontWeight: 700, color: "var(--zacht)" }}>Ons huis</p>
      </div>
    );
  }
  if (!sessie) return <Inlog />;
  return <Huishoudapp gebruiker={sessie.user} key={sessie.user.id} />;
}
