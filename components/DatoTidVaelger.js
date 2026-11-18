// Vælg dag og tid, når man sender en anmodning til en tatovør.
// Dagene vises i en vandret række; tider der er optaget vises gråt og kan
// ikke vælges, så man kan se at kalenderen er rigtig og ikke bare tom.
//
// Optaget er både demodataene (tidErOptaget) og tider andre kunder har booket
// i appen. De sidste hentes live fra Optaget/<udbyderId> med onValue, så en tid
// forsvinder i samme øjeblik en anden kunde tager den.

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { rtdb, ref, onValue } from '../database/db';
import { GlobalStyle as GS } from '../styles/GlobalStyle';
import {
  ledigeDage, tidErOptaget, tidNoegle, relativDag, UGEDAGE_KORT, MAANEDER_KORT, mandagIndeks,
} from '../data/hjaelpere';

export default function DatoTidVaelger({ udbyder, valgtIso, valgtTid, onVaelgDag, onVaelgTid }) {
  const dage = ledigeDage(udbyder, 30);
  const [booket, setBooket] = useState({}); // { '2026-10-03': { '10-00': uid } }

  useEffect(() => {
    const unsubscribe = onValue(
      ref(rtdb, `Optaget/${udbyder.id}`),
      (snap) => setBooket(snap.val() || {}),
      (fejl) => console.log('Kunne ikke hente optagede tider', fejl),
    );
    return unsubscribe;
  }, [udbyder.id]);

  const erOptaget = (iso, t) => tidErOptaget(udbyder.id, iso, t) || !!(booket[iso] && booket[iso][tidNoegle(t)]);

  // Bliver den valgte tid taget af en anden, vælges den næste ledige samme dag
  useEffect(() => {
    if (!valgtIso || !valgtTid || !erOptaget(valgtIso, valgtTid)) return;
    const naeste = udbyder.tider.find((t) => !erOptaget(valgtIso, t));
    onVaelgTid(naeste || null);
  }, [booket, valgtIso, valgtTid]);

  if (dage.length === 0) {
    return <Text style={GS.meta}>Der er ingen ledige tider de næste 30 dage.</Text>;
  }

  const valgtDag = dage.find((d) => d.iso === valgtIso);

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[GS.dagRaekke, { paddingHorizontal: 20 }]}
        style={{ marginHorizontal: -20, marginBottom: 20 }}
      >
        {dage.map((d) => {
          const valgt = d.iso === valgtIso;
          const relativ = relativDag(d.dato);
          return (
            <Pressable
              key={d.iso}
              onPress={() => onVaelgDag(d.iso, d.tider.find((t) => !erOptaget(d.iso, t)) || null)}
              accessibilityRole="button"
              accessibilityState={{ selected: valgt }}
              style={[GS.dag, valgt && GS.dagValgt]}
            >
              <Text style={[GS.dagUge, valgt && GS.dagUgeValgt]}>
                {relativ === 'I dag' ? 'I dag' : UGEDAGE_KORT[mandagIndeks(d.dato)]}
              </Text>
              <Text style={[GS.dagNummer, valgt && GS.dagNummerValgt]}>{d.dato.getDate()}</Text>
              <Text style={[GS.dagMaaned, valgt && GS.dagUgeValgt]}>{MAANEDER_KORT[d.dato.getMonth()]}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {valgtDag ? (
        <>
          <Text style={GS.etiket}>Ledige tider {relativDag(valgtDag.dato).toLowerCase()}</Text>
          <View style={GS.tidGitter}>
            {udbyder.tider.map((t) => {
              const optaget = erOptaget(valgtDag.iso, t);
              const valgt = t === valgtTid;
              return (
                <Pressable
                  key={t}
                  disabled={optaget}
                  onPress={() => onVaelgTid(t)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: valgt, disabled: optaget }}
                  style={[GS.tid, valgt && GS.tidValgt, optaget && GS.tidOptaget]}
                >
                  <Text style={[GS.tidTekst, valgt && GS.tidTekstValgt]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <Text style={GS.meta}>Vælg en dag for at se tiderne.</Text>
      )}
    </View>
  );
}
