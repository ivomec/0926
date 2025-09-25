
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously, signOut } from 'firebase/auth'; // 인증 관련 함수 추가

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app); // auth 객체 생성

// 익명 로그인 함수
const signIn = async () => {
  try {
    await signInAnonymously(auth);
    console.log('익명 로그인 성공');
  } catch (error) {
    console.error("익명 로그인 실패:", error);
  }
};

// 로그아웃 함수
const logOut = async () => {
  try {
    await signOut(auth);
    console.log('로그아웃 성공');
  } catch (error) {
    console.error("로그아웃 실패:", error);
  }
}

export { app, db, storage, auth, signIn, logOut }; // auth, signIn, logOut export 추가
