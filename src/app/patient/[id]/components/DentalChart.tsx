

'use client';

import * as React from 'react';
import type { Patient, DentalData, Procedure } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Shield, XCircle, Replace, GraduationCap } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { procedureCategories, getProcedureCosts, toothRootMap, toothGroups, quadrants } from '@/lib/costs';
import { Bone, GitBranch } from 'lucide-react';

const conditionCategories = [
    {
        name: '치주 질환',
        icon: Shield,
        color: 'text-red-500',
        conditions: [
            { id: 'PD', name: '치주염 (PD)', value: [1, 2, 3, 4], unit: '' },
            { id: 'GI', name: '치은염 (GI)', value: [1, 2, 3], unit: '' },
            { id: 'GH', name: '치은 증식 (GH)', value: [1, 2, 3, 4, 5], unit: 'mm' },
            { id: 'PPD', name: '치주낭 (PPD)', value: [3, 4, 5, 6, 7, 8, 9, 10], unit: 'mm' },
            { id: 'GR', name: '치은퇴축 (GR)', value: [1, 2, 3, 4, 5], unit: 'mm' },
            { id: 'CAL', name: '치은부착소실 (CAL)', value: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], unit: 'mm', manual: true },
            { id: 'F', name: '치근분지부 노출 (F)', value: [1, 2, 3], unit: '' },
            { id: 'M', name: '동요도 (M)', value: [1, 2, 3], unit: '' },
        ],
    },
    {
        name: '치아 구조 이상',
        icon: Bone,
        color: 'text-blue-500',
        conditions: [
            {
              id: 'FX', name: '치아파절 (FX)',
              subConditions: [
                  { id: 'EF', name: '에나멜 파절' },
                  { id: 'UCF', name: '치수 비노출파절' },
                  { id: 'CCF', name: '치수 노출파절' },
                  { id: 'UCRF', name: '치수 비노출 뿌리파절' },
                  { id: 'CCRF', name: '치수 노출 뿌리파절' },
              ]
            },
            { id: 'A', name: '교모/마모 (A)' },
            { id: 'EH', name: '법랑질 형성부전 (EH)' },
            { id: 'E/D', name: '법랑질 결손 (E/D)' },
            { id: 'NV', name: '실활치 (NV)' },
            { id: 'RD', name: '잔존유치 (RD)' },
            { id: 'UC', name: '미맹출치아 (UC)' },
            { id: 'X', name: '발치/결손치 (X)' },
            { id: 'DT', name: '유치 (DT)' },
            { id: 'SN', name: '과잉치 (SN)' },
            { id: 'U', name: '미맹출치 (U)' },
            { id: 'R', name: '회전치 (R)' },
            { id: 'CWD', name: '총생 (CWD)' },
        ],
    },
     {
        name: '기타',
        icon: GitBranch,
        color: 'text-green-500',
        conditions: [
            {
                id: 'TR', name: '치아흡수성병변 (TR)',
                subConditions: [
                    { id: 'T1', name: 'Type 1' },
                    { id: 'T2', name: 'Type 2' },
                    { id: 'T3', name: 'Type 3' },
                ]
            },
            { id: 'CN', name: '유착 (CN)' },
            {
              id: 'RR', name: '잔존치근 (RR)',
              subConditions: [
                  { id: 'IRR', name: '의도적 잔존 치근' },
                  { id: 'ORR', name: '존재하던 잔존 치근' },
              ]
            },
            { id: 'DC', name: '함치성 낭종 (DC)' },
            { id: 'ONF', name: '구비강 누공 (ONF)' },
            { id: 'OM', name: '종양 (OM)' },
        ],
    },
];

const conditionMap = new Map<string, { name: string; isSub: boolean; parentId?: string; unit?: string }>();
conditionCategories.forEach(category => {
    category.conditions.forEach(condition => {
        const nameWithoutAbbr = condition.name.replace(/\s\(.*\)/, '');
        conditionMap.set(condition.id, { name: nameWithoutAbbr, isSub: false, unit: condition.unit });
        if (condition.subConditions) {
            condition.subConditions.forEach(sub => {
                conditionMap.set(sub.id, { name: sub.name, isSub: true, parentId: condition.id });
            });
        }
    });
});


