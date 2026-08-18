# Ons huis · installatie

Ongeveer 30 minuten werk, eenmalig. Daarna staat de app op jullie beginscherm en krijgen jullie meldingen.

## Stap 1 · Supabase (gedeelde gegevens)

1. Maak een gratis account op supabase.com en maak een nieuw project. Kies regio Frankfurt.
2. Ga naar **SQL Editor**, plak de inhoud van `supabase/schema.sql` en voer die uit. Pas eerst onderaan `JOUWPROJECT` en `JOUW_SERVICE_ROLE_KEY` aan.
3. Ga naar **Project Settings > API** en noteer de **Project URL** en de **anon public key**.
4. Ga naar **Authentication > Providers** en zorg dat **Email** aan staat.
5. Wil je geen bevestigingsmail? Zet onder **Authentication > Sign In / Providers** de optie **Confirm email** uit. Handig bij twee gebruikers.

## Stap 2 · Sleutels voor meldingen

Draai op je eigen computer:

```
npx web-push generate-vapid-keys
```

Je krijgt een publieke en een prive sleutel. Bewaar ze.

## Stap 3 · Configuratie invullen

Open `src/config.js` en vul in:

| Veld | Waar vandaan |
|---|---|
| supabaseUrl | Supabase, Project URL |
| supabaseAnonKey | Supabase, anon public key |
| vapidPublicKey | de publieke sleutel uit stap 2 |

## Stap 4 · Meldingsfunctie plaatsen

```
npm install -g supabase
supabase login
supabase link --project-ref pprrkmbvzklxhydejrby
supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... CONTACT_EMAIL=jouw@mail.nl
supabase functions deploy herinneringen
```

De cron uit stap 1 roept deze functie elke 15 minuten aan. Staat een klus open en is het tijdstip bereikt, dan gaat de melding naar de telefoon van degene die aan de beurt is. Bij "samen" krijgen jullie hem allebei.

## Stap 5 · Website publiceren

1. Maak een repository op GitHub en upload alle bestanden uit deze map (zonder `node_modules` en `dist`).
2. Ga naar **Settings > Pages** en zet **Source** op **GitHub Actions**.
3. Bij elke wijziging bouwt en publiceert GitHub de site automatisch. Het adres is `https://JOUWNAAM.github.io/JOUWREPO/`.

## Stap 6 · Op je iPhone zetten

1. Open het adres in **Safari** (dit werkt niet in Chrome op iOS).
2. Tik op het deelicoon en kies **Zet op beginscherm**.
3. Open de app via het nieuwe icoon, niet via Safari.
4. Tik rechtsboven op het belletje en sta meldingen toe.

Marly doet hetzelfde op haar telefoon en kiest bij het openen haar eigen naam.

Vereist iOS 16.4 of hoger. Meldingen werken alleen vanaf het beginscherm, niet vanuit de browser.

## Stap 7 · Meldingen instellen per klus

Ga in de app naar **Klussen** en geef elke klus een ritme, een dag en een tijd.

| Ritme | Wat je kiest | Wanneer de meldingen komen |
|---|---|---|
| elke dag | alleen een tijd | elke dag op dat tijdstip |
| elke week | dag van de week plus tijd | de dag ervoor en op de dag zelf |
| elke maand | dag van de maand plus tijd | de dag ervoor en op de dag zelf |
| eenmalig | datum plus tijd | de dag ervoor en op de dag zelf |

Tijd leeghalen betekent geen melding. Een klus die al afgevinkt is, geeft geen herinnering meer.

Vaste berichten daarnaast:

- **Zondag 19:00**: de stand in de maandronde. Wie voorstaat krijgt "Ga zo door, je staat voor", wie achterloopt krijgt "Let op, je staat achter", met het puntenverschil en de inzet erbij.
- **Eerste van de maand 09:00**: de uitslag. Wie won, wat de eindstand was en wie de inzet moet uitvoeren.

Die tijdstippen pas je aan bovenin `supabase/functions/herinneringen/index.ts` bij `STAND_TIJD` en `UITSLAG_TIJD`.


## Hoe klussen worden goedgekeurd

Elke nieuwe klus gaat eerst naar de ander. Die krijgt een melding en ziet de klus bovenaan het klussenscherm staan onder **Ter goedkeuring**.

