import * as admin from 'firebase-admin';
import { getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    let credentialInput;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const decodedJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      credentialInput = cert(JSON.parse(decodedJson));
    } else {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (privateKey) {
        privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
      }
      credentialInput = cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      });
    }

    admin.initializeApp({
      credential: credentialInput,
    });
    console.log('Firebase Admin Initialized Successfully');
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

export const getAdminAuth = () => getAuth();
export const getDb = () => getFirestore();
