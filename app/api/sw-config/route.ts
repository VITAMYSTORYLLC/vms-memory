// app/api/sw-config/route.ts
// Serves Firebase public config as a JS snippet for the messaging service worker.
// Since env vars aren't available inside service workers, the SW fetches this
// on install and evaluates it to get the Firebase config.

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };

  const js = `self.__FIREBASE_CONFIG__ = ${JSON.stringify(config)};`;

  return new NextResponse(js, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store',
    },
  });
}
