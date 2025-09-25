
'use client';

import { useState } from 'react';
import PatientListPage from './components/PatientListPage';
import LoginPage from './components/LoginPage';
import { Header } from '@/components/Header';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <>
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="container mx-auto p-4 md:p-6 bg-background">
        {isLoggedIn ? (
          <PatientListPage />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        )}
      </div>
    </>
  );
}
