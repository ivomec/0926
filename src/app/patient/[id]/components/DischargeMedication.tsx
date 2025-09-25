
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Patient } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClipboardPenLine } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { PatientFormValues } from './PatientDetailView';
import * as React from 'react';

type Medication = {
  name: string;
  tabletSizeMg: number | string;
  species: 'dog' | 'cat' | 'common';
  type: 'antibiotic' | 'analgesic' | 'gi' | 'liver_support' | 'antifungal' | 'other';
  doseRange: string;
  doseFrequency: string;
  calculate: (weight: number, days: number) => string;
  warning?: {
    kidney?: string;
    liver?: string;
  };
};

// Custom rounding function
const roundUpToOneDecimal = (num: number) => {
    return (Math.ceil(num * 10) / 10).toFixed(1);
}

const medications: Medication[] = [
  // Antibiotics
  { name: '아목시실린', tabletSizeMg: 500, species: 'common', type: 'antibiotic', doseRange: '11-22 mg/kg', doseFrequency: '1일 2회', calculate: (w, d) => `${((((w * 20) / 500) * 2) * d).toFixed(1)}T`, warning: { kidney: '[주의] 심각한 신부전(severe renal failure) 시 투여 간격을 24-48시간으로 연장하는 용량 조절이 필요합니다.', liver: '별도의 용량 조절은 일반적으로 필요하지 않으나, 중증 간질환 시에는 신중히 사용해야 합니다.' } },
  { name: '독시사이클린', tabletSizeMg: 100, species: 'dog', type: 'antibiotic', doseRange: '5-10 mg/kg', doseFrequency: '1일 1-2회', calculate: (w, d) => `${((((w * 5) / 100) * 1) * d).toFixed(1)}T`, warning: { kidney: '신장으로 거의 배설되지 않아 신부전 시에도 일반적으로 용량 조절이 필요 없습니다.', liver: '[주의] 중증 간기능 부전 시에는 용량 감량 또는 투여 간격 연장을 고려해야 합니다.' } },
  { name: '독시사이클린', tabletSizeMg: 100, species: 'cat', type: 'antibiotic', doseRange: '5-10 mg/kg', doseFrequency: '1일 1-2회', calculate: (w, d) => `${((((w * 5) / 100) * 2) * d).toFixed(1)}T`, warning: { kidney: '신부전 시에도 일반적으로 용량 조절이 필요 없습니다.', liver: '[주의] 중증 간기능 부전 시에는 신중히 투여해야 합니다.' } },
  { name: '메트로니다졸', tabletSizeMg: 250, species: 'dog', type: 'antibiotic', doseRange: '10-25 mg/kg', doseFrequency: '1일 2회', calculate: (w, d) => `${((((w * 10) / 250) * 2) * d).toFixed(1)}T`, warning: { liver: '[주의] 간에서 대사되므로, 심각한 간기능 저하 시 신경독성 위험이 있어 용량을 25-50% 감량해야 합니다.', kidney: '[주의] 심각한 신부전 시 용량 감량을 고려할 수 있습니다.' } },
  { name: '메트로니다졸', tabletSizeMg: 250, species: 'cat', type: 'antibiotic', doseRange: '7.5-12.5 mg/kg', doseFrequency: '1일 2회', calculate: (w, d) => `${((((w * 7.5) / 250) * 2) * d).toFixed(1)}T`, warning: { liver: '[주의] 간 질환 시 용량 감량 필수.' } },
  { name: '세파렉신', tabletSizeMg: 500, species: 'common', type: 'antibiotic', doseRange: '22-30 mg/kg', doseFrequency: '1일 2-3회', calculate: (w, d) => `${((((w * 22) / 500) * 2) * d).toFixed(1)}T` },
  { name: '엔로플록사신', tabletSizeMg: 50, species: 'dog', type: 'antibiotic', doseRange: '5-20 mg/kg', doseFrequency: '1일 1회', calculate: (w, d) => `${((((w * 5) / 50) * 1) * d).toFixed(1)}T`, warning: { kidney: '[주의] 심각한 신기능 저하 시 용량을 25-50% 감량하는 것을 고려해야 합니다.', liver: '[주의] 심각한 간기능 저하 시 용량을 25-50% 감량하는 것을 고려해야 합니다.' } },
  { name: '엔로플록사신', tabletSizeMg: 50, species: 'cat', type: 'antibiotic', doseRange: '5 mg/kg', doseFrequency: '1일 1회', calculate: (w, d) => `${((((w * 5) / 50) * 1) * d).toFixed(1)}T`, warning: { kidney: '[주의] 심각한 신기능 저하 시 용량 감량을 고려해야 합니다.', liver: '[주의] 심각한 간기능 저하 시 용량을 25-50% 감량하는 것을 고려해야 합니다. 용량 초과 시 실명 위험.', } },
  { name: '클린다마이신', tabletSizeMg: 75, species: 'common', type: 'antibiotic', doseRange: '11-33 mg/kg/day', doseFrequency: '1일 2회', calculate: (w, d) => `${((((w * 11) / 75) * 2) * d).toFixed(1)}T`, warning: { liver: '[주의] 간 기능 저하 시 주의.' } },

  // Analgesics & NSAIDs
  { name: '베트로캄', tabletSizeMg: '액제', species: 'common', type: 'analgesic', doseRange: '첫날 0.2, 이후 0.1 mg/kg', doseFrequency: '1일 1회', calculate: (w, d) => `${roundUpToOneDecimal((w * 0.2) + ((d - 1) * w * 0.1))}ml`, warning: { kidney: '[금기] 활동성 신장 질환, 특히 신부전이 있는 환자에게는 투여가 금기됩니다.', liver: '[주의] 활동성 간질환이 있는 경우 신중히 사용해야 하며, 간수치 모니터링이 권장됩니다.' } },
  { name: '트라마돌', tabletSizeMg: 50, species: 'dog', type: 'analgesic', doseRange: '2-10 mg/kg', doseFrequency: '1일 2-4회', calculate: (w, d) => `${((((w * 2) / 50) * 2) * d).toFixed(1)}T`, warning: { kidney: '[주의] 신장 질환 시 용량 조절.', liver: '[주의] 간 질환 시 용량 조절.' } },
  { name: '트라마돌', tabletSizeMg: 50, species: 'cat', type: 'analgesic', doseRange: '2-4 mg/kg', doseFrequency: '1일 2-3회', calculate: (w, d) => `${((((w * 2) / 50) * 2) * d).toFixed(1)}T`, warning: { kidney: '[주의] 신장 질환 시 용량 조절.', liver: '[주의] 간 질환 시 용량 조절.' } },
  { name: '가바펜틴', tabletSizeMg: 100, species: 'common', type: 'analgesic', doseRange: '10-30 mg/kg', doseFrequency: '1일 2회', calculate: (w, d) => `${((((w * 10) / 100) * 2) * d).toFixed(1)}T`, warning: { kidney: '[주의] 신부전 시 배설 지연. 용량 감량 및 투여 간격 연장 필수.' } },
  { name: '아세트아미노펜', tabletSizeMg: 500, species: 'dog', type: 'analgesic', doseRange: '15 mg/kg', doseFrequency: '1일 2회', calculate: (w, d) => `${((((w * 15) / 500) * 2) * d).toFixed(1)}T`, warning: { kidney: '[주의] 신독성 가능성, 신중 사용.', liver: '[금기] 간독성으로 간질환 시 투여 금기.' } },

  // GI Agents
  { name: '마로피탄트(세레니아)', tabletSizeMg: 16, species: 'dog', type: 'gi', doseRange: '2 mg/kg', doseFrequency: '1일 1회', calculate: (w, d) => `${((((w * 2) / 16) * 1) * d).toFixed(1)}T`, warning: { liver: '[주의] 중증 간 질환 시 용량 조절.' } },
  { name: '마로피탄트(세레니아)', tabletSizeMg: 16, species: 'cat', type: 'gi', doseRange: '1 mg/kg', doseFrequency: '1일 1회', calculate: (w, d) => `${((((w * 1) / 16) * 1) * d).toFixed(1)}T`, warning: { liver: '[주의] 중증 간 질환 시 용량 조절.' } },
  { name: '파모티딘', tabletSizeMg: 20, species: 'common', type: 'gi', doseRange: '0.7-2 mg/kg', doseFrequency: '1일 2회', calculate: (w, d) => `${((((w * 0.7) / 20) * 2) * d).toFixed(1)}T`, warning: { kidney: '[주의] 중등도 이상 신부전 시 용량 50% 감량 또는 간격 연장.' } },
  { name: '미소프로스톨', tabletSizeMg: 200, species: 'common', type: 'gi', doseRange: '3-5 mcg/kg', doseFrequency: '1일 2회', calculate: (w, d) => `${((((w * 3) / 200) * 2) * d).toFixed(1)}T` },
  { name: '알마겔', tabletSizeMg: 500, species: 'common', type: 'gi', doseRange: '10-20 mg/kg', doseFrequency: '1일 2회', calculate: (w, d) => `${((((w * 10) / 500) * 2) * d).toFixed(1)}T` },
  
  // Hepatoprotectants
  { name: '우루사(UDCA)', tabletSizeMg: 200, species: 'common', type: 'liver_support', doseRange: '10-15 mg/kg', doseFrequency: '1일 1-2회', calculate: (w, d) => `${((((w * 10) / 200) * 1) * d).toFixed(1)}T`, warning: { liver: '[금기] 담도 완전 폐색 시 금기.' } },
  { name: '실리마린', tabletSizeMg: 100, species: 'common', type: 'liver_support', doseRange: '20-50 mg/kg', doseFrequency: '1일 1회', calculate: (w, d) => `${((((w * 20) / 100) * 1) * d).toFixed(1)}T` },
  { name: '사메탑(SAMe)', tabletSizeMg: 200, species: 'common', type: 'liver_support', doseRange: '2.5kg당 1/4T', doseFrequency: '1일 1회', calculate: (w, d) => {
      if (w <= 0) return '0T';
      const dailyDosage = Math.ceil(w / 2.5) * 0.25;
      const totalTabs = dailyDosage * d;
      const dailyDisplay = dailyDosage < 1 ? `${dailyDosage.toFixed(2).replace('0.', '.')}` : `${dailyDosage}`;
      return `${totalTabs.toFixed(2)}T (${dailyDisplay}T/day)`;
  }},

  // Antifungals
  { name: '이트라코나졸', tabletSizeMg: 100, species: 'common', type: 'antifungal', doseRange: '5-10 mg/kg', doseFrequency: '1일 1-2회', calculate: (w, d) => `${((((w * 5) / 100) * 1) * d).toFixed(1)}T`, warning: { liver: '[주의] 간독성 위험, 모니터링 필요.' } },
];

