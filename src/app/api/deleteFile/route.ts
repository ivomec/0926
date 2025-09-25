
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Helper function to initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  // Check if the app is already initialized to prevent errors
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    // Use application default credentials and explicitly set the bucket.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: 'animal-clinic-assistant.firebasestorage.app',
    });
    return admin.app();
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message);
    // Return null if initialization fails, which will be handled in the API route
    return null;
  }
};

export async function POST(request: Request) {
  const app = initializeFirebaseAdmin();

  // If initialization fails, return a clear server configuration error.
  if (!app) {
    return NextResponse.json({ success: false, error: 'Server configuration error. Firebase Admin SDK failed to initialize.' }, { status: 500 });
  }

  try {
    const { patientId, collectionName, fileId, storagePath } = await request.json();

    if (!patientId || !collectionName || !fileId || !storagePath) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }
    
    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    // Delete from Firestore
    const fileDocRef = db.collection('patients').doc(patientId).collection(collectionName).doc(fileId);
    await fileDocRef.delete();

    // Delete from Storage
    const file = bucket.file(storagePath);
    
    // Attempt to delete. If the file doesn't exist, it's not a critical error.
    await file.delete().catch(error => {
        if (error.code === 404) {
            console.warn(`File not found in Storage during deletion, but proceeding: ${storagePath}`);
        } else {
            // For other errors, re-throw to be caught by the outer catch block.
            throw error;
        }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in deleteFile API route:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
