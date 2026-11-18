// Et studie: info, hvem der arbejder der, og vej til kortet.

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Avatar from '../components/Avatar';
import Stjerner from '../components/Stjerner';
import { Maerkat } from '../components/Chip';
import Knap from '../components/Knap';
import { GlobalStyle as GS, Farver, Toner } from '../styles/GlobalStyle';
import { useAppAnmeldelser } from '../database/hooks';
import {
  findSted, udbydereVed, ledigTekst, samletVurdering,
} from '../data/hjaelpere';

export default function StedScreen({ navigation, route }) {
  const sted = findSted(route.params.stedId);
  const appAnmeldelser = useAppAnmeldelser();
  if (!sted) return null;

  const udbydere = udbydereVed(sted.id);

  // Kom man hertil fra kortet, ligger kortet lige bagved — så går vi bare tilbage.
  // Ellers skifter vi over på Kort-fanen og beder den centrere på stedet.
  const visPaaKort = () => {
    if (route.params.fraKort) {
      navigation.goBack();
    } else {
      navigation.navigate('KortFane', { screen: 'Kort', params: { stedId: sted.id, tid: Date.now() } });
    }
  };

  return (
    <ScrollView style={GS.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={[GS.hero, { backgroundColor: Toner[1], height: 170 }]}>
        <Ionicons name="color-palette-outline" size={84} color="#3A362F" />
      </View>

      <View style={{ padding: 20 }}>
        <Text style={GS.lille}>Tatoveringsstudie</Text>
        <Text style={[GS.overskrift, { marginTop: 2 }]}>{sted.navn}</Text>
        <View style={{ marginTop: 10 }}>
          <Stjerner vurdering={sted.vurdering} antal={sted.antalAnmeldelser} stoerrelse={18} />
        </View>

        <View style={[GS.chipRaekke, { marginTop: 14, gap: 6 }]}>
          {sted.maerker.map((m) => <Maerkat key={m} tekst={m} />)}
        </View>

        <View style={[GS.panel, { marginTop: 18 }]}>
          <View style={GS.panelRaekke}>
            <Ionicons name="location-outline" size={20} color={Farver.daempet} />
            <Text style={[GS.broedtekst, { flex: 1, fontSize: 15 }]}>{sted.adresse}</Text>
          </View>
          <View style={[GS.panelRaekke, GS.panelRaekkeSidst]}>
            <Ionicons name="time-outline" size={20} color={Farver.daempet} />
            <Text style={[GS.broedtekst, { flex: 1, fontSize: 15 }]}>Åbent til kl. {sted.aabentTil} i dag</Text>
          </View>
        </View>

        <Knap titel="Vis på kort" variant="sekundaer" onPress={visPaaKort} style={{ marginTop: 14 }} />

        <Text style={[GS.broedtekst, { marginTop: 10 }]}>{sted.om}</Text>

        <View style={GS.sektion}>
          <Text style={GS.underoverskrift}>Artister her ({udbydere.length})</Text>
          {udbydere.map((u, i) => (
            <Pressable
              key={u.id}
              onPress={() => navigation.navigate('Udbyder', { udbyderId: u.id })}
              style={({ pressed }) => [GS.kort, GS.raekke, { gap: 12 }, pressed && { opacity: 0.8 }]}
            >
              <Avatar initialer={u.initialer} indeks={i} />
              <View style={{ flex: 1 }}>
                <Text style={GS.kortTitel}>{u.navn}</Text>
                <View style={{ marginTop: 4 }}>
                  <Stjerner
                    vurdering={samletVurdering(u, appAnmeldelser).vurdering}
                    antal={samletVurdering(u, appAnmeldelser).antal}
                    stoerrelse={13}
                  />
                </View>
                <Text style={{
                  fontSize: 13, fontWeight: '600', marginTop: 5, color: u.venteliste ? Farver.advarsel : Farver.accent,
                }}>
                  {ledigTekst(u)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Farver.svag} />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
