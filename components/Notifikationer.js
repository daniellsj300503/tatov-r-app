// Notifikationer, bygget som components/Notifications.js i 09_notifications.
// Appen bruger lokale notifikationer: de planlægges på telefonen og virker i Expo Go.

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Spørg om tilladelse (samme mønster som registerForPush i 09)
export async function bedOmTilladelse() {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return true;
}

async function harTilladelse() {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// Send en notifikation med det samme — fx når en booking er gennemført.
// Fejler den, sluges fejlen: en notifikation må aldrig få en booking til at
// se ud som om den gik galt.
export async function sendNu(titel, tekst) {
  try {
    if (!(await harTilladelse())) return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title: titel, body: tekst },
      trigger: null,
    });
  } catch (e) {
    console.log('Notifikation kunne ikke sendes', e);
    return null;
  }
}

// Planlæg påmindelser til en booking: aftenen før kl. 18 og en time før.
// Kun påmindelser der ligger ude i fremtiden bliver planlagt.
// Returnerer id'erne, så de kan annulleres hvis bookingen afbestilles.
export async function planlaegPaamindelser({ tidspunkt, udbyderNavn, stedNavn, tid }) {
  try {
    if (!(await harTilladelse())) return [];
  } catch (e) {
    return [];
  }

  const aftenenFoer = new Date(tidspunkt);
  aftenenFoer.setDate(aftenenFoer.getDate() - 1);
  aftenenFoer.setHours(18, 0, 0, 0);

  const enTimeFoer = new Date(tidspunkt.getTime() - 60 * 60 * 1000);

  const paamindelser = [
    {
      dato: aftenenFoer,
      titel: 'Din tid er i morgen',
      tekst: `Kl. ${tid} hos ${udbyderNavn}, ${stedNavn}.`,
    },
    {
      dato: enTimeFoer,
      titel: 'Om en time',
      tekst: `Du skal til ${udbyderNavn} kl. ${tid}.`,
    },
  ];

  const ids = [];
  for (const p of paamindelser) {
    if (p.dato <= new Date()) continue;
    try {
      // 09-vejledningen: en trigger skal have en type, ellers fejler den
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: p.titel, body: p.tekst },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.dato },
      });
      ids.push(id);
    } catch (e) {
      console.log('Påmindelse kunne ikke planlægges', e);
    }
  }
  return ids;
}

export async function annullerPaamindelser(ids = []) {
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.log('Kunne ikke annullere notifikation', id, e);
    }
  }
}
