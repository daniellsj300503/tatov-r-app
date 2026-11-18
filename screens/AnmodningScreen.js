// Én anmodning eller booking set fra udbyderen. Her godkender eller afviser
// tatovøren — og en bekræftet tid kan aflyses eller markeres som gennemført,
// så kunden kan skrive en anmeldelse.
// Hentes live med onValue, så skærmen opdaterer sig selv, hvis kunden afbestiller.

import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  Pressable, Image,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { rtdb, ref, onValue, BRUGER_FIREBASE } from '../database/db';
import { useUlaeste } from '../database/hooks';
import { saetStatus, harKonflikt } from '../database/bookinger';
import { BilledeVindue } from '../components/Portfolio';
import { fejlbesked } from '../database/fejl';
import Knap from '../components/Knap';
import Note from '../components/Note';
import StatusMaerke from '../components/StatusMaerke';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import {
  kr, langDato, kortDato, fraIso, tidspunkt, siden, erUdloebet,
} from '../data/hjaelpere';

const MAX_TEGN = 300;

function Raekke({ ikon, children, sidst }) {
  return (
    <View style={[GS.panelRaekke, sidst && GS.panelRaekkeSidst]}>
      <Ionicons name={ikon} size={20} color={Farver.daempet} />
      <Text style={[GS.broedtekst, { flex: 1, fontSize: 15 }]}>{children}</Text>
    </View>
  );
}

