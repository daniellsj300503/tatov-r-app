// App.js samler det hele:
// - man kan se alt uden at logge ind (gæst). Først når man booker, skal man
//   logge ind — det ønskede tatovørerne i spørgeskemaet ("plug'n'play")
// - onAuthStateChanged fra 06 (via useBruger) holder øje med hvem der er logget ind
// - rollen fra Brugere/<uid> afgør om man ser kundesiden eller udbydersiden
// - faner (bottom-tabs) med ikoner, som i 04 og 05
// - en stack inde i fanerne, som i 05
// - notifikations-handleren fra 09

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';

import { rtdb, ref, onValue } from './database/db';
import { useBruger, useUlaeste } from './database/hooks';
import { foelgMineBookinger, foelgNyeAnmodninger } from './database/bookinger';
import { findUdbyder } from './data/hjaelpere';
import { bedOmTilladelse } from './components/Notifikationer';
import { GlobalStyle as GS, Farver } from './styles/GlobalStyle';

import HjemScreen from './screens/HjemScreen';
import UdbyderScreen from './screens/UdbyderScreen';
import AnmeldelserScreen from './screens/AnmeldelserScreen';
import StedScreen from './screens/StedScreen';
import BookTatoveringScreen from './screens/BookTatoveringScreen';
import KvitteringScreen from './screens/KvitteringScreen';
import KortScreen from './screens/KortScreen';
import BookingerScreen from './screens/BookingerScreen';
import KontoScreen from './screens/KontoScreen';
import IndbakkeScreen from './screens/IndbakkeScreen';
import AnmodningScreen from './screens/AnmodningScreen';
import KalenderScreen from './screens/KalenderScreen';
import SamtaleScreen from './screens/SamtaleScreen';
import AnmeldScreen from './screens/AnmeldScreen';
import MinProfilScreen from './screens/MinProfilScreen';

// Sådan vises en notifikation, mens appen er åben (09-vejledningen:
// shouldShowAlert findes ikke længere — brug shouldShowBanner og shouldShowList)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const UdforskStack = createNativeStackNavigator();
const KortStack = createNativeStackNavigator();
const BookingerStack = createNativeStackNavigator();
const IndbakkeStack = createNativeStackNavigator();
const KalenderStack = createNativeStackNavigator();
const ProfilStack = createNativeStackNavigator();

const stackOptions = {
  headerStyle: { backgroundColor: Farver.baggrund },
  headerTintColor: Farver.tekst,
  headerTitleStyle: { fontWeight: '600' },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: Farver.baggrund },
};

// Skærmene fra profil til kvittering bruges både fra forsiden og fra kortet.
// Hver fane har sin egen stack, så "tilbage" altid fører det rigtige sted hen.
function delteSkaerme(Stack) {
  return (
    <>
      <Stack.Screen name="Udbyder" component={UdbyderScreen} options={{ title: '' }} />
      <Stack.Screen name="Anmeldelser" component={AnmeldelserScreen} />
      <Stack.Screen name="Sted" component={StedScreen} options={{ title: '' }} />
      <Stack.Screen name="BookTatovering" component={BookTatoveringScreen} options={{ title: 'Send anmodning' }} />
      <Stack.Screen
        name="Kvittering"
        component={KvitteringScreen}
        options={{ title: '', headerBackVisible: false, gestureEnabled: false }}
      />
    </>
  );
}

function UdforskNavigator() {
  return (
    <UdforskStack.Navigator screenOptions={stackOptions}>
      <UdforskStack.Screen name="Hjem" component={HjemScreen} options={{ headerShown: false }} />
      {delteSkaerme(UdforskStack)}
    </UdforskStack.Navigator>
  );
}

function KortNavigator() {
  return (
    <KortStack.Navigator screenOptions={stackOptions}>
      <KortStack.Screen name="Kort" component={KortScreen} options={{ title: 'Kort' }} />
      {delteSkaerme(KortStack)}
    </KortStack.Navigator>
  );
}

