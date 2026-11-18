// Kvittering efter en anmodning. Tiden er ikke låst endnu — tatovøren skal
// først se motivet og svare. Det skal kunden kunne se med det samme.

import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Avatar from '../components/Avatar';
import Knap from '../components/Knap';
import Note from '../components/Note';
import StatusMaerke from '../components/StatusMaerke';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import { kr, langDato, fraIso } from '../data/hjaelpere';

export default function KvitteringScreen({ navigation, route }) {
  const { booking } = route.params;
  const fornavn = booking.udbyderNavn.split(' ')[0];

  const tilBookinger = () => {
    navigation.popToTop();
    navigation.navigate('BookingerFane');
  };

  return (
    <ScrollView style={GS.container} contentContainerStyle={GS.skaermIndhold}>
      <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 24 }}>
        <View style={[GS.authLogo, { width: 72, height: 72, borderRadius: 36 }]}>
          <Ionicons name="paper-plane" size={34} color="#FFFFFF" />
        </View>
        <Text style={[GS.overskrift, { textAlign: 'center' }]}>Anmodning sendt</Text>
        <Text style={[GS.broedtekst, { textAlign: 'center', marginTop: 8, color: Farver.daempet }]}>
          {fornavn} kigger på dit motiv og svarer. Du kan følge med under Mine bookinger.
        </Text>
      </View>

      <View style={GS.panel}>
        <View style={GS.panelRaekke}>
          <Avatar initialer={booking.initialer} stoerrelse={44} />
          <View style={{ flex: 1 }}>
            <Text style={GS.titel}>{booking.udbyderNavn}</Text>
            <Text style={GS.lille}>{booking.stedNavn}</Text>
          </View>
          <StatusMaerke booking={booking} />
        </View>
        <View style={GS.panelRaekke}>
          <Ionicons name="calendar-outline" size={20} color={Farver.daempet} />
          <Text style={[GS.broedtekst, { flex: 1, fontSize: 15 }]}>
            {langDato(fraIso(booking.dato))}, kl. {booking.tid}
          </Text>
        </View>
        <View style={GS.panelRaekke}>
          <Ionicons name="location-outline" size={20} color={Farver.daempet} />
          <Text style={[GS.broedtekst, { flex: 1, fontSize: 15 }]}>{booking.adresse}</Text>
        </View>
        <View style={[GS.panelRaekke, GS.panelRaekkeSidst, { alignItems: 'flex-start' }]}>
          <View style={{ flex: 1 }}>
            <Text style={GS.titel}>{booking.stilart} · {booking.stoerrelse}</Text>
            <Text style={[GS.lille, { marginTop: 2 }]}>{booking.kropsdel}</Text>
          </View>
          <Text style={GS.pris}>{kr(booking.estimatLav)}–{kr(booking.estimatHoej)}</Text>
        </View>
      </View>

      {booking.billeder && booking.billeder.length > 0 ? (
        <View style={[GS.raekke, { gap: 8, marginTop: 14 }]}>
          {booking.billeder.map((uri) => <Image key={uri} source={{ uri }} style={GS.miniature} />)}
        </View>
      ) : null}

      <Note neutral style={{ marginTop: 16, marginBottom: 24 }}>
        Depositum på {kr(booking.depositum)} trækkes først, når tiden er bekræftet. Når {fornavn} har svaret,
        får du en notifikation, og påmindelserne bliver sat op.
      </Note>

      <Knap titel="Se mine bookinger" onPress={tilBookinger} />
      <Knap titel="Tilbage til forsiden" variant="sekundaer" onPress={() => navigation.popToTop()} />
    </ScrollView>
  );
}
