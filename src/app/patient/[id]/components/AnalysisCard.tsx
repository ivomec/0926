

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Upload, FileText, Repeat, Save, CheckCircle, LoaderCircle } from 'lucide-react';
import type { PatientFormValues } from './PatientDetailView';
import * as XLSX from 'xlsx';
import * as cheerio from 'cheerio';
import { cn } from '@/lib/utils';
import { Shield, Droplets, Bone, HeartPulse } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField, FormItem, FormControl, FormLabel } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import type { AnalysisResult } from '@/lib/types';


const CORE_ITEMS_WITH_ALIASES: { [key in keyof AnalysisResult]: { id: string; aliases: string[] }[] } = {
  liver: [
    { id: 'ALKP', aliases: ['ALKP'] },
    { id: 'ALT', aliases: ['ALT'] },
    { id: 'GGT', aliases: ['GGT'] },
    { id: 'T-bil', aliases: ['Bilirubin-Total', 'T-bil'] },
  ],
  blood: [
    { id: 'WBC', aliases: ['WBC'] },
    { id: 'RBC', aliases: ['RBC'] },
    { id: 'Hct', aliases: ['Hematocrit', 'Hct'] },
    { id: 'Plt', aliases: ['Platelet', 'Plt'] },
  ],
  kidney: [
    { id: 'SDMA', aliases: ['SDMA'] },
    { id: 'Creatinine', aliases: ['Creatinine', 'cre'] },
    { id: 'BUN', aliases: ['BUN'] },
  ],
  heart: [
    { id: 'Murmur', aliases: ['Murmur'] },
    { id: 'VLAS', aliases: ['VLAS'] },
    { id: 'VHS', aliases: ['VHS'] },
  ],
};


const categoryIcons: { [key in keyof AnalysisResult]: React.ReactNode } = {
  heart: <HeartPulse className="h-4 w-4 text-red-500" />,
  liver: <Shield className="h-4 w-4 text-orange-500" />,
  kidney: <Bone className="h-4 w-4 text-blue-500" />,
  blood: <Droplets className="h-4 w-4 text-rose-500" />,
};

const categoryNames: { [key in keyof AnalysisResult]: string } = {
  heart: '심장',
  liver: '간',
  kidney: '신장',
  blood: '혈구',
}

const categoryFields: { [key in keyof AnalysisResult]: keyof PatientFormValues } = {
    heart: 'hasHeartCondition',
    liver: 'hasLiverCondition',
    kidney: 'hasKidneyCondition',
    blood: 'hasBloodCondition',
}

interface AnalysisCardProps {
  patientId: string;
  initialAnalysisResult: AnalysisResult | null;
  initialAnalysisText: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

const AnalysisCard: React.FC<AnalysisCardProps> = ({ patientId, initialAnalysisResult, initialAnalysisText }) => {
  const { setValue, control } = useFormContext<PatientFormValues>();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [analysisText, setAnalysisText] = React.useState(initialAnalysisText);
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(initialAnalysisResult);
  const [isInputVisible, setIsInputVisible] = React.useState(!initialAnalysisResult);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('idle');
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setAnalysisResult(initialAnalysisResult);
    setAnalysisText(initialAnalysisText);
    setIsInputVisible(!initialAnalysisResult);
  }, [initialAnalysisResult, initialAnalysisText]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAnalysisResult(null);

