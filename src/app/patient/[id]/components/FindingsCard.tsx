

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PencilLine } from 'lucide-react';
import type { PatientFormValues } from './PatientDetailView';
import AnalysisCard from './AnalysisCard';
import usePatient from '../hooks/usePatient';

interface FindingsCardProps {
    patientId: string;
}

const FindingsCard: React.FC<FindingsCardProps> = ({ patientId }) => {
    const { control } = useFormContext<PatientFormValues>();
    const { analysisResult, analysisText } = usePatient(patientId);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><PencilLine />특이사항</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid grid-cols-1 gap-6">
                    <FormField control={control} name="detailedFindings" render={({ field }) => (
                        <FormItem>
                            <FormLabel>상세 소견 기록</FormLabel>
                            <FormControl>
                                <Textarea placeholder="혈액 검사 AI 요약, 특이 사항 등 상세 내용을 기록하세요." {...field} value={field.value || ''} rows={6}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="border-t pt-6">
                  <AnalysisCard 
                    patientId={patientId} 
                    initialAnalysisResult={analysisResult} 
                    initialAnalysisText={analysisText || ''}
                  />
                </div>
            </CardContent>
        </Card>
    );
}

export default React.memo(FindingsCard);
