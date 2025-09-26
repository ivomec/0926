'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, Timestamp, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import type { Patient, DentalData, Costs, SodalimeRecord, ImageRecord } from '@/lib/types';
import { patientSchema, procedureMap, statusMap } from '@/lib/types';

import { LoadingOverlay } from '@/components/LoadingOverlay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Printer, LoaderCircle, CheckCircle, Pipette, ClipboardPenLine, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import DentalChart from './DentalChart';
import SodalimeManagerDialog from './SodalimeManagerDialog';
import DischargeMedication from './DischargeMedication';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import AdditionalTreatments from './AdditionalTreatments';
import PatientInfoCard from './PatientInfoCard';
import AnesthesiaManagementCard from './AnesthesiaManagementCard';
import EmergencyProtocolCard from './EmergencyProtocolCard';
import FluidCRICard from './FluidCRICard';
import PreSurgeryPrepCard from './PreSurgeryPrepCard';
import ImageGalleryCard from './ImageGalleryCard';
import CostInfoCard from './CostInfoCard';
import { DogIcon } from '@/components/DogIcon';
import { CatIcon } from '@/components/CatIcon';
import usePatient from '../hooks/usePatient';
import TubeSelector from './TubeSelector';
import ImageViewer from './ImageViewer';
import EstimatePrintout from './EstimatePrintout';
import SurgicalRecordPrintout from './SurgicalRecordPrintout';
import FindingsCard from './FindingsCard';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import PackagesCard from './PackagesCard';
import { AISpeechAnalysisCard } from './AISpeechAnalysisCard';

export type PatientFormValues = z.infer<typeof patientSchema>;
type SaveStatus = 'idle' | 'saving' | 'saved';
type PrintMode = 'none' | 'estimate' | 'record';

const convertUndefinedToNull = (obj: any): any => {
    if (obj === undefined) return null;
    if (Array.isArray(obj)) return obj.map(item => convertUndefinedToNull(item));
    if (obj !== null && typeof obj === 'object' && !(obj instanceof Timestamp) && !(obj instanceof Date)) {
      const newObj: { [key: string]: any } = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          newObj[key] = convertUndefinedToNull(obj[key]);
        }
      }
      return newObj;
    }
    return obj;
};

