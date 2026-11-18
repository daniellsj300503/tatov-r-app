// Vurdering som stjerner plus tal. Brugertesten viste at vurderingen var for
// utydelig, så den vises nu med guldstjerner og et fedt tal.

import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import { decimal } from '../data/hjaelpere';

export default function Stjerner({ vurdering, antal, stoerrelse = 15 }) {
  const stjerner = [1, 2, 3, 4, 5].map((n) => {
    if (vurdering >= n) return 'star';
    if (vurdering >= n - 0.5) return 'star-half';
    return 'star-outline';
  });

  return (
    <View style={GS.stjerneRaekke} accessibilityLabel={`${decimal(vurdering)} ud af 5 stjerner`}>
      {stjerner.map((navn, i) => (
        <Ionicons key={i} name={navn} size={stoerrelse} color={Farver.stjerne} />
      ))}
      <Text style={[GS.vurderingTal, { fontSize: stoerrelse + 1 }]}>{decimal(vurdering)}</Text>
      {antal != null ? <Text style={GS.vurderingAntal}>({antal})</Text> : null}
    </View>
  );
}