    try {
        let content = '';
        if (file.type.includes('spreadsheetml') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                
                const sheetContent = rawData
                    .filter(row => Array.isArray(row) && row.some(cell => cell !== null && cell !== ''))
                    .map(row => row.join('\t'))
                    .join('\n');
                    
                content += sheetContent + '\n\n';
            });
        } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
            const html = await file.text();
            const $ = cheerio.load(html);
            content = $('body').text();
        } else {
             toast({ title: '지원하지 않는 파일 형식', description: '엑셀(.xlsx, .xls) 또는 HTML 파일만 지원합니다.', variant: 'destructive' });
             return;
        }

        setAnalysisText(content);
        toast({ title: '파일 로드 성공', description: `${file.name}의 내용이 텍스트 영역에 로드되었습니다.` });
    } catch (error) {
        console.error('File reading error:', error);
        toast({ title: '파일 읽기 오류', description: '파일을 읽는 중 오류가 발생했습니다.', variant: 'destructive' });
    } finally {
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };


  const handleExtractCoreItems = () => {
    if (!analysisText.trim()) {
        toast({ title: '오류', description: '분석할 텍스트를 입력해주세요.', variant: 'destructive' });
        return;
    }

    setIsProcessing(true);
    try {
        const lines = analysisText.split('\n');
        const extractedResults: AnalysisResult = { liver: [], blood: [], kidney: [], heart: [] };
        const abnormalItemsByCategory: { [key in keyof AnalysisResult]: Set<string> } = { liver: new Set(), blood: new Set(), kidney: new Set(), heart: new Set() };
        
        const allCoreItems = Object.entries(CORE_ITEMS_WITH_ALIASES).flatMap(([category, items]) => 
            items.map(item => ({ ...item, category: category as keyof AnalysisResult }))
        );

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;
            
            const foundItem = allCoreItems.find(coreItem => 
                coreItem.aliases.some(alias => {
                    const pattern = alias.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
                    let regex;
                    if (alias.toUpperCase() === 'WBC') {
                        regex = new RegExp(`^${pattern}(?![\\-%#a-zA-Z])\\b`, 'i');
                    } else if (alias.toUpperCase() === 'BUN') {
                         regex = new RegExp(`^${pattern}(?!\\/)`, 'i');
                    }
                    else {
                        regex = new RegExp(`^${pattern}\\b`, 'i');
                    }
                    return regex.test(trimmedLine);
                })
            );

            if (foundItem) {
                let isAbnormal = trimmedLine.includes('▲') || trimmedLine.includes('▼');
                
                if (foundItem.id.toLowerCase() === 'murmur') {
                    const match = trimmedLine.match(/(\d+)\/6/);
                    isAbnormal = match ? parseInt(match[1], 10) >= 3 : false;
                }

                const parts = trimmedLine.replace(/\s*\(.*\)\s*/, '').split(/\s+/);
                const resultPart = parts.find(p => /[▲▼]/.test(p) || !isNaN(parseFloat(p))) || parts[parts.length -1] || '';
                const finalLine = `${foundItem.id} ${resultPart}`;
                
                if (extractedResults[foundItem.category]) {
                  extractedResults[foundItem.category].push(finalLine);
                }
                
                if (isAbnormal) {
                    abnormalItemsByCategory[foundItem.category].add(foundItem.id);
                }
            }
        });
        
        setAnalysisResult(extractedResults);
        
        setValue('hasLiverCondition', abnormalItemsByCategory.liver.size >= 2, { shouldDirty: true });
        setValue('hasBloodCondition', abnormalItemsByCategory.blood.size >= 2, { shouldDirty: true });
        setValue('hasKidneyCondition', abnormalItemsByCategory.kidney.size >= 2, { shouldDirty: true });
        setValue('hasHeartCondition', abnormalItemsByCategory.heart.size >= 2, { shouldDirty: true });

        toast({ title: '추출 완료', description: '핵심 항목이 아래 카드에 표시되고 이상 상태가 업데이트되었습니다.' });
        setIsInputVisible(false);
    } catch (error: any) {
        console.error("항목 추출 중 오류 발생:", error);
        toast({ 
            title: '추출 실패', 
            description: error.message || '알 수 없는 오류가 발생했습니다.', 
            variant: 'destructive' 
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleResetAnalysis = () => {
    setAnalysisResult(null);
    setAnalysisText('');
    setIsInputVisible(true);
  }

  const handleSaveAnalysis = async () => {
    setSaveStatus('saving');
    try {
        const patientDocRef = doc(db, 'patients', patientId);
        await updateDoc(patientDocRef, {
            analysisResult: analysisResult,
            analysisText: analysisText,
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        toast({ title: '저장 완료', description: '분석 결과가 차트에 저장되었습니다.' });
    } catch (error) {
        console.error('Error saving analysis:', error);
        setSaveStatus('idle');
        toast({ title: '저장 실패', description: '분석 결과 저장 중 오류가 발생했습니다.', variant: 'destructive' });
    }
  };
  

  return (
    <div className="space-y-2">
        <h3 className="text-base font-semibold flex items-center gap-2 mb-2"><FileText />검사 결과 분석</h3>
        {!isInputVisible && (
          <div className="flex gap-2">
            <Button type="button" onClick={handleResetAnalysis} variant="outline" size="sm">
                <Repeat className="mr-2 h-4 w-4" /> 새로 분석하기
            </Button>
             <Button type="button" onClick={handleSaveAnalysis} variant="outline" size="sm" disabled={saveStatus !== 'idle'}>
                {saveStatus === 'saving' && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {saveStatus === 'saved' && <CheckCircle className="mr-2 h-4 w-4 text-green-600" />}
                {saveStatus === 'idle' && <Save className="mr-2 h-4 w-4" />}
                {saveStatus === 'saved' ? '저장됨' : '추출 결과 저장'}
            </Button>
          </div>
        )}
        
        {isInputVisible && (
          <>
            <CardDescription className="text-xs">혈액 검사 결과 등 텍스트를 붙여넣거나 파일을 업로드하여 분석하세요.</CardDescription>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden"
                accept=".xlsx, .xls, .html, .htm"
            />
            <Textarea 
            placeholder="이곳에 검사 결과 텍스트를 붙여넣으세요..."
            rows={6}
            value={analysisText}
            onChange={(e) => {
                setAnalysisText(e.target.value)
            }}
            />
            <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleExtractCoreItems} disabled={isProcessing}>
                <Wand2 className="mr-2" /> {isProcessing ? '추출 중...' : '핵심 항목 추출'}
            </Button>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                <Upload className="mr-2" /> 파일 업로드하여 분석
            </Button>
            </div>
          </>
        )}

        {analysisResult && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {(Object.keys(analysisResult) as Array<keyof AnalysisResult>).map(category => (
                <Card key={category}>
                <CardHeader className="flex-row items-center justify-between space-y-0 p-3">
                    <div className="flex items-center gap-2">
                        {categoryIcons[category]}
                        <CardTitle className="text-sm font-semibold">{categoryNames[category]}</CardTitle>
                    </div>
                    <FormField
                        control={control}
                        name={categoryFields[category]}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    {analysisResult[category].length > 0 ? (
                    <ul className="space-y-1 text-xs">
                        {analysisResult[category].map((line, index) => (
                        <li key={index} className={cn(
                            'font-mono', 
                            (line.includes('▲') || line.includes('▼')) && 'text-red-600 font-bold'
                        )}>
                            {line}
                        </li>
                        ))}
                    </ul>
                    ) : (
                    <p className="text-xs text-muted-foreground">해당 항목 없음</p>
                    )}
                </CardContent>
                </Card>
            ))}
            </div>
        )}
    </div>
  );
};

export default React.memo(AnalysisCard);
