
'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign } from 'lucide-react';
import type { Patient, Costs, DentalData, SelectedTreatment } from '@/lib/types';
import type { PatientFormValues } from './PatientDetailView';
import { getProcedureCosts, procedureCategories, getToothDescription } from '@/lib/costs';
import { additionalTreatmentsConfig } from '@/lib/costs';
import { cn } from '@/lib/utils';

interface CostInfoCardProps {
  costs: Costs;
  setCosts: React.Dispatch<React.SetStateAction<Costs>>;
  dentalData: DentalData;
  additionalTreatments: SelectedTreatment[];
  patient: Patient;
  selectedPackages: SelectedTreatment[];
}

const CostInfoCard: React.FC<CostInfoCardProps> = ({ costs, setCosts, dentalData, additionalTreatments, patient, selectedPackages }) => {
  const { watch } = useFormContext<PatientFormValues>();
  const species = watch('species');
  const weight = watch('weight');

  const procedureCostTable = React.useMemo(() => {
    if (!species || !weight) return null;
    return getProcedureCosts(species, weight);
  }, [species, weight]);

  const allProcedures = React.useMemo(() => {
    if (!procedureCostTable) return [];
    return procedureCategories.flatMap(cat => procedureCostTable[cat.id] || []);
  }, [procedureCostTable]);

  const procedureMap = React.useMemo(() => {
    return new Map(allProcedures.map(p => [p.id, p]));
  }, [allProcedures]);
  
  React.useEffect(() => {
    if (!dentalData || !procedureMap.size) return;

    const totalProcedureCost = Object.values(dentalData).reduce((total, tooth) => {
        if (!tooth.procedures) return total;
        
        const toothCost = tooth.procedures.reduce((toothTotal, procId) => {
            const procedure = procedureMap.get(procId);
            return toothTotal + (procedure?.price || 0);
        }, 0);
        
        return total + toothCost;
    }, 0);
    
    setCosts(prev => ({ ...prev, procedure: totalProcedureCost }));
  }, [dentalData, procedureMap, setCosts]);

  const procedureDetails = React.useMemo(() => {
    const details: Record<string, { count: number; price: number; name: string, toothIds: string[] }> = {};
    Object.entries(dentalData).forEach(([toothId, tooth]) => {
        if (tooth.procedures && tooth.procedures.length > 0) {
            tooth.procedures.forEach(procId => {
                const procedureInfo = procedureMap.get(procId);
                if (procedureInfo) {
                    if (details[procId]) {
                        details[procId].count++;
                        details[procId].toothIds.push(toothId);
                    } else {
                        details[procId] = {
                            name: procedureInfo.name,
                            price: procedureInfo.price,
                            count: 1,
                            toothIds: [toothId],
                        };
                    }
                }
            });
        }
    });
    return Object.values(details);
  }, [dentalData, procedureMap]);

  const groupedTreatments = React.useMemo(() => {
    if (!patient || !patient.species || !patient.weight) return {};
    const config = additionalTreatmentsConfig(patient);
    if (!config.categories) return {};
  
    return additionalTreatments.reduce((acc, treatment) => {
      for (const category of config.categories as any[]) {
        const items = config[category.id as keyof typeof config.itemsByCategoryId] as { id: string }[] | undefined;
        if (items?.some(item => item.id === treatment.id)) {
          if (!acc[category.name]) {
            acc[category.name] = [];
          }
          acc[category.name].push(treatment);
          break;
        }
      }
      return acc;
    }, {} as Record<string, SelectedTreatment[]>);
  }, [additionalTreatments, patient]);

  const totalCost = (costs.procedure || 0) + (costs.anesthesia || 0) + (costs.checkup || 0) + (costs.additional || 0);
  
  return (
    <AccordionItem value="item-6">
      <Card>
        <AccordionTrigger className="p-6">
          <CardTitle className="flex items-center gap-2">
            <DollarSign />
            비용 정보
          </CardTitle>
        </AccordionTrigger>
        <AccordionContent className="p-6 pt-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-50 p-4 rounded-lg">
              <label className="text-sm font-medium text-slate-600">치과 수술 비용</label>
              <p className="text-2xl font-bold text-slate-800 tracking-tighter">{(costs.procedure || 0).toLocaleString()} 원</p>
            </div>
             <div className="bg-slate-50 p-4 rounded-lg">
              <label className="text-sm font-medium text-slate-600">스케일링 패키지 비용</label>
              <p className="text-2xl font-bold text-slate-800 tracking-tighter">{(costs.anesthesia || 0).toLocaleString()} 원</p>
            </div>
             <div className="bg-slate-50 p-4 rounded-lg">
              <label className="text-sm font-medium text-slate-600">건강검진 비용</label>
              <p className="text-2xl font-bold text-slate-800 tracking-tighter">{(costs.checkup || 0).toLocaleString()} 원</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <label className="text-sm font-medium text-slate-600">추가 처치 비용</label>
               <p className="text-2xl font-bold text-slate-800 tracking-tighter">{(costs.additional || 0).toLocaleString()} 원</p>
            </div>
          </div>

          {procedureDetails.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-lg font-semibold">치과 수술 상세 내역</h4>
              <div className="p-4 rounded-lg bg-slate-50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-base">시술명</TableHead>
                        <TableHead className="text-right text-base">단가</TableHead>
                        <TableHead className="text-right text-base">횟수</TableHead>
                        <TableHead className="text-right text-base">합계</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {procedureDetails.map((proc, index) => (
                        <TableRow key={`${proc.name}-${index}`}>
                          <TableCell className="text-base">
                            <div>{proc.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {patient.species && proc.toothIds.map(id => getToothDescription(id, patient.species!)).join(', ')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-base">{proc.price.toLocaleString()}원</TableCell>
                          <TableCell className="text-right font-mono text-base">{proc.count}</TableCell>
                          <TableCell className="text-right font-mono text-base">{(proc.price * proc.count).toLocaleString()}원</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </div>
            </div>
          )}

          {additionalTreatments.length > 0 && (
             <div className="space-y-2">
              <h4 className="text-lg font-semibold">추가 처치 상세 내역</h4>
              <div className="p-4 rounded-lg bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    {Object.entries(groupedTreatments).map(([category, treatments]) => (
                      <div key={category} className="break-inside-avoid">
                        <h5 className="text-base font-medium text-gray-800 mb-2">{category}</h5>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                          {treatments.map(item => (
                            <li key={item.id + item.optionKey} className="flex justify-between text-base">
                              <span className="pr-2">{item.name}</span>
                              <span className="font-mono whitespace-nowrap">{item.price.toLocaleString()}원</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          )}
          <div className="text-right mt-4 p-4 rounded-lg bg-blue-50">
            <span className="text-xl font-bold mr-4">총 비용:</span>
            <span className="text-3xl font-bold text-blue-700 tracking-tighter">{totalCost.toLocaleString()} 원</span>
          </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
};

export default React.memo(CostInfoCard);
