
'use client';

import { useState, useMemo, useEffect } from 'react';
import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SodalimeRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, History } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


type SodalimeManagerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sodalimeRecord: SodalimeRecord | null;
};

const SODALIME_LIFESPAN_MINUTES_CAUTION = 600; // 10 hours
const SODALIME_LIFESPAN_MINUTES_WARNING = 720; // 12 hours
const SODALIME_LIFESPAN_MINUTES_CRITICAL = 900; // 15 hours


export default function SodalimeManagerDialog({ open, onOpenChange, sodalimeRecord }: SodalimeManagerDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [manualMinutes, setManualMinutes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (open && selectedDate && sodalimeRecord?.usage) {
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        const minutesForDay = sodalimeRecord.usage[dateKey] || '';
        setManualMinutes(String(minutesForDay));
    } else if (open) {
        setManualMinutes('');
    }
  }, [open, selectedDate, sodalimeRecord]);


  const handleSaveDailyUsage = async () => {
    if (!selectedDate) {
      toast({
        title: '오류',
        description: '날짜를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }
    
    const newMinutes = manualMinutes === '' ? 0 : parseInt(manualMinutes, 10);
    if (isNaN(newMinutes) || newMinutes < 0) {
      toast({
        title: '오류',
        description: '유효한 시간을 입력해주세요 (0 이상의 숫자).',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const sodalimeDocRef = doc(db, 'settings', 'sodalime');
      const dateKey = format(selectedDate, 'yyyy-MM-dd');

      await runTransaction(db, async (transaction) => {
        const sodalimeDoc = await transaction.get(sodalimeDocRef);
        
        const currentData = sodalimeDoc.exists() 
            ? (sodalimeDoc.data() as SodalimeRecord) 
            : { totalMinutes: 0, usage: {} };
            
        const oldMinutesForDay = currentData.usage[dateKey] || 0;
        const difference = newMinutes - oldMinutesForDay;

        const newTotalMinutes = (currentData.totalMinutes || 0) + difference;
        const newUsage = { ...currentData.usage };
        
        if (newMinutes === 0) {
            delete newUsage[dateKey];
        } else {
            newUsage[dateKey] = newMinutes;
        }
        
        transaction.set(sodalimeDocRef, {
            totalMinutes: newTotalMinutes,
            usage: newUsage,
        }, { merge: true });
      });

      toast({
        title: '성공',
        description: `${dateKey}의 사용 시간이 ${newMinutes}분으로 저장되었습니다.`,
      });
      setManualMinutes(String(newMinutes));
    } catch (error) {
      console.error("Error updating sodalime record: ", error);
      toast({
        title: '오류',
        description: '소다라임 기록 업데이트 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      const sodalimeDocRef = doc(db, 'settings', 'sodalime');
      await runTransaction(db, async (transaction) => {
        const sodalimeDoc = await transaction.get(sodalimeDocRef);
        const currentData = sodalimeDoc.exists() 
            ? (sodalimeDoc.data() as SodalimeRecord) 
            : { totalMinutes: 0, usage: {} };

        // Keep existing usage data, only reset totalMinutes
        transaction.set(sodalimeDocRef, {
            ...currentData,
            totalMinutes: 0,
            lastResetDate: Timestamp.now(),
        });
      });
      toast({
        title: '성공',
        description: '소다라임 누적 사용 시간이 초기화되었습니다. 기존 기록은 보존됩니다.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error resetting sodalime record: ", error);
      toast({
        title: '오류',
        description: '초기화 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
        setIsSaving(false);
    }
  };
  
  const totalMinutes = sodalimeRecord?.totalMinutes || 0;
  const usagePercentage = Math.min((totalMinutes / SODALIME_LIFESPAN_MINUTES_CRITICAL) * 100, 100);
  const remainingMinutes = Math.max(SODALIME_LIFESPAN_MINUTES_CRITICAL - totalMinutes, 0);
  
  let alertMessage: { title: string; description: string; variant: 'default' | 'destructive' | null, className?: string } | null = null;
  let progressClass = '';
  
  if (totalMinutes >= SODALIME_LIFESPAN_MINUTES_CRITICAL) {
      alertMessage = { title: '위험', description: '사용 시간 15시간 초과, 즉시 교체 필요.', variant: 'destructive' };
      progressClass = '[&>div]:bg-red-500';
  } else if (totalMinutes >= SODALIME_LIFESPAN_MINUTES_WARNING) {
      alertMessage = { title: '경고', description: '사용 시간 12시간 초과, FICO2 확인 필수 및 교체 준비.', variant: 'destructive', className: 'bg-orange-500 border-orange-500 text-white' };
      progressClass = '[&>div]:bg-orange-500';
  } else if (totalMinutes >= SODALIME_LIFESPAN_MINUTES_CAUTION) {
      alertMessage = { title: '주의', description: '사용 시간 10시간 초과, FICO2 확인 권장.', variant: 'default', className: 'bg-yellow-400 border-yellow-400 text-yellow-900 [&>svg]:text-yellow-900' };
      progressClass = '[&>div]:bg-yellow-500';
  }

  const highlightedDays = useMemo(() => {
    if (!sodalimeRecord?.usage) return [];
    // The keys are 'yyyy-MM-dd' strings, which parseISO handles correctly.
    return Object.keys(sodalimeRecord.usage).map(dateStr => parseISO(dateStr));
  }, [sodalimeRecord]);

  const sortedUsage = useMemo(() => {
    if (!sodalimeRecord?.usage) return [];
    return Object.entries(sodalimeRecord.usage).sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
  }, [sodalimeRecord]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>소다라임 사용 시간 관리</DialogTitle>
          <DialogDescription>
            수술 마취 시간을 기록하고 소다라임 교체 시기를 관리합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
                <span>총 사용 시간: {totalMinutes}분</span>
                <span>남은 시간: {remainingMinutes}분</span>
            </div>
            <Progress value={usagePercentage} className={cn(progressClass)}/>
            <div className="flex justify-between text-xs text-muted-foreground">
                {sodalimeRecord?.lastResetDate && (
                    <span className="text-blue-600 font-semibold">
                        최근 교체일: {format((sodalimeRecord.lastResetDate as Timestamp).toDate(), 'yyyy-MM-dd')}
                    </span>
                )}
                <span>{SODALIME_LIFESPAN_MINUTES_CRITICAL}분 기준</span>
            </div>
          </div>
          
          {alertMessage && (
            <Alert variant={alertMessage.variant} className={cn(alertMessage.className)}>
                <AlertTriangle className="h-4 w-4"/>
                <AlertTitle>{alertMessage.title}</AlertTitle>
                <AlertDescription>
                    {alertMessage.description}
                </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">일별 사용 시간 기록/수정</h4>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" disabled={sortedUsage.length === 0}>
                            <History className="mr-2 h-4 w-4"/> 누적 기록 보기
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">사용 기록</h4>
                            <p className="text-sm text-muted-foreground">최근 기록 순으로 표시됩니다.</p>
                        </div>
                        <ScrollArea className="h-64 mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>날짜</TableHead>
                                        <TableHead className="text-right">사용 시간(분)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedUsage.map(([date, minutes]) => (
                                        <TableRow key={date}>
                                            <TableCell>{date}</TableCell>
                                            <TableCell className="text-right">{minutes}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="manual-date">날짜 선택</Label>
                    <DatePicker date={selectedDate} setDate={setSelectedDate} highlightedDays={highlightedDays} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="manual-minutes">사용 시간 (분)</Label>
                    <div className="flex items-center gap-2">
                         <Input 
                            id="manual-minutes" 
                            type="number" 
                            placeholder="예: 60"
                            value={manualMinutes}
                            onChange={(e) => setManualMinutes(e.target.value)}
                         />
                         <Button onClick={handleSaveDailyUsage} disabled={isSaving}>
                            {isSaving ? '저장 중...' : '저장'}
                         </Button>
                    </div>
                </div>
              </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">교체 완료 (기록 초기화)</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>정말로 초기화하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                        이 작업은 되돌릴 수 없습니다. 누적 사용 시간이 0으로 초기화되고, 교체일이 오늘로 기록됩니다. (단, 기존의 일별 사용 기록은 통계를 위해 보존됩니다.)
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset} disabled={isSaving}>
                        {isSaving ? '초기화 중...' : '확인'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
