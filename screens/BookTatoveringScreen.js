// Booking hos en tatovør. Det er en ANMODNING: tatovøren skal se motivet og
// godkende, før tiden er låst. Derfor gemmes den med status "afventer", og
// tatovøren svarer fra udbydersiden.
//
// Fra brugertesten:
// - man kan nu vælge stilart
// - prisen vises som et estimat ud fra størrelsen, ikke bare "fra 1.000 kr"
// - knappen siger hvad der mangler, i stedet for ikke at reagere
//
// Referencebilleder tages med kameraet (07) eller vælges fra galleriet.
// Billederne gemmes på telefonen — at dele dem med en anden telefon kræver
// Firebase Storage, som kommer sammen med Firebase.
//
// Man kan udfylde det hele som gæst. Først når man trykker send, skal man
// logge ind — så mister man ikke det, man har skrevet.

import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Image, Modal, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { opretBooking } from '../database/bookinger';
import { fejlbesked } from '../database/fejl';
import { useBruger } from '../database/hooks';
import { gemBilledePermanent, vaelgFraGalleri } from '../database/billeder';
import AuthScreen from './AuthScreen';
import Chip from '../components/Chip';
import Segment from '../components/Segment';
import Knap from '../components/Knap';
import Note from '../components/Note';
import DatoTidVaelger from '../components/DatoTidVaelger';
import KameraComponent from '../components/KameraComponent';
import { sendNu } from '../components/Notifikationer';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import { STILARTER, STOERRELSER, KROPSDELE } from '../data/udbydere';
import {
  findUdbyder, findSted, ledigeDage, prisestimat, kr, langDato, fraIso,
} from '../data/hjaelpere';

const MAX_TEGN = 500;
const DEPOSITUM = 500;

