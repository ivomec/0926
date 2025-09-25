
'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Droplets, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PatientFormValues } from './PatientDetailView';

const FluidCRICard = () => {
  const { watch } = useFormContext<PatientFormValues>();
  const { species, weight, hasHeartCondition, hasLiverCondition, hasKidneyCondition } = watch();
  
  const pumpSpeed = React.useMemo(() => {
    if (!species || !weight || weight <= 0) return { corrected: 'N/A', original: 'N/A' };

    if (hasHeartCondition) {
        if (species === '개') {
            const min = (1 * weight).toFixed(2);
            const max = (5 * weight).toFixed(2);
            return { corrected: `${min} ml/hr`, original: `(절대 상한: ${max} ml/hr)`, isHeartCondition: true, recommended: '권장 시작: 1-3ml/kg/hr' };
        } else { // 고양이
            const min = (1 * weight).toFixed(2);
            const max = (3 * weight).toFixed(2);
            return { corrected: `${min} ml/hr`, original: `(절대 상한: ${max} ml/hr)`, isHeartCondition: true, recommended: '권장 시작: 1-2ml/kg/hr' };
        }
    }

    const originalSpeed = weight * 5;
    const correctedSpeed = originalSpeed * (60 / 41);
    return {
        corrected: `${correctedSpeed.toFixed(2)} ml/hr`,
        original: `(보정 전: ${originalSpeed.toFixed(2)} ml/hr)`
    };
  }, [species, weight, hasHeartCondition]);

  const painkillerCRI = React.useMemo(() => {
    if (!species || !weight) return { type: '정보 부족', recipe: '', rate: '' };

    if (species === '개') {
        if (hasLiverCondition && hasKidneyCondition) {
            return { type: 'CRI 불가', recipe: '간과 신장 기능 저하로 CRI를 권장하지 않습니다.', rate: '', isContraindicated: true };
        }
        if (hasKidneyCondition) {
            return { type: '리도카인 CRI', recipe: '리도카인 10mL + N/S 90mL', rate: `${(25 * weight * 0.03).toFixed(2)} ~ ${(50 * weight * 0.03).toFixed(2)} mL/hr` };
        }
        if (hasLiverCondition) {
            return { type: '케타민 CRI', recipe: '케타민(50mg/mL) 2mL + N/S 98mL', rate: '정보 없음' };
        }
        // Healthy Dog
        return { type: 'LK CRI', recipe: '리도카인 10mL + 케타민 0.8mL + N/S 89.2mL', rate: `${(25 * weight * 0.03).toFixed(2)} ~ ${(50 * weight * 0.03).toFixed(2)} mL/hr` };

    } else { // Cat
        if (hasKidneyCondition) {
            return { type: '케타민 CRI 금기', recipe: '신장 기능 저하로 케타민 사용을 권장하지 않습니다.', rate: '', isContraindicated: true };
        }
        const rate = (weight * 0.3).toFixed(2);
        return { type: '케타민 CRI', recipe: '케타민(50mg/mL) 2mL + N/S 98mL', rate: `${rate} mL/hr` };
    }
  }, [species, weight, hasLiverCondition, hasKidneyCondition]);

  return (
    <AccordionItem value="item-2">
      <Card>
        <AccordionTrigger className="p-6">
          <CardTitle className="flex items-center gap-2"><Droplets />수액 및 CRI</CardTitle>
        </AccordionTrigger>
        <AccordionContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-4">
              <h4 className="font-bold text-center">수액 펌프 속도</h4>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">펌프 설정 속도</p>
                <p className={cn("text-3xl font-bold text-primary", pumpSpeed.isHeartCondition && "text-red-600")}>{pumpSpeed.corrected}</p>
                <p className={cn("text-xs text-muted-foreground", pumpSpeed.isHeartCondition && "font-bold text-red-600")}>{pumpSpeed.original}</p>
                {pumpSpeed.isHeartCondition && <p className="text-xs text-blue-600 mt-1">{pumpSpeed.recommended}</p>}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-center">진통제 CRI</h4>
              <div className={cn("p-4 rounded-lg", painkillerCRI.isContraindicated ? 'bg-red-100' : 'bg-blue-50')}>
                <h5 className="font-bold flex items-center gap-2">
                  {painkillerCRI.isContraindicated && <AlertTriangle className="text-red-600"/>}
                  추천: <span className={cn(painkillerCRI.isContraindicated ? 'text-red-600' : 'text-blue-600')}>{painkillerCRI.type}</span>
                </h5>
                <p className="text-xs text-muted-foreground mt-1">{painkillerCRI.recipe}</p>
                {painkillerCRI.rate && (
                  <p className="font-semibold mt-2 text-sm">주입 속도: <span className="font-mono">{painkillerCRI.rate}</span></p>
                )}
              </div>
            </div>
          </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}
export default React.memo(FluidCRICard);
