// Mine bookinger, hentet live fra Realtime Database med onValue — som
// CarList i 05_Firebase. Når tatovøren svarer, skifter status her med det samme.
// Afbestilling sletter bookingen, annullerer påmindelserne og giver udbyderen
// besked (database/bookinger.js).
//
// Fra hver booking kan man skrive til tatovøren, og når tatoveringen er lavet,
// kan man skrive en anmeldelse. En gæst bliver bedt om at logge ind.

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, ActivityIndicator, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { rtdb, ref, onValue } from '../database/db';
import { useBruger, useUlaeste } from '../database/hooks';
import { afbestilBooking, fjernBooking } from '../database/bookinger';
import { fejlbesked } from '../database/fejl';
import Avatar from '../components/Avatar';
import Knap from '../components/Knap';
import StatusMaerke from '../components/StatusMaerke';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import {
  kr, langDato, kortDato, fraIso, tidspunkt, nedtaelling, tilListe, erKommende, kanAnmelde,
} from '../data/hjaelpere';

const FANER = [
  { id: 'kommende', navn: 'Kommende' },
  { id: 'tidligere', navn: 'Tidligere' },
];

// Lille knap med ikon. ulaest viser en prik, hvis der er nye beskeder.
function LilleKnap({ ikon, tekst, onPress, moerk, ulaest }) {
  return (
    <Pressable
      onPress={onPress}
      style={[GS.knapLille, GS.raekke, { gap: 6 }, moerk && { backgroundColor: Farver.tekst, borderColor: Farver.tekst }]}
      accessibilityRole="button"
    >
      {ikon ? <Ionicons name={ikon} size={15} color={moerk ? Farver.baggrund : Farver.tekst} /> : null}
      <Text style={[GS.knapLilleTekst, moerk && { color: Farver.baggrund }]}>{tekst}</Text>
      {ulaest ? <View style={GS.ulaestPrik} /> : null}
    </Pressable>
  );
}

