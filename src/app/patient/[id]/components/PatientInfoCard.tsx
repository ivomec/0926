'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { DogIcon } from '@/components/DogIcon';
import { CatIcon } from '@/components/CatIcon';
import { CalendarIcon, HeartPulse, Shield, Bone, Link as LinkIcon, Pipette, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInYears, differenceInMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { PatientFormValues } from './PatientDetailView';
import { Textarea } from '@/components/ui/textarea';
import * as z from 'zod';

const PatientInfoCard: React.FC = () => {
  const { control, watch } = useFormContext<PatientFormValues>();
  const [isBirthDateCalendarOpen, setBirthDateCalendarOpen] = React.useState(false);
  const [isSurgeryCalendarOpen, setSurgeryCalendarOpen] = React.useState(false);

  const {
    birthDate,
  } = watch();

  const ageInfo = React.useMemo(() => {
    if (!birthDate) return { display: '정보 없음' };
    const today = new Date();
    const years = differenceInYears(today, birthDate);
    const months = differenceInMonths(today, birthDate) % 12;
    return { display: `${years}세 ${months}개월` };
  }, [birthDate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>환자 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField
            control={control}
            name="guardianName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>보호자 이름</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="guardianPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>보호자 연락처</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="chartId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>차트 번호</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="species"
            render={({ field }) => (
              <FormItem>
                <FormLabel>종</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={field.value === '개' ? 'secondary' : 'outline'}
                      className={cn(
                        'flex-1 h-14 text-xl',
                        field.value === '개' &&
                          'shadow-md border-2 border-yellow-400 bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      )}
                      onClick={() => field.onChange('개')}
                    >
                      <DogIcon className="h-8 w-8 mr-2" /> 개
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === '고양이' ? 'secondary' : 'outline'}
                      className={cn(
                        'flex-1 h-14 text-xl',
                        field.value === '고양이' &&
                          'shadow-md border-2 border-yellow-400 bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      )}
                      onClick={() => field.onChange('고양이')}
                    >
                      <CatIcon className="h-8 w-8 mr-2" /> 고양이
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
              control={control}
              name="breed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>품종</FormLabel>
                   <FormControl>
                      <Input {...field} value={field.value || ''} readOnly />
                    </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          <FormField
            control={control}
            name="birthDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>생년월일 / 나이</FormLabel>
                <Popover
                  open={isBirthDateCalendarOpen}
                  onOpenChange={setBirthDateCalendarOpen}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, 'PPP', { locale: ko })
                        ) : (
                          <span>날짜 선택</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      locale={ko}
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setBirthDateCalendarOpen(false);
                      }}
                      disabled={(date) =>
                        date > new Date() ||
                        date <
                          new Date(
                            new Date().setFullYear(new Date().getFullYear() - 25)
                          )
                      }
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={new Date().getFullYear() - 25}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
                  {ageInfo.display}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="surgeryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>수술일</FormLabel>
                <Popover
                  open={isSurgeryCalendarOpen}
                  onOpenChange={setSurgeryCalendarOpen}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, 'PPP', { locale: ko })
                        ) : (
                          <span>날짜 선택</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      locale={ko}
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={(date) => {
                        field.onChange(date);
                        setSurgeryCalendarOpen(false);
                      }}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={new Date().getFullYear() - 25}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>성별 / 중성화</FormLabel>
                <div className="flex items-center gap-2 h-10">
                  <Button
                    type="button"
                    variant={field.value === '수컷' ? 'secondary' : 'outline'}
                    className={cn(
                      'flex-1 font-bold text-lg',
                      field.value === '수컷' &&
                        'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                    )}
                    onClick={() => field.onChange('수컷')}
                  >
                    ♂
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === '암컷' ? 'secondary' : 'outline'}
                    className={cn(
                      'flex-1 font-bold text-lg',
                      field.value === '암컷' &&
                        'bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200'
                    )}
                    onClick={() => field.onChange('암컷')}
                  >
                    ♀
                  </Button>
                  <FormField
                    control={control}
                    name="isNeutered"
                    render={({ field: neuterField }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={neuterField.value}
                            onCheckedChange={neuterField.onChange}
                          />
                        </FormControl>
                        <FormLabel>중성화</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>몸무게 (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    {...field}
                    value={field.value || 0}
                    onFocus={(e) => {
                      if (e.target.value === '0') e.target.value = '';
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') e.target.value = '0';
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
export default React.memo(PatientInfoCard);
