// Opret bruger, som SignUpComponent i 06_FirebaseLogin.
// Navnet gemmes i Realtime Database under Brugere/<uid>, så det kan vises i appen.
//
// Man vælger også om man er kunde eller tatovør. En tatovør kobles til en af
// tatovørerne i data/udbydere.js, og App.js viser så udbydersiden i stedet
// for kundesiden. Opretter man sig midt i en booking (kunKunde), er man kunde.

import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import {
  auth, rtdb, ref, set, createUserWithEmailAndPassword,
} from '../database/db';
import { fejlbesked } from '../database/fejl';
import Knap from './Knap';
import Chip from './Chip';
import Segment from './Segment';
import Note from './Note';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';
import { UDBYDERE } from '../data/udbydere';

const ROLLER = [
  { id: 'kunde', navn: 'Jeg vil booke' },
  { id: 'udbyder', navn: 'Jeg er tatovør' },
];

export default function Signup({ kunKunde = false }) {
  const [rolle, setRolle] = useState('kunde');
  const [udbyderId, setUdbyderId] = useState(null);
  const [navn, setNavn] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [arbejder, setArbejder] = useState(false);

  const vaelgUdbyder = (u) => {
    setUdbyderId(u.id);
    if (navn.trim() === '') setNavn(u.navn);
  };

  // Vis præcis hvad der mangler, i stedet for en knap der ikke reagerer
  let mangler = null;
  if (rolle === 'udbyder' && !udbyderId) mangler = 'Vælg hvem du er';
  else if (navn.trim().length < 2) mangler = 'Skriv dit navn';
  else if (!email.includes('@')) mangler = 'Skriv en gyldig email';
  else if (password.length < 6) mangler = 'Adgangskoden skal være mindst 6 tegn';

  const handleSignup = async () => {
    try {
      setArbejder(true);
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const profil = {
        navn: navn.trim(),
        email: user.email,
        rolle,
        oprettet: Date.now(),
      };
      if (rolle === 'udbyder') profil.udbyderId = udbyderId;
      await set(ref(rtdb, `Brugere/${user.uid}`), profil);
      // Midt i en booking sendes anmodningen med det samme — så er en popup kun i vejen
      if (!kunKunde) Alert.alert('Bruger oprettet!', `Velkommen, ${navn.trim().split(' ')[0]}.`);
      setArbejder(false);
    } catch (error) {
      Alert.alert('Kunne ikke oprette bruger', fejlbesked(error));
      setArbejder(false);
    }
  };

  return (
    <View>
      {!kunKunde ? (
        <Segment valg={ROLLER} valgt={rolle} onVaelg={setRolle} style={{ marginBottom: 20 }} />
      ) : null}

      {rolle === 'udbyder' ? (
        <>
          <Text style={GS.etiket}>Hvem er du?</Text>
          <View style={[GS.chipRaekke, { marginBottom: 12 }]}>
            {UDBYDERE.map((u) => (
              <Chip key={u.id} tekst={u.navn} valgt={udbyderId === u.id} onPress={() => vaelgUdbyder(u)} />
            ))}
          </View>
          <Note neutral style={{ marginBottom: 20 }}>
            Prototype: vælg en af tatovørerne i appen. I en rigtig version ville vi tjekke, at du er den, du siger.
          </Note>
        </>
      ) : null}

      <Text style={GS.etiket}>Navn</Text>
      <TextInput
        style={GS.input}
        value={navn}
        onChangeText={setNavn}
        placeholder="Dit fulde navn"
        placeholderTextColor={Farver.svag}
        autoComplete="name"
      />

      <Text style={GS.etiket}>Email</Text>
      <TextInput
        style={GS.input}
        value={email}
        onChangeText={setEmail}
        placeholder="dig@eksempel.dk"
        placeholderTextColor={Farver.svag}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <Text style={GS.etiket}>Adgangskode</Text>
      <TextInput
        style={GS.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Mindst 6 tegn"
        placeholderTextColor={Farver.svag}
        secureTextEntry
        autoCapitalize="none"
      />

      <Knap titel="Opret bruger" onPress={handleSignup} inaktiv={!!mangler} arbejder={arbejder} style={{ marginTop: 8 }} />
      {mangler ? <Text style={GS.hjaelpetekst}>{mangler}</Text> : null}
    </View>
  );
}
