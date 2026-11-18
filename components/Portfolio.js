// Portfolio-billeder: et gitter med billederne, og et vindue der viser ét
// billede i stor størrelse. Bruges på tatovørens profil og på "Min profil".
//
// Billeder markeret som "helet" får et mærke — en kunde i spørgeskemaet ville
// gerne se, hvordan tatoveringerne ser ud, når de er helet, fordi det siger mest
// om kvaliteten.

import React from 'react';
import { View, Text, Image, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GlobalStyle as GS } from '../styles/GlobalStyle';
import { siden } from '../data/hjaelpere';

export function HeletMaerke({ lille = false }) {
  return (
    <View style={[GS.heletMaerke, lille && GS.heletMaerkeLille]}>
      <Ionicons name="sparkles" size={lille ? 10 : 12} color="#FFFFFF" />
      {!lille ? <Text style={GS.heletMaerkeTekst}>Helet</Text> : null}
    </View>
  );
}

/** billeder: [{ id, uri, tekst, helet }]. ekstra vises som sidste felt (fx "Tilføj"). */
export function PortfolioGitter({ billeder, onTryk, ekstra }) {
  return (
    <View style={GS.fliseGitter}>
      {billeder.map((b) => (
        <Pressable
          key={b.id}
          onPress={() => onTryk && onTryk(b)}
          style={{ width: '31.8%' }}
          accessibilityRole="imagebutton"
          accessibilityLabel={b.tekst || (b.helet ? 'Helet tatovering' : 'Tatovering')}
        >
          <Image source={{ uri: b.uri }} style={GS.portfolioBillede} />
          {b.helet ? <HeletMaerke lille /> : null}
        </Pressable>
      ))}
      {ekstra ? <View style={{ width: '31.8%' }}>{ekstra}</View> : null}
    </View>
  );
}

/** Ét billede i fuld størrelse. Luk ved at trykke på krydset. */
export function BilledeVindue({ billede, onLuk, handlinger }) {
  return (
    <Modal visible={!!billede} animationType="fade" onRequestClose={onLuk} transparent={false}>
      <SafeAreaView style={GS.billedeVindue}>
        <View style={GS.billedeVindueTop}>
          <Pressable onPress={onLuk} style={GS.kameraKnap} hitSlop={8} accessibilityLabel="Luk billedet">
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
        {billede ? (
          <>
            <Image source={{ uri: billede.uri }} style={GS.billedeStort} resizeMode="contain" />
            <View style={{ padding: 20, gap: 8 }}>
              {billede.helet ? <HeletMaerke /> : null}
              {billede.tekst ? <Text style={GS.billedeVindueTekst}>{billede.tekst}</Text> : null}
              {billede.oprettet ? (
                <Text style={GS.billedeVindueDato}>Lagt op {siden(billede.oprettet)}</Text>
              ) : null}
              {handlinger || null}
            </View>
          </>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
