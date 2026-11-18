// Beskeder mellem kunde og tatovør om én booking.
// Bruges af begge sider — rolle ('kunde' eller 'udbyder') afgør, hvem der er "mig".
//
// Spørgeskemaet: én kunde skrev, at hun skal kunne tale med tatovøren, før
// hun booker, og tatovørerne vil have færre beskeder frem og tilbage. Derfor
// hører samtalen til anmodningen: alt om motiv, pris og tid står ét sted.
//
// Beskederne hentes live med onValue (05), og samtalen markeres som læst,
// så længe den er åben.

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { auth, rtdb, ref, onValue } from '../database/db';
import { useBruger } from '../database/hooks';
import { sendBesked, markerLaest, MAX_BESKED } from '../database/beskeder';
import { fejlbesked } from '../database/fejl';
import Avatar from '../components/Avatar';
import Note from '../components/Note';
import StatusMaerke from '../components/StatusMaerke';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import {
  findUdbyder, beskederI, beskedTid, kortDato, fraIso, bookingResume, initialerFra,
} from '../data/hjaelpere';

export default function SamtaleScreen({ navigation, route }) {
  const { id, rolle } = route.params;
  const { profil } = useBruger();
  const [booking, setBooking] = useState(null);
  const [samtale, setSamtale] = useState(null);
  const [indlaeser, setIndlaeser] = useState(true);
  const [tekst, setTekst] = useState('');
  const [sender, setSender] = useState(false);
  const listeRef = useRef(null);

  const erKunde = rolle === 'kunde';
  const udbyderId = route.params.udbyderId;

  // Kunden læser sin egen kopi af bookingen, tatovøren sin (se database/bookinger.js)
  const bookingSti = erKunde
    ? `Bookinger/${auth.currentUser ? auth.currentUser.uid : 'ingen'}/${id}`
    : `Anmodninger/${udbyderId}/${id}`;

  useEffect(() => onValue(
    ref(rtdb, bookingSti),
    (snap) => setBooking(snap.exists() ? { ...snap.val(), id } : null),
    () => {},
  ), [bookingSti, id]);

  useEffect(() => onValue(
    ref(rtdb, `Samtaler/${id}`),
    (snap) => {
      setSamtale(snap.val());
      setIndlaeser(false);
    },
    (fejl) => {
      setIndlaeser(false);
      Alert.alert('Kunne ikke hente beskederne', fejlbesked(fejl));
    },
  ), [id]);

  const beskeder = beskederI(samtale);

  // Er samtalen åben, er beskederne læst — også dem der kommer, mens man kigger
  useEffect(() => {
    markerLaest(id, rolle).catch(() => {});
  }, [id, rolle, beskeder.length]);

  // Navnet på den anden part står i headeren
  const andenNavn = booking ? (erKunde ? booking.udbyderNavn : booking.kundeNavn) : '';
  useEffect(() => {
    if (andenNavn) navigation.setOptions({ title: andenNavn.split(' ')[0] });
  }, [navigation, andenNavn]);

  if (indlaeser) {
    return (
      <View style={[GS.container, GS.center]}>
        <ActivityIndicator size="large" color={Farver.accent} />
      </View>
    );
  }

  const mitNavn = erKunde
    ? (profil && profil.navn) || 'Kunde'
    : (findUdbyder(udbyderId) || {}).navn || 'Tatovør';
  const lukket = booking && booking.status === 'afbestilt';
  const kanSende = tekst.trim().length > 0 && !sender && !lukket;

  const send = async () => {
    if (!kanSende) return;
    try {
      setSender(true);
      await sendBesked(id, rolle, mitNavn, tekst);
      setTekst('');
    } catch (e) {
      Alert.alert('Beskeden blev ikke sendt', fejlbesked(e));
    } finally {
      setSender(false);
    }
  };

  const top = booking ? (
    <View style={[GS.kort, { marginBottom: 18 }]}>
      <View style={[GS.raekke, { gap: 12 }]}>
        <Avatar initialer={erKunde ? booking.initialer : initialerFra(booking.kundeNavn)} stoerrelse={42} />
        <View style={{ flex: 1 }}>
          <Text style={GS.titel}>{andenNavn}</Text>
          <Text style={GS.lille}>{kortDato(fraIso(booking.dato))} kl. {booking.tid}</Text>
        </View>
        <StatusMaerke booking={booking} />
      </View>
      <Text style={[GS.meta, { marginTop: 10 }]}>{bookingResume(booking)}</Text>
    </View>
  ) : (
    <Note neutral style={{ marginBottom: 18 }}>Bookingen findes ikke længere, men beskederne er gemt.</Note>
  );

  const tom = (
    <View style={[GS.tomTilstand, { paddingVertical: 24 }]}>
      <Ionicons name="chatbubbles-outline" size={36} color={Farver.svag} />
      <Text style={[GS.meta, { marginTop: 10, textAlign: 'center', maxWidth: 290 }]}>
        {erKunde
          ? `Har du spørgsmål til motiv, placering eller pris? Skriv til ${andenNavn.split(' ')[0] || 'tatovøren'} her.`
          : 'Mangler du noget for at kunne svare på anmodningen? Spørg kunden her — så står det hele ét sted.'}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={GS.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <FlatList
        ref={listeRef}
        data={beskeder}
        keyExtractor={(b) => b.id}
        contentContainerStyle={GS.skaermIndhold}
        ListHeaderComponent={top}
        ListEmptyComponent={tom}
        onContentSizeChange={() => listeRef.current && listeRef.current.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const min = item.fra === rolle;
          return (
            <View style={[GS.bobleRaekke, min && GS.bobleRaekkeMin]}>
              <View style={[GS.boble, min && GS.bobleMin]}>
                <Text style={[GS.bobleTekst, min && GS.bobleTekstMin]}>{item.tekst}</Text>
              </View>
              <Text style={GS.bobleTid}>{min ? 'Dig' : item.navn.split(' ')[0]} · {beskedTid(item.tid)}</Text>
            </View>
          );
        }}
      />

      {lukket ? (
        <View style={GS.bund}>
          <Text style={[GS.meta, { flex: 1, textAlign: 'center' }]}>Bookingen er afbestilt. Du kan ikke skrive mere her.</Text>
        </View>
      ) : (
        <View style={[GS.bund, { alignItems: 'flex-end' }]}>
          <TextInput
            style={GS.beskedFelt}
            value={tekst}
            onChangeText={(t) => setTekst(t.slice(0, MAX_BESKED))}
            placeholder="Skriv en besked"
            placeholderTextColor={Farver.svag}
            multiline
          />
          <Pressable
            onPress={send}
            disabled={!kanSende}
            style={[GS.sendKnap, !kanSende && { backgroundColor: Farver.inaktiv }]}
            accessibilityRole="button"
            accessibilityLabel="Send besked"
          >
            {sender
              ? <ActivityIndicator color={Farver.baggrund} />
              : <Ionicons name="arrow-up" size={22} color={kanSende ? Farver.baggrund : Farver.daempet} />}
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
