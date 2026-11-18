// Skriv en anmeldelse af en tatovør efter en gennemført tid.
// Kun kunder der har været der, kan anmelde (se database/anmeldelser.js), og
// anmeldelsen får mærket "Booket gennem appen".

import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { auth, rtdb, ref, onValue } from '../database/db';
import { skrivAnmeldelse, MAX_ANMELDELSE } from '../database/anmeldelser';
import { fejlbesked } from '../database/fejl';
import Avatar from '../components/Avatar';
import Knap from '../components/Knap';
import Note from '../components/Note';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import { kortDato, fraIso, bookingResume, kanAnmelde } from '../data/hjaelpere';

const ORD = ['', 'Dårligt', 'Ikke så godt', 'Okay', 'Godt', 'Fremragende'];

export default function AnmeldScreen({ navigation, route }) {
  const { id } = route.params;
  const [booking, setBooking] = useState(null);
  const [indlaeser, setIndlaeser] = useState(true);
  const [vurdering, setVurdering] = useState(0);
  const [tekst, setTekst] = useState('');
  const [arbejder, setArbejder] = useState(false);

  const uid = auth.currentUser ? auth.currentUser.uid : null;
  useEffect(() => onValue(
    ref(rtdb, `Bookinger/${uid}/${id}`),
    (snap) => {
      setBooking(snap.exists() ? { ...snap.val(), id } : null);
      setIndlaeser(false);
    },
    () => setIndlaeser(false),
  ), [uid, id]);

  if (indlaeser) {
    return (
      <View style={[GS.container, GS.center]}>
        <ActivityIndicator size="large" color={Farver.accent} />
      </View>
    );
  }
  if (!booking || (!kanAnmelde(booking) && !arbejder)) {
    return (
      <View style={[GS.container, GS.center]}>
        <Text style={[GS.meta, { textAlign: 'center' }]}>
          {booking && booking.anmeldt ? 'Du har allerede anmeldt denne tid. Tak!' : 'Denne tid kan ikke anmeldes.'}
        </Text>
      </View>
    );
  }

  const fornavn = booking.udbyderNavn.split(' ')[0];

  let mangler = null;
  if (vurdering === 0) mangler = 'Vælg mellem 1 og 5 stjerner';
  else if (tekst.trim().length < 10) mangler = 'Skriv et par ord om, hvordan det gik';

  const gem = async () => {
    try {
      setArbejder(true);
      await skrivAnmeldelse(booking, vurdering, tekst);
      Alert.alert('Tak for din anmeldelse', `Den kan nu ses på ${fornavn}s profil.`);
      navigation.goBack();
    } catch (e) {
      setArbejder(false);
      Alert.alert('Anmeldelsen blev ikke gemt', fejlbesked(e));
    }
  };

  return (
    <KeyboardAvoidingView
      style={GS.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView contentContainerStyle={GS.skaermIndhold} keyboardShouldPersistTaps="handled">
        <View style={[GS.raekke, { gap: 12, marginBottom: 22 }]}>
          <Avatar initialer={booking.initialer} stoerrelse={52} />
          <View style={{ flex: 1 }}>
            <Text style={GS.titel}>{booking.udbyderNavn}</Text>
            <Text style={GS.lille}>{kortDato(fraIso(booking.dato))} · {bookingResume(booking)}</Text>
          </View>
        </View>

        <Text style={GS.etiket}>Hvordan var det hos {fornavn}?</Text>
        <View style={[GS.raekke, { gap: 6, marginBottom: 6 }]}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => setVurdering(n)}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={`${n} ${n === 1 ? 'stjerne' : 'stjerner'}`}
              accessibilityState={{ selected: vurdering === n }}
            >
              <Ionicons name={vurdering >= n ? 'star' : 'star-outline'} size={38} color={Farver.stjerne} />
            </Pressable>
          ))}
        </View>
        <Text style={[GS.meta, { marginBottom: 22, minHeight: 20 }]}>{ORD[vurdering]}</Text>

        <Text style={GS.etiket}>Din anmeldelse</Text>
        <TextInput
          style={[GS.input, GS.inputFlerlinje]}
          value={tekst}
          onChangeText={(t) => setTekst(t.slice(0, MAX_ANMELDELSE))}
          multiline
          placeholder="Fx: Hun tegnede motivet om, til det sad helt rigtigt. Rent studie og god snak undervejs."
          placeholderTextColor={Farver.svag}
        />
        <Text style={GS.tegnTaeller}>{tekst.length} / {MAX_ANMELDELSE}</Text>

        <Note neutral ikon="shield-checkmark-outline">
          Anmeldelsen vises med dit fornavn og første bogstav i efternavnet, og med mærket "Booket gennem appen".
        </Note>
      </ScrollView>

      <View style={[GS.bund, { flexDirection: 'column', alignItems: 'stretch', gap: 0 }]}>
        <Knap titel="Send anmeldelse" onPress={gem} inaktiv={!!mangler} arbejder={arbejder} />
        {mangler ? <Text style={GS.hjaelpetekst}>{mangler}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}