function BookingerNavigator() {
  return (
    <BookingerStack.Navigator screenOptions={stackOptions}>
      <BookingerStack.Screen name="Bookinger" component={BookingerScreen} options={{ title: 'Mine bookinger' }} />
      <BookingerStack.Screen name="Samtale" component={SamtaleScreen} options={{ title: 'Beskeder' }} />
      <BookingerStack.Screen name="Anmeld" component={AnmeldScreen} options={{ title: 'Skriv anmeldelse' }} />
    </BookingerStack.Navigator>
  );
}

// Ikonerne vælges ud fra fanens navn, som i 04_Styling
const IKONER = {
  UdforskFane: ['compass', 'compass-outline'],
  KortFane: ['map', 'map-outline'],
  BookingerFane: ['calendar', 'calendar-outline'],
  KontoFane: ['person', 'person-outline'],
  IndbakkeFane: ['file-tray-full', 'file-tray-full-outline'],
  KalenderFane: ['calendar', 'calendar-outline'],
  ProfilFane: ['images', 'images-outline'],
};

const badgeStil = { backgroundColor: Farver.advarsel };

/** Id'erne på alle poster under en sti, live — til tallene på fanerne. */
function useIds(sti) {
  const [ids, setIds] = useState([]);
  useEffect(() => {
    if (!sti) {
      setIds([]);
      return undefined;
    }
    return onValue(ref(rtdb, sti), (snap) => setIds(Object.keys(snap.val() || {})), () => {});
  }, [sti]);
  return ids;
}

const faneOptions = ({ route }) => ({
  tabBarIcon: ({ focused, color, size }) => (
    <Ionicons name={IKONER[route.name][focused ? 0 : 1]} size={size} color={color} />
  ),
  tabBarActiveTintColor: Farver.tekst,
  tabBarInactiveTintColor: Farver.svag,
  tabBarStyle: { backgroundColor: Farver.kort, borderTopColor: Farver.kant },
  headerStyle: { backgroundColor: Farver.baggrund },
  headerTintColor: Farver.tekst,
  headerShadowVisible: false,
  sceneStyle: { backgroundColor: Farver.baggrund },
});

// --- Kundesiden ---------------------------------------------------------------

// Gæster ser de samme faner. Bookinger og Konto beder dem logge ind.
function Faner() {
  const { user } = useBruger();
  const uid = user ? user.uid : null;

  // Mens appen er åben: få besked når en tatovør svarer (database/bookinger.js)
  useEffect(() => (uid ? foelgMineBookinger(uid) : undefined), [uid]);

  // Tallet på Bookinger-fanen: samtaler med nye beskeder fra en tatovør
  const bookingIds = useIds(uid ? `Bookinger/${uid}` : null);
  const { antal } = useUlaeste(bookingIds, 'kunde');

  return (
    <Tab.Navigator screenOptions={faneOptions}>
      <Tab.Screen name="UdforskFane" component={UdforskNavigator} options={{ title: 'Udforsk', headerShown: false }} />
      <Tab.Screen name="KortFane" component={KortNavigator} options={{ title: 'Kort', headerShown: false }} />
      <Tab.Screen
        name="BookingerFane"
        component={BookingerNavigator}
        options={{
          title: 'Bookinger',
          headerShown: false,
          tabBarBadge: antal > 0 ? antal : undefined,
          tabBarBadgeStyle: badgeStil,
        }}
      />
      <Tab.Screen name="KontoFane" component={KontoScreen} options={{ title: 'Konto' }} />
    </Tab.Navigator>
  );
}

// --- Udbydersiden -------------------------------------------------------------
// udbyderId sendes ned gennem initialParams, så hver skærm kan læse det fra route.params.

function IndbakkeNavigator({ route }) {
  return (
    <IndbakkeStack.Navigator screenOptions={stackOptions}>
      <IndbakkeStack.Screen
        name="Indbakke"
        component={IndbakkeScreen}
        initialParams={{ udbyderId: route.params.udbyderId }}
        options={{ title: 'Indbakke' }}
      />
      <IndbakkeStack.Screen name="Anmodning" component={AnmodningScreen} options={{ title: '' }} />
      <IndbakkeStack.Screen name="Samtale" component={SamtaleScreen} options={{ title: 'Beskeder' }} />
    </IndbakkeStack.Navigator>
  );
}

