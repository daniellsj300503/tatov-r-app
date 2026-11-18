// Tatovørens side: indbakken med anmodninger.
// Hentes live fra Anmodninger/<udbyderId> med onValue, som Mine bookinger.
// Nye anmodninger står øverst, ældste først — den der har ventet længst, får svar først.
// En prik på kortet betyder, at kunden har skrevet en ny besked.

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { rtdb, ref, onValue } from '../database/db';
import { useUlaeste } from '../database/hooks';
import { fejlbesked } from '../database/fejl';
import Avatar from '../components/Avatar';
import StatusMaerke from '../components/StatusMaerke';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import {
  findUdbyder, findSted, tilListe, delIndbakke, isoDato, tidspunkt, kortDato, fraIso, siden,
  bookingResume, initialerFra, erBekraeftet,
} from '../data/hjaelpere';

const FANER = [
  { id: 'nye', navn: 'Nye' },
  { id: 'alle', navn: 'Alle' },
];

export default function IndbakkeScreen({ navigation, route }) {
  const { udbyderId } = route.params;
  const udbyder = findUdbyder(udbyderId);
  const sted = findSted(udbyder.stedId);

  const [anmodninger, setAnmodninger] = useState({});
  const [indlaeser, setIndlaeser] = useState(true);
  const [fane, setFane] = useState('nye');
  const { ulaeste } = useUlaeste(Object.keys(anmodninger), 'udbyder');

  useEffect(() => {
    const unsubscribe = onValue(
      ref(rtdb, `Anmodninger/${udbyderId}`),
      (snap) => {
        setAnmodninger(snap.val() || {});
        setIndlaeser(false);
      },
      (fejl) => {
        setIndlaeser(false);
        Alert.alert('Kunne ikke hente anmodninger', fejlbesked(fejl));
      },
    );
    return unsubscribe;
  }, [udbyderId]);

  if (indlaeser) {
    return (
      <View style={[GS.container, GS.center]}>
        <ActivityIndicator size="large" color={Farver.accent} />
      </View>
    );
  }

  const nu = new Date();
  const alle = tilListe(anmodninger);
  const { nye, oevrige } = delIndbakke(alle, nu);
  const bekraeftede = alle.filter((b) => erBekraeftet(b) && tidspunkt(b.dato, b.tid) >= nu);
  const iDag = bekraeftede.filter((b) => b.dato === isoDato(nu));
  const liste = fane === 'nye' ? nye : oevrige;

  const top = (
    <View>
      <Text style={GS.overskrift}>Hej {udbyder.navn.split(' ')[0]}</Text>
      <Text style={[GS.meta, { marginTop: 4, marginBottom: 18 }]}>{sted.navn} · {sted.omraade}</Text>

      <View style={[GS.panel, GS.statRaekke, { marginBottom: 22 }]}>
        <View style={GS.statFelt}>
          <Text style={[GS.statVaerdi, nye.length > 0 && { color: Farver.advarsel }]}>{nye.length}</Text>
          <Text style={GS.statNavn}>Venter på svar</Text>
        </View>
        <View style={GS.statFelt}>
          <Text style={GS.statVaerdi}>{iDag.length}</Text>
          <Text style={GS.statNavn}>Kunder i dag</Text>
        </View>
        <View style={[GS.statFelt, GS.statFeltSidst]}>
          <Text style={GS.statVaerdi}>{bekraeftede.length}</Text>
          <Text style={GS.statNavn}>Kommende</Text>
        </View>
      </View>

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
                {f.navn} ({f.id === 'nye' ? nye.length : oevrige.length})
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const tomTitel = fane === 'nye' ? 'Ingen nye anmodninger' : 'Ingen anmodninger endnu';

  const tom = (
    <View style={GS.tomTilstand}>
      <Ionicons name={fane === 'nye' ? 'file-tray-outline' : 'time-outline'} size={40} color={Farver.svag} />
      <Text style={[GS.titel, { marginTop: 12 }]}>{tomTitel}</Text>
      <Text style={[GS.meta, { marginTop: 6, textAlign: 'center', maxWidth: 280 }]}>
        Når en kunde sender en anmodning, lander den her — og du får en notifikation, mens appen er åben.
      </Text>
    </View>
  );

  return (
    <View style={GS.container}>
      <FlatList
        data={liste}
        keyExtractor={(item) => item.id}
        contentContainerStyle={GS.skaermIndhold}
        ListHeaderComponent={top}
        ListEmptyComponent={tom}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => navigation.navigate('Anmodning', { udbyderId, id: item.id })}
            style={GS.kort}
            accessibilityRole="button"
          >
            <View style={[GS.raekke, { gap: 12 }]}>
              <Avatar initialer={initialerFra(item.kundeNavn)} stoerrelse={44} indeks={index} />
              <View style={{ flex: 1 }}>
                <Text style={GS.titel}>{item.kundeNavn}</Text>
                <Text style={GS.lille}>{kortDato(fraIso(item.dato))} kl. {item.tid}</Text>
              </View>
              <StatusMaerke booking={item} />
            </View>
            <Text style={[GS.meta, { marginTop: 10 }]}>{bookingResume(item)}</Text>
            {item.status === 'afventer' && item.beskrivelse ? (
              <Text style={[GS.broedtekst, { fontSize: 15, lineHeight: 22, marginTop: 6 }]} numberOfLines={2}>
                {item.beskrivelse}
              </Text>
            ) : null}
            <View style={GS.kortBund}>
              <Text style={GS.lille}>
                {item.besvaret && item.status !== 'afventer' ? `Opdateret ${siden(item.besvaret)}` : `Sendt ${siden(item.oprettet)}`}
              </Text>
              <View style={[GS.raekke, { gap: 8 }]}>
                {ulaeste[item.id] ? (
                  <View style={[GS.raekke, { gap: 5 }]}>
                    <View style={GS.ulaestPrik} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: Farver.advarsel }}>Ny besked</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={18} color={Farver.svag} />
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
