# Tatovør

En app der samler tatovører og studier ét sted, så man kan finde den artist der passer
til sin idé — ud fra portfolio, anmeldelser og pris — og sende en anmodning på en ledig tid.
Kunde og tatovør kan skrive sammen om anmodningen, og når tatoveringen er lavet, kan kunden
skrive en anmeldelse. Tatovørerne har deres egen side med indbakke, kalender og portfolio.
React Native med Expo, bygget efter samme opskrift som øvelserne i INNT (01–09).

Navne, priser og de første anmeldelser i appen er opdigtede.

## Kom i gang

```bash
npm install
npx expo install --fix
npx expo start
```

Scan QR-koden med Expo Go. På eduroam: `npx expo start --tunnel`.

`npx expo install --fix` retter versionerne på de nye pakker (`expo-image-picker` og
`expo-file-system`), så de passer til jeres Expo SDK.

**Appen kræver ikke Firebase lige nu.** Alt gemmes på telefonen med AsyncStorage
(se *Lagring* herunder). Når I er klar til Firebase, står det under *Skift til Firebase*.

### Prøv begge sider

Fordi alt ligger på telefonen, testes kunde og tatovør på **samme telefon**:

1. **Gæst:** åbn appen. Du kan se tatovører, priser, portfolio, anmeldelser og kort uden at logge ind.
2. **Kunde:** udfyld en anmodning til fx Freja og tryk *Log ind og send anmodning*. Opret en bruger — anmodningen sendes med det samme.
3. Skriv en besked til Freja fra *Bookinger*.
4. Log ud under *Konto*, og opret en ny bruger med **Jeg er tatovør** › Freja Bang.
5. **Tatovør:** anmodningen ligger i indbakken (med en prik for den nye besked). Svar på beskeden, og godkend tiden.
6. Under *Profil* kan Freja lægge billeder i sin portfolio og markere dem som helet.
7. Åbn anmodningen igen og tryk *Markér som gennemført*. Log ind som kunden igen — nu kan kunden skrive en anmeldelse under *Bookinger › Tidligere*.

*Konto › Nulstil testdata* sletter alt på telefonen, så man kan starte forfra før en ny testperson.

## Hvad appen kan

**For kunder** — det hele kan ses uden login

- **Udforsk:** filtrér på stilart, og se listen med det bedste match øverst.
- **Profiler** med vurdering, stilarter, tatovørens egne portfolio-billeder (helede er markeret), anmeldelser og et prisestimat for hver størrelse.
- **Kort** over studierne. *Find nærmeste tatovør* finder din position, regner afstanden ud til hvert studie og viser det nærmeste.
- **Send en anmodning:** vælg stilart, størrelse og placering, beskriv motivet, tilføj referencebilleder fra kameraet eller galleriet, og vælg tid. Er man ikke logget ind, bliver man bedt om det, når man sender — det udfyldte bliver gemt imens.
- **Beskeder** til tatovøren om netop den anmodning. Nye beskeder giver en prik og et tal på fanen.
- **Mine bookinger** med status. Når tatovøren svarer, skifter status med det samme.
- **Anmeldelser:** når tatoveringen er lavet, kan man give 1–5 stjerner og skrive en anmeldelse. Den får mærket *Booket gennem appen* og tæller med i tatovørens vurdering.
- **Påmindelser** aftenen før og en time før, så snart tatovøren har godkendt tiden.
- **Ingen dobbeltbookinger:** tider som andre har booket, bliver grå i tidsvælgeren med det samme.

**For tatovører** — vælg *Jeg er tatovør*, når du opretter dig

- **Indbakke** med nye anmodninger øverst og et tal på fanen (nye anmodninger og nye beskeder).
- **Svar på en anmodning:** se motiv, referencebilleder, stilart, størrelse, placering og prisestimat. Skriv til kunden, hvis der mangler noget. Godkend eller afvis.
- **Aflys** en bekræftet tid, eller **markér den som gennemført**, så kunden kan anmelde.
- **Kalender** for de næste 14 dage.
- **Profil:** læg billeder i portfolioen med kameraet eller fra galleriet, skriv en kort tekst, markér helede tatoveringer, se dine anmeldelser, og se profilen som kunderne ser den.

