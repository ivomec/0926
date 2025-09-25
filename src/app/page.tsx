
'use client';

import PatientListPage from './components/PatientListPage';
import { Header } from '@/components/Header';

export default function Home() {
  // 로그인 로직을 모두 제거하고, 항상 환자 목록을 보여줍니다.
  return (
    <>
      {/* 헤더에는 항상 로그인 된 것처럼 표시하고, 로그아웃 기능은 비워둡니다. */}
      <Header isLoggedIn={true} onLogout={() => {}} />
      <div className="container mx-auto p-4 md:p-6 bg-background">
        <PatientListPage />
      </div>
    </>
  );
}