| Wat je doet | Wat de ander krijgt | Wat er daarna gebeurt |
|---|---|---|
| Klus voor de ander aanmaken | "Jan stelt een klus voor · 3 punten. Accepteren of weigeren?" | Bij accepteren komt de klus in de lijst van de ander. Bij weigeren verdwijnt hij en krijg jij bericht |
| Klus voor jezelf aanmaken | "Punten goedkeuren · Jan wil 3 punten voor: ramen lappen" | Pas na goedkeuring telt de klus mee voor punten |
| Klus voor samen aanmaken | "Nieuwe klus voor samen · Ga je akkoord?" | Idem |

De goedkeurder kan de punten aanpassen voordat hij accepteert: tik op de gele puntenknop. Zolang er niet is gereageerd, staat de klus bij de indiener onder **Wacht op** en kan die hem intrekken.

De meldingsfunctie draait elke vijf minuten, dus een voorstel komt binnen enkele minuten binnen.


## Profiel, chat en maaltijdvoorstellen

**Profielfoto.** Bij het aanmelden tik je op de cirkel om een foto te maken. Later wijzig je hem door in de kop van de app op je eigen rondje te tikken. De foto wordt verkleind naar 160 pixels en bij de gedeelde gegevens opgeslagen, zodat jullie elkaars foto zien. Bij elke klus staat linksonder op het vinkvakje het rondje van degene die aan de beurt is. Bij samen staat er een paars rondje met een 2.

**Elkaars taken.** Onder het invoerblok staan drie knoppen: alles, jouw naam en de naam van de ander. Zo zie je precies wat bij wie ligt.

**Subtaken.** Tik een klus open. Daar voeg je stappen toe, bijvoorbeeld bij grote schoonmaak: ramen, stofzuigen, dweilen. In de regel zie je de voortgang als 2/3 stappen. De punten gaan pas mee als je de klus zelf afvinkt, niet per stap.

**Maaltijdvoorstellen.** Vul je een gerecht in bij het weekmenu, dan gaat dat als voorstel naar de ander, met melding. Die kiest **Lekker** of **Liever niet**. Bij afwijzing verdwijnt het gerecht en krijg jij bericht. Pas na akkoord kun je de ingredienten op de boodschappenlijst zetten, en de ander krijgt daar ook een melding van.

**Chat.** De ronde knop rechtsonder opent het gesprek met de ander. Elk bericht stuurt een pushmelding met de naam van de afzender. De laatste 200 berichten blijven bewaard.


## Accounts en toegang

De app opent met een inlogscherm. Zo zetten jullie het op:

1. Jij maakt een account met je mailadres en een wachtwoord van minstens acht tekens.
2. Je vult je naam in en maakt een foto. Je profiel hangt vanaf dat moment aan je account.
3. Marly maakt op haar telefoon een eigen account en kiest daarna haar eigen profiel.
4. Als jullie er allebei in staan: ga in Supabase naar **Authentication > Sign In / Providers** en zet **Allow new users to sign up** uit. Dan kan niemand anders er meer bij.

Wat waar staat:

| Gegevens | Wie kan erbij |
|---|---|
| Boodschappen, klussen, weekmenu, wensen, maandronde, chat | jullie allebei, alleen ingelogd |
| Je eigen lijst onder "alleen voor jou" | alleen jouw account, ook op een nieuwe telefoon |
| Meldingsabonnement van je toestel | alleen jouw account |

Wachtwoord kwijt? Tik op **Wachtwoord vergeten** in het inlogscherm. Afmelden doe je met het knopje rechtsboven in de app.

## Beveiliging

De app zit achter een inlog en de database geeft alleen toegang aan ingelogde accounts. De anon sleutel in de code is bedoeld om openbaar te zijn: zonder geldig account levert die niets op.

Twee dingen die je zelf moet doen:

- Zet registreren uit zodra jullie er allebei in staan.
- Kies wachtwoorden die jullie nergens anders gebruiken.

Berichten in de chat staan onversleuteld in de database. Jullie kunnen erbij en de beheerder van het Supabase project ook, dus jij. Voor gewone huishoudberichten prima, maar behandel het niet als een kluis.

## Onderhoud

- Nieuwe functie nodig? Pas `src/App.jsx` aan en push naar GitHub, de site werkt zichzelf bij.
- Werken meldingen niet? Kijk in Supabase bij **Edge Functions > Logs** wat de functie teruggeeft.