## Fra spørgeskemaet

31 svar (22 kunder og 9 tatovører) i november 2026.

| Hvad svarene viste | Hvad det betyder i appen |
|---|---|
| Stil og portfolio er det vigtigste for kunderne (4,1 ud af 5), og det sværeste var at finde en tatovør, hvis stil passer (10 af 22) | Tatovøren lægger selv billeder op, og de nyeste vises allerede på listen på forsiden |
| En kunde ville se tatoveringerne efter heling, fordi det siger mest om kvaliteten | Billeder kan markeres som *helet* og får et mærke |
| Anmeldelser er vigtige for kunderne (3,9), men en tatovør mente at Google-anmeldelser er mere troværdige | Man kan kun anmelde efter en gennemført booking, én gang, og anmeldelsen er mærket *Booket gennem appen* |
| 16 af 22 ville have gavn af et prisestimat, og "hvad koster det" var den tredje største udfordring | Prisestimatet fra brugertesten er bevaret på profilen og i anmodningen |
| Tatovørerne vil især have færre beskeder frem og tilbage (5 af 9). En kunde skal kunne tale med tatovøren, før hun booker | Beskeder hører til en anmodning — ingen åben chat, alt om motiv, pris og tid står ét sted |
| Afstand betyder ikke ret meget (1,9 ud af 5) | *Nærmeste tatovør* er et værktøj på kortet; forsiden sorterer stadig efter match |
| Flere tatovører foretrækker systemer, hvor kunden ikke skal have login ("plug'n'play") | Man kan se alt som gæst og skal først logge ind, når man sender en anmodning |

## Lagring

Lige nu gemmes alt på telefonen med **AsyncStorage**, som i skoleprojektet.
`database/lokalDatabase.js` og `database/lokalLogin.js` har de samme funktioner som Firebase
(`ref`, `get`, `set`, `update`, `push`, `onValue`, `createUserWithEmailAndPassword` osv.)
og de samme stier. Skærmene importerer kun fra `database/db.js`, så de ved ikke, om data
ligger på telefonen eller i Firebase.

Det betyder, at kunder og tatovører kun kan se hinandens bookinger og beskeder, hvis de
bruger den samme telefon. Til en test med rigtige brugere på hver deres telefon skal Firebase på.

## Skift til Firebase

