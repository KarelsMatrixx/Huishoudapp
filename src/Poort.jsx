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
      <div className="flex h-screen items-center justify-center"
        style={{ background: "#EDF0EA", color: "#5C6B64", fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
        Even laden…
      </div>
    );
  }
  if (!sessie) return <Inlog />;
  return <Huishoudapp gebruiker={sessie.user} key={sessie.user.id} />;
}
