
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Species } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import debounce from 'lodash/debounce';

interface TubeSelectorProps {
  species: Species;
  weight: number;
  currentSize: string | undefined;
  currentCuffGuide: string | undefined;
  onSave: (size: string, guide: string) => void;
}

const dogWeightGuide = [
  { maxWeight: 2, id: 3.0 }, { maxWeight: 4, id: 3.5 }, { maxWeight: 6, id: 4.0 },
  { maxWeight: 8, id: 4.5 }, { maxWeight: 10, id: 5.0 }, { maxWeight: 12, id: 5.5 },
  { maxWeight: 14, id: 6.0 }, { maxWeight: 16, id: 6.5 }, { maxWeight: 18, id: 7.0 },
  { maxWeight: 20, id: 7.5 }, { maxWeight: 25, id: 8.0 }, { maxWeight: 30, id: 9.0 },
  { maxWeight: 40, id: 10.0 }, { maxWeight: Infinity, id: 10.0 },
];

const catWeightGuide = [
  { maxWeight: 2, id: 2.5 }, { maxWeight: 3.5, id: 3.0 }, { maxWeight: 4, id: 3.5 },
  { maxWeight: 6, id: 4.0 }, { maxWeight: 9, id: 4.5 }, { maxWeight: Infinity, id: 4.5 },
];

const tubeData = [
    { id: 2.5, od: 4.1 }, { id: 3.0, od: 4.6 }, { id: 3.5, od: 5.3 },
    { id: 4.0, od: 5.9 }, { id: 4.5, od: 6.5 }, { id: 5.0, od: 7.0 },
    { id: 5.5, od: 7.6 }, { id: 6.0, od: 8.2 }, { id: 6.5, od: 9.0 },
    { id: 7.0, od: 9.5 }, { id: 7.5, od: 10.2 }, { id: 10.0, od: 13.5 }
];

const getCuffGuide = (t1Diameter: number, tubeOd: number) => {
    const actualDiff = t1Diameter - tubeOd;
    if (actualDiff < 1.0) {
      return { title: '🟢 풍선 최소량 주입', desc: '튜브가 기관에 거의พอดี. 최소한의 공기 주입으로도 충분한 밀봉이 예상됩니다.' };
    } else if (actualDiff >= 1.0 && actualDiff <= 2.0) {
      return { title: '🟡 풍선 적당량 주입', desc: '일반적인 경우입니다. 적절한 공기 주입이 필요합니다.' };
    } else {
      return { title: '🔴 풍선 충분히 주입 (누출 확인)', desc: '기관과 튜브 사이의 공간이 클 수 있습니다. 누출(leak)이 없는지 확인하며 충분한 공기 주입이 필요합니다.' };
    }
};

