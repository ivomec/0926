
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: "project-7512361120128609234.firebasestorage.app",
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message);
  }
}

const firestore = admin.firestore();
const storage = admin.storage();

export { admin, firestore, storage };