export default function PatientDetailView({ patientId }: { patientId: string }) {
  const { 
    patient, dentalData, setDentalData, dischargeMeds, setDischargeMeds,
    additionalTreatments, setAdditionalTreatments, selectedPackages, setSelectedPackages,
    costs, setCosts, sodalimeRecord, isLoading, images, setImages
  } = usePatient(patientId);
  
  const [formReady, setFormReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [imageViewerData, setImageViewerData] = useState<{ images: ImageRecord[], startIndex: number } | null>(null);
  const [printMode, setPrintMode] = useState<PrintMode>('none');
  const [isSodalimeDialogOpen, setSodalimeDialogOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const recordButtonRef = useRef<HTMLButtonElement>(null);

  const router = useRouter();
  const { toast } = useToast();

  const formMethods = useForm<PatientFormValues>({ resolver: zodResolver(patientSchema) });

  useEffect(() => {
    if (patient) {
        let defaultValues = Object.keys(patientSchema.shape).reduce((acc, key) => {
            const patientKey = key as keyof Patient;
            const value = patient[patientKey];
            if (value instanceof Timestamp) {
                (acc as any)[patientKey] = value.toDate();
            } else {
                (acc as any)[patientKey] = value ?? patientSchema.shape[patientKey]._def.defaultValue;
            }
            return acc;
        }, {} as PatientFormValues);

        defaultValues = convertUndefinedToNull(defaultValues);
        
        formMethods.reset(defaultValues);
        setFormReady(true);
    }
  }, [patient, formMethods]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'AudioVolumeUp') {
        event.preventDefault();
        recordButtonRef.current?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFormSubmit = useCallback(async (data: PatientFormValues) => {
    if (!patient) return;
    setSaveStatus('saving');
    try {
      const patientDocRef = doc(db, 'patients', patientId);
      let dataToSave: Partial<Patient> = { ...data, updatedAt: serverTimestamp(), dentalData, costs, additionalTreatments, selectedPackages, dischargeMeds };
      dataToSave = convertUndefinedToNull(dataToSave);
      await updateDoc(patientDocRef, dataToSave);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      toast({ title: '성공', description: '모든 차트 정보가 저장되었습니다.' });
    } catch (error: any) {
      console.error('Manual save failed:', error);
      toast({ title: '저장 실패', description: `차트 정보를 저장하는 데 실패했습니다: ${error.message || error}`, variant: 'destructive' });
      setSaveStatus('idle');
    }
  }, [patient, dentalData, costs, additionalTreatments, selectedPackages, dischargeMeds, patientId, toast]);

  const handleTubeSave = useCallback((size: string, guide: string) => {
    formMethods.setValue('catheterSize', size, { shouldDirty: true });
    formMethods.setValue('cuffGuide', guide, { shouldDirty: true });
  }, [formMethods]);

  const playAudioFeedback = useCallback(async (text: string) => {
    try {
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        if (!response.ok) throw new Error('TTS API request failed');
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    } catch (error) {
        console.error("Audio feedback error:", error);
        toast({ title: "음성 피드백 오류", description: "완료 음성을 재생하지 못했습니다.", variant: "destructive"});
    }
  }, [toast]);

  const handleAiAnalysis = useCallback(async (data: any) => {
    if (data.error) {
      toast({ title: "AI 분석 오류", description: data.error, variant: "destructive" });
      await playAudioFeedback(`분석에 실패했습니다. ${data.error}`);
      return;
    }

    setIsAiProcessing(true);
    try {
      const { toothId, type, actionId, value } = data;
      
      setDentalData(prevData => {
        const newData = { ...prevData };
        if (type === 'status') {
          if (!newData.statuses) newData.statuses = {};
          newData.statuses[toothId] = { ...newData.statuses[toothId], [actionId]: value ?? true };
        } else if (type === 'procedure') {
          if (!newData.procedures) newData.procedures = {};
          newData.procedures[toothId] = { ...newData.procedures[toothId], [actionId]: true };
        }
        return newData;
      });

      const statusLabel = statusMap[actionId]?.label || '';
      const procedureLabel = procedureMap[actionId]?.label || '';
      let feedbackText = `${toothId}번 치아, `;
      if (type === 'status') {
        feedbackText += `${statusLabel}`;
        if(value) feedbackText += ` ${value}단계, `;
      } else {
        feedbackText += `${procedureLabel}, `;
      }
      feedbackText += "기록 완료.";

      await playAudioFeedback(feedbackText);
      toast({ title: "AI 차팅 완료", description: feedbackText });

    } catch (error) {
        console.error("Chart update error:", error);
        toast({ title: "차트 업데이트 오류", description: "분석 결과를 차트에 반영하지 못했습니다.", variant: "destructive"});
        await playAudioFeedback('차트 기록에 실패했습니다.');
    } finally {
      setIsAiProcessing(false);
    }
  }, [setDentalData, toast, playAudioFeedback]);

  const openImageViewer = (images: ImageRecord[], startIndex: number) => {
    setImageViewerData({ images, startIndex });
  };

  if (isLoading || !formReady) return <LoadingOverlay text="환자 정보를 동기화하는 중..." />;
  if (!patient) return (
    <div className="text-center py-12">
        <p>환자를 찾을 수 없습니다.</p>
        <Button asChild variant="outline" className="mt-4">
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />환자 목록으로 돌아가기</Link>
        </Button>
    </div>
  );

  if (printMode !== 'none') {
    const currentPatientData = formMethods.getValues();
    const printoutData = { patient: { ...patient, ...currentPatientData, id: patient.id }, costs, images: images || [], dentalData, additionalTreatments: additionalTreatments || [], selectedPackages: selectedPackages || [] };
    if (printMode === 'estimate') return <EstimatePrintout data={printoutData} onBack={() => setPrintMode('none')} />;
    if (printMode === 'record') return <SurgicalRecordPrintout data={printoutData} onBack={() => setPrintMode('none')} />;
  }

  const { control, species, weight, catheterSize, cuffGuide, googleDriveLink } = formMethods.watch();

  return (
    <div className="relative min-h-[calc(100vh-10rem)] space-y-8">
      <FormProvider {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <Button asChild variant="secondary" type="button" className="w-full md:w-auto">
                        <Link href={`/guardian/${encodeURIComponent(patient.guardianPhone)}`}><ArrowLeft className="mr-2 h-4 w-4" />보호자 정보로 돌아가기</Link>
                    </Button>
                    <div className="flex w-full md:w-auto items-center gap-2">
                        <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700"><Save className="mr-2"/> 전체 차트 저장</Button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {patient.species === '개' ? <DogIcon className="h-10 w-10 text-primary" /> : <CatIcon className="h-10 w-10 text-primary" />}
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{patient.name}</h2>
                        <p className="text-muted-foreground">{patient.guardianName} ({patient.guardianPhone})</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 w-full md:w-auto items-center gap-2">
                    <Button type="button" onClick={() => setPrintMode('estimate')}><Printer className="mr-2"/> 예상비용 출력</Button>
                    <Button type="button" onClick={() => setPrintMode('record')}><Printer className="mr-2"/> 수술기록 출력</Button>
                </div>
            </div>
      
          <PatientInfoCard />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FindingsCard patientId={patientId} />
              <div className="space-y-6">
                  <FormField control={control} name="googleDriveLink" render={({ field }) => (
                      <Card>
                          <CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon /> Google Drive 링크</CardTitle></CardHeader>
                          <CardContent>
                              <div className="flex items-center gap-2">
                                  <FormControl><Input placeholder="사진, 파일 등이 저장된 폴더 링크" {...field} value={field.value || ''} /></FormControl>
                                  <Button type="button" variant="outline" size="icon" asChild disabled={!googleDriveLink || !z.string().url().safeParse(googleDriveLink).success}>
                                      <a href={googleDriveLink || ''} target="_blank" rel="noopener noreferrer"><LinkIcon /></a>
                                  </Button>
                              </div>
                              <FormMessage />
                          </CardContent>
                      </Card>
                  )} />
                   <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><Pipette />기관 카테터 선택</CardTitle></CardHeader>
                      <CardContent><TubeSelector species={species} weight={weight} currentSize={catheterSize} currentCuffGuide={cuffGuide} onSave={handleTubeSave} /></CardContent>
                  </Card>
              </div>
          </div>
          
          <Accordion type="multiple" className="w-full space-y-6" defaultValue={[]}>
            <PreSurgeryPrepCard />
            <FluidCRICard />
            <EmergencyProtocolCard />
            <AnesthesiaManagementCard sodalimeRecord={sodalimeRecord} setSodalimeDialogOpen={setSodalimeDialogOpen} />
            <AccordionItem value="item-11"><Card><AccordionTrigger className="p-6"><CardTitle className="flex items-center gap-2"><ClipboardPenLine /> 퇴원약 조제</CardTitle></AccordionTrigger><AccordionContent className="p-6 pt-0"><CardDescription className="mb-4">환자 상태에 따라 약물을 선택하고, 필요한 총량을 계산합니다.</CardDescription><DischargeMedication selectedMeds={dischargeMeds} onSelectedMedsChange={setDischargeMeds} /></AccordionContent></Card></AccordionItem>
          </Accordion>
          
          <AISpeechAnalysisCard ref={recordButtonRef} onAnalysis={handleAiAnalysis} isProcessing={isAiProcessing} />
          <DentalChart patient={patient} dentalData={dentalData} onUpdate={setDentalData} />

          <Accordion type="multiple" className="w-full space-y-6" defaultValue={['item-9']}>
            <PackagesCard patient={patient} selectedPackages={selectedPackages} onPackagesChange={setSelectedPackages} setCosts={setCosts} />
            <AdditionalTreatments patient={patient} selectedTreatments={additionalTreatments} onTreatmentsChange={setAdditionalTreatments} setCosts={setCosts} />
            <ImageGalleryCard patientId={patientId} images={images} setImages={setImages} openImageViewer={openImageViewer} />
            <CostInfoCard costs={costs} setCosts={setCosts} dentalData={dentalData} additionalTreatments={additionalTreatments} patient={patient} selectedPackages={selectedPackages} />
          </Accordion>
        </form>
      </FormProvider>
      
      <div className="fixed bottom-4 right-4 z-50">
        {saveStatus === 'saving' && (<div className="flex items-center gap-2 rounded-lg bg-secondary p-3 text-secondary-foreground shadow-lg"><LoaderCircle className="h-5 w-5 animate-spin" /><span>저장 중...</span></div>)}
        {saveStatus === 'saved' && (<div className="flex items-center gap-2 rounded-lg bg-green-100 p-3 text-green-800 shadow-lg"><CheckCircle className="h-5 w-5" /><span>모든 변경사항이 저장되었습니다.</span></div>)}
      </div>
        
      <SodalimeManagerDialog open={isSodalimeDialogOpen} onOpenChange={setSodalimeDialogOpen} sodalimeRecord={sodalimeRecord} />
      {patient && <ImageViewer imageData={imageViewerData} onClose={() => setImageViewerData(null)} />}
    </div>
  );
}
