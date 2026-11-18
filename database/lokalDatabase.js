// En lille database på telefonen, gemt med AsyncStorage (som i skoleprojektet).
//
// Den har de samme funktioner som Realtime Database fra 05_Firebase:
// ref, get, set, update, push og onValue, med de samme stier, fx
// Bookinger/<uid>/<id>. Derfor ser resten af appen ingen forskel.
// Når Firebase skal på, skiftes database/db.js bare over, og resten
// af koden kan blive som den er.
//
// Hele databasen ligger som ét objekt i hukommelsen og bliver gemt i
// AsyncStorage efter hver ændring. Det er fint til de mængder, en test har.

import AsyncStorage from '@react-native-async-storage/async-storage';

const NOEGLE = 'tatovoer-database';

let data = {};
let indlaesning = null; // promise, så databasen kun læses ind én gang
let gemmer = Promise.resolve(); // gemninger køres efter hinanden
const lyttere = new Set();

// Bruges i stedet for rtdb fra Firebase. Funktionerne tager den med for at
// ligne Firebase, men bruger den ikke.
export const rtdb = { lokal: true };

const dele = (sti) => String(sti || '').split('/').filter(Boolean);
const samlet = (...stier) => stier.flatMap(dele).join('/');
const kopi = (v) => (v === null || v === undefined ? null : JSON.parse(JSON.stringify(v)));

// Firebase afviser undefined. Det gør vi også, så fejlen ikke først dukker op
// den dag appen skifter til Firebase.
function tjekVaerdi(sti, v) {
  if (v === undefined) {
    throw new Error(`Værdien på "${sti}" er undefined. Brug null for at slette.`);
  }
  if (v && typeof v === 'object') {
    Object.keys(v).forEach((k) => tjekVaerdi(`${sti}/${k}`, v[k]));
  }
}

function klar() {
  if (!indlaesning) {
    indlaesning = AsyncStorage.getItem(NOEGLE)
      .then((tekst) => {
        data = tekst ? JSON.parse(tekst) : {};
      })
      .catch((e) => {
        console.log('Kunne ikke læse databasen', e);
        data = {};
      });
  }
  return indlaesning;
}

function laes(sti) {
  let node = data;
  for (const del of dele(sti)) {
    if (node === null || typeof node !== 'object' || !(del in node)) return null;
    node = node[del];
  }
  // Tomme objekter findes ikke i Firebase — de giver null
  return node === undefined || (node && typeof node === 'object' && Object.keys(node).length === 0) ? null : node;
}

// Firebase gemmer ikke tomme objekter, så de fjernes også her
function erTom(v) {
  return v === null || v === undefined || (typeof v === 'object' && Object.keys(v).length === 0);
}

function skriv(sti, vaerdi) {
  const d = dele(sti);
  if (d.length === 0) {
    data = vaerdi && typeof vaerdi === 'object' ? kopi(vaerdi) : {};
    return;
  }
  const foraeldre = [data];
  let node = data;
  for (let i = 0; i < d.length - 1; i += 1) {
    if (node[d[i]] === null || typeof node[d[i]] !== 'object') node[d[i]] = {};
    node = node[d[i]];
    foraeldre.push(node);
  }
  const sidste = d[d.length - 1];
  if (erTom(vaerdi)) delete node[sidste];
  else node[sidste] = kopi(vaerdi);

  // Ryd tomme forældre op nedefra
  for (let i = d.length - 2; i >= 0; i -= 1) {
    if (erTom(foraeldre[i + 1])) delete foraeldre[i][d[i]];
  }
}

function lavSnapshot(sti, v) {
  const d = dele(sti);
  const vaerdi = kopi(v);
  return {
    key: d.length ? d[d.length - 1] : null,
    val: () => kopi(vaerdi),
    exists: () => vaerdi !== null,
  };
}

function kaldLytter(lytter) {
  const vaerdi = laes(lytter.sti);
  const json = JSON.stringify(vaerdi);
  if (json === lytter.sidst) return; // intet nyt for netop denne sti
  lytter.sidst = json;
  try {
    lytter.callback(lavSnapshot(lytter.sti, vaerdi));
  } catch (e) {
    console.log('Fejl i en lytter', e);
  }
}

function fortaelLyttere() {
  Array.from(lyttere).forEach(kaldLytter);
}

function gem() {
  const tekst = JSON.stringify(data);
  gemmer = gemmer
    .then(() => AsyncStorage.setItem(NOEGLE, tekst))
    .catch((e) => console.log('Kunne ikke gemme databasen', e));
  return gemmer;
}

// --- Samme funktioner som firebase/database ---------------------------------

export function ref(db, sti = '') {
  const d = dele(sti);
  return { sti: d.join('/'), key: d.length ? d[d.length - 1] : null };
}

// Et nyt, unikt id der sorteres efter tid, ligesom Firebases push-id'er
let taeller = 0;
export function push(reference) {
  taeller = (taeller + 1) % 1000;
  const id = `${Date.now().toString(36)}${String(taeller).padStart(3, '0')}${Math.random().toString(36).slice(2, 6)}`;
  return ref(null, samlet(reference.sti, id));
}

export async function get(reference) {
  await klar();
  return lavSnapshot(reference.sti, laes(reference.sti));
}

export async function set(reference, vaerdi) {
  await klar();
  tjekVaerdi(reference.sti, vaerdi);
  skriv(reference.sti, vaerdi);
  fortaelLyttere();
  await gem();
}

/** Som update() i Firebase: flere stier på én gang, null sletter. */
export async function update(reference, aendringer) {
  await klar();
  const stier = Object.keys(aendringer || {});
  stier.forEach((k) => tjekVaerdi(samlet(reference.sti, k), aendringer[k]));
  stier.forEach((k) => skriv(samlet(reference.sti, k), aendringer[k]));
  fortaelLyttere();
  await gem();
}

/**
 * Som onValue i Firebase: kalder callback med det samme og igen, hver gang
 * data under stien ændrer sig. Returnerer en funktion der stopper lytningen.
 */
export function onValue(reference, callback, onFejl) {
  const lytter = { sti: reference.sti, callback, sidst: undefined };
  lyttere.add(lytter);
  klar()
    .then(() => {
      if (lyttere.has(lytter)) kaldLytter(lytter);
    })
    .catch((e) => onFejl && onFejl(e));
  return () => lyttere.delete(lytter);
}

/** Sletter alt i den lokale database. Bruges af "Nulstil testdata" under Konto. */
export async function nulstilLokalDatabase() {
  await klar();
  data = {};
  fortaelLyttere();
  await gem();
}