const categoryTranslations: { [key in Medication['type']]: string } = {
    antibiotic: '항생제',
    analgesic: '진통소염제',
    gi: '위장관계 약물',
    liver_support: '간 보호제',
    antifungal: '항진균제',
    other: '기타',
};


interface DischargeMedicationProps {
    selectedMeds: string[];
    onSelectedMedsChange: (meds: string[]) => void;
}

const DischargeMedication: React.FC<DischargeMedicationProps> = ({ selectedMeds, onSelectedMedsChange }) => {
  const { watch } = useFormContext<PatientFormValues>();
  const { species, hasLiverCondition, hasKidneyCondition, weight } = watch();

  useEffect(() => {
    if (!species) return;

    const speciesKey = species === '개' ? 'dog' : 'cat';
    const availableMedNames = medications
        .filter(m => m.species === speciesKey || m.species === 'common')
        .map(m => m.name);

    let defaultMeds: string[] = [];
    
    if (speciesKey === 'dog') {
        defaultMeds = ['베트로캄', '아세트아미노펜', '미소프로스톨', '가바펜틴', '아목시실린', '알마겔', '파모티딘', '마로피탄트(세레니아)'];
    } else { // cat
        defaultMeds = ['베트로캄', '트라마돌', '미소프로스톨', '가바펜틴', '아목시실린', '알마겔', '파모티딘', '마로피탄트(세레니아)'];
    }
    
    if (hasLiverCondition) {
        defaultMeds.push('우루사(UDCA)', '실리마린', '사메탑(SAMe)');
    }
    
    const validDefaults = defaultMeds.filter(name => availableMedNames.includes(name));

    if (selectedMeds.length === 0) {
      onSelectedMedsChange(Array.from(new Set(validDefaults)));
    } else {
      let newMeds = [...selectedMeds];
      let hasChanged = false;
      if (hasLiverCondition) {
        const liverMeds = ['우루사(UDCA)', '실리마린', '사메탑(SAMe)'];
        liverMeds.forEach(med => {
          if (!newMeds.includes(med)) {
            newMeds.push(med);
            hasChanged = true;
          }
        });
      }
      if (hasChanged) {
        onSelectedMedsChange(newMeds);
      }
    }
  }, [species, hasLiverCondition, onSelectedMedsChange, selectedMeds]);


  const handleMedToggle = (medName: string) => {
    const newMeds = selectedMeds.includes(medName) 
        ? selectedMeds.filter(name => name !== medName) 
        : [...selectedMeds, medName];
    onSelectedMedsChange(newMeds);
  };
  
  const availableMeds = medications.filter(m => m.species === (species === '개' ? 'dog' : 'cat') || m.species === 'common');
  
  const getWarningInfo = (med: Medication) => {
    const kidneyWarning = hasKidneyCondition && med.warning?.kidney;
    const liverWarning = hasLiverCondition && med.warning?.liver;

    const isContraindicated = (kidneyWarning && kidneyWarning.includes('[금기]')) || (liverWarning && liverWarning.includes('[금기]'));
    const isCaution = !isContraindicated && ((kidneyWarning && kidneyWarning.includes('[주의]')) || (liverWarning && liverWarning.includes('[주의]')));
    const isSafe = !isContraindicated && !isCaution && (kidneyWarning || liverWarning);
    
    let colorClass = '';
    let description = null;
    if (isContraindicated) {
      colorClass = 'text-red-600';
      description = kidneyWarning || liverWarning;
    } else if (isCaution) {
      colorClass = 'text-green-600';
      description = kidneyWarning || liverWarning;
    } else if(isSafe) {
      colorClass = 'text-blue-600';
      description = kidneyWarning || liverWarning;
    }


    return {
        kidneyWarning,
        liverWarning,
        isContraindicated,
        isCaution,
        isSafe,
        colorClass,
        description
    }
  }

  const renderMedicationCard = (med: Medication, isSelected: boolean) => {
    const warningInfo = getWarningInfo(med);
    
    let borderColor = 'border-transparent';
    if (isSelected) {
        if (warningInfo.isContraindicated) borderColor = 'border-red-500';
        else if (warningInfo.isCaution) borderColor = 'border-green-500';
        else if (warningInfo.isSafe) borderColor = 'border-blue-500'; // Safe but has info
        else borderColor = 'border-primary';
    }

    return (
        <Card 
            key={`${med.name}-${med.species}`}
            className={cn("cursor-pointer transition-all flex flex-col justify-between", isSelected ? "shadow-md" : "shadow-sm", borderColor, "border-2")}
            onClick={() => handleMedToggle(med.name)}
        >
            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{med.name}</CardTitle>
                    <Checkbox checked={isSelected} className="mt-1"/>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground space-y-1">
                <p>용량: {med.doseRange}</p>
                <p>횟수: {med.doseFrequency}</p>
                 {warningInfo.description && <p className={cn("mt-1 text-xs font-bold", warningInfo.colorClass)}>{warningInfo.description}</p>}
            </CardContent>
        </Card>
    );
  }
  
  const getCalculation = (med: Medication, duration: number): string => {
      if (!weight || weight <= 0) return '체중 입력 필요';
      try {
        return med.calculate(weight, duration);
      } catch (e) {
        return '계산 오류';
      }
  };

  const renderSummary = (duration: 3 | 7, title: string) => {
    
    let medNamesForDuration: string[] = [];
    if (duration === 3) {
      medNamesForDuration = (species === '개')
        ? ['베트로캄', '아세트아미노펜', '미소프로스톨', '마로피탄트(세레니아)']
        : ['베트로캄', '트라마돌', '미소프로스톨', '마로피탄트(세레니아)'];
    } else { // duration === 7
      medNamesForDuration = (species === '개')
        ? ['가바펜틴', '아목시실린', '알마겔', '파모티딘']
        : ['가바펜틴', '아목시실린', '알마겔', '파모티딘'];
      
      if (hasLiverCondition) {
        medNamesForDuration.push('우루사(UDCA)', '실리마린', '사메탑(SAMe)');
      }
    }

    const summaryMeds = availableMeds.filter(med => selectedMeds.includes(med.name) && medNamesForDuration.includes(med.name));

    return (
      <Card className="bg-blue-50/30 flex-1">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summaryMeds.length > 0 ? summaryMeds.map(med => {
            const warningInfo = getWarningInfo(med);

            return (
              <div key={`${med.name}-${duration}`} className="flex justify-between items-start">
                <div className={cn("font-medium", warningInfo.colorClass)}>
                  <p>{med.name}</p>
                  {warningInfo.description && 
                    <p className="text-xs font-normal max-w-xs">
                      {warningInfo.description}
                    </p>
                  }
                </div>
                <Badge variant="secondary" className="text-base font-mono whitespace-nowrap">{getCalculation(med, duration)}</Badge>
              </div>
            )
          }) : <p className="text-muted-foreground">선택된 약물이 없습니다.</p>}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="flex-row items-center justify-between hidden md:flex">
          <div></div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline"><ClipboardPenLine className="mr-2"/>약물 보드</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-3xl">
              <SheetHeader>
                <SheetTitle>약물 보드</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] pr-6 py-4">
                {(Object.keys(categoryTranslations) as (keyof typeof categoryTranslations)[]).map(type => {
                    const medsOfType = availableMeds.filter(m => m.type === type);
                    if (medsOfType.length === 0) return null;
                    return (
                        <div key={type} className="mb-6">
                            <h4 className="font-bold text-lg capitalize mb-2">{categoryTranslations[type]}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {medsOfType.map(med => renderMedicationCard(med, selectedMeds.includes(med.name)))}
                            </div>
                        </div>
                    )
                })}
              </ScrollArea>
            </SheetContent>
          </Sheet>
      </div>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
            {renderSummary(3, "3일분 조제 요약")}
            {renderSummary(7, "7일분 조제 요약")}
        </div>
      </div>
    </>
  );
}

export default React.memo(DischargeMedication);
