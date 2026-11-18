// Kamera til referencebilleder. Bygget efter den opdaterede 07_kamera-vejledning:
// - CameraView er selvlukkende; knapperne ligger i et overlay ovenpå
// - udløseren venter på onCameraReady
// - key={facing} opretter kameraet på ny, når man skifter for/bag
// - hvis tilladelsen er afvist for altid, sendes man til Indstillinger
//
// Komponenten vises i en Modal fra BookTatoveringScreen (referencebilleder) og
// MinProfilScreen (portfolio) og sender hvert billede tilbage med
// onBillede(uri) — almindelige props, som i 01. tekst er hjælpeteksten nederst.

import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Alert, Linking, ScrollView, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Ionicons from '@expo/vector-icons/Ionicons';
import Knap from './Knap';
import { GlobalStyle as GS } from '../styles/GlobalStyle';

export default function KameraComponent({
  billeder = [], onBillede, onLuk, tekst = 'Tag et billede af din idé eller af stedet på kroppen',
}) {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  // Funktionerne står før de tidlige return (09-vejledningen: ellers ReferenceError)
  function toggleFacing() {
    if (loading) return;
    setCameraReady(false);
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }

  async function snap() {
    if (!cameraRef.current || !cameraReady || loading) return;
    try {
      setLoading(true);
      const result = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      onBillede(result.uri);
    } catch (err) {
      console.log('Snap error:', err);
      Alert.alert('Billedet kunne ikke tages', 'Vent et øjeblik, og prøv igen.');
    } finally {
      setLoading(false);
    }
  }

  if (!permission) return <View style={GS.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={[GS.container, GS.center]}>
        <Ionicons name="camera-outline" size={44} color="#6E695F" />
        <Text style={[GS.underoverskrift, { marginTop: 14, textAlign: 'center' }]}>
          Appen skal have adgang til kameraet
        </Text>
        <Text style={[GS.broedtekst, { textAlign: 'center', marginBottom: 24 }]}>
          Så kan du tage billeder og bruge dem i appen — fx af din idé, eller af en tatovering til din portfolio.
        </Text>
        <View style={{ alignSelf: 'stretch' }}>
          {permission.canAskAgain ? (
            <Knap titel="Giv kameratilladelse" onPress={requestPermission} />
          ) : (
            <>
              <Text style={[GS.meta, { textAlign: 'center', marginBottom: 14 }]}>
                Slå kameraet til i Indstillinger, kom tilbage, og tjek igen.
              </Text>
              <Knap titel="Åbn indstillinger" onPress={() => Linking.openSettings()} />
              <Knap titel="Tjek tilladelse igen" variant="sekundaer" onPress={getPermission} />
            </>
          )}
          <Knap titel="Annullér" variant="sekundaer" onPress={onLuk} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={GS.kameraContainer}>
      <CameraView
        key={facing}
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        onCameraReady={() => setCameraReady(true)}
        onMountError={(e) => {
          console.log('Kamerafejl:', e);
          Alert.alert('Kameraet kunne ikke starte', 'Luk og prøv igen.');
        }}
      />

      <SafeAreaView edges={['top']} style={GS.kameraTop}>
        <Pressable onPress={onLuk} style={GS.kameraKnap} accessibilityLabel="Luk kameraet">
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        <Pressable onPress={toggleFacing} style={GS.kameraKnap} accessibilityLabel="Skift kamera">
          <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
        </Pressable>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={GS.kameraBund}>
        {billeder.length > 0 ? (
          <ScrollView horizontal contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
            {billeder.map((uri) => (
              <Image key={uri} source={{ uri }} style={GS.miniature} />
            ))}
          </ScrollView>
        ) : (
          <Text style={[GS.kameraTekst, { textAlign: 'center', paddingHorizontal: 24 }]}>{tekst}</Text>
        )}

        <Pressable
          onPress={snap}
          disabled={!cameraReady || loading}
          style={[GS.udloeser, (!cameraReady || loading) && { opacity: 0.5 }]}
          accessibilityLabel="Tag billede"
        >
          <View style={GS.udloeserIndre} />
        </Pressable>

        {billeder.length > 0 ? (
          <Pressable onPress={onLuk} accessibilityRole="button">
            <Text style={GS.kameraTekst}>
              Færdig · {billeder.length} {billeder.length === 1 ? 'billede' : 'billeder'}
            </Text>
          </Pressable>
        ) : null}
      </SafeAreaView>
    </View>
  );
}
