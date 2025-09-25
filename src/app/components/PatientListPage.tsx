
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, onSnapshot, query, orderBy, Timestamp, where, getDocs, writeBatch, doc, addDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Patient, Species } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, ArrowUpDown, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DogIcon } from '@/components/DogIcon';
import { CatIcon } from '@/components/CatIcon';

type Guardian = {
  guardianName: string;
  guardianPhone: string;
  patients: Patient[];
  representativeChartId: string;
  surgeryDate: Timestamp | null;
  lastModified: Timestamp | null;
};

type SortKey = 'guardianName' | 'surgeryDate';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | '개' | '고양이';

function formatDate(timestamp: Timestamp | Date | null | undefined) {
  if (!timestamp) return 'N/A';
  // Handle both Firestore Timestamps and JS Dates
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  return new Intl.DateTimeFormat('ko-KR', options).format(date).replace(/\. /g, '-').replace('.', '');
}

const SortableHeader = ({ sortKey: key, currentSortKey, handleSort, children }: { sortKey: SortKey, currentSortKey: SortKey, handleSort: (key: SortKey) => void, children: React.ReactNode }) => (
    <TableHead onClick={() => handleSort(key)} className="cursor-pointer hover:bg-muted">
      <div className="flex items-center gap-2">
        {children}
        {currentSortKey === key && <ArrowUpDown className="h-4 w-4" />}
      </div>
    </TableHead>
  );


