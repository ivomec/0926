
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
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
  
  // Ref to track initial image load to prevent overwrites
  const isInitialImageLoad = useRef(true);

  useEffect(() => {
    if (!patientId) return;

    console.log("Subscribing to patient data for patientId:", patientId);

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
      } else {
        toast({ title: '오류', description: '환자를 찾을 수 없습니다.', variant: 'destructive' });
        router.push('/');
      }
      setIsLoading(false); // Loading is false after the first patient data fetch
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
        // On the first load, set the entire list.
        if (isInitialImageLoad.current) {
            const imagesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ImageRecord));
            setImages(imagesList);
            isInitialImageLoad.current = false;
        } else {
            // After the initial load, only apply granular changes.
            snapshot.docChanges().forEach((change) => {
                const docData = { id: change.doc.id, ...change.doc.data() } as ImageRecord;
                if (change.type === 'added') {
                    // Add the new image, preventing duplicates from optimistic updates.
                    setImages(prevImages => 
                        prevImages.some(img => img.id === docData.id) 
                            ? prevImages 
                            : [docData, ...prevImages]
                    );
                }
                if (change.type === 'modified') {
                    setImages(prevImages => prevImages.map(img => img.id === docData.id ? docData : img));
                }
                if (change.type === 'removed') {
                    setImages(prevImages => prevImages.filter(img => img.id !== docData.id));
                }
            });
        }
    }, (error) => {
      console.error("Error listening to images collection:", error);
      toast({ title: '오류', description: '이미지를 실시간으로 불러오지 못했습니다.', variant: 'destructive' });
    });

    return () => {
      console.log("Unsubscribing from patient data for patientId:", patientId);
      unsubscribePatient();
      unsubscribeSodalime();
      unsubscribeImages();
    };
  // The dependency array is intentionally simple. It should only re-run if the patientId changes.
  }, [patientId, toast, router]);

  return {
    patient,
    dentalData, setDentalData,
    dischargeMeds, setDischargeMeds,
    additionalTreatments, setAdditionalTreatments,
    selectedPackages, setSelectedPackages,
    costs, setCosts,
    images, setImages,
    sodalimeRecord,
    isLoading,
    analysisResult, setAnalysisResult,
    analysisText, setAnalysisText,
  };
}
