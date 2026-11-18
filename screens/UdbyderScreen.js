// Profilen for en tatovør.
// Fra brugertesten: tydeligere vurdering, et rigtigt prisestimat i stedet for
// "fra 1.000 kr", og portfolio der fylder.
// Fra spørgeskemaet: portfolio er det vigtigste, så tatovørens egne billeder
// står øverst, og helede tatoveringer er markeret.
//
// Tatovøren kan selv se sin profil fra "Min profil" (forhaandsvisning) —
// så er bookingknappen skjult.

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Avatar, { Flise } from '../components/Avatar';
import Stjerner from '../components/Stjerner';
import { Maerkat } from '../components/Chip';
import Knap from '../components/Knap';
import { PortfolioGitter, BilledeVindue, HeletMaerke } from '../components/Portfolio';
import { useAppAnmeldelser, usePortfolio } from '../database/hooks';
import { GlobalStyle as GS, Farver, Toner } from '../styles/GlobalStyle';
import { STILARTER, STOERRELSER } from '../data/udbydere';
import {
  findUdbyder, findSted, anmeldelserFor, appAnmeldelserFor, samletVurdering, prisestimat, ledigTekst, kr,
  fuldDato,
} from '../data/hjaelpere';

export default function UdbyderScreen({ navigation, route }) {
  const udbyder = findUdbyder(route.params.udbyderId);
  const forhaandsvisning = !!route.params.forhaandsvisning;
  const appAnmeldelser = useAppAnmeldelser();
  const billeder = usePortfolio(udbyder ? udbyder.id : null);
  const [visBillede, setVisBillede] = useState(null);
  if (!udbyder) return null;

  const sted = findSted(udbyder.stedId);
  const samlet = samletVurdering(udbyder, appAnmeldelser);
  const anmeldelser = [
    ...appAnmeldelserFor(udbyder.id, appAnmeldelser).map((a) => ({ ...a, dato: fuldDato(a.dato) })),
    ...anmeldelserFor(udbyder.id),
  ];
  const antalHelede = billeder.filter((b) => b.helet).length;
  const venteliste = !!udbyder.venteliste;
  const specialer = udbyder.stilarter.map((id) => STILARTER.find((s) => s.id === id).navn);

  const book = () => navigation.navigate('BookTatovering', { udbyderId: udbyder.id });

  return (
    <View style={GS.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {billeder.length > 0 ? (
          <Pressable onPress={() => setVisBillede(billeder[0])} accessibilityRole="imagebutton">
            <Image source={{ uri: billeder[0].uri }} style={GS.heroBillede} />
            {billeder[0].helet ? <HeletMaerke /> : null}
          </Pressable>
        ) : (
          <View style={[GS.hero, { backgroundColor: Toner[0] }]}>
            <Ionicons name={udbyder.portfolio[0]} size={110} color="#3A362F" />
          </View>
        )}

        <View style={{ padding: 20 }}>
          <View style={[GS.raekke, { gap: 14 }]}>
            <Avatar initialer={udbyder.initialer} stoerrelse={58} />
            <View style={{ flex: 1 }}>
              <Text style={GS.overskrift}>{udbyder.navn}</Text>
              {forhaandsvisning ? (
                <Text style={[GS.meta, { marginTop: 2 }]}>{sted.navn} · {sted.omraade}</Text>
              ) : (
                <Pressable onPress={() => navigation.navigate('Sted', { stedId: sted.id })} hitSlop={6}>
                  <Text style={[GS.link, { marginTop: 2 }]}>{sted.navn} · {sted.omraade}</Text>
                </Pressable>
              )}
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('Anmeldelser', { udbyderId: udbyder.id })}
            style={[GS.raekke, { marginTop: 16, gap: 8 }]}
          >
            <Stjerner vurdering={samlet.vurdering} antal={samlet.antal} stoerrelse={19} />
            <Ionicons name="chevron-forward" size={16} color={Farver.svag} />
          </Pressable>

          <View style={[GS.chipRaekke, { marginTop: 14, gap: 6 }]}>
            {specialer.map((s) => <Maerkat key={s} tekst={s} />)}
          </View>

          <View style={[GS.panel, GS.statRaekke, { marginTop: 18 }]}>
            <View style={GS.statFelt}>
              <Text style={GS.statVaerdi}>{udbyder.erfaring} år</Text>
              <Text style={GS.statNavn}>Erfaring</Text>
            </View>
            <View style={GS.statFelt}>
              <Text style={GS.statVaerdi}>{kr(udbyder.minimumspris)}</Text>
              <Text style={GS.statNavn}>Minimum</Text>
            </View>
            <View style={[GS.statFelt, GS.statFeltSidst]}>
              <Text style={GS.statVaerdi}>{udbyder.svartid} t</Text>
              <Text style={GS.statNavn}>Svartid</Text>
            </View>
          </View>

          <Text style={[GS.broedtekst, { marginTop: 20 }]}>{udbyder.bio}</Text>

          <View style={GS.sektion}>
            <Text style={GS.underoverskrift}>Hvad koster det?</Text>
            <View style={GS.panel}>
              {STOERRELSER.map((s, i) => {
                const est = prisestimat(udbyder, s.id);
                return (
                  <View key={s.id} style={[GS.panelRaekke, i === STOERRELSER.length - 1 && GS.panelRaekkeSidst]}>
                    <View style={{ flex: 1 }}>
                      <Text style={GS.titel}>{s.navn}</Text>
                      <Text style={[GS.lille, { marginTop: 2 }]}>
                        ca. {est.timer[0] === est.timer[1] ? `${est.timer[0]} time` : `${est.timer[0]}–${est.timer[1]} timer`}
                      </Text>
                    </View>
                    <Text style={GS.pris}>
                      {est.lav === est.hoej ? kr(est.lav) : `${kr(est.lav)}–${kr(est.hoej)}`}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={[GS.lille, { marginTop: 8 }]}>
              Estimat ud fra {kr(udbyder.timepris)} i timen. Den endelige pris får du, når {udbyder.navn.split(' ')[0]} har set dit motiv.
            </Text>
          </View>

          <View style={GS.sektion}>
            <View style={[GS.mellemrum, { marginBottom: 10 }]}>
              <Text style={[GS.underoverskrift, { marginBottom: 0 }]}>Portfolio</Text>
              <Text style={GS.meta}>
                {billeder.length > 0
                  ? `${billeder.length} billeder${antalHelede > 0 ? ` · ${antalHelede} helede` : ''}`
                  : `${udbyder.antalBilleder} billeder`}
              </Text>
            </View>
            {billeder.length > 0 ? (
              <PortfolioGitter billeder={billeder} onTryk={setVisBillede} />
            ) : (
              <>
                <View style={GS.fliseGitter}>
                  {udbyder.portfolio.map((ikon, i) => (
                    <View key={`${ikon}${i}`} style={{ width: '31.8%' }}>
                      <Flise ikon={ikon} indeks={i} ikonStoerrelse={34} />
                    </View>
                  ))}
                </View>
                <Text style={[GS.lille, { marginTop: 8 }]}>
                  {forhaandsvisning
                    ? 'Kunderne ser disse pladsholdere, indtil du lægger dine egne billeder op under Min profil.'
                    : `${udbyder.navn.split(' ')[0]} har ikke lagt billeder op i appen endnu.`}
                </Text>
              </>
            )}
          </View>

          {anmeldelser.length > 0 ? (
            <View style={GS.sektion}>
              <View style={[GS.mellemrum, { marginBottom: 10 }]}>
                <Text style={[GS.underoverskrift, { marginBottom: 0 }]}>Anmeldelser</Text>
                <Pressable onPress={() => navigation.navigate('Anmeldelser', { udbyderId: udbyder.id })} hitSlop={8}>
                  <Text style={GS.link}>Se alle {samlet.antal}</Text>
                </Pressable>
              </View>
              <View style={GS.kort}>
                <View style={GS.mellemrum}>
                  <Text style={GS.titel}>{anmeldelser[0].navn}</Text>
                  <Stjerner vurdering={anmeldelser[0].vurdering} stoerrelse={13} />
                </View>
                <Text style={[GS.lille, { marginTop: 2 }]}>{anmeldelser[0].hvad} · {anmeldelser[0].dato}</Text>
                <Text style={[GS.broedtekst, { marginTop: 10, fontSize: 15, lineHeight: 22 }]}>
                  {anmeldelser[0].tekst}
                </Text>
                {anmeldelser[0].fraAppen ? (
                  <View style={[GS.raekke, { gap: 6, marginTop: 10 }]}>
                    <Ionicons name="checkmark-circle" size={16} color={Farver.accent} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: Farver.accent }}>Booket gennem appen</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {!forhaandsvisning ? (
        <View style={GS.bund}>
          <View style={{ flex: 1 }}>
            <Text style={GS.titel}>Fra {kr(udbyder.minimumspris)}</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', marginTop: 2, color: venteliste ? Farver.advarsel : Farver.accent }}>
              {ledigTekst(udbyder)}
            </Text>
          </View>
          <Knap
            titel={venteliste ? 'Venteliste' : 'Book tid'}
            onPress={book}
            inaktiv={venteliste}
            style={{ flex: 1, marginBottom: 0 }}
          />
        </View>
      ) : null}

      <BilledeVindue billede={visBillede} onLuk={() => setVisBillede(null)} />
    </View>
  );
}