function DentalChart({ patient, dentalData, onUpdate }: { patient: Patient, dentalData: DentalData, onUpdate: (data: DentalData) => void }) {
    const [chartType, setChartType] = useState<'permanent' | 'deciduous'>('permanent');
    const [editingToothId, setEditingToothId] = useState<string | null>(null);
    const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
    const [isProcedureSheetOpen, setProcedureSheetOpen] = useState(false);

    const procedureCostTable = useMemo(() => {
        if (!patient || !patient.species || !patient.weight) return null;
        return getProcedureCosts(patient.species, patient.weight)
    }, [patient.species, patient.weight]);

    const allProcedures = useMemo(() => {
        if (!procedureCostTable) return [];
        return procedureCategories.flatMap(cat => procedureCostTable[cat.id] || [] )
    }, [procedureCostTable]);
    
    const procedureMap = useMemo(() => new Map(allProcedures.map(p => [p.id, p])), [allProcedures]);

    const handleUpdate = (toothId: string, newToothData: Partial<DentalData[string]>) => {
        const newData: DentalData = {
          ...dentalData,
          [toothId]: {
            ...(dentalData[toothId] || { id: toothId, status: [], procedures: [], isCompleted: false }),
            ...newToothData,
          },
        };
        onUpdate(newData);
    };

    const handleStatusToggle = (toothId: string, condition: any, value?: number | string) => {
        const currentTooth = dentalData[toothId] || { status: [], procedures: [] };
        let statusArray = Array.isArray(currentTooth.status) ? [...currentTooth.status] : [];
        const hasSubOptions = condition.value || condition.subConditions || condition.manual;

        let allRelatedConditions: string[] = [condition.id];
        if (condition.subConditions) {
          allRelatedConditions = [...allRelatedConditions, ...condition.subConditions.map((sc: any) => sc.id)];
        }

        const filteredStatus = statusArray.filter(s => !allRelatedConditions.some(rc => s.startsWith(rc)));

        let newStatus;
        let shouldCloseSheet = false;

        if (value !== undefined && value !== null && value !== '') {
            let statusValue;
            if (condition.id === 'FX' || condition.id === 'RR' || condition.id === 'TR') {
                statusValue = `${value}`;
            } else {
                statusValue = `${condition.id}${value}`;
            }

            if (statusArray.includes(statusValue)) {
                newStatus = filteredStatus;
            } else {
                newStatus = [...filteredStatus, statusValue];
            }
            setOpenSubMenu(null);
            shouldCloseSheet = true;
        } else {
            const isCurrentlyChecked = statusArray.some(s => allRelatedConditions.some(rc => s.startsWith(rc)));

             if (isCurrentlyChecked) {
                newStatus = filteredStatus;
                setOpenSubMenu(null);
                shouldCloseSheet = true;
            } else {
                if (hasSubOptions) {
                    newStatus = statusArray;
                    setOpenSubMenu(openSubMenu === condition.id ? null : condition.id);
                } else {
                    newStatus = [...filteredStatus, condition.id];
                    shouldCloseSheet = true;
                }
            }
        }

        if (condition.id === 'GR' || condition.id === 'PPD') {
            const grValueStr = (newStatus.find(s => s.startsWith('GR'))?.replace('GR', '')) || '';
            const ppdValueStr = (newStatus.find(s => s.startsWith('PPD'))?.replace('PPD', '')) || '';

            const grValue = parseInt(grValueStr, 10);
            const ppdValue = parseInt(ppdValueStr, 10);

            newStatus = newStatus.filter(s => !s.startsWith('CAL'));
            if (!isNaN(grValue) && !isNaN(ppdValue)) {
                const calValue = grValue + ppdValue;
                newStatus.push(`CAL${calValue}`);
            }
        }
        
        let newProcedures = [...(currentTooth.procedures || [])];
        if (condition.id === 'X') {
            newProcedures = []; // 'X' 상태 선택 시 모든 시술 제거
        }

        handleUpdate(toothId, { status: newStatus, procedures: newProcedures });

        if (shouldCloseSheet) {
            setEditingToothId(null);
        }
    };
    
    const handleProcedureToggle = (toothId: string, procedureId: string, procedureCategory: string) => {
        let updatedDentalData = { ...dentalData };
        const currentTooth = updatedDentalData[toothId] || { id: toothId, status: [], procedures: [] };
        let currentProcedures = [...(currentTooth.procedures || [])];
        
        const isExtractionCategory = (category: string) => ['extraction', 'deciduous_extraction', 'forl_extraction', 'persistent_deciduous_extraction'].includes(category);
        const isTreatmentCategory = (category: string) => ['nerve_treatment', 'resin_treatment', 'periodontal_treatment', 'other_surgery'].includes(category);

        const isSelectedExtraction = isExtractionCategory(procedureCategory);

        let newProcedures: string[];

        if (procedureId === 'monitoring') {
            newProcedures = currentProcedures.includes('monitoring') ? [] : ['monitoring'];
        } else {
            let filteredProcedures = [...currentProcedures].filter(p => p !== 'monitoring');

            if (isSelectedExtraction) {
                // If an extraction is selected, remove all other treatments and extractions
                newProcedures = filteredProcedures.includes(procedureId) ? [] : [procedureId];
            } else if (isTreatmentCategory(procedureCategory)) {
                // If a treatment is selected, remove all extractions
                newProcedures = filteredProcedures.filter(p => {
                    const proc = allProcedures.find(ap => ap.id === p);
                    return !proc || !isExtractionCategory(proc.category!);
                });
                
                if (newProcedures.includes(procedureId)) {
                    newProcedures = newProcedures.filter(p => p !== procedureId);
                } else {
                    newProcedures.push(procedureId);
                }
            } else {
                // For other categories (diagnostics, etc.)
                if (filteredProcedures.includes(procedureId)) {
                    newProcedures = filteredProcedures.filter(p => p !== procedureId);
                } else {
                    newProcedures.push(procedureId);
                }
            }
        }
        
        updatedDentalData[toothId] = { ...currentTooth, procedures: newProcedures };
        
        let shouldCloseSheet = false;
        
        // Automation for corresponding permanent tooth
        if (chartType === 'deciduous' && (procedureCategory === 'deciduous_extraction' || procedureCategory === 'persistent_deciduous_extraction')) {
            const permanentToothId = String(Number(toothId) - 400);
            if (Number(permanentToothId) >= 101 && Number(permanentToothId) <= 411) {
                const permanentTooth = updatedDentalData[permanentToothId] || { id: permanentToothId, status: [], procedures: [] };
                let permanentStatus = permanentTooth.status ? [...permanentTooth.status] : [];
                if (!permanentStatus.includes('DT')) permanentStatus.push('DT');
                if (!permanentStatus.includes('RD')) permanentStatus.push('RD');
                updatedDentalData[permanentToothId] = { ...permanentTooth, status: permanentStatus };
            }
        }
    
        const procedure = procedureMap.get(procedureId);
    
        // Automation for related procedures and statuses
        if (newProcedures.includes(procedureId)) {
            let currentStatus = updatedDentalData[toothId]?.status || [];
            let newStatus = [...currentStatus];
    
            if (isSelectedExtraction) {
                if(procedureId.startsWith('forl_')) {
                    if (!newStatus.includes('TR')) newStatus.push('TR');
                } else {
                    if (!newStatus.includes('PD4')) newStatus.push('PD4');
                }
                shouldCloseSheet = true;
            } else if (procedureCategory === 'resin_treatment') {
                if (!newStatus.some(s => s.startsWith('FX'))) newStatus.push('UCF'); // Add Uncomplicated Fracture
                shouldCloseSheet = true;
            } else if (procedureCategory === 'periodontal_treatment' && procedureId.includes('root_planing')) {
                if (!newStatus.includes('PD2')) newStatus.push('PD2');
            } else if (procedureCategory === 'nerve_treatment' && (procedureId.startsWith('vpt_') || procedureId.startsWith('endo_'))) {
                 if (!newStatus.some(s => s.startsWith('FX'))) newStatus.push('CCF'); // Add Complicated Fracture

                let correspondingResinId;
                if(procedure?.isCanine) correspondingResinId = 'resin_canine';
                else if(procedure?.isMolar) correspondingResinId = 'resin_molar';
                else correspondingResinId = 'resin_normal';
                
                const correspondingResin = allProcedures.find(p => p.id === correspondingResinId);
                if (correspondingResin && !newProcedures.includes(correspondingResin.id)) {
                    newProcedures.push(correspondingResin.id);
                }
                shouldCloseSheet = true;
            } else if (procedureId.includes('gingival_tumor')) {
                if (!newStatus.includes('OM')) newStatus.push('OM'); // Add Oral Mass
                const biopsy = allProcedures.find(p => p.id === 'biopsy');
                if (biopsy && !newProcedures.includes(biopsy.id)) {
                    newProcedures.push(biopsy.id);
                }
                shouldCloseSheet = true;
            }
            updatedDentalData[toothId] = { ...updatedDentalData[toothId], status: newStatus, procedures: newProcedures };
        }
    
        onUpdate(updatedDentalData);
    
        if (shouldCloseSheet) {
            setEditingToothId(null);
            setProcedureSheetOpen(false);
        }
    };

    const isDog = patient.species === '개';

    const currentToothGroups = toothGroups[chartType][isDog ? 'dog' : 'cat'];

    const getToothGroup = (toothId: string) => {
        if (!currentToothGroups) return '';
        for (const group in currentToothGroups) {
            if ((currentToothGroups as any)[group].includes(toothId)) {
                return group;
            }
        }
        return '';
    };

    const groupColors: { [key: string]: string } = {
        incisors: 'bg-blue-50',
        canines: 'bg-green-50',
        premolars: 'bg-orange-50',
        molars: 'bg-purple-50',
    };

    const groupLabels: { [key: string]: string } = {
        incisors: '앞니 (Incisors)',
        canines: '송곳니 (Canine)',
        premolars: '소구치 (Premolars)',
        molars: '어금니 (Molars)',
    };

     const getStatusDisplayString = (statusArray: string[]) => {
        if (!statusArray || statusArray.length === 0) return '상태 선택...';

        return statusArray.map(status => {
            let id = status;
            let value = '';

            const match = status.match(/^([A-Z/]+)(.*)$/);
            
            if (match) {
                const potentialId = match[1];
                const potentialSubId = status; 
                
                if (conditionMap.has(potentialSubId) && conditionMap.get(potentialSubId)!.isSub) {
                    id = potentialSubId;
                }
                else if (conditionMap.has(potentialId) && !conditionMap.get(potentialId)!.isSub) {
                    id = potentialId;
                    value = match[2];
                }
            }

            const info = conditionMap.get(id);

            if (!info) return status;

            if (info.isSub) {
                 return info.name;
            }

            if (value) {
                return `${info.name}: ${value}${info.unit || ''}`;
            }
            return info.name;
        }).join(', ');
    };
    
    const getProcedureDisplayString = (procedureIds: string[] | undefined) => {
        if (!procedureIds || procedureIds.length === 0) return { text: '시술 선택...', cost: 0 };
        const text = procedureIds.map(id => procedureMap.get(id)?.name || id).join(', ');
        const cost = procedureIds.reduce((sum, id) => sum + (procedureMap.get(id)?.price || 0), 0);
        return { text, cost };
    };
    
    const handleClearStatus = () => {
        if (!editingToothId) return;
        handleUpdate(editingToothId, { status: [] });
        setEditingToothId(null);
    };
    
    const handleClearProcedures = () => {
        if (!editingToothId) return;
        handleUpdate(editingToothId, { procedures: [] });
        setEditingToothId(null);
        setProcedureSheetOpen(false);
    };

    const renderToothRow = (toothId: string) => {
        const tooth = dentalData[toothId] || { id: toothId, status: [], procedures: [], isCompleted: false };
        const statusArray = Array.isArray(tooth.status) ? tooth.status : [];
        const procedureIds = tooth.procedures;
        const isCompleted = tooth.isCompleted;
        const { text: procedureText, cost: procedureCost } = getProcedureDisplayString(procedureIds);
    
        // Check for extracted deciduous tooth if we are in the permanent chart
        let extractedDeciduousInfo = null;
        if (chartType === 'permanent') {
            const deciduousId = String(Number(toothId) + 400);
            const deciduousTooth = dentalData[deciduousId];
            if (deciduousTooth && deciduousTooth.procedures) {
                const deciduousProcedures = allProcedures.filter(p => ['deciduous_extraction', 'persistent_deciduous_extraction'].includes(p.category || ''));
                const hasExtraction = deciduousTooth.procedures.some(procId => deciduousProcedures.some(dp => dp.id === procId));
                if (hasExtraction) {
                    extractedDeciduousInfo = {
                        id: deciduousId,
                        procedure: getProcedureDisplayString(deciduousTooth.procedures).text
                    };
                }
            }
        }
    
        return (
            <React.Fragment key={toothId}>
                <TableRow className={cn(groupColors[getToothGroup(toothId)], isCompleted && "bg-green-100 hover:bg-green-200/80")}>
                    <TableCell className="font-mono font-medium w-[90px]">
                        <div className="flex items-center gap-2">
                             {(procedureIds && procedureIds.length > 0) && (
                               <Checkbox
                                   id={`complete-${toothId}`}
                                   checked={!!isCompleted}
                                   onCheckedChange={(checked) => handleUpdate(toothId, { isCompleted: !!checked })}
                                   aria-label="수술 완료"
                               />
                             )}
                            <label htmlFor={`complete-${toothId}`} className="cursor-pointer">{toothId}</label>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Button
                            variant="outline"
                            className={cn("w-full h-auto min-h-10 justify-start text-left whitespace-normal", "shadow-sm border-b-2 border-slate-300", statusArray.length > 0 && "bg-yellow-100 hover:bg-yellow-200" )}
                            onClick={() => { setEditingToothId(toothId); setProcedureSheetOpen(false); }}
                        >
                            {getStatusDisplayString(statusArray)}
                        </Button>
                    </TableCell>
                    <TableCell>
                         <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className={cn("flex-1 h-auto min-h-10 justify-start text-left whitespace-normal", "shadow-sm border-b-2 border-slate-300", procedureIds && procedureIds.length > 0 && "bg-sky-100 hover:bg-sky-200")}
                                onClick={() => { setEditingToothId(toothId); setProcedureSheetOpen(true); }}
                            >
                                {procedureText}
                            </Button>
                            {procedureCost > 0 && (
                                <div className="w-[90px] text-right font-mono text-sm text-muted-foreground pr-2">
                                    ({procedureCost.toLocaleString()}원)
                                </div>
                            )}
                         </div>
                    </TableCell>
                </TableRow>
                {extractedDeciduousInfo && (
                    <TableRow key={`${toothId}-deciduous`} className={cn(groupColors[getToothGroup(toothId)], "bg-opacity-50")}>
                        <TableCell className="font-mono text-muted-foreground w-[90px] text-right pr-4">
                            <div className="flex items-center justify-end gap-1">
                                <GraduationCap className="h-3 w-3" />
                                <span>{extractedDeciduousInfo.id}</span>
                            </div>
                        </TableCell>
                        <TableCell colSpan={2} className="text-sm text-muted-foreground italic">
                            {extractedDeciduousInfo.procedure}
                        </TableCell>
                    </TableRow>
                )}
            </React.Fragment>
        );
    };
    

    const renderQuadrantTable = (quadrantIds: string[], quadrantTitle: string) => {
        const species = isDog ? 'dog' : 'cat';
        const speciesToothGroups = toothGroups[chartType][species];
        const groupedTeeth: { [key: string]: string[] } = { incisors: [], canines: [], premolars: [], molars: [] };
        
        const patientQuadrantTeeth = quadrantIds.filter(id => {
            const group = getToothGroup(id);
            // Ensure the group exists in the current species' chart type before checking inclusion
            return group && speciesToothGroups[group as keyof typeof speciesToothGroups] && (speciesToothGroups as any)[group].includes(id);
        });

        patientQuadrantTeeth.forEach(id => {
            const group = getToothGroup(id);
            if (group && groupedTeeth[group]) {
                groupedTeeth[group].push(id);
            }
        });

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[90px]">번호</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>시술</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     <TableRow className="bg-primary hover:bg-primary">
                        <TableCell colSpan={3} className="font-semibold text-center text-lg text-primary-foreground">{quadrantTitle}</TableCell>
                    </TableRow>
                    {Object.entries(groupedTeeth).map(([group, teeth]) => (
                        teeth.length > 0 && (
                           <React.Fragment key={group}>
                                <TableRow>
                                    <TableCell colSpan={3} className={cn("font-semibold text-muted-foreground", groupColors[group])}>
                                        {groupLabels[group]}
                                    </TableCell>
                                </TableRow>
                               {teeth.map(toothId => renderToothRow(toothId))}
                           </React.Fragment>
                        )
                    ))}
                </TableBody>
            </Table>
        );
    };

    const renderEditingSheet = () => {
        if (!editingToothId) return null;
        const tooth = dentalData[editingToothId] || { id: editingToothId, status: [], procedures: [] };
        const statusArray = Array.isArray(tooth.status) ? tooth.status : [];


        return (
            <Sheet open={!!editingToothId && !isProcedureSheetOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingToothId(null)}}>
                <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
                    <SheetHeader className="flex-row items-center justify-between pr-6">
                       <div>
                         <SheetTitle>치아 #{editingToothId} 상태 수정</SheetTitle>
                         <SheetDescription>해당 치아의 진단 상태를 선택하거나 수정하세요.</SheetDescription>
                       </div>
                       <div className="flex gap-2">
                            <Button variant="destructive" onClick={handleClearStatus}><XCircle className="mr-2" /> 모두 해제</Button>
                            <Button onClick={() => setEditingToothId(null)}>확인</Button>
                       </div>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-8rem)] pr-6">
                        <div className="space-y-6 py-4">
                            {conditionCategories.map((category) => (
                                <div key={category.name}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <category.icon className={cn("h-5 w-5", category.color)} />
                                        <h4 className={cn("font-semibold", category.color)}>{category.name}</h4>
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-3 pl-2">
                                        {category.conditions.map(condition => {
                                            let allRelatedConditions: string[] = [condition.id];
                                            if (condition.subConditions) {
                                                allRelatedConditions = [...allRelatedConditions, ...condition.subConditions.map((sc: any) => sc.id)];
                                            }
                                            const isChecked = statusArray.some(s => allRelatedConditions.some(rc => s.startsWith(rc)));
                                            let currentValue = statusArray.find(s => allRelatedConditions.some(rc => s.startsWith(rc))) || '';
                                            let currentSubValue = '';
                                            if (condition.id === 'FX' || condition.id === 'RR' || condition.id === 'TR') {
                                                currentSubValue = currentValue;
                                            } else {
                                                currentSubValue = currentValue.replace(new RegExp(`^${condition.id}`), '');
                                            }

                                            let labelText = `${condition.name}`;
                                            if (isChecked && currentSubValue) {
                                              let subName = '';
                                              if (condition.subConditions) {
                                                const subCondition = condition.subConditions.find(s => s.id === currentSubValue);
                                                subName = subCondition ? ` (${subCondition.name})` : ` (${currentSubValue})`;
                                              } else {
                                                subName = `: ${currentSubValue}${condition.unit || ''}`;
                                              }
                                              labelText += subName;
                                            }

                                            return (
                                                <div key={condition.id} className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id={`${editingToothId}-${condition.id}`} checked={isChecked} onCheckedChange={(checked) => {
                                                            handleStatusToggle(editingToothId, condition, checked ? undefined : null);
                                                            if (checked && (condition.value || condition.subConditions || condition.manual)) {
                                                                setOpenSubMenu(openSubMenu === condition.id ? null : condition.id);
                                                            }
                                                        }} />
                                                        <label htmlFor={`${editingToothId}-${condition.id}`} className="flex-1 text-sm font-medium cursor-pointer"
                                                          onClick={(e) => {
                                                              if (condition.value || condition.subConditions || condition.manual) {
                                                                  setOpenSubMenu(openSubMenu === condition.id ? null : condition.id);
                                                              }
                                                          }}
                                                        >
                                                            {labelText}
                                                        </label>
                                                    </div>
                                                    {openSubMenu === condition.id && (condition.value || condition.subConditions || condition.manual) && (
                                                        <div className="pl-6 space-y-2">
                                                            {condition.manual && (
                                                                <div className="flex items-center gap-2">
                                                                    <Input type="number" placeholder="직접 입력" className="h-8 text-sm max-w-24" defaultValue={currentSubValue} onBlur={(e) => handleStatusToggle(editingToothId, condition, e.target.value)} />
                                                                    <span>{condition.unit}</span>
                                                                </div>
                                                            )}
                                                            <div className={cn("flex flex-wrap gap-1 mt-1", condition.subConditions && "flex-col items-start")}>
                                                                {condition.value?.map((v: any) => ( <Button key={v} variant={currentSubValue === String(v) ? 'default' : 'outline'} size="sm" className="h-7" onClick={() => handleStatusToggle(editingToothId, condition, v)}> {v}{condition.unit} </Button> ))}
                                                                {condition.subConditions?.map((sub: any) => ( <Button key={sub.id} variant={currentSubValue === sub.id ? 'default' : 'ghost'} size="sm" className="h-7 justify-start w-full text-left" onClick={() => handleStatusToggle(editingToothId, condition, sub.id)}> {sub.name} ({sub.id}) </Button>))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        )
    }
    
    const renderProcedureSheet = () => {
        if (!editingToothId || !procedureCostTable) return null;
        
        const tooth = dentalData[editingToothId] || { id: editingToothId, status: [], procedures: [] };
        const currentProcedures = tooth.procedures || [];
        
        const speciesKey = patient.species === '개' ? 'dog' : 'cat';
        const rootInfo = toothRootMap[speciesKey];
    
        const getToothCharacteristics = (toothId: string) => {
             const characteristics = {
                isCanine: false, isMolar: false, isPremolar: false,
                isIncisor: false, isCarnassial: false,
                rootCount: null as number | null,
                jaw: null as 'upper' | 'lower' | null,
            };
    
            const toothNum = parseInt(toothId, 10);
            const isDeciduous = toothNum >= 500;

            const groups = isDeciduous ? toothGroups.deciduous[speciesKey] : toothGroups.permanent[speciesKey];

            if (groups.incisors.includes(toothId)) characteristics.isIncisor = true;
            if (groups.canines.includes(toothId)) characteristics.isCanine = true;
            if (groups.premolars.includes(toothId)) characteristics.isPremolar = true;
            if (groups.molars?.includes(toothId)) characteristics.isMolar = true;

            if ((rootInfo.carnassial_upper && rootInfo.carnassial_upper.includes(toothId)) || (rootInfo.carnassial_lower && rootInfo.carnassial_lower.includes(toothId))) {
                characteristics.isCarnassial = true;
            }
    
            if (rootInfo['1'] && rootInfo['1'].includes(toothId)) characteristics.rootCount = 1;
            else if (rootInfo['2'] && rootInfo['2'].includes(toothId)) characteristics.rootCount = 2;
            else if (rootInfo['3'] && rootInfo['3'].includes(toothId)) characteristics.rootCount = 3;
    
            if (rootInfo.upper_jaw.includes(toothId)) characteristics.jaw = 'upper';
            if (rootInfo.lower_jaw.includes(toothId)) characteristics.jaw = 'lower';
        
            return characteristics;
        };


        const { isCanine, isMolar, isPremolar, isIncisor, isCarnassial, rootCount, jaw } = getToothCharacteristics(editingToothId);
        
        let filteredCategories = procedureCategories;

        if (chartType === 'permanent') {
             filteredCategories = procedureCategories.filter(category => 
                !['deciduous_extraction', 'persistent_deciduous_extraction'].includes(category.id)
            );
        } else { // deciduous chart
            filteredCategories = procedureCategories.filter(category => {
                 if (['deciduous_extraction', 'persistent_deciduous_extraction'].includes(category.id)) {
                    return true;
                 }
                 if(category.id === 'extraction' && allProcedures.some(p => p.category === 'extraction' && p.id === 'monitoring')) {
                    return true;
                 }
                 return false;
            });
        }

        return (
            <Sheet open={isProcedureSheetOpen} onOpenChange={(isOpen) => { if (!isOpen) { setEditingToothId(null); setProcedureSheetOpen(false); }}}>
                <SheetContent className="w-full sm:max-w-2xl">
                     <SheetHeader className="flex-row items-center justify-between pr-6">
                        <div>
                            <SheetTitle>치아 #{editingToothId} 시술 선택</SheetTitle>
                            <SheetDescription>
                                이 치아({isCanine ? '송곳니' : ''}{isMolar ? '어금니' : ''}{isPremolar ? '소구치' : ''}{isIncisor ? '앞니' : ''}{isCarnassial ? '(열육치)' : ''}, 뿌리 {rootCount || 'N/A'}개, {jaw === 'upper' ? '상악' : jaw === 'lower' ? '하악' : ''})에 적용 가능한 시술을 선택하세요.
                            </SheetDescription>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="destructive" onClick={handleClearProcedures}><XCircle className="mr-2" /> 모두 해제</Button>
                             <Button onClick={() => { setEditingToothId(null); setProcedureSheetOpen(false); }}>확인</Button>
                        </div>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
                        <div className="space-y-4 py-4">
                            {filteredCategories.map(category => {
                                let procedures = (procedureCostTable[category.id] || [])
                                    .filter(p => {
                                        if (chartType === 'deciduous') {
                                            if (category.id === 'extraction' && p.id === 'monitoring') return true;

                                            if (category.id === 'deciduous_extraction') {
                                                if (isCanine) return p.isCanine; // 유치 송곳니 발치
                                                return !p.isCanine; // 치은 위 유치
                                            }
                                            
                                            if (category.id === 'persistent_deciduous_extraction') {
                                                 if (p.isCanine !== undefined && p.isCanine !== isCanine) return false;
                                                 if (p.rootCount !== undefined && p.rootCount !== rootCount) return false;
                                                 return true;
                                            }
                                            
                                            return false;
                                        }

                                        if (p.isCanine !== undefined && p.isCanine !== isCanine) return false;
                                        if (p.isMolar !== undefined && p.isMolar !== isMolar) return false;
                                        if (p.rootCount !== undefined && p.rootCount !== rootCount) return false;
                                        if (p.toothType === 'carnassial' && !isCarnassial) return false;
                                        if (p.toothType === 'incisor' && !isIncisor) return false;
                                        if (p.jaw !== undefined && p.jaw !== jaw) return false;

                                        return true;
                                    });
                                
                                if (chartType === 'deciduous' && category.id === 'deciduous_extraction' && !isCanine) {
                                    procedures = procedures.filter(p => p.id === 'dec_ext_gingival');
                                }
                                
                                if (procedures.length === 0) return null;

                                return (
                                    <div key={category.id}>
                                        <h4 className="font-semibold mb-2 text-base text-primary">{category.name}</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {procedures.map(proc => (
                                                <div
                                                    key={proc.id}
                                                    className={cn(
                                                        "flex items-center space-x-3 rounded-md border p-3 cursor-pointer transition-colors",
                                                        currentProcedures.includes(proc.id) ? "bg-secondary border-primary" : "hover:bg-muted/50"
                                                    )}
                                                    onClick={() => handleProcedureToggle(editingToothId, proc.id, category.id)}
                                                >
                                                    <Checkbox
                                                        id={`${editingToothId}-${proc.id}`}
                                                        checked={currentProcedures.includes(proc.id)}
                                                        onCheckedChange={() => handleProcedureToggle(editingToothId, proc.id, category.id)}
                                                    />
                                                    <label
                                                        htmlFor={`${editingToothId}-${proc.id}`}
                                                        className="flex flex-1 justify-between items-center text-sm font-medium cursor-pointer"
                                                    >
                                                        <span className="whitespace-normal">{proc.name}</span>
                                                        <span className="text-xs font-mono text-muted-foreground pl-2">{proc.price.toLocaleString()}원</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        )
    };

    const currentQuadrants = quadrants[chartType];
    const hasDeciduousChart = patient.species === '개' || patient.species === '고양이';


    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex-row justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                            <Shield className="h-6 w-6 text-primary" />
                            치과 차트
                        </CardTitle>
                        <CardDescription>{patient.name} ({isDog ? '강아지' : '고양이'}) - {chartType === 'permanent' ? '영구치' : '유치'}</CardDescription>
                    </div>
                    {hasDeciduousChart && (
                        <Button type="button" variant="outline" onClick={() => setChartType(chartType === 'permanent' ? 'deciduous' : 'permanent')}>
                            <Replace className="mr-2 h-4 w-4" />
                            {chartType === 'permanent' ? '유치 차트 보기' : '영구치 차트 보기'}
                        </Button>
                    )}
                </CardHeader>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-0">
                       {renderQuadrantTable(currentQuadrants.upperRight, '우측 - 상악')}
                       <div className="my-4" />
                       {renderQuadrantTable(currentQuadrants.lowerRight, '우측 - 하악')}
                    </CardContent>
                </Card>
                <Card>
                     <CardContent className="p-0">
                       {renderQuadrantTable(currentQuadrants.upperLeft, '좌측 - 상악')}
                       <div className="my-4" />
                       {renderQuadrantTable(currentQuadrants.lowerLeft, '좌측 - 하악')}
                    </CardContent>
                </Card>
            </div>
            {renderEditingSheet()}
            {renderProcedureSheet()}
        </div>
    );
}


export default React.memo(DentalChart);

    