export default function PatientListPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('surgeryDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filter, setFilter] = useState<FilterType>('all');
  
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [guardianToDelete, setGuardianToDelete] = useState<Guardian | null>(null);

  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const [isAddingGuardian, setIsAddingGuardian] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'patients'), orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
      setPatients(patientsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching patients: ", error);
      toast({
        title: '오류',
        description: '환자 목록을 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const guardians = useMemo<Guardian[]>(() => {
    const groupedByPhone = patients.reduce((acc, patient) => {
      if (!patient.guardianPhone) return acc;
      if (!acc[patient.guardianPhone]) {
        acc[patient.guardianPhone] = {
          guardianName: patient.guardianName,
          guardianPhone: patient.guardianPhone,
          patients: [],
        };
      }
      acc[patient.guardianPhone].patients.push(patient);
      return acc;
    }, {} as Record<string, { guardianName: string; guardianPhone: string; patients: Patient[] }>);
    
    return Object.values(groupedByPhone).map(group => {
       const patientsWithRealData = group.patients.filter(p => p.name);
       
       const validTimestamps = group.patients
         .map(p => p.updatedAt)
         .filter(ts => ts instanceof Timestamp) as Timestamp[];

       const lastModified = validTimestamps.length > 0
         ? validTimestamps.reduce((latest, current) => current.toMillis() > latest.toMillis() ? current : latest)
         : null;

       if (patientsWithRealData.length === 0) {
         return {
           guardianName: group.guardianName,
           guardianPhone: group.guardianPhone,
           patients: [],
           representativeChartId: '반려동물 없음',
           surgeryDate: null,
           lastModified
         };
       }

       const representativePatient = [...patientsWithRealData].sort((a,b) => {
           const timeA = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : 0;
           const timeB = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : 0;
           return timeB - timeA;
       })[0];
       
       const surgeryPatient = [...patientsWithRealData].sort((a,b) => {
           const timeA = a.surgeryDate instanceof Timestamp ? a.surgeryDate.toMillis() : 0;
           const timeB = b.surgeryDate instanceof Timestamp ? b.surgeryDate.toMillis() : 0;
           return timeB - timeA;
       })[0];

       return {
         guardianName: group.guardianName,
         guardianPhone: group.guardianPhone,
         patients: patientsWithRealData,
         representativeChartId: representativePatient.id,
         surgeryDate: surgeryPatient?.surgeryDate instanceof Timestamp ? surgeryPatient.surgeryDate : null,
         lastModified,
       };
    });

  }, [patients]);
  

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }, [sortKey, sortDirection]);
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    let formattedValue = '';

    if (rawValue.length > 3) {
      formattedValue += rawValue.substring(0, 3) + '-';
      if (rawValue.length > 7) {
        formattedValue += rawValue.substring(3, 7) + '-';
        formattedValue += rawValue.substring(7, 11);
      } else {
        formattedValue += rawValue.substring(3);
      }
    } else {
      formattedValue = rawValue;
    }
    setNewGuardianPhone(formattedValue);
  };

  const sortedAndFilteredGuardians = useMemo(() => {
    let filtered = guardians;
    
    if (filter !== 'all') {
       filtered = guardians.filter(g => g.patients.some(p => p.species === filter));
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      
      let compare = 0;
      
      if (aValue === null || aValue === undefined) compare = -1;
      else if (bValue === null || bValue === undefined) compare = 1;
      else if (aValue instanceof Timestamp && bValue instanceof Timestamp) {
        compare = aValue.toMillis() - bValue.toMillis();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        compare = aValue.localeCompare(bValue);
      }

      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [guardians, filter, sortKey, sortDirection]);

  const handleAddGuardian = useCallback(async () => {
    if (!newGuardianName || !newGuardianPhone) {
        toast({ title: '오류', description: '보호자 이름과 전화번호를 모두 입력해주세요.', variant: 'destructive' });
        return;
    }
    if (!/^\d{3}-\d{3,4}-\d{4}$/.test(newGuardianPhone)) {
        toast({ title: '오류', description: '전화번호 형식이 올바르지 않습니다. (010-1234-5678)', variant: 'destructive' });
        return;
    }

    const existingGuardian = guardians.find(g => g.guardianPhone === newGuardianPhone);
    if (existingGuardian) {
        toast({ title: '오류', description: '이미 등록된 보호자 전화번호입니다.', variant: 'destructive' });
        return;
    }
    
    setIsAddingGuardian(true);
    try {
        const docRef = doc(collection(db, 'patients'));
        
        await setDoc(docRef, {
            id: docRef.id,
            guardianName: newGuardianName,
            guardianPhone: newGuardianPhone,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        toast({ title: '성공', description: `${newGuardianName} 보호자가 추가되었습니다.` });
        setNewGuardianName('');
        setNewGuardianPhone('');
    } catch (error) {
        console.error("Error adding new guardian:", error);
        toast({ title: '오류', description: '보호자 추가 중 오류가 발생했습니다.', variant: 'destructive' });
    } finally {
        setIsAddingGuardian(false);
    }
  }, [newGuardianName, newGuardianPhone, guardians, toast]);
  
  const handleDeleteGuardian = useCallback(async () => {
    if (!guardianToDelete) return;
    
    try {
      const batch = writeBatch(db);
      const q = query(collection(db, 'patients'), where('guardianPhone', '==', guardianToDelete.guardianPhone));
      const snapshot = await getDocs(q);
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      toast({
        title: '성공',
        description: `${guardianToDelete.guardianName} 보호자 및 모든 반려동물 정보가 삭제되었습니다.`
      });

    } catch (error) {
       console.error("Error deleting guardian and patients: ", error);
       toast({
        title: '오류',
        description: '보호자 정보 삭제 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setGuardianToDelete(null);
    }
  }, [guardianToDelete, toast]);
  
  const handleRowClick = useCallback((guardian: Guardian) => {
    const encodedPhone = encodeURIComponent(guardian.guardianPhone);
    router.push(`/guardian/${encodedPhone}`);
  }, [router]);


  if (isLoading) {
    return <LoadingOverlay text="목록을 불러오는 중..." />;
  }

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">
            보호자를 선택하거나 새로 추가하세요.
          </p>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>새 보호자 추가</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="flex items-center gap-4">
              <Input
                placeholder="보호자 이름"
                value={newGuardianName}
                onChange={(e) => setNewGuardianName(e.target.value)}
                className="max-w-xs"
              />
              <Input
                placeholder="전화번호"
                value={newGuardianPhone}
                onChange={handlePhoneChange}
                className="max-w-xs"
                maxLength={13}
              />
              <Button onClick={handleAddGuardian} disabled={isAddingGuardian}>
                <Plus className="mr-2 h-4 w-4" />
                {isAddingGuardian ? '추가 중...' : '추가'}
              </Button>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>보호자 목록</CardTitle>
           <div className="flex items-center gap-2">
              <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>전체</Button>
              <Button variant={filter === '개' ? 'default' : 'outline'} onClick={() => setFilter('개')}><DogIcon className="mr-2 h-4 w-4" />강아지</Button>
              <Button variant={filter === '고양이' ? 'default' : 'outline'} onClick={() => setFilter('고양이')}><CatIcon className="mr-2 h-4 w-4" />고양이</Button>
           </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader sortKey="guardianName" currentSortKey={sortKey} handleSort={handleSort}>보호자 이름</SortableHeader>
                  <TableHead>전화번호</TableHead>
                  <TableHead>반려동물</TableHead>
                  <TableHead>대표 차트번호</TableHead>
                  <SortableHeader sortKey="surgeryDate" currentSortKey={sortKey} handleSort={handleSort}>수술일</SortableHeader>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredGuardians.length > 0 ? (
                  sortedAndFilteredGuardians.map((guardian) => (
                    <TableRow
                      key={guardian.guardianPhone}
                      onClick={() => handleRowClick(guardian)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium">{guardian.guardianName}</TableCell>
                      <TableCell className="text-muted-foreground">{guardian.guardianPhone}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-x-2 gap-y-1 items-center">
                          {guardian.patients.length > 0 ? guardian.patients.map((p, index) => (
                            <Link
                              key={p.id}
                              href={`/patient/${p.id}`}
                              className="hover:underline text-primary"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {p.name}{index < guardian.patients.length - 1 ? ',' : ''}
                            </Link>
                          )) : (
                            <span className="text-muted-foreground text-xs">반려동물 없음</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{guardian.representativeChartId}</TableCell>
                      <TableCell>{formatDate(guardian.surgeryDate)}</TableCell>
                      <TableCell>
                         <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                setGuardianToDelete(guardian);
                                setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">삭제</span>
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                       {filter === 'all' ? '등록된 보호자가 없습니다.' : `등록된 ${filter} 보호자가 없습니다.`}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                이 작업은 되돌릴 수 없습니다. {guardianToDelete?.guardianName} 보호자의 모든 반려동물 정보가 영구적으로 삭제됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteGuardian} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
