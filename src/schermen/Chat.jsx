import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Avatar, kleurVan } from "../ui";
import { id, lokaal, sleutelVan, vanSleutel, DAGEN, MAANDEN } from "../logica";
import { BALK_ONDER } from "./Lijsten";

export function ongelezen(chat, ik) {
  const gelezen = lokaal("chat-gelezen") || 0;
  return chat.filter((b) => b.door !== ik.pid && b.moment > gelezen).length;
}

function dagLabel(moment) {
  const d = new Date(moment);
  const nu = new Date();
  if (sleutelVan(d) === sleutelVan(nu)) return "Vandaag";
  const gister = new Date(nu); gister.setDate(nu.getDate() - 1);
  if (sleutelVan(d) === sleutelVan(gister)) return "Gisteren";
  return `${DAGEN[(d.getDay() + 6) % 7]} ${d.getDate()} ${MAANDEN[d.getMonth()]}`;
}

export default function Chat({ chat, zetChat, ik, personen, meld }) {
  const [tekst, zetTekst] = useState("");
  const onder = useRef(null);
  const ander = personen.find((p) => p.pid !== ik.pid);

  useEffect(() => {
    onder.current?.scrollIntoView({ block: "end" });
    lokaal("chat-gelezen", Date.now());
  }, [chat.length]);

  const versturen = () => {
    if (!tekst.trim()) return;
    zetChat([...chat, { id: id(), door: ik.pid, tekst: tekst.trim(), moment: Date.now() }].slice(-200));
    if (ander) meld(ander.pid, ik.naam, tekst.trim());
    zetTekst("");
  };

  let vorigeDag = null;
  return (
    <>
      <header style={{ position: "sticky", top: 0, zIndex: 5, padding: "calc(env(safe-area-inset-top) + 10px) 20px 12px", display: "flex", alignItems: "center", gap: 12, background: "var(--bg)" }}>
        {ander && <Avatar persoon={ander} personen={personen} maat={40} rand={2.5} />}
        <h1 className="display" style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{ander ? ander.naam : "Chat"}</h1>
      </header>

      <div style={{ padding: "4px 16px 84px", display: "flex", flexDirection: "column", gap: 6 }}>
        {chat.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--zacht)", fontSize: 15, marginTop: 40 }}>Nog geen berichten. Begin het gesprek.</p>
        )}
        {chat.map((b) => {
          const vanMij = b.door === ik.pid;
          const dag = dagLabel(b.moment);
          const nieuweDag = dag !== vorigeDag;
          vorigeDag = dag;
          return (
            <React.Fragment key={b.id}>
              {nieuweDag && <p className="label" style={{ textAlign: "center", margin: "12px 0 4px" }}>{dag}</p>}
              <div style={{ display: "flex", justifyContent: vanMij ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "78%", padding: "9px 13px", borderRadius: vanMij ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
                  background: vanMij ? kleurVan(personen, b.door) : "var(--kaart)", color: vanMij ? "var(--op-kleur)" : "var(--ink)",
                  border: vanMij ? 0 : "1px solid var(--kaartrand)", boxShadow: vanMij ? "none" : "var(--schaduw)" }}>
                  <p style={{ margin: 0, fontSize: 16, lineHeight: 1.4, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{b.tekst}</p>
                  <p className="cijfers" style={{ margin: "3px 0 0", fontSize: 11, textAlign: "right", opacity: 0.7 }}>
                    {new Date(b.moment).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={onder} />
      </div>

      <div style={{ position: "fixed", left: 14, right: 14, bottom: `calc(${BALK_ONDER} + 76px)`, zIndex: 30, maxWidth: 532, margin: "0 auto" }}>
        <div style={{ minHeight: 56, borderRadius: 20, background: "var(--kaart)", border: "1px solid var(--kaartrand)", boxShadow: "0 8px 28px rgba(43,36,32,0.16)", display: "flex", alignItems: "center", gap: 8, padding: "0 8px 0 16px" }}>
          <label style={{ flex: 1, display: "flex" }}>
            <span className="alleen-lezer">Bericht</span>
            <input value={tekst} onChange={(e) => zetTekst(e.target.value)} placeholder={ander ? `Bericht aan ${ander.naam}` : "Bericht"} enterKeyHint="send"
              onKeyDown={(e) => { if (e.key === "Enter") versturen(); }} style={{ width: "100%", border: 0, background: "transparent", outline: "none" }} />
          </label>
          <button type="button" aria-label="Versturen" onClick={versturen} className="druk"
            style={{ width: 40, height: 40, flex: "none", border: 0, borderRadius: 13, background: tekst.trim() ? "var(--knop)" : "var(--linnen)", color: tekst.trim() ? "var(--knop-tekst)" : "var(--zacht)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
