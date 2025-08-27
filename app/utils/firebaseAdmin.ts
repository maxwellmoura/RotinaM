import admin from 'firebase-admin';

let app: admin.app.App | null = null;

export function getAdminApp() {
  if (app) return app;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 não configurado.');
  }
  const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf-8');
  const creds = JSON.parse(json);
  app = admin.apps.length ? admin.app() : admin.initializeApp({
    credential: admin.credential.cert(creds),
  });
  return app;
}

export async function sendPushToAll(title: string, body: string) {
  const { prisma } = await import('./db');
  const tokens = await prisma.deviceToken.findMany();
  if (!tokens.length) return { success: 0 };
  const app = getAdminApp();
  const messaging = app.messaging();
  const res = await messaging.sendEachForMulticast({
    tokens: tokens.map(t => t.token),
    notification: { title, body },
  });
  return { success: res.successCount, failure: res.failureCount };
}
