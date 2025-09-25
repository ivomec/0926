
'use client';
import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import PatientDetailView from './PatientDetailView';
import { Header } from '@/components/Header';
import LoginPage from '@/app/components/LoginPage';

export default function PatientDetailClientPage({
  patientId,
}: {
  patientId: string;
}) {
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('isLoggedIn', false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // 또는 로딩 스피너를 보여줄 수 있습니다.
  }

  return (
    <>
      <Header isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)} />
      <div className="container mx-auto p-4 md:p-6">
        {isLoggedIn ? (
          <PatientDetailView patientId={patientId} />
        ) : (
          <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />
        )}
      </div>
    </>
  );
}
