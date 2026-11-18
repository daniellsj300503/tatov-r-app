// Anmeldelser skrevet i appen. Kun en kunde der har været hos tatovøren
// (bookingen er gennemført), kan anmelde — og kun én gang pr. booking.
// Spørgeskemaet: kunderne gav anmeldelser 3,9 ud af 5 i vigtighed, men en
// tatovør mente at Google-anmeldelser er mere troværdige. Derfor er alle
// anmeldelser i appen knyttet til en rigtig booking.
//
//   Anmeldelser/<udbyderId>/<bookingId>   selve anmeldelsen (bookingens id = én pr. booking)
//   Bookinger/<kundeUid>/<bookingId>/anmeldt = true

import { auth, rtdb, ref, get, update } from './db';
import { kortNavn, initialerFra, isoDato, kanAnmelde } from '../data/hjaelpere';

export const MAX_ANMELDELSE = 500;

export async function skrivAnmeldelse(booking, vurdering, tekst) {
  const uid = auth.currentUser.uid;
  if (!kanAnmelde(booking)) throw new Error('Bookingen kan ikke anmeldes');
  if (!(vurdering >= 1 && vurdering <= 5)) throw new Error('Vælg mellem 1 og 5 stjerner');

  const brugerSnap = await get(ref(rtdb, `Brugere/${uid}`));
  const navn = brugerSnap.exists() && brugerSnap.val().navn ? brugerSnap.val().navn : 'Anonym';

  const anmeldelse = {
    kundeUid: uid,
    navn: kortNavn(navn),
    initialer: initialerFra(navn),
    vurdering,
    tekst: String(tekst || '').trim().slice(0, MAX_ANMELDELSE),
    hvad: booking.stilart,
    dato: isoDato(new Date()),
    oprettet: Date.now(),
    bekraeftet: true,
  };

  await update(ref(rtdb), {
    [`Anmeldelser/${booking.udbyderId}/${booking.id}`]: anmeldelse,
    [`Bookinger/${uid}/${booking.id}/anmeldt`]: true,
  });
}