function KalenderNavigator({ route }) {
  return (
    <KalenderStack.Navigator screenOptions={stackOptions}>
      <KalenderStack.Screen
        name="Kalender"
        component={KalenderScreen}
        initialParams={{ udbyderId: route.params.udbyderId }}
        options={{ title: 'Kalender' }}
      />
      <KalenderStack.Screen name="Anmodning" component={AnmodningScreen} options={{ title: '' }} />
      <KalenderStack.Screen name="Samtale" component={SamtaleScreen} options={{ title: 'Beskeder' }} />
    </KalenderStack.Navigator>
  );
}

// Tatovørens egen profil: portfolio-billeder og anmeldelser, og profilen som kunderne ser den
function ProfilNavigator({ route }) {
  return (
    <ProfilStack.Navigator screenOptions={stackOptions}>
      <ProfilStack.Screen
        name="MinProfil"
        component={MinProfilScreen}
        initialParams={{ udbyderId: route.params.udbyderId }}
        options={{ title: 'Min profil' }}
      />
      <ProfilStack.Screen name="Anmeldelser" component={AnmeldelserScreen} />
      <ProfilStack.Screen name="Udbyder" component={UdbyderScreen} options={{ title: 'Som kunderne ser dig' }} />
    </ProfilStack.Navigator>
  );
}

function UdbyderFaner({ route }) {
  const { udbyderId } = route.params;
  const [antalNye, setAntalNye] = useState(0);

  // Mens appen er åben: notifikation ved nye anmodninger, og tallet på fanen
  useEffect(() => foelgNyeAnmodninger(udbyderId, setAntalNye), [udbyderId]);

  // Tallet tæller også samtaler med nye beskeder fra en kunde
  const anmodningIds = useIds(`Anmodninger/${udbyderId}`);
  const { antal: ulaeste } = useUlaeste(anmodningIds, 'udbyder');
  const tal = antalNye + ulaeste;

  return (
    <Tab.Navigator screenOptions={faneOptions}>
      <Tab.Screen
        name="IndbakkeFane"
        component={IndbakkeNavigator}
        initialParams={{ udbyderId }}
        options={{
          title: 'Indbakke',
          headerShown: false,
          tabBarBadge: tal > 0 ? tal : undefined,
          tabBarBadgeStyle: badgeStil,
        }}
      />
      <Tab.Screen
        name="KalenderFane"
        component={KalenderNavigator}
        initialParams={{ udbyderId }}
        options={{ title: 'Kalender', headerShown: false }}
      />
      <Tab.Screen
        name="ProfilFane"
        component={ProfilNavigator}
        initialParams={{ udbyderId }}
        options={{ title: 'Profil', headerShown: false }}
      />
      <Tab.Screen name="KontoFane" component={KontoScreen} options={{ title: 'Konto' }} />
    </Tab.Navigator>
  );
}

const navTema = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Farver.baggrund, card: Farver.baggrund, text: Farver.tekst, primary: Farver.accent },
};

export default function App() {
  const { user, profil, klar } = useBruger();

  // Spinneren vises kun ved opstart. Logger man ind midt i en booking, må
  // skærmene ikke forsvinde, mens profilen hentes — så mister man det udfyldte.
  const [startet, setStartet] = useState(false);
  useEffect(() => {
    if (klar) setStartet(true);
  }, [klar]);

  // Spørg om notifikationer, når man er logget ind (som i 09)
  const uid = user ? user.uid : null;
  useEffect(() => {
    if (uid) bedOmTilladelse();
  }, [uid]);

  // Vent til vi ved om nogen er logget ind fra sidst, så forkerte faner ikke blinker
  if (!klar && !startet) {
    return (
      <View style={[GS.container, GS.center]}>
        <ActivityIndicator size="large" color={Farver.accent} />
      </View>
    );
  }

  // Udbyder kun hvis profilen peger på en udbyder der findes i data/udbydere.js
  const erUdbyder = !!user && !!profil && profil.rolle === 'udbyder' && !!findUdbyder(profil.udbyderId);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTema}>
        <StatusBar style="dark" />
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {erUdbyder ? (
            <RootStack.Screen
              navigationKey={profil.udbyderId}
              name="Udbyderside"
              component={UdbyderFaner}
              initialParams={{ udbyderId: profil.udbyderId }}
            />
          ) : (
            <RootStack.Screen name="Main" component={Faner} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
