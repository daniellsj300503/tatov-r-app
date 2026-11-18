// Login på telefonen, gemt med AsyncStorage.
//
// Funktionerne hedder det samme og virker på samme måde som i firebase/auth
// fra 06_FirebaseLogin: createUserWithEmailAndPassword,
// signInWithEmailAndPassword, signOut og onAuthStateChanged. Fejlene har også
// de samme koder (fx auth/weak-password), så database/fejl.js virker til begge.
//
// Brugerne findes kun på den telefon, de er oprettet på. Adgangskoden gemmes
// ikke i klartekst, men det er ikke rigtig sikkerhed — det får man først med Firebase.

import AsyncStorage from '@react-native-async-storage/async-storage';

const NOEGLE = 'tatovoer-login';

let tilstand = { brugere: {}, aktuel: null }; // brugere: email → { uid, email, kode }
let indlaesning = null;
const lyttere = new Set();

// Som auth fra Firebase: currentUser er den der er logget ind, eller null
export const auth = { currentUser: null };

function fejl(code, besked) {
  const e = new Error(besked);
  e.code = code;
  return e;
}

// Lille hash, så adgangskoden ikke står direkte i AsyncStorage
function hash(tekst) {
  let h = 5381;
  for (let i = 0; i < tekst.length; i += 1) h = ((h * 33) ^ tekst.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

const brugerFra = (b) => (b ? { uid: b.uid, email: b.email } : null);

function opdaterCurrentUser() {
  const b = Object.values(tilstand.brugere).find((x) => x.uid === tilstand.aktuel);
  auth.currentUser = brugerFra(b);
}

function klar() {
  if (!indlaesning) {
    indlaesning = AsyncStorage.getItem(NOEGLE)
      .then((tekst) => {
        if (tekst) tilstand = { brugere: {}, aktuel: null, ...JSON.parse(tekst) };
        opdaterCurrentUser();
      })
      .catch((e) => console.log('Kunne ikke læse login', e));
  }
  return indlaesning;
}

async function gemOgFortael() {
  opdaterCurrentUser();
  try {
    await AsyncStorage.setItem(NOEGLE, JSON.stringify(tilstand));
  } catch (e) {
    console.log('Kunne ikke gemme login', e);
  }
  Array.from(lyttere).forEach((cb) => cb(auth.currentUser));
}

function tjekEmail(email) {
  if (!email) throw fejl('auth/invalid-email', 'Mangler email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fejl('auth/invalid-email', 'Ugyldig email');
}

// --- Samme funktioner som firebase/auth --------------------------------------

export function onAuthStateChanged(a, callback) {
  lyttere.add(callback);
  klar().then(() => {
    if (lyttere.has(callback)) callback(auth.currentUser);
  });
  return () => lyttere.delete(callback);
}

export async function createUserWithEmailAndPassword(a, emailInd, kode) {
  await klar();
  const email = String(emailInd || '').trim().toLowerCase();
  tjekEmail(email);
  if (!kode) throw fejl('auth/missing-password', 'Mangler adgangskode');
  if (kode.length < 6) throw fejl('auth/weak-password', 'For kort adgangskode');
  if (tilstand.brugere[email]) throw fejl('auth/email-already-in-use', 'Email findes allerede');

  const uid = `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  tilstand.brugere[email] = { uid, email, kode: hash(kode) };
  tilstand.aktuel = uid;
  await gemOgFortael();
  return { user: auth.currentUser };
}

export async function signInWithEmailAndPassword(a, emailInd, kode) {
  await klar();
  const email = String(emailInd || '').trim().toLowerCase();
  tjekEmail(email);
  if (!kode) throw fejl('auth/missing-password', 'Mangler adgangskode');
  const bruger = tilstand.brugere[email];
  if (!bruger || bruger.kode !== hash(kode)) throw fejl('auth/invalid-credential', 'Forkert login');
  tilstand.aktuel = bruger.uid;
  await gemOgFortael();
  return { user: auth.currentUser };
}

export async function signOut(a) {
  await klar();
  tilstand.aktuel = null;
  await gemOgFortael();
}

/** Sletter alle brugere på telefonen. Bruges af "Nulstil testdata" under Konto. */
export async function nulstilLokalLogin() {
  await klar();
  tilstand = { brugere: {}, aktuel: null };
  await gemOgFortael();
}
