import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Tus credenciales reales
const firebaseConfig = {
  apiKey: "AIzaSyAo15JfLzuBCo17Xb4eL0fyrqNCDJzC728",
  authDomain: "finanzasfamiliares-7034f.firebaseapp.com",
  projectId: "finanzasfamiliares-7034f",
  storageBucket: "finanzasfamiliares-7034f.firebasestorage.app",
  messagingSenderId: "210648816928",
  appId: "1:210648816928:web:d618ed3379520fea618b45"
};

const app = initializeApp(firebaseConfig);

// Exportar base de datos y autenticación
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Función para iniciar sesión que usará tu botón de Login
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export default app;