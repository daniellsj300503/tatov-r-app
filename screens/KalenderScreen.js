// Udbydersiden: kalenderen. Vælg en dag, og se hver tid i løbet af dagen —
// bekræftet (grøn), anmodning der venter (gul), optaget uden for appen (grå)
// eller ledig. Tryk på en kunde for at se detaljerne.

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { rtdb, ref, onValue } from '../database/db';
import { fejlbesked } from '../database/fejl';
import Note from '../components/Note';
import { GlobalStyle as GS } from '../styles/GlobalStyle';
import {
  findUdbyder, tilListe, kalenderDage, dagsplan, erAktiv, relativDag, langDato, fraIso,
  mandagIndeks, UGEDAGE, UGEDAGE_KORT, MAANEDER_KORT, bookingResume, erBekraeftet,
} from '../data/hjaelpere';

export default function KalenderScreen({ navigation, route }) {
  const { udbyderId } = route.params;
  const udbyder = findUdbyder(udbyderId);
  const dage = kalenderDage(14);

  const [anmodninger, setAnmodninger] = useState({});
  const [valgtIso, setValgtIso] = useState(dage[0].iso);

  useEffect(() => {
    const unsubscribe = onValue(
      ref(rtdb, `Anmodninger/${udbyderId}`),
      (snap) => setAnmodninger(snap.val() || {}),
      (fejl) => Alert.alert('Kunne ikke hente kalenderen', fejlbesked(fejl)),
    );
    return unsubscribe;
  }, [udbyderId]);

  const liste = tilListe(anmodninger).filter(erAktiv);
  const plan = dagsplan(udbyder, valgtIso, liste);
  const valgtDato = fraIso(valgtIso);

  const antalBekraeftet = plan.filter((r) => r.booking && erBekraeftet(r.booking)).length;
  const antalAfventer = plan.filter((r) => r.booking && r.booking.status === 'afventer').length;
  const antalLedige = plan.filter((r) => !r.booking && !r.udenforAppen).length;

  const overskrift = relativDag(valgtDato) === 'I dag' || relativDag(valgtDato) === 'I morgen'
    ? `${relativDag(valgtDato)} · ${langDato(valgtDato)}`
    : langDato(valgtDato);

  return (
    <ScrollView style={GS.container} contentContainerStyle={GS.skaermIndhold}>
      {udbyder.venteliste ? (
        <Note neutral ikon="hourglass-outline" style={{ marginBottom: 18 }}>
          Kunderne ser dig som "venteliste · {udbyder.venteliste} uger", så de kan ikke booke dig i appen lige nu.
        </Note>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[GS.dagRaekke, { paddingHorizontal: 20 }]}
        style={{ marginHorizontal: -20, marginBottom: 22 }}
      >
        {dage.map((d) => {
          const valgt = d.iso === valgtIso;
          const fri = !udbyder.arbejdsdage.includes(mandagIndeks(d.dato));
          const denneDag = liste.filter((b) => b.dato === d.iso);
          const afventer = denneDag.some((b) => b.status === 'afventer');
          return (
            <Pressable
              key={d.iso}
              onPress={() => setValgtIso(d.iso)}
              accessibilityRole="button"
              accessibilityState={{ selected: valgt }}
              style={[GS.dag, valgt && GS.dagValgt, fri && !valgt && GS.dagFri]}
            >
              <Text style={[GS.dagUge, valgt && GS.dagUgeValgt]}>
                {relativDag(d.dato) === 'I dag' ? 'I dag' : UGEDAGE_KORT[mandagIndeks(d.dato)]}
              </Text>
              <Text style={[GS.dagNummer, valgt && GS.dagNummerValgt]}>{d.dato.getDate()}</Text>
              <Text style={[GS.dagMaaned, valgt && GS.dagUgeValgt]}>{MAANEDER_KORT[d.dato.getMonth()]}</Text>
              <View style={[GS.dagPrik, afventer && GS.dagPrikAfventer, denneDag.length === 0 && GS.dagPrikTom]} />
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={GS.underoverskrift}>{overskrift.charAt(0).toUpperCase() + overskrift.slice(1)}</Text>

      {plan.length === 0 ? (
        <Text style={GS.meta}>Fridag — du arbejder ikke {UGEDAGE[mandagIndeks(valgtDato)]}e.</Text>
      ) : (
        <>
          <Text style={[GS.meta, { marginTop: -4, marginBottom: 14 }]}>
            {antalBekraeftet} bekræftet · {antalAfventer} venter på svar · {antalLedige} ledig{antalLedige === 1 ? '' : 'e'}
          </Text>

          {plan.map((r) => {
            const b = r.booking;
            if (b) {
              const bekraeftet = erBekraeftet(b);
              return (
                <Pressable
                  key={r.tid}
                  onPress={() => navigation.navigate('Anmodning', { udbyderId, id: b.id })}
                  style={GS.planRaekke}
                  accessibilityRole="button"
                >
                  <Text style={GS.planTid}>{r.tid}</Text>
                  <View style={[GS.planFelt, bekraeftet ? GS.planBekraeftet : GS.planAfventer]}>
                    <Text style={GS.titel}>{b.kundeNavn}</Text>
                    <Text style={[GS.lille, { marginTop: 2 }]}>
                      {bekraeftet ? bookingResume(b) : 'Anmodning · venter på dit svar'}
                      {r.flere > 0 ? ` · +${r.flere} mere` : ''}
                    </Text>
                  </View>
                </Pressable>
              );
            }
            return (
              <View key={r.tid} style={GS.planRaekke}>
                <Text style={GS.planTid}>{r.tid}</Text>
                <View style={[GS.planFelt, r.udenforAppen && GS.planOptaget]}>
                  <Text style={GS.lille}>{r.udenforAppen ? 'Optaget · booket uden for appen' : 'Ledig'}</Text>
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}
