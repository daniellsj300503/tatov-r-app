// Alle anmeldelser af én udbyder, med en samlet oversigt øverst.
// Listen er en FlatList, som i 03_Lister.
// Anmeldelser skrevet i appen står øverst (nyeste først), derefter de gamle.

import React from 'react';
import { View, Text, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Avatar from '../components/Avatar';
import Stjerner from '../components/Stjerner';
import { useAppAnmeldelser } from '../database/hooks';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import {
  findUdbyder, anmeldelserFor, appAnmeldelserFor, samletVurdering, decimal, fuldDato,
} from '../data/hjaelpere';

export default function AnmeldelserScreen({ route }) {
  const udbyder = findUdbyder(route.params.udbyderId);
  const appAnmeldelser = useAppAnmeldelser();
  const anmeldelser = [
    ...appAnmeldelserFor(udbyder.id, appAnmeldelser).map((a) => ({ ...a, dato: fuldDato(a.dato) })),
    ...anmeldelserFor(udbyder.id),
  ];
  const samlet = samletVurdering(udbyder, appAnmeldelser);

  const oversigt = (
    <View style={[GS.kort, { alignItems: 'center', paddingVertical: 22, marginBottom: 18 }]}>
      <Text style={{ fontSize: 44, fontWeight: '700', color: Farver.tekst }}>{decimal(samlet.vurdering)}</Text>
      <View style={{ marginTop: 6 }}>
        <Stjerner vurdering={samlet.vurdering} stoerrelse={20} />
      </View>
      <Text style={[GS.meta, { marginTop: 8 }]}>
        {samlet.antal} anmeldelser{samlet.nyeIAppen > 0 ? ` · ${samlet.nyeIAppen} skrevet i appen` : ''}
      </Text>
      <Text style={[GS.lille, { marginTop: 10, textAlign: 'center' }]}>
        Kun kunder der har fået lavet en tatovering gennem appen, kan skrive en anmeldelse.
      </Text>
    </View>
  );

  return (
    <View style={GS.container}>
      <FlatList
        data={anmeldelser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={GS.skaermIndhold}
        ListHeaderComponent={oversigt}
        renderItem={({ item, index }) => (
          <View style={GS.kort}>
            <View style={[GS.raekke, { gap: 11 }]}>
              <Avatar initialer={item.initialer} stoerrelse={38} indeks={index + 1} />
              <View style={{ flex: 1 }}>
                <Text style={GS.titel}>{item.navn}</Text>
                <Text style={GS.lille}>{item.hvad} · {item.dato}</Text>
              </View>
            </View>
            <View style={{ marginTop: 10 }}>
              <Stjerner vurdering={item.vurdering} stoerrelse={14} />
            </View>
            <Text style={[GS.broedtekst, { marginTop: 10 }]}>{item.tekst}</Text>
            {item.bekraeftet ? (
              <View style={[GS.raekke, { gap: 6, marginTop: 10 }]}>
                <Ionicons name="checkmark-circle" size={16} color={Farver.accent} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: Farver.accent }}>Booket gennem appen</Text>
              </View>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}
