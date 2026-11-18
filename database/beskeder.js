// Beskeder mellem kunde og tatovør. En samtale hører altid til én booking —
// spørgeskemaet viste, at tatovørerne helst vil have FÆRRE beskeder frem og
// tilbage, så der er ingen åben chat. Man skriver om netop den anmodning.
//
//   Samtaler/<bookingId>/beskeder/<id>   { fra: 'kunde' | 'udbyder', navn, tekst, tid }
//   Samtaler/<bookingId>/laest/<rolle>   hvornår rollen sidst åbnede samtalen

import { rtdb, ref, push, update } from './db';

export const MAX_BESKED = 600;

/** Send en besked. rolle er 'kunde' eller 'udbyder', navn står på beskeden. */
export async function sendBesked(bookingId, rolle, navn, tekst) {
  const rent = String(tekst || '').trim().slice(0, MAX_BESKED);
  if (!rent) return;
  const id = push(ref(rtdb, `Samtaler/${bookingId}/beskeder`)).key;
  const nu = Date.now();
  await update(ref(rtdb), {
    [`Samtaler/${bookingId}/beskeder/${id}`]: { fra: rolle, navn, tekst: rent, tid: nu },
    // Har man selv skrevet, har man også læst det der stod før
    [`Samtaler/${bookingId}/laest/${rolle}`]: nu,
  });
}

/** Marker samtalen som læst for rolle. */
export async function markerLaest(bookingId, rolle) {
  await update(ref(rtdb), { [`Samtaler/${bookingId}/laest/${rolle}`]: Date.now() });
}