1. Opret et projekt på [console.firebase.google.com](https://console.firebase.google.com). Slå Analytics fra.
2. Tilføj en web-app (`</>`-ikonet) og kopiér `firebaseConfig`.
3. **Build › Realtime Database › Create database** › Belgium (europe-west1) › Test mode. Kopiér URL'en.
4. **Build › Authentication › Get started › Sign-in method** › slå **Email/Password** til.
5. Sæt config og URL ind i `database/firebase.js`.
6. I `database/db.js`: sæt `//` foran de to linjer under *Lokalt*, fjern `//` foran de tre under *Firebase*, og sæt `BRUGER_FIREBASE` til `true`.
7. Sæt reglerne herunder ind under **Realtime Database › Rules**.

**Billeder** (portfolio og referencebilleder) ligger stadig kun på den telefon, de er taget på.
For at andre kan se dem, skal de uploades til **Firebase Storage** og gemmes som en download-URL
i stedet for en sti på telefonen. Det er det næste skridt efter Firebase.

### Regler til databasen

Hver bruger ser kun sine egne data, en tatovør kun sine egne anmodninger, kun de to i en
booking kan læse samtalen, og man kan kun anmelde en booking, man selv har haft.
Portfolio, anmeldelser og optagede tider kan læses af alle, så gæster kan se dem.

```json
{
  "rules": {
    "Brugere": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "Bookinger": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid",
        "$bookingId": {
          ".write": "auth != null && data.exists() && newData.exists() && root.child('Brugere').child(auth.uid).child('udbyderId').val() === data.child('udbyderId').val()"
        }
      }
    },
    "Anmodninger": {
      "$udbyderId": {
        ".read": "auth != null && root.child('Brugere').child(auth.uid).child('udbyderId').val() === $udbyderId",
        "$bookingId": {
          ".write": "auth != null && (root.child('Brugere').child(auth.uid).child('udbyderId').val() === $udbyderId || newData.child('kundeUid').val() === auth.uid)"
        }
      }
    },
    "Optaget": {
      ".read": true,
      "$udbyderId": {
        "$dato": {
          "$tid": {
            ".write": "auth != null && ((!data.exists() && newData.val() === auth.uid) || data.val() === auth.uid || root.child('Brugere').child(auth.uid).child('udbyderId').val() === $udbyderId)"
          }
        }
      }
    },
    "Samtaler": {
      "$bookingId": {
        ".read": "auth != null && (data.child('kundeUid').val() === auth.uid || root.child('Brugere').child(auth.uid).child('udbyderId').val() === data.child('udbyderId').val())",
        ".write": "auth != null && (data.child('kundeUid').val() === auth.uid || (!data.exists() && newData.child('kundeUid').val() === auth.uid) || root.child('Brugere').child(auth.uid).child('udbyderId').val() === data.child('udbyderId').val())",
        "kundeUid": { ".validate": "!data.exists() || data.val() === newData.val()" },
        "udbyderId": { ".validate": "!data.exists() || data.val() === newData.val()" }
      }
    },
    "Anmeldelser": {
      ".read": true,
      "$udbyderId": {
        "$bookingId": {
          ".write": "auth != null && !data.exists() && newData.child('kundeUid').val() === auth.uid && root.child('Bookinger').child(auth.uid).child($bookingId).child('udbyderId').val() === $udbyderId && (root.child('Bookinger').child(auth.uid).child($bookingId).child('status').val() === 'gennemfoert' || root.child('Bookinger').child(auth.uid).child($bookingId).child('status').val() === 'bekraeftet')"
        }
      }
    },
    "Portfolio": {
      ".read": true,
      "$udbyderId": {
        ".write": "auth != null && root.child('Brugere').child(auth.uid).child('udbyderId').val() === $udbyderId"
      }
    }
  }
}
```

## Hvor kursets emner er brugt

| Øvelse | Hvor i appen |
|---|---|
| 01 Komponenter | Genbrugte komponenter med props i `components/` — fx `Knap`, `Chip`, `Stjerner`, `PortfolioGitter` |
| 02 Navigation | `App.js`: faner (bottom-tabs) med en stack inde i hver, og data mellem skærme med `route.params` |
| 03 Lister | `FlatList` på forsiden, i anmeldelser, i bookinger, i indbakken og i beskederne |
| 04 Styling | Al styling i `styles/GlobalStyle.js`, faneikoner valgt ud fra rutens navn |
| 05 Firebase | Samme funktioner og stier som Realtime Database (`onValue`, `push`, `update` på flere stier) — lige nu med den lokale udgave i `database/lokalDatabase.js` |
| 06 Firebase Login | Samme login-funktioner (`createUserWithEmailAndPassword`, `onAuthStateChanged`, `signOut`) i `database/lokalLogin.js`. Rollen (kunde/tatovør) afgør hvilke faner man ser |
| 07 Kamera | `components/KameraComponent.js` til referencebilleder og portfolio |
| 08 Maps | `screens/KortScreen.js` · `MapView` med `Marker` for hvert studie · `expo-location` til egen position |
| 09 Notifikationer | `components/Notifikationer.js` · besked når tatovøren svarer eller markerer tiden som gennemført, og når der kommer en ny anmodning |

**Fra skoleprojektet (godkendelsesopgave 2):** lagring med AsyncStorage, og afstanden til
det nærmeste studie med haversine-formlen (`afstandKm` i `data/hjaelpere.js`).

## Rettet efter brugertesten

| Hvad brugerne sagde | Hvad der er ændret |
|---|---|
| Bookingknappen reagerede ikke, hvis man manglede at udfylde noget | Knappen er grå og inaktiv, og teksten under den siger præcis hvad der mangler (også i login og anmeldelser) |
| Vurderingen var utydelig | Guldstjerner, fedt tal og antal anmeldelser på alle kort og profiler |
| Fonten i beskrivelsen var svær at læse | Brødtekst er større (16) og mørkere |
| Man kunne ikke vælge stilart | Stilart vælges som det første, når man booker en tatovering |
| Der manglede billeder af tidligere arbejde | Tatovøren lægger selv sine billeder op |
| "Fra 1.000 kr" var ikke nok | Prisestimat for hver størrelse, beregnet ud fra tatovørens timepris |
| Der manglede en oversigt over bookinger | Fanen Bookinger |
| Folk gav op i søgningen, fordi der var for mange at vælge imellem | Søgning og liste er på samme skærm, sorteret med det bedste match øverst |

## Sådan er koden bygget op

```
App.js                       faner for gæst/kunde og for tatovør, notifikations-handler
database/db.js               ÉT sted der bestemmer: data på telefonen eller i Firebase
database/lokalDatabase.js    database på telefonen (AsyncStorage), samme funktioner som Firebase
database/lokalLogin.js       login på telefonen, samme funktioner som Firebase Auth
database/firebase.js         Firebase-opsætning — bruges, når I skifter
database/hooks.js            useBruger, useAppAnmeldelser, usePortfolio, useUlaeste
database/bookinger.js        opret, afbestil og svar på bookinger + lyttere til notifikationer
database/beskeder.js         send besked, markér som læst
database/anmeldelser.js      skriv en anmeldelse
database/portfolio.js        tilføj, markér som helet, slet billede
database/billeder.js         galleri og kopiering af billeder til appens mappe
database/fejl.js             fejl oversat til dansk
styles/GlobalStyle.js        farver og alle styles
data/udbydere.js             tatovører, studier, stilarter og de første anmeldelser
data/hjaelpere.js            datoer, priser, ledige tider, søgning, afstand, beskeder
components/                  Knap, Chip, Stjerner, Avatar, Segment, Note, StatusMaerke,
                             UdbyderKort, DatoTidVaelger, KameraComponent, Portfolio,
                             LogInComponent, SignUpComponent, Notifikationer
screens/                     én fil pr. skærm — tatovørens side er IndbakkeScreen,
                             AnmodningScreen, KalenderScreen og MinProfilScreen
```

**Data:**

```
Brugere/<uid>                          navn, email, rolle ('kunde' eller 'udbyder'), udbyderId
Bookinger/<kundeUid>/<bookingId>       kundens kopi af bookingen
Anmodninger/<udbyderId>/<bookingId>    tatovørens kopi — samme id
Optaget/<udbyderId>/<dato>/<tid>       hvem der har taget tiden
Samtaler/<bookingId>                   kundeUid, udbyderId, beskeder og hvornår hver part sidst læste
Anmeldelser/<udbyderId>/<bookingId>    én anmeldelse pr. booking
Portfolio/<udbyderId>/<billedId>       billede, tekst og om tatoveringen er helet
```

En booking har en status: **afventer** → **bekræftet** eller **afvist**. En bekræftet tid kan
blive **aflyst** af tatovøren, **afbestilt** af kunden, eller **gennemført** — så kan kunden anmelde.

I koden hedder en tatovør stadig en *udbyder* (`udbyderId`, `rolle: 'udbyder'`).

## Det der ikke er der endnu

- **Firebase.** Indtil det er sat op, virker appen kun på én telefon ad gangen (se *Skift til Firebase*).
- **Billeder på tværs af telefoner** kræver Firebase Storage.
- **Rigtig adgang for tatovører.** Man vælger selv, hvilken tatovør man er, når man opretter sig.
  En rigtig version skal tjekke det — fx ved at studiet inviterer sine tatovører.
- **Notifikationer når appen er lukket** og ved nye beskeder kræver rigtige push-beskeder og en server (fx Cloud Functions).
- **Tatovøren kan ikke ændre sin profil**, priser eller arbejdstider fra appen — de ligger i `data/udbydere.js`.
- **Betaling.** Depositum og priser vises, men opkræves ikke.
- **Påmindelser i en simulator.** Notifikationer virker kun på en rigtig telefon.
