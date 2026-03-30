// app/api/cron/reminders/route.ts
// Vercel Cron job — runs daily to find inactive users and send re-engagement push notifications.
// Scheduled in vercel.json: "0 14 * * *" (9am EST / 2pm UTC)

import { NextRequest, NextResponse } from 'next/server';
import { getAdminMessaging, getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const INACTIVE_DAYS = 7; // Days of inactivity before sending a reminder
const INACTIVE_MS = INACTIVE_DAYS * 24 * 60 * 60 * 1000;

const REMINDER_MESSAGES = [
  { title: '\u270D\uFE0F A story is waiting to be told', body: "The memories you haven't captured yet are still worth sharing." },
  { title: '\uD83D\uDCAD Someone is wondering about their roots', body: 'Take a moment today — even one sentence becomes a treasure.' },
  { title: '\uD83D\uDCD6 VitaMyStory misses you', body: 'You have stories worth preserving. Write one today.' },
  { title: "\uD83C\uDF3F It's been a while", body: 'Family stories fade with time. Help keep them alive.' },
  { title: '\uD83D\uDC9B A quiet moment to remember', body: 'Return to VitaMyStory and capture a memory today.' },
];

export async function POST(req: NextRequest) {
  // Verify this came from Vercel Cron (not a random caller)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdminDb();
  const messaging = getAdminMessaging();
  const now = Date.now();
  const cutoff = now - INACTIVE_MS;

  let sentCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    // Find all users who have FCM tokens (means they opted into notifications)
    // and haven't been active recently
    const usersSnap = await db
      .collection('users')
      .where('lastActiveAt', '<', cutoff)
      .get();

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;

      // Get all tokens for this user
      const tokensSnap = await db
        .collection('users')
        .doc(uid)
        .collection('fcmTokens')
        .get();

      if (tokensSnap.empty) {
        skippedCount++;
        continue;
      }

      const tokens = tokensSnap.docs
        .map((d) => d.data().token as string)
        .filter(Boolean);

      if (tokens.length === 0) {
        skippedCount++;
        continue;
      }

      // Pick a random reminder message (variety keeps it fresh)
      const msg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];

      try {
        const response = await messaging.sendEachForMulticast({
          tokens,
          data: {
            title: String(msg.title),
            body: String(msg.body),
            icon: '/icon-192x192.png',
            url: 'https://vms-memory.vercel.app/',
          },
        });

        sentCount += response.successCount;

        // Clean up stale tokens
        const deletions: Promise<any>[] = [];
        response.responses.forEach((res, idx) => {
          if (!res.success) {
            const code = res.error?.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              deletions.push(tokensSnap.docs[idx].ref.delete());
            }
          }
        });
        await Promise.allSettled(deletions);
      } catch (err) {
        console.error(`[cron/reminders] Failed for uid ${uid}:`, err);
        errorCount++;
      }
    }

    console.log(`[cron/reminders] Done — sent: ${sentCount}, skipped: ${skippedCount}, errors: ${errorCount}`);
    return NextResponse.json({ sent: sentCount, skipped: skippedCount, errors: errorCount });
  } catch (err: any) {
    console.error('[cron/reminders] Fatal error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
