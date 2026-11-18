// Appens faste data, som data/const.js i 04_Styling.
// Navne, priser og anmeldelser er opdigtede. Bookinger ligger IKKE her —
// de gemmes i Firebase Realtime Database, fordi det er brugerens egne data.

// --- Valgmuligheder ---------------------------------------------------------

export const STILARTER = [
  { id: 'fineline', navn: 'Fine line', ikon: 'leaf-outline' },
  { id: 'blackwork', navn: 'Blackwork', ikon: 'contrast-outline' },
  { id: 'ornamental', navn: 'Ornamental', ikon: 'snow-outline' },
  { id: 'oldschool', navn: 'Old school', ikon: 'flash-outline' },
  { id: 'japansk', navn: 'Japansk', ikon: 'water-outline' },
  { id: 'realisme', navn: 'Realisme', ikon: 'image-outline' },
  { id: 'dotwork', navn: 'Dotwork', ikon: 'ellipsis-horizontal' },
  { id: 'celestial', navn: 'Celestial', ikon: 'moon-outline' },
];

export const KROPSDELE = ['Underarm', 'Overarm', 'Skulder', 'Ryg', 'Bryst', 'Ben', 'Hånd', 'Nakke'];

// Hvor mange timer en tatovering typisk tager i hver størrelse. Bruges til
// prisestimatet — brugertesten viste, at "fra 1.000 kr" ikke var nok.
export const STOERRELSER = [
  { id: 'lille', navn: 'Under 5 cm', timer: [1, 1] },
  { id: 'mellem', navn: '5–10 cm', timer: [1.5, 2.5] },
  { id: 'stor', navn: '10–20 cm', timer: [3, 4] },
  { id: 'kaempe', navn: 'Over 20 cm', timer: [5, 7] },
];

// --- Studier --------------------------------------------
// breddegrad/laengdegrad bruges til nålene på kortet.

export const STEDER = [
  {
    id: 'naalehuset',
    navn: 'Nålehuset',
    omraade: 'Vesterbro',
    adresse: 'Sønder Boulevard 44, 1720 København V',
    vurdering: 4.8,
    antalAnmeldelser: 312,
    aabentTil: '18',
    maerker: ['Walk-ins fredag', 'Piercing', 'Kørestolsvenligt'],
    om: 'Lille studie på Vesterbro med faste artister. Vi arbejder efter aftale, men holder åbent for walk-ins hver fredag fra kl. 12.',
    breddegrad: 55.6658,
    laengdegrad: 12.5532,
  },
  {
    id: 'ankerogblaek',
    navn: 'Anker og Blæk',
    omraade: 'Indre By',
    adresse: 'Landemærket 8, 1119 København K',
    vurdering: 4.6,
    antalAnmeldelser: 184,
    aabentTil: '17',
    maerker: ['Old school', 'Walk-ins', 'Gavekort'],
    om: 'Klassisk værksted midt i byen. Vi laver mest traditionelt arbejde og tager gerne små walk-ins, hvis der er hul i kalenderen.',
    breddegrad: 55.683,
    laengdegrad: 12.5755,
  },
  {
    id: 'tuschogtraad',
    navn: 'Tusch og Tråd',
    omraade: 'Nørrebro',
    adresse: 'Stefansgade 31, 2200 København N',
    vurdering: 4.7,
    antalAnmeldelser: 96,
    aabentTil: '19',
    maerker: ['Fine line', 'Aftenåbent'],
    om: 'Tre artister der deler et lyst lokale på Nørrebro. Vi tegner alt op fra bunden og sender skitsen inden din tid.',
    breddegrad: 55.6995,
    laengdegrad: 12.545,
  },
];

// --- Tatovører --------------------------------------------------------------
// arbejdsdage: 0 = mandag ... 6 = søndag
// portfolio: ikonnavne fra Ionicons, som pladsholdere indtil rigtige billeder

