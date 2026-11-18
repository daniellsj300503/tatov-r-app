// Kontoen: hvem er logget ind, notifikationer, og log ud (signOut fra 06).
// Bruges både af kunder og udbydere — en udbyder ser sit sted og sine anmodninger.
// Er man ikke logget ind, vises login og opret bruger her.

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';
import {
  auth, rtdb, ref, onValue, signOut, BRUGER_FIREBASE,
} from '../database/db';
import { nulstilLokalDatabase } from '../database/lokalDatabase';
import { nulstilLokalLogin } from '../database/lokalLogin';
import { useBruger } from '../database/hooks';
import AuthScreen from './AuthScreen';
import Avatar from '../components/Avatar';
import Knap from '../components/Knap';
import Note from '../components/Note';
import { bedOmTilladelse } from '../components/Notifikationer';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import { findUdbyder, findSted, initialerFra } from '../data/hjaelpere';

export default function KontoScreen() {
  const { user, profil: bruger } = useBruger();
  const [antalBookinger, setAntalBookinger] = useState(0);
  const [notifikationerTil, setNotifikationerTil] = useState(false);

  const uid = user ? user.uid : null;

  useEffect(() => {
    if (!uid) return;
    Notifications.getPermissionsAsync().then(({ status }) => setNotifikationerTil(status === 'granted'));
  }, [uid]);

  // En udbyder ser sine anmodninger, en kunde sine egne bookinger
  const udbyder = bruger && bruger.rolle === 'udbyder' ? findUdbyder(bruger.udbyderId) : null;
  const taelleSti = udbyder ? `Anmodninger/${udbyder.id}` : `Bookinger/${uid}`;
  useEffect(() => {
    if (!uid || !bruger) return undefined;
    return onValue(ref(rtdb, taelleSti), (snap) => {
      setAntalBookinger(snap.exists() ? Object.keys(snap.val()).length : 0);
    });
  }, [uid, taelleSti, bruger]);

  const slaaNotifikationerTil = async () => {
    const ok = await bedOmTilladelse();
    setNotifikationerTil(!!ok);
    if (!ok) {
      Alert.alert(
        'Notifikationer er slået fra',
        'Du kan slå dem til for appen i telefonens Indstillinger. (Påmindelser virker kun på en rigtig telefon, ikke i en simulator.)',
      );
    }
  };

  const logUd = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      Alert.alert('Kunne ikke logge ud', e.message);
    }
  };

  // Kun mens alt ligger på telefonen: start forfra med en tom app
  const nulstil = () => {
    Alert.alert(
      'Nulstil testdata?',
      'Alle brugere, bookinger, beskeder, anmeldelser og portfolio-billeder på denne telefon bliver slettet.',
      [
        { text: 'Fortryd', style: 'cancel' },
        {
          text: 'Nulstil',
          style: 'destructive',
          onPress: async () => {
            await nulstilLokalDatabase();
            await nulstilLokalLogin();
          },
        },
      ],
    );
  };

  // Gæst: vis login og opret bruger
  if (!user) {
    return (
      <AuthScreen tekst="Du kan se tatovører, priser og kort uden at logge ind. For at sende en anmodning skal du have en bruger." />
    );
  }

  const navn = bruger && bruger.navn ? bruger.navn : 'Ukendt navn';
  const initialer = initialerFra(navn);
  const sted = udbyder ? findSted(udbyder.stedId) : null;

  return (
    <ScrollView style={GS.container} contentContainerStyle={GS.skaermIndhold}>
      <View style={[GS.raekke, { gap: 14, marginBottom: 24 }]}>
        <Avatar initialer={initialer} stoerrelse={64} />
        <View style={{ flex: 1 }}>
          <Text style={[GS.overskrift, { fontSize: 24 }]}>{navn}</Text>
          <Text style={GS.meta}>{user.email}</Text>
        </View>
      </View>

      {udbyder ? (
        <View style={[GS.panel, { marginBottom: 20 }]}>
          <View style={GS.panelRaekke}>
            <Ionicons name="color-palette-outline" size={20} color={Farver.daempet} />
            <Text style={[GS.broedtekst, { flex: 1, fontSize: 15 }]}>Logget ind som</Text>
            <Text style={GS.titel}>{udbyder.navn}</Text>
          </View>
          <View style={[GS.panelRaekke, GS.panelRaekkeSidst]}>
            <Ionicons name="storefront-outline" size={20} color={Farver.daempet} />
            <Text style={[GS.broedtekst, { flex: 1, fontSize: 15 }]}>Arbejder hos</Text>
            <Text style={GS.titel}>{sted.navn}</Text>
          </View>
        </View>
      ) : null}

      <View style={[GS.panel, { marginBottom: 20 }]}>
        <View style={GS.panelRaekke}>
          <Ionicons name="calendar-outline" size={20} color={Farver.daempet} />
          <Text style={[GS.broedtekst, { flex: 1, fontSize: 15 }]}>
            {udbyder ? 'Anmodninger og bookinger' : 'Bookinger i alt'}
          </Text>
          <Text style={GS.titel}>{antalBookinger}</Text>
        </View>
        <View style={[GS.panelRaekke, GS.panelRaekkeSidst]}>
          <Ionicons name="notifications-outline" size={20} color={Farver.daempet} />
          <Text style={[GS.broedtekst, { flex: 1, fontSize: 15 }]}>{udbyder ? 'Notifikationer' : 'Påmindelser'}</Text>
          <Text style={[GS.titel, { color: notifikationerTil ? Farver.accent : Farver.daempet }]}>
            {notifikationerTil ? 'Til' : 'Fra'}
          </Text>
        </View>
      </View>

      {!notifikationerTil ? (
        <>
          <Note style={{ marginBottom: 14 }}>
            {udbyder
              ? 'Slå notifikationer til, så får du besked, når en kunde sender en anmodning eller afbestiller.'
              : 'Slå notifikationer til, så minder vi dig om din tid aftenen før og en time før.'}
          </Note>
          <Knap titel="Slå notifikationer til" variant="sekundaer" onPress={slaaNotifikationerTil} />
        </>
      ) : null}

      <Knap titel="Log ud" onPress={logUd} style={{ marginTop: 20 }} />

      {!BRUGER_FIREBASE ? (
        <>
          <Note neutral ikon="phone-portrait-outline" style={{ marginTop: 16, marginBottom: 12 }}>
            {udbyder
              ? 'Testversion: brugere og bookinger gemmes på denne telefon. Log ud og ind som kunde for at sende en anmodning til dig selv.'
              : 'Testversion: brugere og bookinger gemmes på denne telefon. Vil du prøve tatovørsiden, så log ud, og opret en bruger med "Jeg er tatovør".'}
          </Note>
          <Knap titel="Nulstil testdata" variant="sekundaer" onPress={nulstil} />
        </>
      ) : null}

      <Text style={[GS.lille, { textAlign: 'center', marginTop: 20 }]}>
        Navne, priser og de første anmeldelser i appen er opdigtede.
      </Text>
    </ScrollView>
  );
}
