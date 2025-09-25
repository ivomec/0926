'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { differenceInMinutes, differenceInSeconds, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { FormLabel } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { SodalimeRecord } from '@/lib/types';
import type { PatientFormValues } from './PatientDetailView';
import { Activity, Play, StopCircle, RefreshCw, History, Pipette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TimePicker } from './TimePicker';

type AnesthesiaManagementCardProps = {
  sodalimeRecord: SodalimeRecord | null;
  setSodalimeDialogOpen: (isOpen: boolean) => void;
};

const AnesthesiaManagementCard = ({ sodalimeRecord, setSodalimeDialogOpen }: AnesthesiaManagementCardProps) => {
  const { watch, setValue, getValues } = useFormContext<PatientFormValues>();
  const { toast } = useToast();

  const [elapsedTime, setElapsedTime] = React.useState('00:00:00');
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const surgeryStartTime = watch('surgeryStartTime');
  const surgeryEndTime = watch('surgeryEndTime');
  const anesthesiaDuration = watch('anesthesiaDuration');

  const formattedDuration = React.useMemo(() => {
    const totalMinutes = anesthesiaDuration || 0;
    if (totalMinutes <= 0) return '0분';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let result = '';
    if (hours > 0) {
      result += `${hours}시간 `;
    }
    if (minutes > 0 || hours === 0) {
      result += `${minutes}분`;
    }
    return result.trim();
  }, [anesthesiaDuration]);
  
  const stopTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedTime('00:00:00');
  }, []);

  const startTimer = React.useCallback((startTime: Date) => {
    stopTimer();
    timerRef.current = setInterval(() => {
      const now = new Date();
      const durationInSeconds = differenceInSeconds(now, startTime);
      const hours = Math.floor(durationInSeconds / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((durationInSeconds % 3600) / 60).toString().padStart(2, '0');
      const seconds = (durationInSeconds % 60).toString().padStart(2, '0');
      setElapsedTime(`${hours}:${minutes}:${seconds}`);
      
      const durationInMinutes = differenceInMinutes(now, startTime);
      setValue('anesthesiaDuration', durationInMinutes, { shouldDirty: true });
    }, 1000);
  }, [setValue, stopTimer]);
  
  React.useEffect(() => {
    const startTime = getValues('surgeryStartTime');
    const endTime = getValues('surgeryEndTime');
    if (startTime && !endTime) {
        startTimer(startTime);
    } else {
        stopTimer();
    }
    return () => stopTimer();
  }, [surgeryStartTime, surgeryEndTime, startTimer, stopTimer, getValues]);


  const handleTimeAction = (action: 'start' | 'stop' | 'reset') => {
    const now = new Date();
    if (action === 'start') {
      setValue('surgeryStartTime', now, { shouldDirty: true });
      setValue('surgeryEndTime', null, { shouldDirty: true });
      startTimer(now);
    } else if (action === 'stop') {
      const startTime = getValues('surgeryStartTime');
      if (startTime) {
        setValue('surgeryEndTime', now, { shouldDirty: true });
        const duration = differenceInMinutes(now, startTime);
        setValue('anesthesiaDuration', duration, { shouldDirty: true });
        stopTimer();
      } else {
        toast({ title: '오류', description: '시작 시간을 먼저 기록해주세요.', variant: 'destructive' });
      }
    } else if (action === 'reset') {
      setValue('surgeryStartTime', null, { shouldDirty: true });
      setValue('surgeryEndTime', null, { shouldDirty: true });
      setValue('anesthesiaDuration', 0, { shouldDirty: true });
      stopTimer();
    }
  };

  const handleTimeChange = (field: 'surgeryStartTime' | 'surgeryEndTime', newDateValue: Date | null) => {
    // This function ensures correct calculation by first setting the value,
    // then immediately getting both values to perform the calculation.
    setValue(field, newDateValue, { shouldDirty: true });
    
    // We get the values *after* setting the new one to ensure our calculation is up-to-date.
    const currentValues = getValues();
    const startTime = currentValues.surgeryStartTime;
    const endTime = currentValues.surgeryEndTime;
  
    if (startTime && endTime) {
      if (endTime < startTime) {
        toast({
            title: '경고',
            description: '종료 시간이 시작 시간보다 빠릅니다.',
            variant: 'destructive'
        });
        setValue('anesthesiaDuration', 0, { shouldDirty: true });
        stopTimer();
        return;
      }
      const duration = differenceInMinutes(endTime, startTime);
      setValue('anesthesiaDuration', duration > 0 ? duration : 0, { shouldDirty: true });
      stopTimer();
    } else if (!startTime || !endTime) {
        // if one of them is cleared or not set, clear duration.
        setValue('anesthesiaDuration', 0, { shouldDirty: true });
        // If start time exists but end time is cleared, start the timer again
        if (startTime && !endTime) {
            startTimer(startTime);
        } else {
            stopTimer();
        }
    }
  };

  const handleSaveAnesthesiaToSodalime = async () => {
    const duration = getValues('anesthesiaDuration');
    const surgeryDate = getValues('surgeryStartTime') || getValues('surgeryDate');

    if (!duration || duration <= 0) {
      toast({ title: '오류', description: '유효한 마취 시간이 없습니다.', variant: 'destructive' });
      return;
    }
    if (!surgeryDate) {
      toast({ title: '오류', description: '수술 날짜 정보가 없습니다.', variant: 'destructive' });
      return;
    }

    try {
      const sodalimeDocRef = doc(db, 'settings', 'sodalime');
      const dateKey = format(surgeryDate, 'yyyy-MM-dd');

      await runTransaction(db, async (transaction) => {
        const sodalimeDoc = await transaction.get(sodalimeDocRef);
        const currentData = sodalimeDoc.exists() ? (sodalimeDoc.data() as SodalimeRecord) : { totalMinutes: 0, usage: {} };
        
        const oldMinutesForDay = currentData.usage[dateKey] || 0;
        const newMinutesForDay = oldMinutesForDay + duration;
        
        const totalDifference = newMinutesForDay - oldMinutesForDay;
        const newTotalMinutes = (currentData.totalMinutes || 0) + totalDifference;
        
        const newUsage = { ...currentData.usage, [dateKey]: newMinutesForDay };
        
        transaction.set(sodalimeDocRef, { totalMinutes: newTotalMinutes, usage: newUsage }, { merge: true });
      });

      toast({
        title: '성공',
        description: `${dateKey}에 ${duration}분의 소다라임 사용 시간이 추가되었습니다.`,
      });
    } catch (error) {
      console.error("Error updating sodalime record from surgery time: ", error);
      toast({
        title: '오류',
        description: '소다라임 기록 업데이트 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };
  

  return (
    <AccordionItem value="item-4">
      <Card>
        <AccordionTrigger className="p-6">
          <CardTitle className="flex items-center gap-2">
            <Activity />
            수술 관리
          </CardTitle>
        </AccordionTrigger>
        <AccordionContent className="p-6 pt-0">
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">수술/마취 시간 기록</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <FormLabel>시작 시간</FormLabel>
                   <TimePicker
                    date={surgeryStartTime}
                    setDate={(date) => handleTimeChange('surgeryStartTime', date)}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>종료 시간</FormLabel>
                  <TimePicker
                    date={surgeryEndTime}
                    setDate={(date) => handleTimeChange('surgeryEndTime', date)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-lg font-bold">
                  총 마취: <span className="font-mono text-primary">{formattedDuration}</span>
                  {timerRef.current && <span className="ml-2 text-sm font-mono text-muted-foreground tabular-nums">({elapsedTime})</span>}
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2">
                  <Button type="button" size="icon" variant="outline" onClick={() => handleTimeAction('start')}><Play className="text-green-600"/></Button>
                  <Button type="button" size="icon" variant="outline" onClick={() => handleTimeAction('stop')}><StopCircle className="text-red-600"/></Button>
                  <Button type="button" size="icon" variant="outline" onClick={() => handleTimeAction('reset')}><RefreshCw /></Button>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                {anesthesiaDuration > 0 && surgeryStartTime && surgeryEndTime && (
                  <Button type="button" onClick={handleSaveAnesthesiaToSodalime}>
                    <History className="mr-2" />
                    소다라임 사용 시간에 추가
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold mb-2">소다라임 관리</h4>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  누적 사용 시간: {sodalimeRecord?.totalMinutes || 0} 분
                  {sodalimeRecord && sodalimeRecord.totalMinutes >= 720 && <Badge variant="destructive" className="ml-2">FICO2 확인 요망</Badge>}
                </p>
                <Button type="button" onClick={() => setSodalimeDialogOpen(true)} className={cn(sodalimeRecord && sodalimeRecord.totalMinutes >= 720 && "bg-yellow-500 hover:bg-yellow-600")}>
                  <Pipette className="mr-2"/> 소다라임 관리
                </Button>
              </div>
            </div>
          </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}
export default React.memo(AnesthesiaManagementCard);