export const UDBYDERE = [
  {
    id: 'freja',
    navn: 'Freja Bang',
    initialer: 'FB',
    stedId: 'naalehuset',
    vurdering: 4.9,
    antalAnmeldelser: 128,
    erfaring: 8,
    svartid: 2,
    stilarter: ['fineline', 'ornamental', 'dotwork'],
    timepris: 1000,
    minimumspris: 1200,
    bio: 'Jeg arbejder med tynde streger og botaniske motiver, og tegner helst designet fra bunden sammen med dig. Kom gerne med en idé frem for en færdig skabelon.',
    portfolio: ['leaf-outline', 'flower-outline', 'snow-outline', 'moon-outline', 'rose-outline', 'water-outline'],
    antalBilleder: 84,
    arbejdsdage: [1, 3, 4],
    tider: ['10.00', '11.30', '14.00', '16.30'],
  },
  {
    id: 'mikkel',
    navn: 'Mikkel Ravn',
    initialer: 'MR',
    stedId: 'tuschogtraad',
    vurdering: 4.8,
    antalAnmeldelser: 94,
    erfaring: 5,
    svartid: 4,
    stilarter: ['fineline', 'dotwork', 'celestial'],
    timepris: 900,
    minimumspris: 1000,
    bio: 'Dotwork og fine line, gerne astronomi og geometri. Jeg tager god tid til at snakke placering, for det er dér de fleste ender med at fortryde.',
    portfolio: ['moon-outline', 'planet-outline', 'sparkles-outline', 'ellipsis-horizontal', 'leaf-outline', 'snow-outline'],
    antalBilleder: 61,
    arbejdsdage: [0, 1, 2, 4],
    tider: ['09.30', '12.00', '15.00'],
  },
  {
    id: 'asger',
    navn: 'Asger Hvid',
    initialer: 'AH',
    stedId: 'naalehuset',
    vurdering: 4.7,
    antalAnmeldelser: 156,
    erfaring: 12,
    svartid: 12,
    stilarter: ['blackwork', 'japansk', 'oldschool'],
    timepris: 1300,
    minimumspris: 1800,
    bio: 'Store flader, japanske motiver og blackwork. Jeg booker helst hele dage, for det er sjældent noget af det jeg laver er overstået på en time.',
    portfolio: ['water-outline', 'contrast-outline', 'flash-outline', 'skull-outline', 'snow-outline', 'flame-outline'],
    antalBilleder: 140,
    arbejdsdage: [2, 3, 5],
    tider: ['11.00', '14.30'],
  },
  {
    id: 'sofie',
    navn: 'Sofie Dalgaard',
    initialer: 'SD',
    stedId: 'ankerogblaek',
    vurdering: 5.0,
    antalAnmeldelser: 41,
    erfaring: 3,
    svartid: 24,
    stilarter: ['fineline', 'ornamental'],
    timepris: 1100,
    minimumspris: 1500,
    venteliste: 6,
    bio: 'Meget små motiver og lettering. Jeg har venteliste, men skriver ud så snart der bliver plads — skriv gerne hvad du vil have lavet.',
    portfolio: ['snow-outline', 'leaf-outline', 'moon-outline', 'rose-outline'],
    antalBilleder: 28,
    arbejdsdage: [1, 4],
    tider: ['13.00'],
  },
  {
    id: 'jonas',
    navn: 'Jonas Krag',
    initialer: 'JK',
    stedId: 'ankerogblaek',
    vurdering: 4.6,
    antalAnmeldelser: 203,
    erfaring: 15,
    svartid: 6,
    stilarter: ['oldschool', 'blackwork'],
    timepris: 950,
    minimumspris: 800,
    bio: 'Old school med tykke streger og stærke farver — ankre, svaler, roser og hjerter. Jeg har en mappe med flash, du kan vælge fra, hvis du ikke selv har en idé.',
    portfolio: ['boat-outline', 'heart-outline', 'rose-outline', 'flash-outline', 'skull-outline', 'star-outline'],
    antalBilleder: 176,
    arbejdsdage: [0, 1, 2, 3, 4, 5],
    tider: ['10.00', '12.00', '14.00', '16.00'],
  },
  {
    id: 'laerke',
    navn: 'Lærke Holm',
    initialer: 'LH',
    stedId: 'tuschogtraad',
    vurdering: 4.9,
    antalAnmeldelser: 67,
    erfaring: 7,
    svartid: 8,
    stilarter: ['realisme', 'blackwork'],
    timepris: 1200,
    minimumspris: 1500,
    bio: 'Realisme i sort og grå — portrætter, dyr og planter efter dine egne billeder. Send gerne et skarpt foto med, så kan jeg sige med det samme, om det kan lade sig gøre.',
    portfolio: ['paw-outline', 'eye-outline', 'leaf-outline', 'image-outline', 'contrast-outline', 'flower-outline'],
    antalBilleder: 73,
    arbejdsdage: [1, 2, 3, 5],
    tider: ['10.30', '14.00'],
  },
];

