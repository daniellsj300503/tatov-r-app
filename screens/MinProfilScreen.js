// Tatovørens egen profil: læg billeder op i portfolioen, markér helede
// tatoveringer, og se anmeldelserne fra appen.
//
// Spørgeskemaet: kunderne gav stil og portfolio 4,1 ud af 5 i vigtighed, og
// det sværeste var at finde en tatovør, hvis stil passer. En kunde ville se
// tatoveringerne, når de er helet. Derfor er portfolioen det første her.
//
// Billeder tages med kameraet (07) eller vælges fra galleriet.

import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Image, Modal, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppAnmeldelser, usePortfolio } from '../database/hooks';
import {
  tilfoejBillede, saetHelet, fjernBillede, MAX_BILLEDTEKST,
} from '../database/portfolio';
import { vaelgFraGalleri } from '../database/billeder';
import { fejlbesked } from '../database/fejl';
import Avatar from '../components/Avatar';
import Knap from '../components/Knap';
import Note from '../components/Note';
import KameraComponent from '../components/KameraComponent';
import { PortfolioGitter, BilledeVindue } from '../components/Portfolio';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import {
  findUdbyder, findSted, samletVurdering, appAnmeldelserFor, decimal,
} from '../data/hjaelpere';

export default function MinProfilScreen({ navigation, route }) {
  const { udbyderId } = route.params;
  const udbyder = findUdbyder(udbyderId);
  const sted = findSted(udbyder.stedId);
  const billeder = usePortfolio(udbyderId);
  const appAnmeldelser = useAppAnmeldelser();

  const [visKamera, setVisKamera] = useState(false);
  const [nytUri, setNytUri] = useState(null); // billedet der er ved at blive lagt op
  const [nyTekst, setNyTekst] = useState('');
  const [nyHelet, setNyHelet] = useState(false);
  const [gemmer, setGemmer] = useState(false);
  const [valgt, setValgt] = useState(null); // billedet der vises stort

  const samlet = samletVurdering(udbyder, appAnmeldelser);
  const nyeAnmeldelser = appAnmeldelserFor(udbyderId, appAnmeldelser);
  const antalHelede = billeder.filter((b) => b.helet).length;

  const startNyt = (uri) => {
    setNyTekst('');
    setNyHelet(false);
    setNytUri(uri);
  };

  const fraGalleri = async () => {
    try {
      const uri = await vaelgFraGalleri();
      if (uri) startNyt(uri);
    } catch (e) {
      Alert.alert('Kunne ikke åbne galleriet', 'Prøv igen, eller tag et billede med kameraet.');
    }
  };

  const tilfoej = () => {
    Alert.alert('Nyt billede', 'Hvor skal billedet komme fra?', [
      { text: 'Tag et billede', onPress: () => setVisKamera(true) },
      { text: 'Vælg fra galleriet', onPress: fraGalleri },
      { text: 'Fortryd', style: 'cancel' },
    ]);
  };

  const laegOp = async () => {
    try {
      setGemmer(true);
      await tilfoejBillede(udbyderId, nytUri, nyTekst, nyHelet);
      setNytUri(null);
    } catch (e) {
      Alert.alert('Billedet blev ikke lagt op', fejlbesked(e));
    } finally {
      setGemmer(false);
    }
  };

  const skiftHelet = async () => {
    try {
      await saetHelet(udbyderId, valgt.id, !valgt.helet);
      setValgt({ ...valgt, helet: !valgt.helet });
    } catch (e) {
      Alert.alert('Kunne ikke gemme', fejlbesked(e));
    }
  };

  const slet = () => {
    Alert.alert('Slet billedet?', 'Det forsvinder fra din profil med det samme.', [
      { text: 'Behold', style: 'cancel' },
      {
        text: 'Slet',
        style: 'destructive',
        onPress: async () => {
          try {
            await fjernBillede(udbyderId, valgt.id);
            setValgt(null);
          } catch (e) {
            Alert.alert('Kunne ikke slette', fejlbesked(e));
          }
        },
      },
    ]);
  };

  const tilfoejFelt = (
    <Pressable onPress={tilfoej} style={GS.tilfoejFelt} accessibilityRole="button" accessibilityLabel="Tilføj billede">
      <Ionicons name="add" size={30} color={Farver.daempet} />
      <Text style={GS.lille}>Tilføj</Text>
    </Pressable>
  );

  return (
    <View style={GS.container}>
      <ScrollView contentContainerStyle={GS.skaermIndhold}>
        <View style={[GS.raekke, { gap: 14, marginBottom: 18 }]}>
          <Avatar initialer={udbyder.initialer} stoerrelse={58} />
          <View style={{ flex: 1 }}>
            <Text style={[GS.overskrift, { fontSize: 24 }]}>{udbyder.navn}</Text>
            <Text style={GS.meta}>{sted.navn} · {sted.omraade}</Text>
          </View>
        </View>

        <View style={[GS.panel, GS.statRaekke, { marginBottom: 14 }]}>
          <View style={GS.statFelt}>
            <Text style={GS.statVaerdi}>★ {decimal(samlet.vurdering)}</Text>
            <Text style={GS.statNavn}>{samlet.antal} anmeldelser</Text>
          </View>
          <View style={GS.statFelt}>
            <Text style={GS.statVaerdi}>{nyeAnmeldelser.length}</Text>
            <Text style={GS.statNavn}>Fra appen</Text>
          </View>
          <View style={[GS.statFelt, GS.statFeltSidst]}>
            <Text style={GS.statVaerdi}>{billeder.length}</Text>
            <Text style={GS.statNavn}>Billeder</Text>
          </View>
        </View>

        <View style={GS.knapRaekke}>
          <Knap
            titel="Se som kunde"
            variant="sekundaer"
            onPress={() => navigation.navigate('Udbyder', { udbyderId, forhaandsvisning: true })}
            style={{ flex: 1 }}
          />
          <Knap
            titel="Anmeldelser"
            variant="sekundaer"
            onPress={() => navigation.navigate('Anmeldelser', { udbyderId })}
            style={{ flex: 1 }}
          />
        </View>

        <View style={GS.sektion}>
          <View style={[GS.mellemrum, { marginBottom: 10 }]}>
            <Text style={[GS.underoverskrift, { marginBottom: 0 }]}>Din portfolio</Text>
            {billeder.length > 0 ? (
              <Text style={GS.meta}>{billeder.length} billeder · {antalHelede} helede</Text>
            ) : null}
          </View>

          {billeder.length === 0 ? (
            <Note style={{ marginBottom: 14 }}>
              Kunderne vælger først og fremmest ud fra stil og tidligere arbejde. Læg dine bedste billeder op —
              og gerne nogle af helede tatoveringer, så kunderne kan se, hvordan de holder.
            </Note>
          ) : null}

          <PortfolioGitter billeder={billeder} onTryk={setValgt} ekstra={tilfoejFelt} />
          <Text style={[GS.lille, { marginTop: 10 }]}>Tryk på et billede for at markere det som helet eller slette det.</Text>
        </View>
      </ScrollView>

      {/* Kameraet, som i BookTatoveringScreen. Ét billede ad gangen. */}
      <Modal visible={visKamera} animationType="slide" onRequestClose={() => setVisKamera(false)}>
        <SafeAreaProvider>
          <KameraComponent
            tekst="Tag et billede af en tatovering til din portfolio"
            onBillede={(uri) => {
              setVisKamera(false);
              startNyt(uri);
            }}
            onLuk={() => setVisKamera(false)}
          />
        </SafeAreaProvider>
      </Modal>

      {/* Nyt billede: tekst og om det er helet, før det lægges op */}
      <Modal visible={!!nytUri} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setNytUri(null)}>
        <SafeAreaProvider>
          <SafeAreaView style={GS.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView contentContainerStyle={GS.skaermIndhold} keyboardShouldPersistTaps="handled">
                <Text style={[GS.overskrift, { fontSize: 24, marginBottom: 16 }]}>Nyt billede</Text>
                {nytUri ? <Image source={{ uri: nytUri }} style={GS.nytBillede} /> : null}

                <Text style={[GS.etiket, { marginTop: 18 }]}>Beskrivelse (valgfri)</Text>
                <TextInput
                  style={GS.input}
                  value={nyTekst}
                  onChangeText={(t) => setNyTekst(t.slice(0, MAX_BILLEDTEKST))}
                  placeholder="Fx: Fine line-kvist på underarmen"
                  placeholderTextColor={Farver.svag}
                />

                <View style={[GS.panel, GS.panelRaekke, GS.panelRaekkeSidst, { marginBottom: 8 }]}>
                  <Ionicons name="sparkles-outline" size={20} color={Farver.daempet} />
                  <View style={{ flex: 1 }}>
                    <Text style={GS.titel}>Helet tatovering</Text>
                    <Text style={GS.lille}>Billedet er taget efter heling, ikke lige efter</Text>
                  </View>
                  <Switch
                    value={nyHelet}
                    onValueChange={setNyHelet}
                    trackColor={{ true: Farver.accent }}
                    accessibilityLabel="Helet tatovering"
                  />
                </View>
              </ScrollView>

              <View style={[GS.bund, GS.knapRaekke]}>
                <Knap titel="Fortryd" variant="sekundaer" onPress={() => setNytUri(null)} style={{ flex: 1, marginBottom: 0 }} />
                <Knap titel="Læg op" onPress={laegOp} arbejder={gemmer} style={{ flex: 1.4, marginBottom: 0 }} />
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>

      <BilledeVindue
        billede={valgt}
        onLuk={() => setValgt(null)}
        handlinger={valgt ? (
          <View style={{ marginTop: 12 }}>
            <Knap
              titel={valgt.helet ? 'Fjern mærket "helet"' : 'Markér som helet'}
              variant="sekundaer"
              onPress={skiftHelet}
            />
            <Knap titel="Slet billedet" variant="sekundaer" onPress={slet} />
          </View>
        ) : null}
      />
    </View>
  );
}
