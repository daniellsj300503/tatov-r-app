// Al Firebase-opsætning samlet ét sted, som i 05_Firebase og 06_FirebaseLogin —
// "så vi undgår require cycles".
//
// BRUGES IKKE ENDNU. Lige nu gemmer appen alt på telefonen (database/db.js).
// Når I er klar til Firebase, sætter I nøglerne ind her og skifter db.js over.
//
// SÅDAN SÆTTER DU DET OP (se også README):
// 1. Opret et projekt på https://console.firebase.google.com (slå Analytics fra)
// 2. Tilføj en web-app og kopiér firebaseConfig ind herunder
// 3. Build > Realtime Database > Create database > Belgium (europe-west1) > Test mode
//    Kopiér database-URL'en ind i DATABASE_URL
// 4. Build > Authentication > Get started > Sign-in method > slå Email/Password til

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Indsæt din egen config her fra Firebase Console
const firebaseConfig = {
  apiKey: 'DIN_API_KEY',
  authDomain: 'DIT_PROJECT.firebaseapp.com',
  projectId: 'DIT_PROJECT',
  storageBucket: 'DIT_PROJECT.firebasestorage.app',
  messagingSenderId: 'DIT_SENDER_ID',
  appId: 'DIT_APP_ID',
};

// Står under Realtime Database i konsollen, øverst over dataene
const DATABASE_URL = 'https://DIT_PROJECT-default-rtdb.europe-west1.firebasedatabase.app';

// Er nøglerne sat ind? Hvis ikke, viser App.js en vejledning i stedet for at
// gå ned med en kryptisk fejl.
export const firebaseErSatOp = !firebaseConfig.apiKey.startsWith('DIN_')
  && !DATABASE_URL.includes('DIT_PROJECT');

let app = null;
let database = null;
let authInstans = null;

if (firebaseErSatOp) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  database = getDatabase(app, DATABASE_URL);

  // initializeAuth må kun kaldes én gang. Når Expo genindlæser filen under
  // udvikling, findes auth allerede — så henter vi den med getAuth i stedet.
  // (Det er vores sammenlægning af 05 og 06, som kurset viser hver for sig.)
  try {
    authInstans = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    authInstans = getAuth(app);
  }
}

export const firebaseApp = app;
export const rtdb = database;
export const auth = authInstans;
