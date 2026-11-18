// Hjælpefunktioner: datoer, priser, ledige tider og opslag i data.
// Skærmene henter alt herfra, så selve beregningerne kun står ét sted.

import { UDBYDERE, STEDER, ANMELDELSER, STOERRELSER } from './udbydere';

// --- Datoer -----------------------------------------------------------------

export const UGEDAGE_KORT = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn'];
export const UGEDAGE = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag'];
export const MAANEDER = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
];
export const MAANEDER_KORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

// Mandag = 0, så ugen starter hvor den gør i Danmark.
export const mandagIndeks = (dato) => (dato.getDay() + 6) % 7;

export const isoDato = (dato) => {
  const to = (n) => String(n).padStart(2, '0');
  return `${dato.getFullYear()}-${to(dato.getMonth() + 1)}-${to(dato.getDate())}`;
};

export const fraIso = (iso) => {
  const [aar, maaned, dag] = iso.split('-').map(Number);
  return new Date(aar, maaned - 1, dag);
};

/** "tor. 3. sep" */
export const kortDato = (dato) =>
  `${UGEDAGE_KORT[mandagIndeks(dato)]}. ${dato.getDate()}. ${MAANEDER_KORT[dato.getMonth()]}`;

/** "torsdag d. 3. september" */
export const langDato = (dato) =>
  `${UGEDAGE[mandagIndeks(dato)]} d. ${dato.getDate()}. ${MAANEDER[dato.getMonth()]}`;

const dageFraIdag = (dato) => {
  const idag = new Date();
  idag.setHours(0, 0, 0, 0);
  const d = new Date(dato);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - idag) / 86400000);
};

/** "I dag" / "I morgen" / "tor. 3. sep" */
export const relativDag = (dato) => {
  const dage = dageFraIdag(dato);
  if (dage === 0) return 'I dag';
  if (dage === 1) return 'I morgen';
  return kortDato(dato);
};

/** "Om 3 dage" — bruges på næste booking. */
export const nedtaelling = (iso) => {
  const dage = dageFraIdag(fraIso(iso));
  if (dage < 0) return 'Overstået';
  if (dage === 0) return 'I dag';
  if (dage === 1) return 'I morgen';
  return `Om ${dage} dage`;
};

/** Laver et Date-objekt ud fra "2026-10-03" og "14.30" — bruges til notifikationerne. */
export const tidspunkt = (iso, tid) => {
  const dato = fraIso(iso);
  const [timer, minutter] = tid.split('.').map(Number);
  dato.setHours(timer, minutter, 0, 0);
  return dato;
};

// --- Tal og priser ----------------------------------------------------------

