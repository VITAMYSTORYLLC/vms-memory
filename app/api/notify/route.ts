// app/api/notify/route.ts
// POST /api/notify — sends a push notification to the story owner's devices.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminMessaging, getAdminDb } from '../../lib/firebaseAdmin';

export const runtime = 'nodejs';

interface NotifyPayload {
  ownerUid: string;       // UID of the story author
  title: string;          // Notification title
  body: string;           // Notification body
  url?: string;           // Deep-link URL (e.g. /shared/[shareId])
}

export async function POST(req: NextRequest) {
  try {
    const { ownerUid, title, body, url } = (await req.json()) as NotifyPayload;

    if (!ownerUid || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    const messaging = getAdminMessaging();

    // 1. Look up all FCM tokens for this user
    const tokensSnap = await db
      .collection('users')
      .doc(ownerUid)
      .collection('fcmTokens')
      .get();

    if (tokensSnap.empty) {
      // Owner hasn't granted notification permission yet — that's fine
      return NextResponse.json({ sent: 0, message: 'No tokens found for owner' });
    }

    const tokens: string[] = tokensSnap.docs.map((d) => d.data().token as string).filter(Boolean);

    if (tokens.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No valid tokens' });
    }

    // 2. Send to all tokens (handles up to 500 at once via sendEachForMulticast)
    const response = await messaging.sendEachForMulticast({
      tokens,
      // Use `data` instead of `notification` so the SW can control the display
      data: {
        title,
        body,
        icon: '/icon-192x192.png',
        url: url || 'https://vms-memory.vercel.app',
      },
    });

    // 3. Clean up stale/invalid tokens
    const staleTokenDeletions: Promise<void>[] = [];
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const errCode = res.error?.code;
        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token'
        ) {
          // Remove the stale token from Firestore
          const tokenDoc = tokensSnap.docs[idx];
          staleTokenDeletions.push(tokenDoc.ref.delete().then(() => undefined));
        }
      }
    });
    await Promise.allSettled(staleTokenDeletions);

    return NextResponse.json({
      sent: response.successCount,
      failed: response.failureCount,
    });
  } catch (err: any) {
    console.error('[/api/notify] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
