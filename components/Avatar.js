// Avatar med initialer, og Flise: et billedfelt med et ikon som pladsholder.
// Flise bruges til portfolio, indtil der kommer rigtige billeder.

import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GlobalStyle as GS, Toner, AvatarToner } from '../styles/GlobalStyle';

export default function Avatar({ initialer, stoerrelse = 48, indeks = 0 }) {
  const tone = AvatarToner[indeks % AvatarToner.length];
  return (
    <View style={[GS.avatar, {
      width: stoerrelse, height: stoerrelse, borderRadius: stoerrelse / 2, backgroundColor: tone.baggrund,
    }]}>
      <Text style={[GS.avatarTekst, { fontSize: stoerrelse * 0.32, color: tone.tekst }]}>{initialer}</Text>
    </View>
  );
}

export function Flise({ ikon, indeks = 0, stoerrelse, ikonStoerrelse = 30, style }) {
  return (
    <View style={[
      GS.flise,
      { backgroundColor: Toner[indeks % Toner.length] },
      stoerrelse ? { width: stoerrelse, height: stoerrelse } : null,
      style,
    ]}>
      <Ionicons name={ikon} size={ikonStoerrelse} color="#3A362F" />
    </View>
  );
}