export default function BookingerScreen({ navigation }) {
  const { user } = useBruger();
  const uid = user ? user.uid : null;
  const [bookinger, setBookinger] = useState({});
  const [indlaeser, setIndlaeser] = useState(true);
  const [fane, setFane] = useState('kommende');
  const { ulaeste } = useUlaeste(Object.keys(bookinger), 'kunde');

  useEffect(() => {
    if (!uid) {
      setBookinger({});
      setIndlaeser(false);
      return undefined;
    }
    setIndlaeser(true);
    const bookingRef = ref(rtdb, `Bookinger/${uid}`);
    const unsubscribe = onValue(
      bookingRef,
      (snap) => {
        setBookinger(snap.val() || {});
        setIndlaeser(false);
      },
      (fejl) => {
        setIndlaeser(false);
        Alert.alert('Kunne ikke hente bookinger', fejlbesked(fejl));
      },
    );
    return unsubscribe;
  }, [uid]);

  // Fra objekt (id → booking) til liste, som i 05.
  // Kommende = tider der stadig gælder. Afviste, aflyste og gennemførte ryger over i Tidligere.
  const nu = new Date();
  const alle = tilListe(bookinger)
    .sort((a, b) => tidspunkt(a.dato, a.tid) - tidspunkt(b.dato, b.tid));
  const kommende = alle.filter((b) => erKommende(b, nu));
  const tidligere = alle.filter((b) => !kommende.includes(b)).reverse();
  const liste = fane === 'kommende' ? kommende : tidligere;

  const afbestil = (booking) => {
    Alert.alert(
      'Afbestil tiden?',
      `${booking.udbyderNavn} · ${langDato(fraIso(booking.dato))} kl. ${booking.tid}`,
      [
        { text: 'Behold', style: 'cancel' },
        {
          text: 'Afbestil',
          style: 'destructive',
          onPress: async () => {
            try {
              await afbestilBooking(booking);
            } catch (e) {
              Alert.alert('Kunne ikke afbestille', fejlbesked(e));
            }
          },
        },
      ],
    );
  };

  const fjern = async (booking) => {
    try {
      await fjernBooking(booking);
    } catch (e) {
      Alert.alert('Kunne ikke fjerne bookingen', fejlbesked(e));
    }
  };

  const aabnSamtale = (booking) => navigation.navigate('Samtale', { id: booking.id, rolle: 'kunde' });
  const anmeld = (booking) => navigation.navigate('Anmeld', { id: booking.id });

  if (!uid) {
    return (
      <View style={[GS.container, GS.center]}>
        <Ionicons name="calendar-outline" size={40} color={Farver.svag} />
        <Text style={[GS.titel, { marginTop: 12 }]}>Log ind for at se dine bookinger</Text>
        <Text style={[GS.meta, { marginTop: 6, textAlign: 'center', maxWidth: 280 }]}>
          Du kan finde en tatovør og udfylde en anmodning uden at logge ind. Du bliver bedt om det, når du sender.
        </Text>
        <Knap titel="Log ind eller opret bruger" onPress={() => navigation.navigate('KontoFane')} style={{ marginTop: 20, alignSelf: 'stretch' }} />
        <Knap titel="Find en tatovør" variant="sekundaer" onPress={() => navigation.navigate('UdforskFane')} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  if (indlaeser) {
    return (
      <View style={[GS.container, GS.center]}>
        <ActivityIndicator size="large" color={Farver.accent} />
      </View>
    );
  }

  const naeste = fane === 'kommende' ? kommende[0] : null;

  const top = (
    <View>
      <View style={GS.faneRaekke}>
        {FANER.map((f) => {
          const aktiv = f.id === fane;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFane(f.id)}
              style={[GS.fane, aktiv && GS.faneAktiv]}
              accessibilityRole="tab"
              accessibilityState={{ selected: aktiv }}
            >
              <Text style={[GS.faneTekst, aktiv && GS.faneTekstAktiv]}>
                {f.navn} ({f.id === 'kommende' ? kommende.length : tidligere.length})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {naeste ? (
        <View style={GS.naesteBooking}>
          <View style={[GS.mellemrum, { marginBottom: 14 }]}>
            <View style={[GS.maerke, { backgroundColor: 'rgba(250,248,245,0.14)' }]}>
              <Text style={[GS.maerkeTekst, { color: Farver.baggrund }]}>{nedtaelling(naeste.dato)}</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#B5AFA6' }}>
              {naeste.status === 'afventer' ? 'Afventer svar' : 'Bekræftet'}
            </Text>
          </View>
          <Text style={GS.naesteBookingDato}>
            {langDato(fraIso(naeste.dato))}{'\n'}kl. {naeste.tid}
          </Text>
          <View style={GS.naesteBookingStreg}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: Farver.baggrund }}>{naeste.udbyderNavn}</Text>
            <Text style={GS.naesteBookingTekst}>{naeste.stedNavn} · {naeste.adresse}</Text>
            <Text style={GS.naesteBookingTekst}>
              {`${naeste.stilart} · ${naeste.kropsdel} · estimat ${kr(naeste.estimatLav)}–${kr(naeste.estimatHoej)}`}
            </Text>
            {naeste.svar ? (
              <Text style={[GS.naesteBookingTekst, { marginTop: 10, fontStyle: 'italic', color: Farver.baggrund }]}>
                "{naeste.svar}" — {naeste.udbyderNavn.split(' ')[0]}
              </Text>
            ) : null}
          </View>
          <View style={[GS.knapRaekke, { marginTop: 16 }]}>
            <Pressable onPress={() => aabnSamtale(naeste)} style={[GS.naesteBookingKnap, { flex: 1 }]} accessibilityRole="button">
              <Ionicons name="chatbubble-outline" size={16} color={Farver.baggrund} />
              <Text style={GS.naesteBookingKnapTekst}>
                {ulaeste[naeste.id] ? `Ny besked (${ulaeste[naeste.id]})` : `Skriv til ${naeste.udbyderNavn.split(' ')[0]}`}
              </Text>
            </Pressable>
            <Pressable onPress={() => afbestil(naeste)} style={GS.naesteBookingKnap} accessibilityRole="button">
              <Text style={GS.naesteBookingKnapTekst}>Afbestil</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {fane === 'kommende' && kommende.length > 1 ? (
        <Text style={[GS.etiket, { marginTop: 8 }]}>Senere</Text>
      ) : null}
    </View>
  );

  return (
    <View style={GS.container}>
      <FlatList
        data={naeste ? liste.slice(1) : liste}
        keyExtractor={(item) => item.id}
        contentContainerStyle={GS.skaermIndhold}
        ListHeaderComponent={top}
        ListEmptyComponent={naeste ? null : (
          <View style={GS.tomTilstand}>
            <Ionicons name="calendar-outline" size={40} color={Farver.svag} />
            <Text style={[GS.titel, { marginTop: 12 }]}>
              {fane === 'kommende' ? 'Ingen kommende tider' : 'Ingen tidligere tider'}
            </Text>
            <Text style={[GS.meta, { marginTop: 6, textAlign: 'center', maxWidth: 260 }]}>
              Når du sender en anmodning til en tatovør, lander den her.
            </Text>
            {fane === 'kommende' ? (
              <Knap
                titel="Find en tid"
                onPress={() => navigation.navigate('UdforskFane')}
                style={{ marginTop: 20, alignSelf: 'stretch' }}
              />
            ) : null}
          </View>
        )}
        renderItem={({ item, index }) => (
          <View style={GS.kort}>
            <View style={[GS.raekke, { gap: 12 }]}>
              <Avatar initialer={item.initialer} stoerrelse={44} indeks={index} />
              <View style={{ flex: 1 }}>
                <Text style={GS.titel}>{item.udbyderNavn}</Text>
                <Text style={GS.lille}>{kortDato(fraIso(item.dato))} kl. {item.tid} · {item.stedNavn}</Text>
              </View>
              <StatusMaerke booking={item} />
            </View>
            <Text style={[GS.meta, { marginTop: 10 }]}>
              {`${item.stilart} · ${item.kropsdel} · ${kr(item.estimatLav)}–${kr(item.estimatHoej)}`}
            </Text>
            {item.billeder && item.billeder.length > 0 ? (
              <View style={[GS.raekke, { gap: 6, marginTop: 10 }]}>
                {item.billeder.slice(0, 4).map((uri) => (
                  <Image key={uri} source={{ uri }} style={{ width: 44, height: 44, borderRadius: 8 }} />
                ))}
              </View>
            ) : null}
            {item.svar ? (
              <Text style={[GS.citat, { marginTop: 10, fontSize: 14 }]}>
                "{item.svar}" — {item.udbyderNavn.split(' ')[0]}
              </Text>
            ) : null}
            {item.anmeldt ? (
              <View style={[GS.raekke, { gap: 6, marginTop: 10 }]}>
                <Ionicons name="checkmark-circle" size={16} color={Farver.accent} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: Farver.accent }}>Du har anmeldt {item.udbyderNavn.split(' ')[0]}</Text>
              </View>
            ) : null}
            <View style={[GS.raekke, { justifyContent: 'flex-end', gap: 8, marginTop: 10, flexWrap: 'wrap' }]}>
              <LilleKnap
                ikon="chatbubble-outline"
                tekst={ulaeste[item.id] ? 'Ny besked' : 'Beskeder'}
                ulaest={!!ulaeste[item.id]}
                onPress={() => aabnSamtale(item)}
              />
              {fane === 'kommende' ? <LilleKnap tekst="Afbestil" onPress={() => afbestil(item)} /> : null}
              {item.status === 'afvist' || item.status === 'aflyst' ? (
                <LilleKnap tekst="Fjern" onPress={() => fjern(item)} />
              ) : null}
              {(item.status === 'afvist' || item.status === 'aflyst') && tidspunkt(item.dato, item.tid) >= nu ? (
                <LilleKnap
                  moerk
                  tekst="Find en ny tid"
                  onPress={() => navigation.navigate('UdforskFane', { screen: 'Udbyder', params: { udbyderId: item.udbyderId } })}
                />
              ) : null}
              {kanAnmelde(item, nu) ? (
                <LilleKnap moerk ikon="star-outline" tekst="Skriv anmeldelse" onPress={() => anmeld(item)} />
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}
