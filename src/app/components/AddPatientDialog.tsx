
'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Species } from '@/lib/types';
import { dogBreeds, catBreeds } from '@/lib/breeds';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DogIcon } from '@/components/DogIcon';
import { CatIcon } from '@/components/CatIcon';

const patientFormSchema = z.object({
  chartId: z.string().min(1, '차트번호는 필수입니다.'),
  name: z.string().min(1, '환자 이름은 필수입니다.'),
  species: z.enum(['개', '고양이']),
  breed: z.string().min(1, '품종은 필수입니다.'),
  birthDate: z.date({ required_error: '생년월일은 필수입니다.' }),
  gender: z.enum(['수컷', '암컷']),
  isNeutered: z.boolean().default(false),
  weight: z.coerce.number().min(0.1, '몸무게는 0.1kg 이상이어야 합니다.'),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

type AddPatientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guardian: { name: string; phone: string };
};

export function AddPatientDialog({ open, onOpenChange, guardian }: AddPatientDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  
  const { toast } = useToast();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      chartId: '',
      name: '',
      species: '개',
      breed: '',
      birthDate: undefined,
      gender: '수컷',
      isNeutered: false,
      weight: 0,
    },
  });

  const watchedSpecies = useWatch({
    control: form.control,
    name: 'species',
  });

  useEffect(() => {
    form.setValue('breed', '');
  }, [watchedSpecies, form]);
  
  useEffect(() => {
    if (open) {
      form.reset({
        chartId: '',
        species: '개',
        name: '',
        breed: '',
        birthDate: undefined,
        gender: '수컷',
        isNeutered: false,
        weight: 0,
      });
    }
  }, [open, form]);

  const onSubmit = async (data: PatientFormValues) => {
    if (!guardian) {
        toast({ title: '오류', description: '보호자 정보가 없습니다.', variant: 'destructive' });
        return;
    }
    setIsLoading(true);
    try {
      const patientDocRef = doc(db, 'patients', data.chartId);
      const docSnap = await getDoc(patientDocRef);

      if (docSnap.exists()) {
        toast({
          title: '오류',
          description: '이미 존재하는 차트번호입니다. 다른 번호를 입력해주세요.',
          variant: 'destructive',
        });
        form.setError('chartId', { type: 'manual', message: '이미 사용 중인 차트번호입니다.' });
        setIsLoading(false);
        return;
      }

      await setDoc(patientDocRef, {
        guardianName: guardian.name,
        guardianPhone: guardian.phone,
        ...data,
        id: data.chartId,
        birthDate: Timestamp.fromDate(data.birthDate),
        surgeryDate: Timestamp.now(), // 시스템 날짜로 자동 생성
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        hasHeartCondition: false,
        hasLiverCondition: false,
        hasKidneyCondition: false,
      });

      toast({
        title: '성공',
        description: `${guardian.name} 보호자님의 새 반려동물(${data.name})이 등록되었습니다.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        title: '오류',
        description: '환자 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const breedList = watchedSpecies === '개' ? dogBreeds : catBreeds;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>새 반려동물 추가</DialogTitle>
          <DialogDescription>
            {guardian?.name} 보호자님의 반려동물 정보를 입력하세요.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="chartId" render={({ field }) => (
              <FormItem><FormLabel>차트번호</FormLabel><FormControl><Input placeholder="고유 번호 입력" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>이름</FormLabel><FormControl><Input placeholder="예: 사랑이" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="species" render={({ field }) => (
              <FormItem>
                <FormLabel>종</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Button type="button" variant={field.value === '개' ? 'secondary' : 'outline'} className={cn("flex-1 h-14 text-xl", field.value === '개' && "shadow-md border-2 border-yellow-400 bg-yellow-100 text-yellow-800 hover:bg-yellow-200")} onClick={() => field.onChange('개')}>
                      <DogIcon className="h-8 w-8 mr-2" /> 개
                    </Button>
                    <Button type="button" variant={field.value === '고양이' ? 'secondary' : 'outline'} className={cn("flex-1 h-14 text-xl", field.value === '고양이' && "shadow-md border-2 border-yellow-400 bg-yellow-100 text-yellow-800 hover:bg-yellow-200")} onClick={() => field.onChange('고양이')}>
                      <CatIcon className="h-8 w-8 mr-2" /> 고양이
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
             <FormField
              control={form.control}
              name="breed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>품종</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="품종을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {breedList.map((breed) => (
                        <SelectItem key={breed} value={breed}>
                          {breed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="birthDate" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>생년월일</FormLabel><Popover open={isCalendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild><FormControl>
                  <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, 'PPP', { locale: ko }) : <span>날짜 선택</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl></PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    locale={ko} 
                    mode="single" 
                    selected={field.value} 
                    onSelect={(date) => { field.onChange(date); setCalendarOpen(false); }} 
                    disabled={(date) => date > new Date() || date < new Date(new Date().setFullYear(new Date().getFullYear() - 25))} 
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={new Date().getFullYear() - 25}
                    toYear={new Date().getFullYear()}
                    />
                </PopoverContent>
              </Popover><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem className="space-y-3"><FormLabel>성별</FormLabel><FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-2">
                  <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="수컷" /></FormControl><FormLabel className="font-normal">수컷</FormLabel></FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="암컷" /></FormControl><FormLabel className="font-normal">암컷</FormLabel></FormItem>
                </RadioGroup>
              </FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="isNeutered" render={({ field }) => (
                <FormItem className="space-y-3"><FormLabel>중성화 여부</FormLabel><FormControl>
                  <RadioGroup onValueChange={(value) => field.onChange(value === 'true')} defaultValue={String(field.value)} className="flex items-center space-x-2">
                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">완료</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">미완료</FormLabel></FormItem>
                  </RadioGroup>
                </FormControl><FormMessage /></FormItem>
              )} />
            <FormField control={form.control} name="weight" render={({ field }) => (
              <FormItem>
                <FormLabel>몸무게 (kg)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    {...field} 
                    onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                    onBlur={(e) => { if (e.target.value === '') e.target.value = '0'; }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? '저장 중...' : '추가하기'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
