// Små hooks der lytter på databasen med onValue og giver data til skærmene.
// De samler de onValue-kald, som ellers skulle stå i mange skærme.

import { useEffect, useState } from 'react';
import { auth, rtdb, ref, onValue, onAuthStateChanged } from './db';
import { ulaesteI } from '../data/hjaelpere';

/**
 * Hvem er logget ind, og hvad står der i Brugere/<uid> (navn og rolle)?
 * user er null for en gæst — man kan se alt i appen uden at være logget ind.
 * klar er falsk, indtil vi ved om nogen er logget ind fra sidst.
 */
export function useBruger() {
  const [user, setUser] = useState(auth.currentUser);
  const [loginKlar, setLoginKlar] = useState(false);
  const [profil, setProfil] = useState(null);

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    setLoginKlar(true);
  }), []);

  const uid = user ? user.uid : null;
  useEffect(() => {
    setProfil(null);
    if (!uid) return undefined;
    return onValue(
      ref(rtdb, `Brugere/${uid}`),
      (snap) => setProfil(snap.val() || {}), // ingen profil = kunde
      () => setProfil({}),
    );
  }, [uid]);

  return { user, profil, klar: loginKlar && (!user || profil !== null) };
}

/** Anmeldelser skrevet i appen: { udbyderId: { bookingId: anmeldelse } } */
export function useAppAnmeldelser() {
  const [anmeldelser, setAnmeldelser] = useState({});
  useEffect(() => onValue(
    ref(rtdb, 'Anmeldelser'),
    (snap) => setAnmeldelser(snap.val() || {}),
    (fejl) => console.log('Kunne ikke hente anmeldelser', fejl),
  ), []);
  return anmeldelser;
}

/** Tatovørens egne billeder, nyeste først. */
export function usePortfolio(udbyderId) {
  const [billeder, setBilleder] = useState([]);
  useEffect(() => {
    if (!udbyderId) return undefined;
    return onValue(
      ref(rtdb, `Portfolio/${udbyderId}`),
      (snap) => {
        const objekt = snap.val() || {};
        setBilleder(Object.keys(objekt)
          .map((id) => ({ ...objekt[id], id }))
          .sort((a, b) => b.oprettet - a.oprettet));
      },
      (fejl) => console.log('Kunne ikke hente portfolio', fejl),
    );
  }, [udbyderId]);
  return billeder;
}

/**
 * Ulæste beskeder i en række bookinger. rolle er 'kunde' eller 'udbyder' —
 * det er beskeder fra den ANDEN part, der tælles.
 * Giver { antal: samlet antal samtaler med ulæste, ulaeste: { bookingId: antal } }
 */
export function useUlaeste(bookingIds, rolle) {
  const [samtaler, setSamtaler] = useState({});
  const noegle = [...bookingIds].sort().join(',');

  useEffect(() => {
    const ids = noegle ? noegle.split(',') : [];
    const stop = ids.map((id) => onValue(
      ref(rtdb, `Samtaler/${id}`),
      (snap) => setSamtaler((foer) => ({ ...foer, [id]: snap.val() })),
      () => {},
    ));
    return () => stop.forEach((s) => s());
  }, [noegle]);

  const ulaeste = {};
  let antal = 0;
  (noegle ? noegle.split(',') : []).forEach((id) => {
    const n = ulaesteI(samtaler[id], rolle);
    if (n > 0) {
      ulaeste[id] = n;
      antal += 1;
    }
  });
  return { antal, ulaeste };
}
