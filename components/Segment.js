// Segmentkontrol — den grå bjælke hvor ét valg er markeret med hvidt.
// Bruges fx til at vælge størrelse, når man sender en anmodning.

import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { GlobalStyle as GS } from '../styles/GlobalStyle';

export default function Segment({ valg, valgt, onVaelg, style }) {
  return (
    <View style={[GS.segment, style]}>
      {valg.map((v) => {
        const aktiv = v.id === valgt;
        return (
          <Pressable
            key={String(v.id)}
            onPress={() => onVaelg(v.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: aktiv }}
            style={[GS.segmentValg, aktiv && GS.segmentValgAktiv]}
          >
            <Text numberOfLines={1} style={[GS.segmentTekst, aktiv && GS.segmentTekstAktiv]}>
              {v.navn}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
