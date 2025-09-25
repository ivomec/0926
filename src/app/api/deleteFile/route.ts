
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: "project-7512361120128609234.firebasestorage.app",
    });
    return admin.app();
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message);
    return null;
  }
};

export async function POST(request: Request) {
  const app = initializeFirebaseAdmin();
  if (!app) {
    return new NextResponse(JSON.stringify({ message: 'Firebase Admin SDK initialization failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  let data;
  try {
    data = await request.json();
  } catch (error) {
    return new NextResponse(JSON.stringify({ message: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  const { storagePath, patientId, fileId } = data;
  console.log('API /deleteFile called with:', { storagePath, patientId, fileId });

  if (!storagePath || !patientId || !fileId) {
    console.error('Missing required fields for deletion');
    return new NextResponse(JSON.stringify({ message: 'Missing required fields: storagePath, patientId, fileId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const bucket = admin.storage().bucket();
  const firestore = admin.firestore();
  
  const fileRef = bucket.file(storagePath);
  const docRef = firestore.collection('patients').doc(patientId).collection('images').doc(fileId);

  try {
    // Perform deletions concurrently and wait for both to settle
    const [storageResult, firestoreResult] = await Promise.allSettled([
      fileRef.delete(),
      docRef.delete()
    ]);

    const errors = [];

    if (storageResult.status === 'rejected') {
      const error: any = storageResult.reason;
      // We are tolerant of "file not found" errors for storage, as it might have been deleted already.
      if (error.code !== 404 && !(error.code === 5 && error.message.includes("No such object"))) {
        console.error('Error deleting file from storage:', error);
        errors.push(`Storage deletion failed: ${error.message}`);
      } else {
        console.log(`File not found in storage (considered non-fatal): ${storagePath}`);
      }
    } else {
      console.log(`Successfully deleted file from storage: ${storagePath}`);
    }

    if (firestoreResult.status === 'rejected') {
      const error: any = firestoreResult.reason;
      // A failure to delete the Firestore document is always a critical error.
      console.error('CRITICAL: Error deleting Firestore document:', error);
      errors.push(`Firestore record deletion failed: ${error.message}`);
    } else {
      console.log(`Successfully deleted Firestore document: ${fileId}`);
    }

    if (errors.length > 0) {
      const message = `Deletion process encountered errors: ${errors.join('; ')}`;
      return new NextResponse(JSON.stringify({ message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return NextResponse.json({ message: 'File and database record deleted successfully' });

  } catch (e) {
      console.error('Unexpected error in deleteFile API handler:', e);
      const error = e as Error;
      return new NextResponse(JSON.stringify({ message: 'An unexpected server error occurred.', detail: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
