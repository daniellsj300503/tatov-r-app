// Forsiden: filtrér på stilart, og se listen over tatovører.
// Søgning og liste ligger på samme skærm med vilje — brugertesten viste at
// folk falder fra i søgningen, fordi der er for mange at vælge imellem.
// Derfor sorteres listen med det bedste match øverst.
// Vurderingen tæller også de anmeldelser, kunder har skrevet i appen.

import React, { useState } from 'react';
import { View, Text, FlatList, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useBruger, useAppAnmeldelser } from '../database/hooks';
import Chip from '../components/Chip';
import UdbyderKort from '../components/UdbyderKort';
import Stjerner from '../components/Stjerner';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import { STILARTER, STEDER } from '../data/udbydere';
import { soeg } from '../data/hjaelpere';

export default function HjemScreen({ navigation }) {
  const [stilart, setStilart] = useState(null);
  const { profil } = useBruger();
  const anmeldelser = useAppAnmeldelser();
  const fornavn = profil && profil.navn ? profil.navn.split(' ')[0] : '';

  const resultater = soeg({ stilart, anmeldelser });

  const filtre = (
    <View>
      <Text style={[GS.meta, { marginBottom: 4 }]}>{fornavn ? `Hej ${fornavn}` : 'Hej'}</Text>
      <Text style={[GS.overskrift, { marginBottom: 16 }]}>Find din tatovør</Text>

      <Text style={GS.etiket}>Hvilken stil er du efter?</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20, marginBottom: 18 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        <Chip tekst="Alle" valgt={!stilart} onPress={() => setStilart(null)} />
        {STILARTER.map((s) => (
          <Chip key={s.id} tekst={s.navn} valgt={stilart === s.id} onPress={() => setStilart(s.id)} />
        ))}
      </ScrollView>

      <Text style={[GS.meta, { marginBottom: 12 }]}>
        {resultater.length === 0
          ? 'Ingen matcher'
          : `${resultater.length} ${resultater.length === 1 ? 'tatovør' : 'tatovører'} · bedste match først`}
      </Text>
    </View>
  );

  const stederListe = (
    <View style={GS.sektion}>
      <Text style={GS.underoverskrift}>Studier</Text>
      {STEDER.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => navigation.navigate('Sted', { stedId: s.id })}
          style={({ pressed }) => [GS.kort, GS.raekke, { gap: 12 }, pressed && { opacity: 0.8 }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={GS.kortTitel}>{s.navn}</Text>
            <Text style={GS.kortUnder}>{s.omraade} · åbent til {s.aabentTil}</Text>
            <View style={{ marginTop: 6 }}>
              <Stjerner vurdering={s.vurdering} antal={s.antalAnmeldelser} stoerrelse={13} />
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Farver.svag} />
        </Pressable>
      ))}
    </View>
  );

  // Forsiden har ingen header, så SafeAreaView holder indholdet fri af statuslinjen
  return (
    <SafeAreaView edges={['top']} style={GS.container}>
      <FlatList
        data={resultater}
        keyExtractor={(item) => item.id}
        contentContainerStyle={GS.skaermIndhold}
        ListHeaderComponent={filtre}
        ListFooterComponent={stederListe}
        ListEmptyComponent={(
          <View style={GS.tomTilstand}>
            <Text style={GS.titel}>Ingen matcher filtret</Text>
            <Text style={[GS.meta, { marginTop: 6, textAlign: 'center' }]}>Prøv at vælge "Alle".</Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <UdbyderKort
            udbyder={item}
            indeks={index}
            onPress={() => navigation.navigate('Udbyder', { udbyderId: item.id })}
          />
        )}
      />
    </SafeAreaView>
  );
}
