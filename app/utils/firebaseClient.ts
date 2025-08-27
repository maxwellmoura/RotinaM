// app/utils/firebaseClient.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

// SUA CONFIG DO FIREBASE (Web)
const firebaseConfig = {
  apiKey: "AIzaSyCgLHDlkK1u8fhl6QPDihcPaBsZjhrCc-Y",
  authDomain: "rotinam-4be01.firebaseapp.com",
  projectId: "rotinam-4be01",
  storageBucket: "rotinam-4be01.firebasestorage.app",
  messagingSenderId: "575844907882",
  appId: "1:575844907882:web:ca71bcbb5229d822950313",
  measurementId: "G-2J329MLF6Z",
};

// Evita reinicializar em hot-reload
export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// (Opcional) Analytics só no navegador, e só se suportado
export async function ensureAnalytics() {
  if (typeof window === 'undefined') return null;
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
}
