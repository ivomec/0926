
import { NextResponse } from 'next/server';
import { storage, firestore } from '@/lib/firebase-admin'; // 중앙 초기화 모듈에서 가져옵니다.

export async function POST(request: Request) {
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

  const bucket = storage.bucket(); // 이미 초기화된 storage 객체를 사용합니다.
  const fileRef = bucket.file(storagePath);
  const docRef = firestore.collection('patients').doc(patientId).collection('images').doc(fileId);

  try {
    const [storageResult, firestoreResult] = await Promise.allSettled([
      fileRef.delete(),
      docRef.delete()
    ]);

    const errors = [];

    if (storageResult.status === 'rejected') {
      const error: any = storageResult.reason;
      if (error.code !== 404) { // 404 (Not Found)는 오류로 간주하지 않습니다.
        console.error('Error deleting file from storage:', error);
        errors.push(`Storage deletion failed: ${error.message}`);
      }
    }

    if (firestoreResult.status === 'rejected') {
      const error: any = firestoreResult.reason;
      console.error('CRITICAL: Error deleting Firestore document:', error);
      errors.push(`Firestore record deletion failed: ${error.message}`);
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
