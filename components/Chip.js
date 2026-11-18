// Chip bruges til filtre og valg (fx stilart). Maerkat er den samme form,
// men kan ikke trykkes på — bruges til at vise fx specialer på en profil.

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { GlobalStyle as GS } from '../styles/GlobalStyle';

export default function Chip({ tekst, valgt, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!valgt }}
      style={({ pressed }) => [GS.chip, valgt && GS.chipValgt, pressed && { opacity: 0.7 }]}
    >
      <Text style={[GS.chipTekst, valgt && GS.chipTekstValgt]}>{tekst}</Text>
    </Pressable>
  );
}

export function Maerkat({ tekst }) {
  return (
    <View style={GS.maerkat}>
      <Text style={GS.maerkatTekst}>{tekst}</Text>
    </View>
  );
}
