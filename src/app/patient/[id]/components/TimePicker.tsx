'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface TimePickerProps {
  date: Date | null | undefined;
  setDate: (date: Date | null) => void;
}

export function TimePicker({ date, setDate }: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleTimeChange = (hours: number, minutes: number) => {
    const newDate = date ? new Date(date) : new Date();
    newDate.setHours(hours, minutes, 0, 0);
    setDate(newDate);
  };

  const selectedPeriod = date ? (date.getHours() < 12 ? 'AM' : 'PM') : 'AM';
  const selectedHour = date ? date.getHours() % 12 || 12 : 12;
  const selectedMinute = date ? date.getMinutes() : 0;

  const handlePeriodChange = (period: 'AM' | 'PM') => {
    if (!date) return;
    const currentHours = date.getHours();
    if (period === 'AM' && currentHours >= 12) {
      handleTimeChange(currentHours - 12, selectedMinute);
    } else if (period === 'PM' && currentHours < 12) {
      handleTimeChange(currentHours + 12, selectedMinute);
    }
  };
  
  const handleHourChange = (hour: number) => {
    let newHour = hour;
    if (selectedPeriod === 'PM' && hour !== 12) {
        newHour += 12;
    }
    if (selectedPeriod === 'AM' && hour === 12) {
        newHour = 0;
    }
    handleTimeChange(newHour, selectedMinute);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {date ? format(date, 'hh:mm a') : <span>시간 선택</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="p-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button 
                variant={selectedPeriod === 'AM' ? 'secondary' : 'outline'} 
                onClick={() => handlePeriodChange('AM')}
                className={cn(selectedPeriod === 'AM' && 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800')}
            >
                오전
            </Button>
            <Button 
                variant={selectedPeriod === 'PM' ? 'secondary' : 'outline'} 
                onClick={() => handlePeriodChange('PM')}
                className={cn(selectedPeriod === 'PM' && 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800')}
            >
                오후
            </Button>
          </div>
          <Separator />
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
              <Button key={`hour-${hour}`} size="icon" variant={selectedHour === hour ? 'secondary' : 'ghost'} className="h-8 w-8" onClick={() => handleHourChange(hour)}>
                {hour}
              </Button>
            ))}
          </div>
          <Separator />
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 6 }, (_, i) => i * 10).map((minute) => (
              <Button key={`minute-${minute}`} size="icon" variant={selectedMinute === minute ? 'secondary' : 'ghost'} className="h-8 w-8" onClick={() => handleTimeChange(date?.getHours() || 0, minute)}>
                {minute.toString().padStart(2, '0')}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