// --- Anmeldelser -------------------------------------------------------------
// bekraeftet = personen har booket gennem appen

export const ANMELDELSER = [
  {
    id: 'a1', udbyderId: 'freja', navn: 'Anne L.', initialer: 'AL', vurdering: 5,
    hvad: 'Fine line', dato: '12. august 2026', bekraeftet: true,
    tekst: 'Freja brugte god tid på at tegne motivet om, indtil det sad lige i skabet. Rolig hånd, ren arbejdsplads, og hun forklarede hele vejen hvad der skete.',
  },
  {
    id: 'a2', udbyderId: 'freja', navn: 'Thomas K.', initialer: 'TK', vurdering: 4,
    hvad: 'Ornamental', dato: '29. juli 2026', bekraeftet: true,
    tekst: 'Super resultat og god stemning i studiet. Trak en stjerne fordi vi måtte rykke tiden en uge, men hun meldte selv ud i god tid.',
  },
  {
    id: 'a3', udbyderId: 'freja', navn: 'Line M.', initialer: 'LM', vurdering: 5,
    hvad: 'Fine line', dato: '3. juli 2026', bekraeftet: true,
    tekst: 'Første tatovering og jeg var nervøs. Hun spurgte flere gange om vi skulle holde pause. Det betød alt.',
  },
  {
    id: 'a4', udbyderId: 'mikkel', navn: 'Sara B.', initialer: 'SB', vurdering: 5,
    hvad: 'Dotwork', dato: '20. august 2026', bekraeftet: true,
    tekst: 'Tålmodig og grundig. Prikkerne sidder helt ensartet, også på kanten hvor det er svært.',
  },
  {
    id: 'a5', udbyderId: 'asger', navn: 'Peter N.', initialer: 'PN', vurdering: 5,
    hvad: 'Japansk', dato: '14. august 2026', bekraeftet: true,
    tekst: 'Tre heldage på en halv ryg. Asger holdt tidsplanen og den pris han havde sagt fra starten.',
  },
  {
    id: 'a6', udbyderId: 'sofie', navn: 'Maja T.', initialer: 'MT', vurdering: 5,
    hvad: 'Lettering', dato: '2. august 2026', bekraeftet: true,
    tekst: 'Ventede fem uger, men det var det værd. Bogstaverne er knivskarpe.',
  },
  {
    id: 'a7', udbyderId: 'jonas', navn: 'Kasper V.', initialer: 'KV', vurdering: 5,
    hvad: 'Old school', dato: '22. august 2026', bekraeftet: true,
    tekst: 'Valgte en svale fra hans flash-mappe og var ude igen efter en time. Stregerne er tykke og rene, præcis som de skal være.',
  },
  {
    id: 'a8', udbyderId: 'jonas', navn: 'Nanna F.', initialer: 'NF', vurdering: 4,
    hvad: 'Old school', dato: '6. august 2026', bekraeftet: true,
    tekst: 'Flot arbejde og fair pris. Lidt travlt i studiet, så vi startede en halv time senere end aftalt.',
  },
  {
    id: 'a9', udbyderId: 'laerke', navn: 'Emil S.', initialer: 'ES', vurdering: 5,
    hvad: 'Realisme', dato: '30. august 2026', bekraeftet: true,
    tekst: 'Portræt af min hund efter et billede fra telefonen. Lærke sagde ærligt, hvilke detaljer der ville holde over tid, og hvilke der ikke ville.',
  },
];
