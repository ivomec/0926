
'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Syringe } from 'lucide-react';
import { differenceInYears } from 'date-fns';
import type { PatientFormValues } from './PatientDetailView';


const getAgeCategory = (species: '개' | '고양이', birthDate: Date, weight: number) => {
    if (!birthDate) return null;
    const ageYears = differenceInYears(new Date(), birthDate);

    if (species === '고양이') {
        if (ageYears >= 15) return { name: '초고령기', color: 'bg-red-500' };
        if (ageYears >= 11) return { name: '노령기', color: 'bg-orange-500' };
        if (ageYears >= 7) return { name: '성숙기', color: 'bg-blue-500' };
        return null;
    } else { // 개
        if (weight > 40) { // 초대형견
            if (ageYears >= 5) return { name: '노령기', color: 'bg-orange-500' };
        } else if (weight > 25) { // 대형견
            if (ageYears >= 7) return { name: '노령기', color: 'bg-orange-500' };
        } else if (weight > 10) { // 중형견
            if (ageYears >= 8) return { name: '노령기', color: 'bg-orange-500' };
        } else { // 소형견
            if (ageYears >= 9) return { name: '노령기', color: 'bg-orange-500' };
        }
    }
    return null;
};

const calculatePropofolMl = (species: '개' | '고양이', weight: number) => {
    if (weight <= 0) return 0;
    let doseRate; // mg/kg
    if (species === '고양이') {
        if (weight <= 4) doseRate = 6.0;
        else doseRate = 5.5;
    } else { // 개
        if (weight <= 4) doseRate = 5.0;
        else if (weight <= 7) doseRate = 4.5;
        else if (weight <= 10) doseRate = 4.0;
        else if (weight <= 20) doseRate = 3.5;
        else if (weight <= 40) doseRate = 3.0;
        else doseRate = 2.5;
    }
    return (doseRate * weight) / 10; // 10mg/ml
};

const calculateAlfaxanMl = (species: '개' | '고양이', weight: number) => {
    if (weight <= 0) return 0;
    let doseRate; // mg/kg
    if (species === '고양이') {
        if (weight <= 4) doseRate = 3.0;
        else doseRate = 2.5;
    } else { // 개
        if (weight <= 4) doseRate = 2.5;
        else if (weight <= 10) doseRate = 2.0;
        else if (weight <= 20) doseRate = 1.8;
        else if (weight <= 40) doseRate = 1.5;
        else if (weight <= 80) doseRate = 1.2;
        else doseRate = 1.0;
    }
    return (doseRate * weight) / 10; // 10mg/ml
};

