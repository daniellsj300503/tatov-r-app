// Genbrugt knap. Props: titel, onPress, variant ("primaer" eller "sekundaer")
// og inaktiv.
//
// Den inaktive tilstand kom til efter brugertesten: en knap der så aktiv ud,
// men ikke gjorde noget, fik folk til at tro at appen var gået i stå.

import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';

export default function Knap({ titel, onPress, variant = 'primaer', inaktiv = false, arbejder = false, style }) {
  const erPrimaer = variant === 'primaer';

  let knapStil = erPrimaer ? GS.knap : GS.knapSekundaer;
  let tekstStil = erPrimaer ? GS.knapTekst : GS.knapSekundaerTekst;
  if (inaktiv) {
    knapStil = GS.knapInaktiv;
    tekstStil = GS.knapInaktivTekst;
  }

  return (
    <Pressable
      onPress={inaktiv || arbejder ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: inaktiv }}
      style={({ pressed }) => [knapStil, pressed && !inaktiv && { opacity: 0.8 }, style]}
    >
      {arbejder ? (
        <ActivityIndicator color={erPrimaer ? Farver.baggrund : Farver.tekst} />
      ) : (
        <Text style={tekstStil}>{titel}</Text>
      )}
    </Pressable>
  );
}
