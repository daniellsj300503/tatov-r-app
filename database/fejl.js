// Oversætter Firebase-fejl til dansk. Kurset viser error.message direkte,
// men den er på engelsk og svær at forstå for en bruger.

export function fejlbesked(error) {
  const kode = error && error.code ? error.code : '';
  switch (kode) {
    case 'auth/invalid-email':
      return 'Email-adressen ser ikke rigtig ud.';
    case 'auth/missing-password':
      return 'Du mangler at skrive en adgangskode.';
    case 'auth/weak-password':
      return 'Adgangskoden skal være mindst 6 tegn.';
    case 'auth/email-already-in-use':
      return 'Der findes allerede en bruger med den email. Prøv at logge ind i stedet.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Forkert email eller adgangskode.';
    case 'auth/too-many-requests':
      return 'For mange forsøg. Vent lidt, og prøv igen.';
    case 'auth/network-request-failed':
      return 'Ingen forbindelse til internettet.';
    case 'auth/operation-not-allowed':
      return 'Email-login er ikke slået til i Firebase. Se README.';
    case 'tid-optaget':
      return 'En anden har lige taget den tid. Vælg en anden tid.';
    case 'PERMISSION_DENIED':
      return 'Databasen afviste forespørgslen. Tjek reglerne i Firebase.';
    default:
      return (error && error.message) || 'Noget gik galt.';
  }
}
