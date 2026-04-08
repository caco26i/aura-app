import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function firebaseAuthConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey?.trim() &&
      firebaseConfig.authDomain?.trim() &&
      firebaseConfig.projectId?.trim() &&
      firebaseConfig.appId?.trim(),
  );
}

let app: FirebaseApp | null = null;

export function getAuraFirebaseApp(): FirebaseApp {
  if (!firebaseAuthConfigured()) {
    throw new Error('Firebase is not configured (missing VITE_FIREBASE_* env).');
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getAuraFirebaseAuth() {
  return getAuth(getAuraFirebaseApp());
}
