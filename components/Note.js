// En lille boks med et ikon og en forklarende tekst.

import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';

export default function Note({ children, ikon = 'information-circle-outline', neutral = false, style }) {
  return (
    <View style={[GS.note, neutral && GS.noteNeutral, style]}>
      <Ionicons name={ikon} size={20} color={neutral ? Farver.daempet : Farver.accent} />
      <Text style={[GS.noteTekst, neutral && GS.noteTekstNeutral]}>{children}</Text>
    </View>
  );
}