export default function AnmodningScreen({ navigation, route }) {
  const { udbyderId, id } = route.params;
  const [booking, setBooking] = useState(null);
  const [indlaeser, setIndlaeser] = useState(true);
  const [svar, setSvar] = useState('');
  const [arbejder, setArbejder] = useState(null); // 'godkend' | 'afvis' | 'aflys' | 'gennemfoert'
  const [visBillede, setVisBillede] = useState(null);
  const { ulaeste } = useUlaeste([id], 'udbyder');

  useEffect(() => {
    const unsubscribe = onValue(
      ref(rtdb, `Anmodninger/${udbyderId}/${id}`),
      (snap) => {
        setBooking(snap.exists() ? { ...snap.val(), id } : null);
        setIndlaeser(false);
      },
      (fejl) => {
        setIndlaeser(false);
        Alert.alert('Kunne ikke hente anmodningen', fejlbesked(fejl));
      },
    );
    return unsubscribe;
  }, [udbyderId, id]);

  if (indlaeser) {
    return (
      <View style={[GS.container, GS.center]}>
        <ActivityIndicator size="large" color={Farver.accent} />
      </View>
    );
  }
  if (!booking) {
    return (
      <View style={[GS.container, GS.center]}>
        <Text style={GS.meta}>Anmodningen findes ikke længere.</Text>
      </View>
    );
  }

  const fornavn = booking.kundeNavn.split(' ')[0];
  const hvornaar = `${kortDato(fraIso(booking.dato))} kl. ${booking.tid}`;
  const fremtid = tidspunkt(booking.dato, booking.tid) > new Date();
  const kanSvare = booking.status === 'afventer' && !erUdloebet(booking);
  const kanAflyse = booking.status === 'bekraeftet' && fremtid;
  const kanGennemfoere = booking.status === 'bekraeftet';
  const antalBilleder = booking.billeder ? booking.billeder.length : 0;

  // Fælles for de tre knapper: gem, vis fejl, gå tilbage til listen
  const gem = async (status, hvad) => {
    try {
      setArbejder(hvad);
      await saetStatus(booking, status, svar);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Kunne ikke gemme', fejlbesked(e));
    } finally {
      setArbejder(null);
    }
  };

  const godkend = async () => {
    try {
      setArbejder('godkend');
      if (await harKonflikt(booking)) {
        setArbejder(null);
        Alert.alert(
          'Du har allerede en kunde på den tid',
          `Der er en bekræftet booking ${hvornaar}. Afvis denne anmodning, eller aflys den anden tid først.`,
        );
        return;
      }
    } catch (e) {
      // Kan vi ikke tjekke, går vi videre — det vigtigste er at kunden får svar
      console.log('Kunne ikke tjekke for konflikt', e);
    }
    await gem('bekraeftet', 'godkend');
  };

  const afvis = () => {
    Alert.alert(
      'Afvis anmodningen?',
      `${fornavn} får besked${svar.trim() ? ' med din besked' : ''}, og tiden bliver ledig igen.`,
      [
        { text: 'Fortryd', style: 'cancel' },
        { text: 'Afvis', style: 'destructive', onPress: () => gem('afvist', 'afvis') },
      ],
    );
  };

  const aflys = () => {
    Alert.alert(
      'Aflys tiden?',
      `${fornavn} har en bekræftet tid ${hvornaar}. Kunden får besked, og påmindelserne fjernes.`,
      [
        { text: 'Behold', style: 'cancel' },
        { text: 'Aflys', style: 'destructive', onPress: () => gem('aflyst', 'aflys') },
      ],
    );
  };

  // Når tatoveringen er lavet: så kan kunden skrive en anmeldelse
  const gennemfoert = () => {
    Alert.alert(
      'Er tatoveringen lavet?',
      fremtid
        ? `Tiden ${hvornaar} er ikke nået endnu. Markér den kun som gennemført, hvis I allerede har lavet tatoveringen.`
        : `${fornavn} får besked og kan skrive en anmeldelse af dig.`,
      [
        { text: 'Fortryd', style: 'cancel' },
        { text: 'Ja, den er lavet', onPress: () => gem('gennemfoert', 'gennemfoert') },
      ],
    );
  };

  const beskeder = () => navigation.navigate('Samtale', { id, rolle: 'udbyder', udbyderId });

  return (
    <KeyboardAvoidingView
      style={GS.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={GS.skaermIndhold} keyboardShouldPersistTaps="handled">
        <View style={[GS.mellemrum, { marginBottom: 6 }]}>
          <Text style={GS.meta}>Anmodning · sendt {siden(booking.oprettet)}</Text>
          <StatusMaerke booking={booking} />
        </View>
        <Text style={[GS.overskrift, { marginBottom: 14 }]}>{booking.kundeNavn}</Text>

        <Pressable onPress={beskeder} style={[GS.kort, GS.raekke, { gap: 12, marginBottom: 20 }]} accessibilityRole="button">
          <Ionicons name="chatbubbles-outline" size={22} color={Farver.tekst} />
          <View style={{ flex: 1 }}>
            <Text style={GS.titel}>{ulaeste[id] ? `Ny besked fra ${fornavn}` : `Skriv til ${fornavn}`}</Text>
            <Text style={GS.lille}>Spørg om motiv, placering eller pris, før du svarer</Text>
          </View>
          {ulaeste[id] ? <View style={GS.ulaestPrik} /> : null}
          <Ionicons name="chevron-forward" size={18} color={Farver.svag} />
        </Pressable>

        <View style={[GS.panel, { marginBottom: 20 }]}>
          <Raekke ikon="calendar-outline">{langDato(fraIso(booking.dato))}, kl. {booking.tid}</Raekke>
          <Raekke ikon="color-palette-outline">{booking.stilart} · {booking.stoerrelse}</Raekke>
          <Raekke ikon="body-outline">{booking.kropsdel}</Raekke>
          <Raekke ikon="cash-outline" sidst>
            Estimat {kr(booking.estimatLav)}–{kr(booking.estimatHoej)} · depositum {kr(booking.depositum)}
          </Raekke>
        </View>

        {booking.beskrivelse ? (
          <>
            <Text style={GS.etiket}>Motiv</Text>
            <View style={[GS.kort, { marginBottom: 20 }]}>
              <Text style={GS.broedtekst}>{booking.beskrivelse}</Text>
            </View>
          </>
        ) : null}

        {antalBilleder > 0 && !BRUGER_FIREBASE ? (
          <>
            <Text style={GS.etiket}>Referencebilleder</Text>
            <View style={[GS.raekke, { gap: 8, marginBottom: 20, flexWrap: 'wrap' }]}>
              {booking.billeder.map((uri) => (
                <Pressable key={uri} onPress={() => setVisBillede({ uri })} accessibilityRole="imagebutton">
                  <Image source={{ uri }} style={GS.miniature} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
        {antalBilleder > 0 && BRUGER_FIREBASE ? (
          <Note neutral ikon="images-outline" style={{ marginBottom: 20 }}>
            {fornavn} har sendt {antalBilleder === 1 ? 'ét referencebillede' : `${antalBilleder} referencebilleder`}.
            De ligger på kundens telefon — at dele dem kræver Firebase Storage.
          </Note>
        ) : null}

        {booking.svar ? (
          <>
            <Text style={GS.etiket}>Dit svar</Text>
            <Text style={[GS.citat, { marginBottom: 20 }]}>{booking.svar}</Text>
          </>
        ) : null}

        {booking.status === 'gennemfoert' ? (
          <Note ikon="checkmark-done-outline" style={{ marginBottom: 12 }}>
            Gennemført. {fornavn} kan nu skrive en anmeldelse af dig.
          </Note>
        ) : null}
        {booking.status === 'afbestilt' ? (
          <Note neutral ikon="close-circle-outline">{fornavn} har afbestilt. Tiden er ledig igen.</Note>
        ) : null}
        {erUdloebet(booking) ? (
          <Note neutral ikon="time-outline">Tiden er gået, uden at anmodningen blev besvaret.</Note>
        ) : null}

        {kanSvare || kanAflyse ? (
          <>
            <Text style={GS.etiket}>Besked til {fornavn} (valgfri)</Text>
            <TextInput
              style={[GS.input, GS.inputFlerlinje, { minHeight: 80 }]}
              value={svar}
              onChangeText={(t) => setSvar(t.slice(0, MAX_TEGN))}
              multiline
              placeholder={kanSvare
                ? 'Fx: Glæder mig! Kom gerne 10 min før, så tegner vi motivet op sammen.'
                : 'Fx: Jeg er desværre syg. Skriv endelig, så finder vi en ny tid.'}
              placeholderTextColor={Farver.svag}
            />
            <Text style={GS.tegnTaeller}>{svar.length} / {MAX_TEGN}</Text>
          </>
        ) : null}
      </ScrollView>

      {kanSvare ? (
        <View style={[GS.bund, GS.knapRaekke]}>
          <Knap
            titel="Afvis"
            variant="sekundaer"
            onPress={afvis}
            arbejder={arbejder === 'afvis'}
            inaktiv={arbejder === 'godkend'}
            style={{ flex: 1, marginBottom: 0 }}
          />
          <Knap
            titel="Godkend tiden"
            onPress={godkend}
            arbejder={arbejder === 'godkend'}
            inaktiv={arbejder === 'afvis'}
            style={{ flex: 2, marginBottom: 0 }}
          />
        </View>
      ) : null}

      {kanGennemfoere ? (
        <View style={[GS.bund, GS.knapRaekke]}>
          {kanAflyse ? (
            <Knap
              titel="Aflys tiden"
              variant="sekundaer"
              onPress={aflys}
              arbejder={arbejder === 'aflys'}
              inaktiv={arbejder === 'gennemfoert'}
              style={{ flex: 1, marginBottom: 0 }}
            />
          ) : null}
          <Knap
            titel="Markér som gennemført"
            onPress={gennemfoert}
            arbejder={arbejder === 'gennemfoert'}
            inaktiv={arbejder === 'aflys'}
            style={{ flex: kanAflyse ? 1.4 : 1, marginBottom: 0 }}
          />
        </View>
      ) : null}

      <BilledeVindue billede={visBillede} onLuk={() => setVisBillede(null)} />
    </KeyboardAvoidingView>
  );
}
