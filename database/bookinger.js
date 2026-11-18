// Alt hvor en booking skrives til databasen, samlet ét sted.
//
// En booking ligger to steder, med samme id:
//   Bookinger/<kundeUid>/<id>      kundens kopi   → "Mine bookinger"
//   Anmodninger/<udbyderId>/<id>   udbyderens kopi → udbydersiden
// og tiden markeres som taget under
//   Optaget/<udbyderId>/<dato>/<tid>
// så to kunder ikke kan booke samme tid.
//
// og der oprettes en samtale under
//   Samtaler/<id>
// så kunde og tatovør kan skrive sammen om netop den booking.
//
// Det hele skrives med ÉT update() på roden. Det er samme update() som i
// 05_Firebase — bare med flere stier på én gang. Enten lykkes de alle, eller
// også sker der ingenting, så de to kopier aldrig kommer ud af trit.

import {
  auth, rtdb, ref, push, get, update, onValue,
} from './db';
import { sendNu, planlaegPaamindelser, annullerPaamindelser } from '../components/Notifikationer';
import {
  tidNoegle, tidspunkt, kortDato, fraIso, tilListe, delIndbakke, erAktiv, erBekraeftet,
} from '../data/hjaelpere';

const optagetSti = (b) => `Optaget/${b.udbyderId}/${b.dato}/${tidNoegle(b.tid)}`;

// --- Kunden -----------------------------------------------------------------

/** Gem en ny booking begge steder. Returnerer bookingen med id. */
export async function opretBooking(booking) {
  const uid = auth.currentUser.uid;

  // push() uden data giver bare et nyt, unikt id
  const id = push(ref(rtdb, `Bookinger/${uid}`)).key;

  // Har en anden lige taget tiden? (Tidsvælgeren skjuler den, men to kan trykke samtidig.)
  const optagetSnap = await get(ref(rtdb, optagetSti(booking)));
  if (optagetSnap.exists()) {
    const fejl = new Error('Tiden er optaget');
    fejl.code = 'tid-optaget';
    throw fejl;
  }

  // Udbyderen skal kunne se hvem kunden er
  const brugerSnap = await get(ref(rtdb, `Brugere/${uid}`));
  const kundeNavn = brugerSnap.exists() && brugerSnap.val().navn
    ? brugerSnap.val().navn
    : auth.currentUser.email;

  const fuld = { ...booking, kundeUid: uid, kundeNavn };

  const updates = {};
  updates[`Bookinger/${uid}/${id}`] = fuld;
  updates[`Anmodninger/${booking.udbyderId}/${id}`] = fuld;
  updates[optagetSti(booking)] = uid;
  updates[`Samtaler/${id}/kundeUid`] = uid;
  updates[`Samtaler/${id}/udbyderId`] = booking.udbyderId;
  await update(ref(rtdb), updates);

  return { ...fuld, id };
}

/** Kunden afbestiller: kundens kopi slettes, udbyderen ser "Afbestilt". */
export async function afbestilBooking(booking) {
  const uid = auth.currentUser.uid;
  await annullerPaamindelser(booking.notifikationer || []);

  const updates = {};
  updates[`Bookinger/${uid}/${booking.id}`] = null; // null = slet
  // Bookinger fra før udbydersiden fandtes, har ingen kopi hos udbyderen
  if (booking.kundeUid) {
    updates[`Anmodninger/${booking.udbyderId}/${booking.id}/status`] = 'afbestilt';
    updates[`Anmodninger/${booking.udbyderId}/${booking.id}/besvaret`] = Date.now();
    // Kun frigiv tiden, hvis det er vores egen markering
    const optagetSnap = await get(ref(rtdb, optagetSti(booking)));
    if (optagetSnap.val() === uid) updates[optagetSti(booking)] = null;
  }
  await update(ref(rtdb), updates);
}

/** Kunden fjerner en afvist eller aflyst booking fra sin liste. */
export async function fjernBooking(booking) {
  await update(ref(rtdb), { [`Bookinger/${auth.currentUser.uid}/${booking.id}`]: null });
}

/**
 * Lytter på kundens bookinger, mens appen er åben. Når udbyderen har svaret,
 * får kunden en notifikation — og ved en bekræftet tid planlægges påmindelserne.
 *
 * informeretOm husker hvilken status kunden sidst har fået besked om. Så får
 * man også besked, hvis tatovøren svarede mens appen var lukket.
 * Returnerer en funktion der stopper lytningen (ligesom onValue).
 */
