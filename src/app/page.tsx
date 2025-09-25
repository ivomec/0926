
'use client';

import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import { Header } from '@/components/Header';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import PatientListPage from './components/PatientListPage';
import { signIn, logOut, auth } from '@/lib/firebase'; // signIn, logOut, auth 임포트
import { onAuthStateChanged } from 'firebase/auth'; // onAuthStateChanged 임포트
import { LoadingOverlay } from '@/components/LoadingOverlay';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('isLoggedIn', false);
  const [isAuthReady, setIsAuthReady] = useState(false); // 인증 상태 확인 로딩

  useEffect(() => {
    // Firebase의 현재 로그인 상태를 감지
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true); // 사용자가 있으면 로그인 상태로
      } else {
        setIsLoggedIn(false); // 사용자가 없으면 로그아웃 상태로
      }
      setIsAuthReady(true); // 인증 상태 확인 완료
    });

    return () => unsubscribe(); // 컴포넌트 언마운트 시 감지 중단
  }, [setIsLoggedIn]);

  const handleLogin = async () => {
    await signIn(); // 실제 Firebase 익명 로그인 실행
    // onAuthStateChanged가 상태를 자동으로 업데이트하므로 setIsLoggedIn(true)는 필요없음
  };

  const handleLogout = async () => {
    await logOut(); // 실제 Firebase 로그아웃 실행
    // onAuthStateChanged가 상태를 자동으로 업데이트하므로 setIsLoggedIn(false)는 필요없음
  };

  if (!isAuthReady) {
    return <LoadingOverlay />; // 인증 상태 확인 중 로딩 화면 표시
  }

  return (
    <>
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="container mx-auto p-4 md:p-6 bg-background">
        {!isLoggedIn ? (
          <LoginPage onLoginSuccess={handleLogin} />
        ) : (
          <PatientListPage />
        )}
      </div>
    </>
  );
}
