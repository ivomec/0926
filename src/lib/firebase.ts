
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously, signOut } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAsUXIwdfQZXxNZtD9CQatVq2k4xaCoEGE",
  authDomain: "project-7512361120128609234.firebaseapp.com",
  projectId: "project-7512361120128609234",
  storageBucket: "project-7512361120128609234.firebasestorage.app",
  messagingSenderId: "41205404623",
  appId: "1:41205404623:web:dd2de9726c6af2645af8ba",
  measurementId: "G-W9BTDGE2KP"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

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

export { app, db, storage, auth, signIn, logOut };