export default function TubeSelector({ species, weight, currentSize, currentCuffGuide, onSave }: TubeSelectorProps) {
  const [t1Diameter, setT1Diameter] = useState('');
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [finalDecision, setFinalDecision] = useState(currentSize || '');
  const [finalCuffGuide, setFinalCuffGuide] = useState(currentCuffGuide || '');


  const { toast } = useToast();

  useEffect(() => {
    setFinalDecision(currentSize || '');
    setFinalCuffGuide(currentCuffGuide || '');
  }, [currentSize, currentCuffGuide]);

  const weightRecommendation = useMemo(() => {
    if (!weight || weight <= 0) return null;
    const guide = species === '개' ? dogWeightGuide : catWeightGuide;
    const recommendation = guide.find(g => weight <= g.maxWeight);
    return recommendation ? `${recommendation.id.toFixed(1)} mm` : 'N/A';
  }, [species, weight]);

  const debouncedCalculate = useCallback(
    debounce((t1Value: string) => {
      const t1 = parseFloat(t1Value);
      if (isNaN(t1) || t1 <= 0) {
        setCalculationResult(null);
        return;
      }
  
      const targetOd = t1 * 0.8;
      let closestTube = null;
      let minDiff = Infinity;
  
      tubeData.forEach(tube => {
        const diff = Math.abs(tube.od - targetOd);
        if (diff < minDiff) {
          minDiff = diff;
          closestTube = tube;
        }
      });
  
      if (!closestTube) {
          setCalculationResult(null);
          return;
      }
  
      const guide = getCuffGuide(t1, closestTube.od);
  
      const result = {
          recommendedId: closestTube.id.toFixed(1),
          diameterDiff: (t1 - closestTube.od).toFixed(2),
          cuffGuide: guide,
      };

      setCalculationResult(result);
      setFinalDecision(result.recommendedId);
      setFinalCuffGuide(result.cuffGuide.title);
    }, 300), 
  []);

  const handleDiameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setT1Diameter(value);
    if (value) {
      debouncedCalculate(value);
    } else {
      setCalculationResult(null);
    }
  };
  
  const handleSave = () => {
    const t1 = parseFloat(t1Diameter);
    const finalTubeId = parseFloat(finalDecision);

    if (isNaN(finalTubeId) || finalTubeId <= 0) {
        toast({ title: '오류', description: '유효한 최종 결정 사이즈를 입력해주세요.', variant: 'destructive'});
        return;
    }

    let guideToSave = finalCuffGuide;

    if (!isNaN(t1) && t1 > 0) {
        const selectedTube = tubeData.find(tube => tube.id === finalTubeId);
        if (selectedTube) {
            guideToSave = getCuffGuide(t1, selectedTube.od).title;
        } else {
            toast({ title: '경고', description: '선택한 튜브 사이즈에 대한 정보가 없습니다. 커프 가이드를 직접 확인해주세요.', variant: 'destructive'});
        }
    }
    
    onSave(finalDecision, guideToSave);
    toast({ title: '저장 완료', description: `카테터 사이즈 ${finalDecision}mm와 커프 가이드가 저장되었습니다.`});
  }

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side: Calculations */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
                <Label>체중 기반 추천</Label>
                <p className="text-2xl font-bold text-primary">{weightRecommendation || '체중 입력 필요'}</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="t1-diameter">T1 기관 직경 (mm)</Label>
                <Input
                    id="t1-diameter"
                    type="number"
                    placeholder="X-ray에서 측정한 값"
                    value={t1Diameter}
                    onChange={handleDiameterChange}
                    step="0.1"
                />
            </div>
             {calculationResult && (
                <div className="space-y-4 border p-4 rounded-lg bg-blue-50/50">
                    <h4 className="font-bold text-center">T1 직경 기반 계산 결과</h4>
                    <div className="flex justify-between items-center">
                        <Label>🎯 추천 I.D</Label>
                        <span className="text-xl font-bold text-blue-600">{calculationResult.recommendedId} mm</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <Label>↔ 직경 차이 (T1 - O.D)</Label>
                        <span className="font-semibold">{calculationResult.diameterDiff} mm</span>
                    </div>
                    <div>
                        <Label>🎈 커프 팽창 가이드</Label>
                        <div className="p-2 mt-1 rounded-md bg-white text-center">
                            <p className="font-bold">{calculationResult.cuffGuide.title}</p>
                            <p className="text-xs text-muted-foreground">{calculationResult.cuffGuide.desc}</p>
                        </div>
                    </div>
                </div>
            )}
          </div>

          {/* Right Side: Final Decision & Table */}
          <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="final-decision" className="text-base font-bold">최종 결정 사이즈 (mm)</Label>
                 <div className="flex gap-2">
                    <Input
                        id="final-decision"
                        type="number"
                        placeholder="수의사 최종 결정"
                        value={finalDecision}
                        onChange={(e) => setFinalDecision(e.target.value)}
                        step="0.1"
                        className="font-bold text-lg"
                    />
                    <Button onClick={handleSave}>선택 저장</Button>
                </div>
            </div>

            <Separator />
            
            <div className="space-y-2">
                 <h4 className="font-bold text-center text-sm">튜브 사이즈 참고표</h4>
                 <div className="max-h-48 overflow-y-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">I.D (mm)</TableHead>
                                <TableHead className="text-center">O.D (mm)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tubeData.map(tube => (
                                <TableRow key={tube.id}>
                                    <TableCell className="text-center font-mono">{tube.id.toFixed(1)}</TableCell>
                                    <TableCell className="text-center font-mono">{tube.od.toFixed(1)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </div>
            </div>
          </div>
        </div>
      </div>
  );
}