export function foelgMineBookinger(uid) {
  const iGang = new Set(); // undgå at samme ændring håndteres to gange

  return onValue(ref(rtdb, `Bookinger/${uid}`), async (snap) => {
    for (const b of tilListe(snap.val())) {
      if (b.status === 'afventer' || b.informeretOm === b.status) continue;
      const noegle = `${b.id}/${b.status}`;
      if (iGang.has(noegle)) continue;
      iGang.add(noegle);

      const fornavn = b.udbyderNavn.split(' ')[0];
      const hvornaar = `${kortDato(fraIso(b.dato))} kl. ${b.tid}`;
      const fremtid = tidspunkt(b.dato, b.tid) > new Date();
      const aendringer = { informeretOm: b.status };

      try {
        if (b.status === 'bekraeftet' && fremtid) {
          const ids = await planlaegPaamindelser({
            tidspunkt: tidspunkt(b.dato, b.tid),
            udbyderNavn: b.udbyderNavn,
            stedNavn: b.stedNavn,
            tid: b.tid,
          });
          aendringer.notifikationer = ids;
          await sendNu(`${fornavn} har bekræftet din tid`, `${hvornaar} · ${b.stedNavn}`);
        } else if (b.status === 'afvist' && fremtid) {
          await sendNu(`${fornavn} kan ikke tage din tid`, b.svar || 'Prøv en anden dag, eller find en anden tatovør.');
        } else if (b.status === 'gennemfoert') {
          await sendNu(`Hvordan blev din tatovering?`, `Skriv gerne en anmeldelse af ${fornavn} under Mine bookinger.`);
        } else if (b.status === 'aflyst') {
          await annullerPaamindelser(b.notifikationer || []);
          aendringer.notifikationer = null;
          if (fremtid) await sendNu(`${fornavn} har aflyst din tid`, b.svar || hvornaar);
        }
        await update(ref(rtdb, `Bookinger/${uid}/${b.id}`), aendringer);
      } catch (e) {
        console.log('Kunne ikke håndtere ny status', e);
        iGang.delete(noegle); // prøv igen næste gang data ændrer sig
      }
    }
  }, (fejl) => console.log('Kunne ikke følge bookinger', fejl));
}

// --- Udbyderen --------------------------------------------------------------

/**
 * Udbyderen svarer på en anmodning eller aflyser en tid.
 * status er 'bekraeftet', 'afvist', 'aflyst' eller 'gennemfoert'. svar er en valgfri besked til kunden.
 * Status skrives i begge kopier, så kunden ser svaret med det samme.
 */
export async function saetStatus(booking, status, svar) {
  const updates = {};
  const steder = [
    `Anmodninger/${booking.udbyderId}/${booking.id}`,
    `Bookinger/${booking.kundeUid}/${booking.id}`,
  ];
  for (const sti of steder) {
    updates[`${sti}/status`] = status;
    updates[`${sti}/besvaret`] = Date.now();
    if (svar && svar.trim()) updates[`${sti}/svar`] = svar.trim();
  }
  // Bekræftet eller gennemført: tiden er kundens. Afvist eller aflyst: tiden bliver
  // ledig igen — medmindre en anden kunde stadig har en tid eller anmodning på samme tidspunkt.
  if (status === 'bekraeftet' || status === 'gennemfoert') {
    updates[optagetSti(booking)] = booking.kundeUid;
  } else {
    const andre = await andreSammeTid(booking);
    const anden = andre.find(erBekraeftet) || andre[0];
    updates[optagetSti(booking)] = anden ? anden.kundeUid : null;
  }
  await update(ref(rtdb), updates);
}

/** Andre aktive bookinger hos samme udbyder, samme dag og klokkeslæt. */
async function andreSammeTid(booking) {
  const snap = await get(ref(rtdb, `Anmodninger/${booking.udbyderId}`));
  return tilListe(snap.val()).filter((b) => b.id !== booking.id
    && b.dato === booking.dato && b.tid === booking.tid && erAktiv(b));
}

/** Har udbyderen allerede en bekræftet tid på samme dag og klokkeslæt? */
export async function harKonflikt(booking) {
  const andre = await andreSammeTid(booking);
  return andre.some(erBekraeftet);
}

/**
 * Lytter på udbyderens anmodninger, mens appen er åben, og sender en
 * notifikation når der kommer en ny — eller når en kunde afbestiller.
 * Første gang huskes bare hvad der allerede ligger, så man ikke får
 * notifikationer om gamle anmodninger, hver gang appen åbnes.
 * onAntalNye får antallet af ubesvarede anmodninger — til tallet på fanen.
 */
export function foelgNyeAnmodninger(udbyderId, onAntalNye) {
  let kendte = null; // id → status

  return onValue(ref(rtdb, `Anmodninger/${udbyderId}`), (snap) => {
    const liste = tilListe(snap.val());
    if (kendte) {
      for (const b of liste) {
        const foer = kendte[b.id];
        const hvornaar = `${kortDato(fraIso(b.dato))} kl. ${b.tid}`;
        if (!foer && b.status === 'afventer') {
          sendNu(`Ny anmodning fra ${b.kundeNavn}`, `${b.stilart} · ${b.kropsdel} · ${hvornaar}`);
        } else if (foer && foer !== 'afbestilt' && b.status === 'afbestilt') {
          sendNu(`${b.kundeNavn} har afbestilt`, `${hvornaar} er ledig igen.`);
        }
      }
    }
    kendte = {};
    for (const b of liste) kendte[b.id] = b.status;
    if (onAntalNye) onAntalNye(delIndbakke(liste).nye.length);
  }, (fejl) => console.log('Kunne ikke følge anmodninger', fejl));
}
