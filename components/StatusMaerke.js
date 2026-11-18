// Lille mærke med en bookings status. Bruges både på kundesiden og udbydersiden.
// Afventer er gul, bekræftet og gennemført er grøn, og afvist/aflyst/afbestilt er grå.

import React from 'react';
import { View, Text } from 'react-native';
import { GlobalStyle as GS } from '../styles/GlobalStyle';
import { statusNavn, erUdloebet, erBekraeftet } from '../data/hjaelpere';

export default function StatusMaerke({ booking }) {
  const udloebet = erUdloebet(booking);
  const afventer = booking.status === 'afventer' && !udloebet;
  const bekraeftet = erBekraeftet(booking);
  const graa = !afventer && !bekraeftet;

  return (
    <View style={[GS.maerke, afventer && GS.maerkeAdvarsel, graa && GS.maerkeNeutral]}>
      <Text style={[GS.maerkeTekst, afventer && GS.maerkeAdvarselTekst, graa && GS.maerkeNeutralTekst]}>
        {udloebet ? 'Ikke besvaret' : statusNavn(booking.status)}
      </Text>
    </View>
  );
}
