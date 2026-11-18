// Kortet i listen på forsiden. Vurderingen står øverst og tydeligt, og
// nederst står hvornår personen er ledig, og hvad det koster.
// Har tatovøren lagt billeder op, vises de tre nyeste i stedet for pladsholderne.

import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Avatar, { Flise } from './Avatar';
import Stjerner from './Stjerner';
import { Maerkat } from './Chip';
import { HeletMaerke } from './Portfolio';
import { usePortfolio } from '../database/hooks';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import { STILARTER } from '../data/udbydere';
import { findSted, ledigTekst, kr } from '../data/hjaelpere';

export default function UdbyderKort({ udbyder, indeks = 0, onPress }) {
  const sted = findSted(udbyder.stedId);
  const venteliste = !!udbyder.venteliste;
  const specialer = udbyder.stilarter.map((id) => STILARTER.find((s) => s.id === id).navn);
  const billeder = usePortfolio(udbyder.id);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [GS.kort, pressed && { opacity: 0.8 }]}>
      <View style={[GS.raekke, { gap: 12 }]}>
        <Avatar initialer={udbyder.initialer} stoerrelse={54} indeks={indeks} />
        <View style={{ flex: 1 }}>
          <Text style={GS.kortTitel}>{udbyder.navn}</Text>
          <Text style={GS.kortUnder} numberOfLines={1}>
            {sted.navn} · {sted.omraade}
          </Text>
          <View style={{ marginTop: 6 }}>
            <Stjerner vurdering={udbyder.vurdering} antal={udbyder.antalAnmeldelser} stoerrelse={14} />
          </View>
        </View>
      </View>

      <View style={[GS.chipRaekke, { marginTop: 12, gap: 6 }]}>
        {specialer.slice(0, 3).map((s) => <Maerkat key={s} tekst={s} />)}
      </View>

      <View style={[GS.raekke, { gap: 6, marginTop: 12 }]}>
        {billeder.length > 0
          ? billeder.slice(0, 3).map((b) => (
            <View key={b.id} style={{ flex: 1 }}>
              <Image source={{ uri: b.uri }} style={GS.kortBillede} />
              {b.helet ? <HeletMaerke lille /> : null}
            </View>
          ))
          : udbyder.portfolio.slice(0, 3).map((ikon, i) => (
            <Flise key={`${ikon}${i}`} ikon={ikon} indeks={i} style={{ flex: 1, aspectRatio: 1.4 }} />
          ))}
      </View>

      <View style={GS.kortBund}>
        <View style={[GS.raekke, { gap: 6 }]}>
          <Ionicons
            name="time-outline"
            size={16}
            color={venteliste ? Farver.advarsel : Farver.accent}
          />
          <Text style={{ fontSize: 14, fontWeight: '600', color: venteliste ? Farver.advarsel : Farver.accent }}>
            {ledigTekst(udbyder)}
          </Text>
        </View>
        <Text style={GS.meta}>
          Fra <Text style={{ fontWeight: '600', color: Farver.tekst }}>{kr(udbyder.minimumspris)}</Text>
        </Text>
      </View>
    </Pressable>
  );
}
