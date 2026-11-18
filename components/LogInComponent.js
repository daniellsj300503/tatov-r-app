// Login-formularen, som LogInComponent i 06_FirebaseLogin.
// Funktionen hedder Login med stort L, som vejledningen siger.
// signInWithEmailAndPassword kommer fra database/db.js — lige nu den lokale
// udgave på telefonen, senere Firebase.

import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { auth, signInWithEmailAndPassword } from '../database/db';
import { fejlbesked } from '../database/fejl';
import Knap from './Knap';
import { GlobalStyle as GS, Farver } from '../styles/GlobalStyle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [arbejder, setArbejder] = useState(false);

  const udfyldt = email.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    try {
      setArbejder(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Når login lykkes, opdaterer appen sig selv via onAuthStateChanged
    } catch (error) {
      Alert.alert('Login fejlede', fejlbesked(error));
      setArbejder(false);
    }
  };

  return (
    <View>
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
        placeholder="Din adgangskode"
        placeholderTextColor={Farver.svag}
        secureTextEntry
        autoCapitalize="none"
      />

      <Knap titel="Log ind" onPress={handleLogin} inaktiv={!udfyldt} arbejder={arbejder} style={{ marginTop: 8 }} />
      {!udfyldt ? <Text style={GS.hjaelpetekst}>Skriv email og adgangskode for at logge ind</Text> : null}
    </View>
  );
}
