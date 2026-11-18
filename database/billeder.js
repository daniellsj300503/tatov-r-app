// Billeder fra kameraet (07) eller galleriet.
//
// Kameraet og galleriet giver en sti til en midlertidig fil, som telefonen
// selv kan finde på at slette. Derfor kopieres billedet over i appens egen
// mappe med expo-file-system, før stien gemmes.
//
// Billederne ligger kun på telefonen. Skal en tatovør på en anden telefon kunne
// se dem, skal de uploades til Firebase Storage — det kommer sammen med Firebase.

import * as ImagePicker from 'expo-image-picker';
import { File, Directory, Paths } from 'expo-file-system';

/** Kopiér et billede til appens mappe. Går det galt, bruges den oprindelige sti. */
export function gemBilledePermanent(uri, mappe = 'billeder') {
  try {
    const dir = new Directory(Paths.document, mappe);
    if (!dir.exists) dir.create({ intermediates: true });
    const endelse = (uri.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
    const navn = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${endelse}`;
    const maal = new File(dir, navn);
    new File(uri).copy(maal);
    return maal.uri;
  } catch (e) {
    console.log('Kunne ikke kopiere billedet', e);
    return uri;
  }
}

/** Vælg ét billede fra galleriet. Giver stien, eller null hvis man fortryder. */
export async function vaelgFraGalleri() {
  const resultat = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (resultat.canceled || !resultat.assets || resultat.assets.length === 0) return null;
  return resultat.assets[0].uri;
}
