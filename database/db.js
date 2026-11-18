// Appens eneste indgang til data og login. Alle skærme importerer herfra.
//
// LIGE NU: alt gemmes på telefonen med AsyncStorage (lokalDatabase.js og
// lokalLogin.js). Appen virker uden Firebase, men kunder og tatovører skal
// bruge den samme telefon for at se hinandens bookinger og beskeder.
//
// SÅDAN SKIFTER I TIL FIREBASE (se README):
// 1. Sæt jeres nøgler ind i database/firebase.js
// 2. Sæt // foran de to export-linjer under "Lokalt", og fjern // foran de tre under "Firebase"
// 3. Sæt BRUGER_FIREBASE til true
// Resten af appen bruger de samme funktioner og stier, så den kan blive som den er.

// Lokalt (AsyncStorage)
export { rtdb, ref, get, set, update, push, onValue } from './lokalDatabase';
export {
  auth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
} from './lokalLogin';

// Firebase
// export { ref, get, set, update, push, onValue } from 'firebase/database';
// export { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
// export { rtdb, auth } from './firebase';

// Bruges til at vise "på denne telefon"-noterne og knappen Nulstil testdata
export const BRUGER_FIREBASE = false;
