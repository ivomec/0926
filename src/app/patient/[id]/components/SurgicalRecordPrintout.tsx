
'use client';

import * as React from 'react';
import { useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Printer, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import type { Patient, Costs, ImageRecord, DentalData, SelectedTreatment, Procedure } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { additionalTreatmentsConfig, getProcedureCosts, procedureCategories, getToothDescription } from '@/lib/costs';
import { format, differenceInYears, differenceInMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';


type PrintoutData = {
  patient: Patient;
  costs: Costs;
  images: ImageRecord[];
  dentalData: DentalData;
  additionalTreatments: SelectedTreatment[];
  selectedPackages: SelectedTreatment[];
};

type SurgicalRecordPrintoutProps = {
    data: PrintoutData;
    onBack: () => void;
};

const toothGroups = {
    permanent: {
        dog: {
            incisors: ['101', '102', '103', '201', '202', '203', '301', '302', '303', '401', '402', '403'],
            canines: ['104', '204', '304', '404'],
            premolars: ['105', '106', '107', '108', '205', '206', '207', '208', '305', '306', '307', '308', '405', '406', '407', '408'],
            molars: ['109', '110', '209', '210', '309', '310', '311', '409', '410', '411'],
        },
        cat: {
            incisors: ['101', '102', '103', '201', '202', '203', '301', '302', '303', '401', '402', '403'],
            canines: ['104', '204', '304', '404'],
            premolars: ['106', '107', '108', '206', '207', '208', '307', '308', '407', '408'], 
            molars: ['109', '209', '309', '409'],
        },
    },
    deciduous: {
        dog: {
            incisors: ['501', '502', '503', '601', '602', '603', '701', '702', '703', '801', '802', '803'],
            canines: ['504', '604', '704', '804'],
            premolars: ['505', '506', '507', '508', '605', '606', '607', '608', '705', '706', '707', '708', '805', '806', '807', '808'],
        },
        cat: {
            incisors: ['501', '502', '503', '601', '602', '603', '701', '702', '703', '801', '802', '803'],
            canines: ['504', '604', '704', '804'],
            premolars: ['506', '507', '508', '606', '607', '608', '707', '708', '807', '808'],
        }
    }
};

const quadrants = {
    permanent: {
        upperRight: ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110'],
        upperLeft:  ['201', '202', '203', '204', '205', '206', '207', '208', '209', '210'],
        lowerRight: ['401', '402', '403', '404', '405', '406', '407', '408', '409', '410', '411'],
        lowerLeft:  ['301', '302', '303', '304', '305', '306', '307', '308', '309', '310', '311'],
    },
    deciduous: {
        upperRight: ['501', '502', '503', '504', '505', '506', '507', '508'],
        upperLeft:  ['601', '602', '603', '604', '605', '606', '607', '608'],
        lowerRight: ['801', '802', '803', '804', '805', '806', '807', '808'],
        lowerLeft:  ['701', '702', '703', '704', '705', '706', '707', '708'],
    }
};

const conditionCategories = [
    { name: '치주 질환', conditions: [ { id: 'PD', name: '치주염 (PD)' }, { id: 'GI', name: '치은염 (GI)' }, { id: 'GH', name: '치은 증식 (GH)' }, { id: 'PPD', name: '치주낭 (PPD)' }, { id: 'GR', name: '치은퇴축 (GR)' }, { id: 'CAL', name: '치은부착소실 (CAL)' }, { id: 'F', name: '치근분지부 노출 (F)' }, { id: 'M', name: '동요도 (M)' } ] },
    { name: '치아 구조 이상', conditions: [ { id: 'FX', name: '치아파절 (FX)', subConditions: [ { id: 'EF', name: '에나멜 파절' }, { id: 'UCF', name: '치수 비노출파절' }, { id: 'CCF', name: '치수 노출파절' }, { id: 'UCRF', name: '치수 비노출 뿌리파절' }, { id: 'CCRF', name: '치수 노출 뿌리파절' }] }, { id: 'A', name: '교모/마모 (A)' }, { id: 'EH', name: '법랑질 형성부전 (EH)' }, { id: 'E/D', name: '법랑질 결손 (E/D)' }, { id: 'NV', name: '실활치 (NV)' }, { id: 'RD', name: '잔존유치 (RD)' }, { id: 'UC', name: '미맹출치아 (UC)' }, { id: 'X', name: '발치/결손치 (X)' }, { id: 'DT', name: '유치 (DT)' }, { id: 'SN', name: '과잉치 (SN)' }, { id: 'U', name: '미맹출치 (U)' }, { id: 'R', name: '회전치 (R)' }, { id: 'CWD', name: '총생 (CWD)' } ] },
    { name: '기타', conditions: [ { id: 'TR', name: '치아흡수성병변 (TR)', subConditions: [ { id: 'T1', name: 'Type 1' }, { id: 'T2', name: 'Type 2' }, { id: 'T3', name: 'Type 3' }] }, { id: 'CN', name: '유착 (CN)' }, { id: 'RR', name: '잔존치근 (RR)', subConditions: [ { id: 'IRR', name: '의도적 잔존 치근' }, { id: 'ORR', name: '존재하던 잔존 치근' }] }, { id: 'DC', name: '함치성 낭종 (DC)' }, { id: 'ONF', name: '구비강 누공 (ONF)' }, { id: 'OM', name: '종양 (OM)' } ] },
];

const conditionMap = new Map<string, { name: string; isSub: boolean; parentId?: string; unit?: string }>();
conditionCategories.forEach(category => {
    category.conditions.forEach(condition => {
        const nameWithoutAbbr = condition.name.replace(/\s\(.*\)/, '');
        conditionMap.set(condition.id, { name: nameWithoutAbbr, isSub: false });
        if (condition.subConditions) {
            condition.subConditions.forEach(sub => {
                conditionMap.set(sub.id, { name: sub.name, isSub: true, parentId: condition.id });
            });
        }
    });
});

// 한글 조사(을/를) 자동 변경 함수
const getPostposition = (name: string, particle: '을/를') => {
    if (!name) return name;
    const lastChar = name.charCodeAt(name.length - 1);
    // 한글의 시작(가)과 끝(힣)의 유니코드 포인트
    const start = 0xac00;
    const end = 0xd7a3;
    if (lastChar < start || lastChar > end) {
        // 한글이 아닌 경우
        return name + (particle === '을/를' ? '을' : ''); // 기본값 '을'
    }
    // 마지막 글자의 종성(받침) 유무 확인
    const hasJongseong = (lastChar - start) % 28 > 0;
    
    if (particle === '을/를') {
        return name + (hasJongseong ? '을' : '를');
    }
    // 다른 조사가 필요할 경우 여기에 추가
    return name;
};


export default function SurgicalRecordPrintout({ data, onBack }: SurgicalRecordPrintoutProps) {
    const { toast } = useToast();
    const { patient, costs, images, dentalData, additionalTreatments, selectedPackages } = data;

    const preSurgeryImages = useMemo(() => images?.filter(img => img.category === 'pre-surgery') || [], [images]);
    const postSurgeryImages = useMemo(() => images?.filter(img => img.category === 'post-surgery') || [], [images]);
    
    const procedureCostTable = useMemo(() => {
        if (!patient || !patient.species || !patient.weight) return null;
        return getProcedureCosts(patient.species, patient.weight);
    }, [patient]);

    const allProcedures = useMemo(() => {
        if (!procedureCostTable) return [];
        return procedureCategories.flatMap(cat => procedureCostTable[cat.id] || []);
    }, [procedureCostTable]);

    const procedureMap = useMemo(() => new Map(allProcedures.map(p => [p.id, p])), [allProcedures]);

    const ageInfo = useMemo(() => {
        if (!patient?.birthDate) return '정보 없음';
        const birthDate = patient.birthDate instanceof Timestamp ? patient.birthDate.toDate() : patient.birthDate;
        const today = new Date();
        const years = differenceInYears(today, birthDate);
        const months = differenceInMonths(today, birthDate) % 12;
        return `${years}세 ${months}개월`;
    }, [patient?.birthDate]);
    
    const procedureDetails = useMemo(() => {
        if (!dentalData) return [];
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

    const additionalTreatmentsForDisplay = React.useMemo(() => {
        return additionalTreatments.filter(t => t.id !== 'scaling_package' && t.id !== 'anesthesia_package' && !t.id.startsWith('health_checkup'));
    }, [additionalTreatments]);

    const groupedTreatments = useMemo(() => {
        if (!patient || !patient.species || !patient.weight || !additionalTreatmentsForDisplay) return {};
        const config = additionalTreatmentsConfig(patient);
        if (!config.categories) return {};
      
        return additionalTreatmentsForDisplay.reduce((acc, treatment) => {
          for (const category of config.categories) {
            const items = config.itemsByCategoryId[category.id as keyof typeof config.itemsByCategoryId] as { id: string }[] | undefined;
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
    }, [additionalTreatmentsForDisplay, patient]);

    const totalCost = (costs?.procedure || 0) + (costs?.additional || 0) + (costs?.anesthesia || 0) + (costs?.checkup || 0);

    const handlePrint = () => {
        const surgeryDate = patient.surgeryDate ? format(patient.surgeryDate instanceof Timestamp ? patient.surgeryDate.toDate() : patient.surgeryDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        const filename = `${patient.name}_수술기록서_${surgeryDate}`;
        const printContent = document.getElementById('record-print-area')?.innerHTML;
        
        if (printContent) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>${filename}</title>
                            <style>
                                @page { 
                                  size: A4;
                                  margin: 0; 
                                }
                                body { 
                                    font-family: 'Inter', sans-serif; 
                                    line-height: 1.6; 
                                    color: #333;
                                    padding: 15mm;
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                }
                                .no-print { display: none; }
                                @media print {
                                  .print-instructions { display: none; }
                                }
                                .print-instructions {
                                  text-align: center;
                                  padding: 1rem;
                                  background-color: #f2f7ff !important;
                                  border: 1px dashed #0056b3;
                                  margin-bottom: 1.5rem;
                                }
                                .header { text-align: center; margin-bottom: 2rem; }
                                .header h1 { font-size: 2em; margin: 0; color: #1a1a1a; }
                                .header p { font-size: 1.1em; margin: 0; color: #555; }
                                .section { margin-bottom: 2rem; page-break-inside: avoid; }
                                .section-title { font-size: 1.4em; font-weight: bold; color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 0.5rem; margin-bottom: 1rem; }
                                .image-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                                .image-container { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
                                .image-container img { width: 100%; height: auto; display: block; }
                                table { width: 100%; border-collapse: collapse; margin-bottom: 1rem;}
                                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; vertical-align: top; font-size: 11px; }
                                th { background-color: #f8f9fa !important; font-weight: bold; }
                                .cost-summary-table td:first-child { width: 70%; }
                                .cost-summary-table td:nth-child(2) { text-align: right; font-weight: bold; }
                                .procedure-details-table th:not(:first-child), .procedure-details-table td:not(:first-child) { text-align: right; }
                                .total-cost-row { font-weight: bold; font-size: 1.2em; }
                                .total-cost-row td:first-child { text-align: right; }
                                .footer-note { margin-top: 2.5rem; padding: 1.5rem; background-color: #f2f7ff !important; border-left: 5px solid #0056b3; font-size: 0.95em; }
                                .hospital-info { text-align: center; margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #ccc; font-size: 0.9em; color: #666; }
                                .patient-info-table td:first-child { font-weight: bold; background-color: #f9f9f9 !important; width: 120px; }
                                .dental-chart-print { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                                .dental-chart-print .quadrant-table { page-break-inside: avoid; }
                                .dental-chart-print th, .dental-chart-print td { padding: 4px 8px; font-size: 10px; }
                                .dental-chart-print .quadrant-title { background-color: #3b82f6 !important; color: white !important; font-weight: bold; text-align: center; }
                                .dental-chart-print .group-title { font-weight: bold; color: #6b7280; }
                                .bg-blue-50 { background-color: #eff6ff !important; } .bg-green-50 { background-color: #f0fdf4 !important; } .bg-orange-50 { background-color: #fff7ed !important; } .bg-purple-50 { background-color: #faf5ff !important; }
                                .status-text { background-color: #fefce8 !important; font-size: 9px; }
                                .proc-text { background-color: #e0f2fe !important; font-size: 9px; }
                                .additional-treatments-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; page-break-inside: avoid; }
                                .bg-slate-50 { background-color: #f8fafc !important; }
                            </style>
                        </head>
                        <body>
                            <div class="print-instructions">
                              <p>모든 내용이 올바르게 보이는지 확인 후, <strong>Ctrl+P</strong> 또는 <strong>Cmd+P</strong>를 눌러 인쇄하세요.</p>
                            </div>
                            ${printContent}
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
            }
        }
    };
    
    const handleSaveImage = () => {
        toast({ title: '준비 중', description: '이미지로 저장하는 기능은 현재 개발 중입니다.' });
    };

    const isDog = patient?.species === '개';
    
    const getToothGroup = (toothId: string) => {
        if (!patient.species) return '';
        const isDeciduous = parseInt(toothId, 10) >= 500;
        const chartType = isDeciduous ? 'deciduous' : 'permanent';
        const speciesKey = patient.species === '개' ? 'dog' : 'cat';

        const speciesGroups = toothGroups[chartType]?.[speciesKey];
        if (!speciesGroups) return '';

        for (const group in speciesGroups) {
            if (Object.prototype.hasOwnProperty.call(speciesGroups, group)) {
                if ((speciesGroups as any)[group].includes(toothId)) {
                    return group;
                }
            }
        }
        return '';
    };

    const groupColors: { [key: string]: string } = { incisors: 'bg-blue-50', canines: 'bg-green-50', premolars: 'bg-orange-50', molars: 'bg-purple-50' };
    const groupLabels: { [key: string]: string } = { incisors: '앞니 (Incisors)', canines: '송곳니 (Canine)', premolars: '소구치 (Premolars)', molars: '어금니 (Molars)' };
    
    const getStatusDisplayString = (statusArray: string[]) => {
        if (!statusArray || statusArray.length === 0) return '-';
        return statusArray.map(status => {
            let id = status;
            let value = '';
            const match = status.match(/^([A-Z/]+)(.*)$/);
            if (match) {
                const potentialId = match[1];
                const potentialSubId = status; 
                if (conditionMap.has(potentialSubId) && conditionMap.get(potentialSubId)!.isSub) { id = potentialSubId; } 
                else if (conditionMap.has(potentialId) && !conditionMap.get(potentialId)!.isSub) { id = potentialId; value = match[2]; }
            }
            const info = conditionMap.get(id);
            if (!info) return status;
            if (info.isSub) return info.name;
            if (value) return `${info.name}: ${value}${info.unit || ''}`;
            return info.name;
        }).join(', ');
    };
    
    const getProcedureDisplayString = (procedureIds: string[] | undefined) => {
        if (!procedureIds || procedureIds.length === 0) return { text: '-', cost: 0 };
        const text = procedureIds.map(id => procedureMap.get(id)?.name || id).join(', ');
        const cost = procedureIds.reduce((sum, id) => sum + (procedureMap.get(id)?.price || 0), 0);
        return { text, cost };
    };

    const renderQuadrantTable = (quadrantIds: string[], quadrantTitle: string) => {
        if (!dentalData) return null;
        const speciesKey = isDog ? 'dog' : 'cat';
        
        const teethInQuadrant = quadrantIds.filter(id => {
            const group = getToothGroup(id);
            const speciesToothGroups = toothGroups.permanent[speciesKey];
            return group && (speciesToothGroups as any)[group] && (speciesToothGroups as any)[group].includes(id);
        });

        const groupedTeeth: { [key: string]: any[] } = { incisors: [], canines: [], premolars: [], molars: [] };
        
        teethInQuadrant.forEach(id => {
            const tooth = dentalData[id];
            if (tooth && (tooth.status?.length > 0 || tooth.procedures?.length > 0)) {
                const group = getToothGroup(id);
                if (group && groupedTeeth[group]) {
                    groupedTeeth[group].push(tooth);
                }
            }
        });

        const hasContent = Object.values(groupedTeeth).some(teeth => teeth.length > 0);
        if (!hasContent) return null;

        return (
            <div className="quadrant-table">
            <table className="w-full border-collapse">
                <thead>
                    <tr><th className="w-1/6">번호</th><th className="w-2/5">상태</th><th className="w-2/5">시술</th><th className="w-1/6 text-right">비용</th></tr>
                </thead>
                 <tbody>
                    <tr><td colSpan={4} className="quadrant-title">{quadrantTitle}</td></tr>
                    {Object.entries(groupedTeeth).map(([group, teeth]) => {
                       if (teeth.length === 0) return null;
                       return (
                           <React.Fragment key={group}>
                                <tr><td colSpan={4} className={cn("group-title", groupColors[group])}>{groupLabels[group]}</td></tr>
                               {teeth.map(tooth => {
                                   const statusArray = Array.isArray(tooth.status) ? tooth.status : [];
                                   const { text: procedureText, cost: procedureCost } = getProcedureDisplayString(tooth.procedures);
                                   return (
                                       <tr key={tooth.id} className={groupColors[getToothGroup(tooth.id)]}>
                                           <td className="font-mono font-medium">{tooth.id}</td><td className="status-text">{getStatusDisplayString(statusArray)}</td>
                                           <td className="proc-text">{procedureText}</td><td className="text-right font-mono">{procedureCost > 0 ? `${procedureCost.toLocaleString()}원` : '-'}</td>
                                       </tr>
                                   );
                               })}
                           </React.Fragment>
                        )
                    })}
                </tbody>
            </table>
            </div>
        );
    };

    if (!patient) return null;

    return (
        <div data-print-wrapper>
            <div className="bg-background/80 backdrop-blur-sm fixed inset-0 z-40 overflow-y-auto" >
                <div className="max-w-4xl mx-auto my-8 p-4 sm:p-8 bg-white shadow-2xl rounded-lg" data-print-content>
                    <div className="sticky top-0 bg-white/80 backdrop-blur-sm py-4 mb-4 border-b z-10 flex justify-center gap-4 no-print">
                         <Button type="button" variant="outline" onClick={onBack}><ArrowLeft className="mr-2" /> 뒤로가기</Button>
                         <Button type="button" variant="outline" onClick={handleSaveImage}><ImageIcon className="mr-2" /> 이미지로 저장</Button>
                         <Button onClick={handlePrint}><Printer className="mr-2" /> PDF로 저장/인쇄</Button>
                    </div>
                    <div id="record-print-area">
                        <div className="header">
                            <Image src="https://raw.githubusercontent.com/ivomec/image/main/Final%20Logo.png" alt="Hospital Logo" width={120} height={120} className="mx-auto" />
                            <h1 className="mt-4">수술 기록 안내서</h1>
                            <p><strong>{patient.guardianName}</strong> 보호자님 (환자: <strong>{patient.name}</strong>)</p>
                        </div>
                        <div className="section"><h2 className="section-title">환자 정보</h2>
                            <table className="patient-info-table"><tbody>
                                <tr><td>차트번호</td><td>{patient.id}</td></tr>
                                <tr><td>환자 이름</td><td>{patient.name}</td></tr>
                                <tr><td>종/품종</td><td>{patient.species} / {patient.breed}</td></tr>
                                <tr><td>나이</td><td>{ageInfo}</td></tr>
                                <tr><td>성별/중성화</td><td>{patient.gender} / {patient.isNeutered ? '완료' : '미완료'}</td></tr>
                                <tr><td>몸무게</td><td>{patient.weight} kg</td></tr>
                            </tbody></table>
                        </div>
                        <div className="section"><h2 className="section-title">치과 차트</h2>
                            <div className="dental-chart-print">
                               <div className="quadrant-container">{renderQuadrantTable(quadrants.permanent.upperRight, '우측 - 상악')}{renderQuadrantTable(quadrants.permanent.lowerRight, '우측 - 하악')}</div>
                               <div className="quadrant-container">{renderQuadrantTable(quadrants.permanent.upperLeft, '좌측 - 상악')}{renderQuadrantTable(quadrants.permanent.lowerLeft, '좌측 - 하악')}</div>
                            </div>
                        </div>
                        <div className="section"><h2 className="section-title">수술 전 X-Ray</h2>
                            {preSurgeryImages.length > 0 ? (<div className="image-gallery">{preSurgeryImages.map(image => (<div key={image.id} className="image-container"><Image src={image.imageUrl} alt="수술 전 X-Ray" width={200} height={200} style={{width: "100%", height: "auto"}} /></div>))}</div>) : (<p>업로드된 수술 전 X-Ray 사진이 없습니다.</p>)}
                        </div>
                        <div className="section"><h2 className="section-title">수술 후 X-Ray</h2>
                            {postSurgeryImages.length > 0 ? (<div className="image-gallery">{postSurgeryImages.map(image => (<div key={image.id} className="image-container"><Image src={image.imageUrl} alt="수술 후 X-Ray" width={200} height={200} style={{width: "100%", height: "auto"}} /></div>))}</div>) : (<p>업로드된 수술 후 X-Ray 사진이 없습니다.</p>)}
                        </div>
                        <div className="section"><h2 className="section-title">패키지 항목</h2>
                           {selectedPackages.length > 0 ? (
                            <div className="p-4 rounded-lg bg-slate-50">
                                <ul className="space-y-1.5 text-sm text-muted-foreground">
                                 {selectedPackages.map(pkg => (
                                     <li key={pkg.id + pkg.optionKey} className="flex justify-between text-base">
                                        <span className="pr-2">{pkg.name}</span>
                                        <span className="font-mono whitespace-nowrap">{pkg.price.toLocaleString()}원</span>
                                     </li>
                                 ))}
                                </ul>
                            </div>
                           ) : (<p>선택된 패키지 항목이 없습니다.</p>)}
                        </div>
                        <div className="section"><h2 className="section-title">추가 처치 항목</h2>
                            {additionalTreatmentsForDisplay && additionalTreatmentsForDisplay.length > 0 ? (<div className="p-4 rounded-lg bg-slate-50"><div className="additional-treatments-grid">{Object.entries(groupedTreatments).map(([category, treatments]) => (<div key={category} className="break-inside-avoid"><h5 className="text-base font-medium text-gray-800 mb-2">{category}</h5><ul className="space-y-1.5 text-sm text-muted-foreground">{treatments.map(item => (<li key={item.id + item.optionKey} className="flex justify-between text-base"><span className="pr-2">{item.name}</span><span className="font-mono whitespace-nowrap">{item.price.toLocaleString()}원</span></li>))}</ul></div>))}</div></div>) : (<p>선택된 추가 처치 항목이 없습니다.</p>)}
                        </div>
                        <div className="section"><h2 className="section-title">최종 비용 정보</h2>
                            <div className="space-y-6">
                                <table className="cost-summary-table">
                                    <tbody>
                                        <tr><td>치과 수술 비용</td><td>{(costs.procedure || 0).toLocaleString()} 원</td></tr>
                                        <tr><td>스케일링 패키지 비용</td><td>{(costs.anesthesia || 0).toLocaleString()} 원</td></tr>
                                        <tr><td>건강검진 비용</td><td>{(costs.checkup || 0).toLocaleString()} 원</td></tr>
                                        <tr><td>추가 처치 비용</td><td>{(costs.additional || 0).toLocaleString()} 원</td></tr>
                                        <tr className="total-cost-row"><td className='text-right'>총 최종 비용:</td><td>{totalCost.toLocaleString()} 원</td></tr>
                                    </tbody>
                                </table>

                                {procedureDetails.length > 0 && (<div className="space-y-2"><h4 className="text-lg font-semibold">시술 비용 상세 내역</h4><div className="p-4 rounded-lg bg-slate-50"><Table className="procedure-details-table"><TableHeader><TableRow><TableHead className="text-base">시술명</TableHead><TableHead className="text-right text-base">단가</TableHead><TableHead className="text-right text-base">횟수</TableHead><TableHead className="text-right text-base">합계</TableHead></TableRow></TableHeader><TableBody>{procedureDetails.map((proc, index) => (<TableRow key={`${proc.name}-${index}`}><TableCell className="text-base"><div>{proc.name}</div><div className="text-sm text-muted-foreground mt-1">{patient.species && proc.toothIds.map(id => getToothDescription(id, patient.species!)).join(', ')}</div></TableCell><TableCell className="text-right font-mono text-base">{proc.price.toLocaleString()}원</TableCell><TableCell className="text-right font-mono text-base">{proc.count}</TableCell><TableCell className="text-right font-mono text-base">{(proc.price * proc.count).toLocaleString()}원</TableCell></TableRow>))}</TableBody></Table></div></div>)}
                            </div>
                        </div>
                        <div className="footer-note"><p><strong>안내 말씀</strong></p><p>오늘 {patient.name}의 치과 수술이 무사히 끝났습니다. 아이의 회복을 위해 최선을 다했으며, 위 기록은 오늘 진행된 수술의 모든 내용을 정리한 것입니다. 퇴원약 복용과 주의사항을 잘 지켜주시고, 궁금한 점이 있으시면 언제든 병원으로 연락주세요. {getPostposition(patient.name, '을/를')} 저희에게 믿고 맡겨주셔서 진심으로 감사합니다.</p></div>
                        <div className="hospital-info"><p><strong>치과 특화 금호동물병원</strong></p><p>광주 광역시 서구 금호동 금화로54 거북빌딩 1층 110호</p><p>Tel: 062-383-7572</p></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