/** 1200 → "1.200 kr". Laves i hånden, så det virker ens på alle telefoner. */
export const kr = (n) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} kr`;

/** 4.9 → "4,9" */
export const decimal = (n) => n.toFixed(1).replace('.', ',');

const afrund50 = (n) => Math.round(n / 50) * 50;

/**
 * Prisestimat for en tatovering ud fra størrelse. Brugertesten viste at
 * "fra 1.000 kr" ikke var nok — folk vil vide hvad det ender med at koste.
 */
export const prisestimat = (udbyder, stoerrelseId) => {
  const stoerrelse = STOERRELSER.find((s) => s.id === stoerrelseId) || STOERRELSER[1];
  const [faa, mange] = stoerrelse.timer;
  return {
    lav: Math.max(udbyder.minimumspris, afrund50(udbyder.timepris * faa)),
    hoej: Math.max(udbyder.minimumspris, afrund50(udbyder.timepris * mange)),
    timer: stoerrelse.timer,
  };
};

// --- Ledige tider -----------------------------------------------------------
// Tiderne regnes ud fra i dag, så appen aldrig viser datoer der er løbet ud.
// "Optaget" er deterministisk: samme dag giver altid samme svar.

const hash = (tekst) => {
  let h = 0;
  for (let i = 0; i < tekst.length; i += 1) h = (h * 31 + tekst.charCodeAt(i)) % 9973;
  return h;
};

export const tidErOptaget = (udbyderId, iso, tid) => hash(`${udbyderId}${iso}${tid}`) % 3 === 0;

/** Liste af dage med mindst én ledig tid: [{ iso, dato, tider: [...] }] */
export const ledigeDage = (udbyder, antalDage = 30) => {
  if (!udbyder || udbyder.venteliste) return [];
  const resultat = [];
  const idag = new Date();
  idag.setHours(0, 0, 0, 0);
  for (let i = 0; i < antalDage; i += 1) {
    const dato = new Date(idag);
    dato.setDate(idag.getDate() + i);
    if (!udbyder.arbejdsdage.includes(mandagIndeks(dato))) continue;
    const iso = isoDato(dato);
    const ledige = udbyder.tider.filter((t) => !tidErOptaget(udbyder.id, iso, t));
    if (ledige.length > 0) resultat.push({ iso, dato, tider: ledige });
  }
  return resultat;
};

export const naesteLedige = (udbyder) => ledigeDage(udbyder, 60)[0] || null;

/** "Ledig i dag 15.30" / "Venteliste · 6 uger" */
export const ledigTekst = (udbyder) => {
  if (udbyder.venteliste) return `Venteliste · ${udbyder.venteliste} uger`;
  const naeste = naesteLedige(udbyder);
  if (!naeste) return 'Ingen ledige tider';
  return `Ledig ${relativDag(naeste.dato).toLowerCase()} ${naeste.tider[0]}`;
};

// --- Opslag -----------------------------------------------------------------

export const findUdbyder = (id) => UDBYDERE.find((u) => u.id === id) || null;
export const findSted = (id) => STEDER.find((s) => s.id === id) || null;
export const udbydereVed = (stedId) => UDBYDERE.filter((u) => u.stedId === stedId);
export const anmeldelserFor = (udbyderId) => ANMELDELSER.filter((a) => a.udbyderId === udbyderId);

// --- Anmeldelser fra appen --------------------------------------------------
// De opdigtede anmeldelser i data/udbydere.js er "fra før appen". Nye
// anmeldelser skrives af kunder efter en gennemført tid og ligger i
// databasen under Anmeldelser/<udbyderId>/<bookingId>.

/** Appens anmeldelser af én tatovør, nyeste først. */
export const appAnmeldelserFor = (udbyderId, alleApp = {}) => {
  const objekt = alleApp[udbyderId] || {};
  return Object.keys(objekt)
    .map((id) => ({ ...objekt[id], id, fraAppen: true }))
    .sort((a, b) => b.oprettet - a.oprettet);
};

/** Samlet vurdering: de gamle anmeldelser plus dem fra appen. */
export const samletVurdering = (udbyder, alleApp = {}) => {
  const nye = appAnmeldelserFor(udbyder.id, alleApp);
  const antal = udbyder.antalAnmeldelser + nye.length;
  const sum = udbyder.vurdering * udbyder.antalAnmeldelser + nye.reduce((s, a) => s + a.vurdering, 0);
  return { vurdering: antal > 0 ? sum / antal : 0, antal, nyeIAppen: nye.length };
};

/** "Mads Holm" → "Mads H." — sådan står navnet på en anmeldelse. */
export const kortNavn = (navn = '') => {
  const d = navn.trim().split(' ').filter(Boolean);
  if (d.length === 0) return 'Anonym';
  return d.length === 1 ? d[0] : `${d[0]} ${d[d.length - 1][0].toUpperCase()}.`;
};

/** "2026-08-12" → "12. august 2026" */
export const fuldDato = (iso) => {
  const d = fraIso(iso);
  return `${d.getDate()}. ${MAANEDER[d.getMonth()]} ${d.getFullYear()}`;
};

// --- Afstand (fra skoleprojektets kort) --------------------------------------

/** Afstand i km mellem to punkter i luftlinje (haversine-formlen). */
export const afstandKm = (a, b) => {
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.breddegrad - a.breddegrad);
  const dLon = rad(b.laengdegrad - a.laengdegrad);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.breddegrad)) * Math.cos(rad(b.breddegrad)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

/** 0.45 → "450 m", 3.24 → "3,2 km" */
export const afstandTekst = (km) => (km < 1
  ? `${Math.round((km * 1000) / 10) * 10} m`
  : `${decimal(km)} km`);

/** Studierne sorteret efter afstand fra en position: [{ ...sted, km }] */
export const stederEfterAfstand = (position) => STEDER
  .map((s) => ({ ...s, km: afstandKm(position, s) }))
  .sort((a, b) => a.km - b.km);

/**
 * Søgning på forsiden. Sorteres så dem med en ledig tid står først, og
 * derefter efter vurdering. Brugertesten viste, at folk falder fra i
 * søgningen fordi der er for mange at vælge imellem — så det bedste
 * match skal stå øverst.
 */
export const soeg = ({ stilart = null, anmeldelser = {} } = {}) =>
  UDBYDERE
    .filter((u) => !stilart || u.stilarter.includes(stilart))
    .map((u) => {
      const samlet = samletVurdering(u, anmeldelser);
      return {
        ...u, vurdering: samlet.vurdering, antalAnmeldelser: samlet.antal, naeste: naesteLedige(u),
      };
    })
    .sort((a, b) => {
      if (!!a.naeste !== !!b.naeste) return a.naeste ? -1 : 1;
      return b.vurdering - a.vurdering;
    });

// --- Bookinger og udbydersiden ----------------------------------------------

/** '10.00' → '10-00'. Punktum må ikke stå i en nøgle i Realtime Database. */
export const tidNoegle = (tid) => tid.replace('.', '-');

// En booking kan have disse seks statusser. "aktiv" betyder at tiden er holdt.
// gennemfoert sætter tatovøren, når tatoveringen er lavet — så kan kunden anmelde.
export const STATUS = {
  afventer: { navn: 'Afventer', aktiv: true },
  bekraeftet: { navn: 'Bekræftet', aktiv: true },
  gennemfoert: { navn: 'Gennemført', aktiv: true },
  afvist: { navn: 'Afvist', aktiv: false },
  aflyst: { navn: 'Aflyst', aktiv: false },
  afbestilt: { navn: 'Afbestilt', aktiv: false },
};
export const statusNavn = (status) => (STATUS[status] ? STATUS[status].navn : 'Ukendt');
export const erAktiv = (booking) => !!STATUS[booking.status] && STATUS[booking.status].aktiv;

/** Bekræftet eller allerede lavet — tiden er kundens. */
export const erBekraeftet = (booking) => booking.status === 'bekraeftet' || booking.status === 'gennemfoert';

/** En tid der stadig skal finde sted: venter på svar eller er bekræftet, og ligger ude i fremtiden. */
export const erKommende = (booking, nu = new Date()) =>
  (booking.status === 'afventer' || booking.status === 'bekraeftet') && tidspunkt(booking.dato, booking.tid) >= nu;

/**
 * Kan kunden skrive en anmeldelse? Kun hvis tatoveringen faktisk er lavet:
 * tatovøren har markeret den som gennemført, eller en bekræftet tid er overstået.
 * Så kan man kun anmelde, hvis man har været der.
 */
export const kanAnmelde = (booking, nu = new Date()) => !booking.anmeldt && (
  booking.status === 'gennemfoert'
  || (booking.status === 'bekraeftet' && tidspunkt(booking.dato, booking.tid) < nu)
);

/** En anmodning der aldrig blev besvaret, og hvis tid er gået. */
export const erUdloebet = (booking, nu = new Date()) =>
  booking.status === 'afventer' && tidspunkt(booking.dato, booking.tid) < nu;

/** "for 5 min. siden" / "for 2 t. siden" / "i går" */
export const siden = (ms, nu = Date.now()) => {
  const min = Math.floor((nu - ms) / 60000);
  if (min < 1) return 'lige nu';
  if (min < 60) return `for ${min} min. siden`;
  const timer = Math.floor(min / 60);
  if (timer < 24) return `for ${timer} t. siden`;
  const dage = Math.floor(timer / 24);
  return dage === 1 ? 'i går' : `for ${dage} dage siden`;
};

/** Fra objekt (id → booking) til liste, som i 05. Halve poster uden dato springes over. */
export const tilListe = (objekt) =>
  Object.keys(objekt || {})
    .map((id) => ({ ...objekt[id], id }))
    .filter((b) => b.dato && b.tid);

/** Udbyderens indbakke: nye anmodninger (ældste først) og resten (nyeste først). */
export const delIndbakke = (liste, nu = new Date()) => {
  const nye = liste
    .filter((b) => b.status === 'afventer' && !erUdloebet(b, nu))
    .sort((a, b) => a.oprettet - b.oprettet);
  const oevrige = liste
    .filter((b) => !nye.includes(b))
    .sort((a, b) => (b.besvaret || b.oprettet) - (a.besvaret || a.oprettet));
  return { nye, oevrige };
};

/** De næste dage fra i dag: [{ iso, dato }] — til udbyderens kalender. */
export const kalenderDage = (antal = 14) => {
  const idag = new Date();
  idag.setHours(0, 0, 0, 0);
  const dage = [];
  for (let i = 0; i < antal; i += 1) {
    const dato = new Date(idag);
    dato.setDate(idag.getDate() + i);
    dage.push({ iso: isoDato(dato), dato });
  }
  return dage;
};

/**
 * Udbyderens dag: én række pr. tid. Er der både en bekræftet tid og en
 * anmodning på samme tid, vises den bekræftede. udenforAppen er tider der er
 * optaget i demodataene (som om de var booket over telefonen).
 * En fridag giver en tom liste.
 */
export const dagsplan = (udbyder, iso, liste) => {
  if (!udbyder.arbejdsdage.includes(mandagIndeks(fraIso(iso)))) return [];
  return udbyder.tider.map((tid) => {
    const her = liste.filter((b) => b.dato === iso && b.tid === tid && erAktiv(b));
    const booking = her.find(erBekraeftet) || her[0] || null;
    return {
      tid,
      booking,
      flere: Math.max(0, her.length - 1),
      udenforAppen: !booking && tidErOptaget(udbyder.id, iso, tid),
    };
  });
};

/** "Mads Holm" → "MH" */
export const initialerFra = (navn = '') =>
  navn.split(' ').filter(Boolean).map((d) => d[0]).join('').slice(0, 2).toUpperCase() || '?';

/** Kort beskrivelse af en anmodning: "Fine line · Under 5 cm · Underarm" */
export const bookingResume = (b) => `${b.stilart} · ${b.stoerrelse} · ${b.kropsdel}`;

// --- Beskeder -----------------------------------------------------------------
// Samtaler/<bookingId> = { kundeUid, udbyderId, beskeder: { id: besked }, laest: { kunde, udbyder } }

/** Beskederne i en samtale, ældste først. */
export const beskederI = (samtale) => {
  const objekt = (samtale && samtale.beskeder) || {};
  return Object.keys(objekt)
    .map((id) => ({ ...objekt[id], id }))
    .sort((a, b) => a.tid - b.tid);
};

/** Hvor mange beskeder fra den anden part er kommet, siden rolle sidst åbnede samtalen? */
export const ulaesteI = (samtale, rolle) => {
  const sidst = (samtale && samtale.laest && samtale.laest[rolle]) || 0;
  return beskederI(samtale).filter((b) => b.fra !== rolle && b.tid > sidst).length;
};

/** "14.05" i dag, ellers "tor. 3. sep 14.05" */
export const beskedTid = (ms) => {
  const d = new Date(ms);
  const kl = `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`;
  return relativDag(d) === 'I dag' ? kl : `${kortDato(d)} ${kl}`;
};
