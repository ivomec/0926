'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { DogIcon } from '@/components/DogIcon';
import { CatIcon } from '@/components/CatIcon';
import type { PatientFormValues } from './PatientDetailView';

const EmergencyProtocolCard = () => {
  const { watch } = useFormContext<PatientFormValues>();
  const species = watch('species');
  const weight = watch('weight');

  const hypotensionCRI = React.useMemo(() => {
    if (!species || !weight || weight <= 0) return { type: '정보 부족', recipe: '', rate: '' };
    
    if (species === '개') {
        const minRate = (weight * 0.58).toFixed(2);
        const maxRate = (weight * 2.9).toFixed(2);
        return { type: '도부타민 CRI', recipe: '도부타민 1.7mL + N/S 98.3mL', rate: `${minRate} ~ ${maxRate} mL/hr`};
    } else { // Cat
        const minRate = (weight * 0.3).toFixed(2);
        const maxRate = (weight * 3.0).toFixed(2);
        return { type: '노르에피네프린 CRI', recipe: '노르에피네프린 1.0mL + N/S 99.0mL', rate: `${minRate} ~ ${maxRate} mL/hr`};
    }
  }, [species, weight]);

  const emergencyProtocol = React.useMemo(() => {
    if (!species || !weight || weight <= 0) return null;

    if (species === '개') {
        return {
            title: '강아지 심정지 (CPA) 프로토콜 (RECOVER 기반)',
            bls: [
                '즉시 100-120회/분 흉부압박',
                '6초에 1회 환기 시작'
            ],
            als: [
                '2분마다 흉부압박 교대하며 아래 약물 투여'
            ],
            meds: [
                {
                    name: '에피네프린 (Low dose, 1차)',
                    details: '희석법: 에피네프린 원액 0.1mL + N/S 0.9mL (총 1mL)',
                    dose: `${(weight * 0.1).toFixed(2)} mL (희석액) IV`
                },
                {
                    name: '아트로핀 (Asystole/PEA 시)',
                    dose: `${(weight * 0.04).toFixed(2)} mL (${(weight * 0.02).toFixed(2)} mg) IV`
                },
                {
                    name: '에피네프린 (High dose, 반응 없을 시)',
                    dose: `${(weight * 0.1).toFixed(2)} mL (원액) IV`
                }
            ]
        };
    } else { // Cat
        return {
            title: '고양이 심정지 (CPA) 프로토콜 (RECOVER 기반)',
            bls: [
                '분당 100-120회 속도로 흉곽 1/3 깊이 압박 (2분마다 교대)',
                '즉시 기관 삽관, 6초에 1회 인공 환기 (과환기 금지)'
            ],
            als: [],
            meds: [
                {
                    name: '에피네프린 (Low dose)',
                    details: '희석: 원액 0.1mL + N/S 0.9mL',
                    dose: `${(weight * 0.1).toFixed(2)} mL (희석액) IV`
                },
                {
                    name: '바소프레신 (대체 가능)',
                    dose: `${(weight * 0.04).toFixed(2)} mL IV`
                },
                {
                    name: '아트로핀 (Vagal arrest 의심 시)',
                    dose: `${(weight * 0.04).toFixed(2)} mL IV`
                }
            ]
        };
    }
  }, [species, weight]);
  
  return (
    <AccordionItem value="item-8">
      <Card>
        <AccordionTrigger className="p-6">
          <CardTitle className="flex items-center gap-2 text-red-600"><AlertCircle /> 응급 대응</CardTitle>
        </AccordionTrigger>
        <AccordionContent className="p-6 pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-orange-50">
              <CardHeader><CardTitle className="text-base">저혈압 대응 CRI</CardTitle></CardHeader>
              <CardContent>
                <h5 className="font-semibold">{hypotensionCRI.type}</h5>
                <p className="text-sm text-muted-foreground mt-1">{hypotensionCRI.recipe}</p>
                <p className="font-semibold mt-2">주입 속도: <span className="font-mono text-lg font-bold text-primary">{hypotensionCRI.rate}</span></p>
              </CardContent>
            </Card>
            <Card className="bg-red-50">
              <CardHeader><CardTitle className="text-base">응급 Bolus (서맥/저혈압)</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold flex items-center gap-2">
                      <DogIcon className="h-5 w-5" />
                      <CatIcon className="h-5 w-5" />
                      강아지/고양이: 아트로핀 (IV)
                    </h5>
                    <p className="text-xs text-muted-foreground mt-1">저혈압(MAP&lt;60) 동반 유의미한 서맥 시 (※ 예방적 사용 금지)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">초기: <span className="font-mono text-lg font-bold text-primary">{(weight * 0.04).toFixed(2)} mL</span></p>
                    <p className="font-semibold text-sm">최대: <span className="font-mono text-lg font-bold text-primary">{(weight * 0.08).toFixed(2)} mL</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {emergencyProtocol && (
              <Card className="lg:col-span-2 border-red-500 border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">{emergencyProtocol.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-bold text-base">BLS (기본소생술)</h4>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
                      {emergencyProtocol.bls.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-base">ALS (전문소생술)</h4>
                    {emergencyProtocol.als.length > 0 && (
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
                        {emergencyProtocol.als.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    )}
                    <div className="mt-2 space-y-3">
                      {emergencyProtocol.meds.map((med, i) => (
                        <div key={i} className="flex items-start justify-between p-2 bg-red-50 rounded-md">
                          <div>
                            <p className="font-semibold">{med.name}</p>
                            {med.details && <p className="text-xs text-muted-foreground">{med.details}</p>}
                          </div>
                          <Badge variant="destructive" className="text-base font-mono whitespace-nowrap">{med.dose}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}
export default React.memo(EmergencyProtocolCard);
