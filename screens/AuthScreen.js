// Login og opret bruger på samme skærm, som AuthScreen i 06_FirebaseLogin.
// isLogin skifter mellem de to formularer.
//
// Man kan bruge appen uden at være logget ind. Skærmen vises derfor to steder:
// under Konto, og som et vindue når en gæst sender sin første anmodning.
// kunKunde skjuler valget "Jeg er tatovør", når man er midt i en booking.

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Login from '../components/LogInComponent';
import Signup from '../components/SignUpComponent';
import { GlobalStyle as GS } from '../styles/GlobalStyle';

export default function AuthScreen({ kunKunde = false, tekst }) {
  const [isLogin, setIsLogin] = useState(!kunKunde);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={GS.container}
      keyboardVerticalOffset={Platform.OS === 'ios' && !kunKunde ? 90 : 0}
    >
      <ScrollView contentContainerStyle={GS.authIndhold} keyboardShouldPersistTaps="handled">
        <View style={GS.authLogo}>
          <Ionicons name="calendar" size={30} color="#FFFFFF" />
        </View>

        <Text style={GS.overskrift}>{isLogin ? 'Log ind' : 'Opret bruger'}</Text>
        <Text style={[GS.broedtekst, { marginTop: 8, marginBottom: 28 }]}>
          {tekst || 'Find den rigtige tatovør, og send din idé direkte — uden at skrive rundt på Instagram.'}
        </Text>

        {isLogin ? <Login /> : <Signup kunKunde={kunKunde} />}

        <Pressable onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 22 }} hitSlop={10}>
          <Text style={[GS.link, { textAlign: 'center' }]}>
            {isLogin ? 'Ny her? Opret en bruger' : 'Har du allerede en bruger? Log ind'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