export default function BookTatoveringScreen({ navigation, route }) {
  const udbyder = findUdbyder(route.params.udbyderId);
  const sted = findSted(udbyder.stedId);
  const foersteDag = ledigeDage(udbyder, 30)[0];

  const [stilart, setStilart] = useState(udbyder.stilarter.length === 1 ? udbyder.stilarter[0] : null);
  const [stoerrelse, setStoerrelse] = useState('mellem');
  const [kropsdel, setKropsdel] = useState(null);
  const [beskrivelse, setBeskrivelse] = useState('');
  const [billeder, setBilleder] = useState([]);
  const [visKamera, setVisKamera] = useState(false);
  const [dagIso, setDagIso] = useState(foersteDag ? foersteDag.iso : null);
  const [tid, setTid] = useState(foersteDag ? foersteDag.tider[0] : null);
  const [arbejder, setArbejder] = useState(false);
  const [visLogin, setVisLogin] = useState(false);
  const { user, profil } = useBruger();

  const estimat = prisestimat(udbyder, stoerrelse);
  const stilarterHer = STILARTER.filter((s) => udbyder.stilarter.includes(s.id));

  // Fortæl præcis hvad der mangler. Rækkefølgen følger skærmen oppefra.
  let mangler = null;
  if (!stilart) mangler = 'Vælg en stilart';
  else if (!kropsdel) mangler = 'Vælg hvor på kroppen';
  else if (beskrivelse.trim().length < 10) mangler = 'Beskriv dit motiv med et par ord mere';
  else if (!dagIso || !tid) mangler = 'Vælg dag og tid';

  const fjernBillede = (uri) => {
    Alert.alert('Fjern billedet?', '', [
      { text: 'Behold', style: 'cancel' },
      { text: 'Fjern', style: 'destructive', onPress: () => setBilleder(billeder.filter((b) => b !== uri)) },
    ]);
  };

  const send = async () => {
    // Gæst: log ind først. Effekten herunder sender, når login er på plads.
    if (!user) {
      setVisLogin(true);
      return;
    }

    const booking = {
      status: 'afventer',
      udbyderId: udbyder.id,
      udbyderNavn: udbyder.navn,
      initialer: udbyder.initialer,
      stedNavn: sted.navn,
      adresse: sted.adresse,
      dato: dagIso,
      tid,
      stilart: STILARTER.find((s) => s.id === stilart).navn,
      stoerrelse: STOERRELSER.find((s) => s.id === stoerrelse).navn,
      kropsdel,
      beskrivelse: beskrivelse.trim(),
      billeder,
      estimatLav: estimat.lav,
      estimatHoej: estimat.hoej,
      depositum: DEPOSITUM,
      oprettet: Date.now(),
    };

    try {
      setArbejder(true);
      // Gemmes både hos kunden og hos tatovøren (se database/bookinger.js)
      const gemt = await opretBooking(booking);
      await sendNu('Anmodning sendt', `${udbyder.navn} har fået din anmodning og svarer typisk inden for ${udbyder.svartid} timer.`);
      navigation.navigate('Kvittering', { booking: gemt });
    } catch (e) {
      Alert.alert('Anmodningen blev ikke sendt', fejlbesked(e));
    } finally {
      setArbejder(false);
    }
  };

  // Når gæsten er logget ind (og vi ved hvem det er), lukkes vinduet og anmodningen sendes
  useEffect(() => {
    if (!visLogin || !user || profil === null) return;
    setVisLogin(false);
    if (profil.rolle === 'udbyder') {
      Alert.alert('Du er logget ind som tatovør', 'Log ind som kunde for at sende en anmodning.');
      return;
    }
    send();
  }, [visLogin, user, profil]);

  const tilfoejBillede = (uri) => {
    setBilleder((tidligere) => [...tidligere, gemBilledePermanent(uri, 'reference')]);
  };

  const fraGalleri = async () => {
    try {
      const uri = await vaelgFraGalleri();
      if (uri) tilfoejBillede(uri);
    } catch (e) {
      Alert.alert('Kunne ikke åbne galleriet', 'Prøv igen, eller tag et billede med kameraet.');
    }
  };

  return (
    <KeyboardAvoidingView style={GS.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={GS.skaermIndhold} keyboardShouldPersistTaps="handled">
        <Text style={GS.meta}>Anmodning til</Text>
        <Text style={[GS.overskrift, { marginBottom: 20 }]}>{udbyder.navn}</Text>

        <Text style={GS.etiket}>Stilart</Text>
        <View style={[GS.chipRaekke, { marginBottom: 22 }]}>
          {stilarterHer.map((s) => (
            <Chip key={s.id} tekst={s.navn} valgt={stilart === s.id} onPress={() => setStilart(s.id)} />
          ))}
        </View>

        <Text style={GS.etiket}>Størrelse</Text>
        <Segment
          valg={STOERRELSER.map((s) => ({ id: s.id, navn: s.navn.replace(' cm', '') }))}
          valgt={stoerrelse}
          onVaelg={setStoerrelse}
          style={{ marginBottom: 10 }}
        />
        <View style={[GS.mellemrum, { marginBottom: 22 }]}>
          <Text style={GS.meta}>Prisestimat</Text>
          <Text style={GS.pris}>
            {estimat.lav === estimat.hoej ? kr(estimat.lav) : `${kr(estimat.lav)}–${kr(estimat.hoej)}`}
          </Text>
        </View>

        <Text style={GS.etiket}>Hvor på kroppen?</Text>
        <View style={[GS.chipRaekke, { marginBottom: 22 }]}>
          {KROPSDELE.map((k) => (
            <Chip key={k} tekst={k} valgt={kropsdel === k} onPress={() => setKropsdel(k)} />
          ))}
        </View>

        <Text style={GS.etiket}>Beskriv dit motiv</Text>
        <TextInput
          style={[GS.input, GS.inputFlerlinje]}
          value={beskrivelse}
          onChangeText={(t) => setBeskrivelse(t.slice(0, MAX_TEGN))}
          multiline
          placeholder="Fx: en lille kvist med tre blade langs indersiden af underarmen. Tynde streger, ingen skygge."
          placeholderTextColor={Farver.svag}
        />
        <Text style={GS.tegnTaeller}>{beskrivelse.length} / {MAX_TEGN}</Text>

        <Text style={GS.etiket}>Referencebilleder</Text>
        <Text style={[GS.meta, { marginTop: -4, marginBottom: 12 }]}>
          Tag et billede af din idé eller af stedet på kroppen, eller vælg et fra galleriet. Det hjælper {udbyder.navn.split(' ')[0]} med at give en præcis pris.
        </Text>
        <View style={[GS.raekke, { gap: 8, marginBottom: 24, flexWrap: 'wrap' }]}>
          {billeder.map((uri) => (
            <Pressable key={uri} onPress={() => fjernBillede(uri)} accessibilityLabel="Fjern billede">
              <Image source={{ uri }} style={GS.miniature} />
            </Pressable>
          ))}
          <Pressable
            onPress={() => setVisKamera(true)}
            style={[GS.miniature, {
              borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D6D1C9', alignItems: 'center', justifyContent: 'center',
            }]}
            accessibilityRole="button"
            accessibilityLabel="Tag billede"
          >
            <Ionicons name="camera-outline" size={24} color={Farver.daempet} />
          </Pressable>
          <Pressable
            onPress={fraGalleri}
            style={[GS.miniature, {
              borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D6D1C9', alignItems: 'center', justifyContent: 'center',
            }]}
            accessibilityRole="button"
            accessibilityLabel="Vælg billede fra galleriet"
          >
            <Ionicons name="images-outline" size={24} color={Farver.daempet} />
          </Pressable>
        </View>

        <Text style={GS.etiket}>Dag og tid</Text>
        <DatoTidVaelger
          udbyder={udbyder}
          valgtIso={dagIso}
          valgtTid={tid}
          onVaelgDag={(iso, foersteTid) => { setDagIso(iso); setTid(foersteTid); }}
          onVaelgTid={setTid}
        />

        <Note style={{ marginTop: 24 }}>
          Det er en anmodning. {udbyder.navn.split(' ')[0]} ser dit motiv og bekræfter tiden. Først derefter
          trækkes et depositum på {kr(DEPOSITUM)}, som går fra i den endelige pris.
        </Note>
      </ScrollView>

      <View style={[GS.bund, { flexDirection: 'column', alignItems: 'stretch', gap: 0 }]}>
        {dagIso && tid ? (
          <Text style={[GS.meta, { textAlign: 'center', marginBottom: 8 }]}>
            {langDato(fraIso(dagIso))} kl. {tid}
          </Text>
        ) : null}
        <Knap
          titel={user ? 'Send anmodning' : 'Log ind og send anmodning'}
          onPress={send}
          inaktiv={!!mangler}
          arbejder={arbejder}
        />
        {mangler ? <Text style={GS.hjaelpetekst}>{mangler}</Text> : null}
        {!mangler && !user ? (
          <Text style={[GS.lille, { textAlign: 'center', marginTop: 2 }]}>Det du har skrevet, bliver gemt imens.</Text>
        ) : null}
      </View>

      <Modal visible={visKamera} animationType="slide" onRequestClose={() => setVisKamera(false)}>
        <SafeAreaProvider>
          <KameraComponent
            billeder={billeder}
            onBillede={tilfoejBillede}
            onLuk={() => setVisKamera(false)}
          />
        </SafeAreaProvider>
      </Modal>

      <Modal visible={visLogin} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setVisLogin(false)}>
        <SafeAreaProvider>
          <SafeAreaView style={GS.container}>
            <View style={[GS.raekke, { justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 }]}>
              <Pressable onPress={() => setVisLogin(false)} hitSlop={10} accessibilityLabel="Luk">
                <Ionicons name="close" size={26} color={Farver.tekst} />
              </Pressable>
            </View>
            <AuthScreen
              kunKunde
              tekst={`Opret en bruger, eller log ind, så sender vi din anmodning til ${udbyder.navn.split(' ')[0]}. Det du har udfyldt, er gemt.`}
            />
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </KeyboardAvoidingView>
  );
}
