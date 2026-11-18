// Tatovørens portfolio. Spørgeskemaet viste, at stil og portfolio er det
// vigtigste for kunderne (4,1 ud af 5), og at det sværeste er at finde en
// tatovør hvis stil passer. Én kunde ville gerne se, hvordan tatoveringerne ser
// ud, når de er helet — derfor kan et billede markeres som "helet".
//
//   Portfolio/<udbyderId>/<id>   { uri, tekst, helet, oprettet }

import { rtdb, ref, push, set, update } from './db';
import { gemBilledePermanent } from './billeder';

export const MAX_BILLEDTEKST = 120;

export async function tilfoejBillede(udbyderId, uri, tekst, helet) {
  const id = push(ref(rtdb, `Portfolio/${udbyderId}`)).key;
  await set(ref(rtdb, `Portfolio/${udbyderId}/${id}`), {
    uri: gemBilledePermanent(uri, 'portfolio'),
    tekst: String(tekst || '').trim().slice(0, MAX_BILLEDTEKST),
    helet: !!helet,
    oprettet: Date.now(),
  });
}

export async function saetHelet(udbyderId, billedId, helet) {
  await update(ref(rtdb, `Portfolio/${udbyderId}/${billedId}`), { helet: !!helet });
}

export async function fjernBillede(udbyderId, billedId) {
  await set(ref(rtdb, `Portfolio/${udbyderId}/${billedId}`), null);
}
