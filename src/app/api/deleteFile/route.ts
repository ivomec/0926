
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
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

  if (!storagePath || !patientId || !fileId) {
    return new NextResponse(JSON.stringify({ message: 'Missing required fields: storagePath, patientId, fileId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const bucket = admin.storage().bucket();
  const firestore = admin.firestore();
  const file = bucket.file(storagePath);
  const imageDocRef = firestore.collection('patients').doc(patientId).collection('images').doc(fileId);

  try {
    // First, try to delete the file from storage
    await file.delete();
  } catch (error: any) {
    // If the file does not exist, it might have been deleted manually.
    // Check for "object not found" error codes.
    if (error.code === 404 || (error.code === 5 && error.message.includes("No such object"))) {
      console.log(`File not found in storage: ${storagePath}. Proceeding to delete Firestore record.`);
    } else {
      // For other errors (like permission issues), log them and fail.
      console.error('Error deleting file from storage:', error);
      return new NextResponse(JSON.stringify({ message: 'Error deleting file from storage', detail: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  try {
    // Regardless of storage deletion result (if it was a 'not found' error),
    // we attempt to delete the Firestore document.
    await imageDocRef.delete();
    return NextResponse.json({ message: 'File and/or record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting Firestore document:', error);
    return new NextResponse(JSON.stringify({ message: 'File was deleted from storage, but failed to delete Firestore record.', detail: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
