// app/lib/firebaseAdmin.ts
// Server-side Firebase Admin SDK singleton — used only in API routes (Node.js runtime)

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  adminApp = initializeApp({
    credential: cert(serviceAccount),
  });

  return adminApp;
}

export function getAdminMessaging() {
  return getMessaging(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
