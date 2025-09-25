
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Patient } from '@/lib/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';

import { Header } from '@/components/Header';
import LoginPage from '@/app/components/LoginPage';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AddPatientDialog } from '@/app/components/AddPatientDialog';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DogIcon } from '@/components/DogIcon';
import { Cat } from 'lucide-react';


export default function GuardianDetailPage({ phone }: { phone: string }) {
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('isLoggedIn', false);
  const [isMounted, setIsMounted] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [guardianName, setGuardianName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);

    const q = query(
      collection(db, 'patients'),
      where('guardianPhone', '==', phone)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Patient))
        .filter(p => p.name); // Filter out placeholder guardians
        
      setPatients(patientsData);
      
      if (snapshot.docs.length > 0 && !guardianName) {
        setGuardianName(snapshot.docs[0].data().guardianName);
      } else if (snapshot.empty) {
        // This case should ideally not happen if a placeholder is created.
        // But as a fallback, redirect.
        if (!isLoading) {
          router.push('/');
        }
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching guardian's patients: ", error);
      toast({ title: '오류', description: '환자 목록을 불러오는 중 오류가 발생했습니다.', variant: 'destructive' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [phone, toast, router, isLoading, guardianName]);

  const openDeleteDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) return;
    try {
      await deleteDoc(doc(db, 'patients', selectedPatient.id));
      toast({
        title: '성공',
        description: `${selectedPatient.name} 환자 정보가 삭제되었습니다.`
      });
    } catch (error) {
      console.error("Error deleting patient: ", error);
      toast({
        title: '오류',
        description: '환자 정보 삭제 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedPatient(null);
    }
  };


  if (!isMounted || isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <>
      <Header isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)} />
      <div className="container mx-auto p-4 md:p-6">
        {isLoggedIn ? (
          <div className="space-y-6">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                보호자 목록으로
              </Link>
            </Button>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{guardianName}님의 반려동물</h1>
              <p className="text-muted-foreground">{phone}</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>새 반려동물 차트 생성</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> 새 환자 추가
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {patients.length > 0 ? patients.map((patient) => (
                <Card 
                  key={patient.id} 
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                >
                  <div 
                    className="flex-grow flex items-center gap-4 cursor-pointer"
                    onClick={() => router.push(`/patient/${patient.id}`)}
                  >
                    {patient.species === '개' ? <DogIcon className="h-8 w-8 text-muted-foreground" /> : <Cat className="h-8 w-8 text-muted-foreground" />}
                    <div>
                      <p className="font-semibold">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">{patient.species} / {patient.breed}</p>
                    </div>
                  </div>
                   <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(patient);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">삭제</span>
                    </Button>
                </Card>
              )) : (
                <Card className="p-8 text-center text-muted-foreground">
                  등록된 반려동물이 없습니다. '새 환자 추가' 버튼을 눌러 등록해주세요.
                </Card>
              )}
            </div>
            
            <AddPatientDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} guardian={{name: guardianName, phone: phone}} />
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 작업은 되돌릴 수 없습니다. {selectedPatient?.name} 환자의 모든 정보가 영구적으로 삭제됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePatient} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

          </div>
        ) : (
          <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />
        )}
      </div>
    </>
  );
}