const PreSurgeryPrepCard = () => {
  const { watch } = useFormContext<PatientFormValues>();
  const { species, weight, birthDate, hasHeartCondition, hasKidneyCondition, hasLiverCondition } = watch();

  const [localAnestheticSites, setLocalAnestheticSites] = React.useState<number>(0);

  const ageCategory = React.useMemo(() => {
    if (!birthDate) return null;
    return getAgeCategory(species, birthDate, weight);
  }, [species, birthDate, weight]);

  const isSeniorOrUnderlyingCondition = React.useMemo(() => {
    return !!ageCategory || hasHeartCondition || hasKidneyCondition || hasLiverCondition;
  }, [ageCategory, hasHeartCondition, hasKidneyCondition, hasLiverCondition]);

  const bupivacaineCalculation = React.useMemo(() => {
    if (!species || !weight || weight <= 0 || localAnestheticSites === 0) {
      return { total: 0, perSite: 0, maxSafe: 0 };
    }

    let multiplier;
    if (isSeniorOrUnderlyingCondition) {
      multiplier = species === '개' ? 0.15 : 0.1;
    } else {
      multiplier = species === '개' ? 0.3 : 0.2;
    }
    
    const totalForFourSites = weight * multiplier;
    const totalVolume = (totalForFourSites / 4) * localAnestheticSites;
    const perSiteVolume = localAnestheticSites > 0 ? totalVolume / localAnestheticSites : 0;
    const maxSafeVolume = weight * 0.4; // 2mg/kg at 0.5% (5mg/ml)

    return {
      total: totalVolume,
      perSite: perSiteVolume,
      maxSafe: maxSafeVolume,
    };
  }, [species, weight, isSeniorOrUnderlyingCondition, localAnestheticSites]);

  return (
    <AccordionItem value="item-1">
      <Card>
        <AccordionTrigger className="p-6">
          <CardTitle className="flex items-center gap-2"><Syringe />수술 전 약물 준비</CardTitle>
        </AccordionTrigger>
        <AccordionContent className="p-6 pt-0">
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-blue-50/50 p-4">
                <CardTitle className="text-base font-semibold mb-2">예방적 항생제</CardTitle>
                <div className="space-y-1">
                  <p>바이트릴/세프론: <span className="font-bold text-lg">{(weight * 0.05).toFixed(2)} ml</span></p>
                  <p>덱사메타손: <span className="font-bold text-lg">{(weight * 0.1).toFixed(2)} ml</span></p>
                </div>
              </Card>
              <Card className="bg-green-50/50 p-4">
                <CardTitle className="text-base font-semibold mb-2">24시간 지속 진통 주사</CardTitle>
                <div className="space-y-1">
                  <p>노바트: <span className="font-bold text-lg">{(weight * 0.1).toFixed(2)} ml</span></p>
                </div>
              </Card>
              <Card className="bg-yellow-50/50 p-4">
                <CardTitle className="text-base font-semibold mb-2">전 마취 주사</CardTitle>
                <div className="space-y-1">
                  <p>부토르파놀: <span className="font-bold text-lg">{(weight * 0.08).toFixed(2)} ml</span></p>
                  <p>미다졸람: <span className="font-bold text-lg">{(weight * 0.08).toFixed(2)} ml</span></p>
                </div>
              </Card>
              <Card className="bg-red-50/50 p-4">
                <CardTitle className="text-base font-semibold mb-2">국소 마취 (부피바카인)</CardTitle>
                <div className="space-y-2">
                  <Select onValueChange={(value) => setLocalAnestheticSites(Number(value))} value={String(localAnestheticSites)}>
                    <SelectTrigger>
                      <SelectValue placeholder="부위 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">선택 안함</SelectItem>
                      <SelectItem value="1">1 site</SelectItem>
                      <SelectItem value="2">2 sites</SelectItem>
                      <SelectItem value="3">3 sites</SelectItem>
                      <SelectItem value="4">4 sites</SelectItem>
                    </SelectContent>
                  </Select>
                  {localAnestheticSites > 0 && (
                    <div className="text-xs space-y-1 bg-white/50 p-2 rounded-md">
                      <p>총 주사량: <span className="font-bold">{bupivacaineCalculation.total.toFixed(2)} ml</span></p>
                      <p>부위당: <span className="font-bold">{bupivacaineCalculation.perSite.toFixed(2)} ml</span></p>
                      <p className="text-red-600">안전 최대 용량: <span className="font-bold">{bupivacaineCalculation.maxSafe.toFixed(2)} ml</span></p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
            <Card className="bg-purple-50/50 p-4">
              <CardTitle className="text-base font-semibold mb-2">도입 마취제</CardTitle>
              <div className="flex gap-8">
                <p>프로포폴: <span className="font-bold text-lg">{calculatePropofolMl(species, weight).toFixed(2)} ml</span></p>
                <p>
                  알팍산: <span className="font-bold text-lg">{calculateAlfaxanMl(species, weight).toFixed(2)} ml</span>
                  {isSeniorOrUnderlyingCondition && <Badge variant="destructive" className="ml-2">추천</Badge>}
                </p>
              </div>
            </Card>
          </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}
export default React.memo(PreSurgeryPrepCard);
