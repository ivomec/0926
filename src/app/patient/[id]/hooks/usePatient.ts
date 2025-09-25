

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot, Timestamp, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Patient, DentalData, Costs, SodalimeRecord, SelectedTreatment, ImageRecord, AnalysisResult } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function usePatient(patientId: string) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [dentalData, setDentalData] = useState<DentalData>({});
  const [dischargeMeds, setDischargeMeds] = useState<string[]>([]);
  const [additionalTreatments, setAdditionalTreatments] = useState<SelectedTreatment[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<SelectedTreatment[]>([]);
  const [costs, setCosts] = useState<Costs>({ procedure: 0, additional: 0, anesthesia: 0, checkup: 0 });
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisText, setAnalysisText] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [sodalimeRecord, setSodalimeRecord] = useState<SodalimeRecord | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!patientId) return;

    const patientDocRef = doc(db, 'patients', patientId);
    const unsubscribePatient = onSnapshot(patientDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const patientData = { id: docSnap.id, ...docSnap.data() } as Patient;
        setPatient(patientData);
        
        setDentalData(patientData.dentalData || {});
        setDischargeMeds(patientData.dischargeMeds || []);
        setAdditionalTreatments(patientData.additionalTreatments || []);
        setSelectedPackages(patientData.selectedPackages || []);
        setCosts(patientData.costs || { procedure: 0, additional: 0, anesthesia: 0, checkup: 0 });
        setAnalysisResult(patientData.analysisResult || null);
        setAnalysisText(patientData.analysisText || '');
        
        setIsLoading(false);
      } else {
        toast({ title: '오류', description: '환자를 찾을 수 없습니다.', variant: 'destructive' });
        router.push('/');
        setIsLoading(false);
      }
    }, (error) => {
      console.error('Error fetching patient data: ', error);
      toast({ title: '오류', description: '환자 정보를 가져오지 못했습니다.', variant: 'destructive' });
      setIsLoading(false);
    });

    const sodalimeDocRef = doc(db, 'settings', 'sodalime');
    const unsubscribeSodalime = onSnapshot(sodalimeDocRef, (doc) => {
        setSodalimeRecord(doc.exists() ? (doc.data() as SodalimeRecord) : { totalMinutes: 0, usage: {} });
    });

    const imagesCollectionRef = collection(db, 'patients', patientId, 'images');
    const qImages = query(imagesCollectionRef, orderBy('uploadedAt', 'desc'));
    const unsubscribeImages = onSnapshot(qImages, (snapshot) => {
      const imagesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ImageRecord));
      setImages(imagesList);
    }, (error) => {
      console.error("Error listening to images collection:", error);
      toast({ title: '오류', description: '이미지를 실시간으로 불러오지 못했습니다.', variant: 'destructive' });
    });

    return () => {
      unsubscribePatient();
      unsubscribeSodalime();
      unsubscribeImages();
    };
  }, [patientId, toast, router]);

  return {
    patient,
    dentalData, setDentalData,
    dischargeMeds, setDischargeMeds,
    additionalTreatments, setAdditionalTreatments,
    selectedPackages, setSelectedPackages,
    costs, setCosts,
    images,
    sodalimeRecord,
    isLoading,
    analysisResult, setAnalysisResult,
    analysisText, setAnalysisText,
  };
}
