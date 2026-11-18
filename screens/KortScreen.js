// Kort over tatoveringsstudierne, bygget som Map.js i 08_Maps.
// Nålene kommer fra data/udbydere.js (ikke AsyncStorage som i øvelsen).
// Lokationen hentes først, når man trykker på knappen — så får man ikke en
// tilladelses-popup bare ved at åbne fanen, og GPS'en overskriver ikke kortet.
//
// Fra skoleprojektet: når positionen er fundet, regnes afstanden til hvert
// studie ud (haversine), og det nærmeste vises i en boks nederst.
// Spørgeskemaet viste, at afstand ikke betyder så meget for de fleste (1,9 ud
// af 5), så kortet er et ekstra værktøj — forsiden sorterer stadig efter match.

import React, { useState, useEffect } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import Knap from '../components/Knap';
import { STEDER } from '../data/udbydere';
import {
  findSted, stederEfterAfstand, afstandTekst, udbydereVed,
} from '../data/hjaelpere';

const KOEBENHAVN = {
  latitude: 55.6825,
  longitude: 12.5600,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

export default function KortScreen({ navigation, route }) {
  const [region, setRegion] = useState(KOEBENHAVN);
  const [henter, setHenter] = useState(false);
  const [visPosition, setVisPosition] = useState(false);
  const [position, setPosition] = useState(null); // { breddegrad, laengdegrad }

  // Kommer man fra et sted ("Vis på kort"), centreres kortet på det
  const maalStedId = route.params ? route.params.stedId : null;
  const maalTid = route.params ? route.params.tid : null;
  useEffect(() => {
    if (!maalStedId) return;
    const sted = findSted(maalStedId);
    if (!sted) return;
    setRegion({
      latitude: sted.breddegrad,
      longitude: sted.laengdegrad,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    });
  }, [maalStedId, maalTid]);

  // Samme fremgangsmåde som getLocation i 08
  const gaaTilMinPosition = async () => {
    try {
      setHenter(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ingen adgang til lokation', 'Slå lokation til for appen i Indstillinger, hvis du vil se hvor du er.');
        return;
      }
      setVisPosition(true);
      const { coords } = await Location.getCurrentPositionAsync({});
      const her = { breddegrad: coords.latitude, laengdegrad: coords.longitude };
      setPosition(her);

      // Vis både dig og det nærmeste studie på kortet
      const naermeste = stederEfterAfstand(her)[0];
      const spaend = Math.max(
        Math.abs(naermeste.breddegrad - her.breddegrad),
        Math.abs(naermeste.laengdegrad - her.laengdegrad),
      );
      const zoom = Math.min(Math.max(spaend * 2.6, 0.02), 4);
      setRegion({
        latitude: (coords.latitude + naermeste.breddegrad) / 2,
        longitude: (coords.longitude + naermeste.laengdegrad) / 2,
        latitudeDelta: zoom,
        longitudeDelta: zoom,
      });
    } catch (e) {
      console.error('Kunne ikke hente lokation', e);
      Alert.alert('Kunne ikke finde din position', 'Prøv igen om lidt.');
    } finally {
      setHenter(false);
    }
  };

  const afstande = position ? stederEfterAfstand(position) : [];
  const naermeste = afstande[0] || null;
  const kmTil = (id) => {
    const s = afstande.find((x) => x.id === id);
    return s ? ` · ${afstandTekst(s.km)} herfra` : '';
  };

  return (
    <View style={GS.container}>
      <MapView
        style={GS.landkort}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={visPosition}
      >
        {STEDER.map((s) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.breddegrad, longitude: s.laengdegrad }}
            title={s.navn}
            description={`${s.omraade}${kmTil(s.id)} · tryk for at se artisterne`}
            pinColor={Farver.naal}
            tracksViewChanges={false}
            onCalloutPress={() => navigation.navigate('Sted', { stedId: s.id, fraKort: true })}
          />
        ))}
      </MapView>

      {naermeste ? (
        <View style={GS.naermesteBoks}>
          <View style={[GS.mellemrum, { marginBottom: 4 }]}>
            <Text style={GS.lille}>Nærmeste studie</Text>
            <Pressable onPress={() => setPosition(null)} hitSlop={10} accessibilityLabel="Luk">
              <Ionicons name="close" size={18} color={Farver.daempet} />
            </Pressable>
          </View>
          <Text style={GS.kortTitel}>{naermeste.navn}</Text>
          <Text style={[GS.meta, { marginTop: 2, marginBottom: 12 }]}>
            {afstandTekst(naermeste.km)} herfra · {naermeste.omraade} · {udbydereVed(naermeste.id).length} artister
          </Text>
          <Knap
            titel="Se studiet"
            onPress={() => navigation.navigate('Sted', { stedId: naermeste.id, fraKort: true })}
            style={{ marginBottom: 0 }}
          />
        </View>
      ) : (
        <Pressable
          onPress={gaaTilMinPosition}
          disabled={henter}
          style={[GS.findNaermesteKnap, henter && { opacity: 0.6 }]}
          accessibilityRole="button"
        >
          <Ionicons name="navigate" size={18} color={Farver.baggrund} />
          <Text style={GS.findNaermesteTekst}>{henter ? 'Finder din position …' : 'Find nærmeste tatovør'}</Text>
        </Pressable>
      )}

      <Pressable
        onPress={gaaTilMinPosition}
        disabled={henter}
        style={[GS.landkortPositionKnap, naermeste && { bottom: 196 }, henter && { opacity: 0.5 }]}
        accessibilityRole="button"
        accessibilityLabel="Gå til min position"
      >
        <Ionicons name="locate" size={22} color={Farver.tekst} />
      </Pressable>
    </View>
  );
}
