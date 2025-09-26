

import type { Timestamp } from 'firebase/firestore';
import * as z from 'zod';

export type Species = '개' | '고양이' | '기타';

export const patientSchema = z.object({
  chartId: z.string().min(1, '차트 번호는 필수입니다.'),
  guardianName: z.string().min(1, '보호자 이름은 필수입니다.'),
  guardianPhone: z.string().min(1, '보호자 연락처는 필수입니다.'),
  name: z.string().min(1, '이름은 필수입니다.'),
  species: z.enum(['개', '고양이']),
  breed: z.string().min(1, '품종은 필수입니다.'),
  birthDate: z.date({ required_error: '생년월일은 필수입니다.' }),
  gender: z.enum(['수컷', '암컷']),
  isNeutered: z.boolean().default(false),
  weight: z.coerce.number().min(0.1, '몸무게는 0.1kg 이상이어야 합니다.'),
  hasHeartCondition: z.boolean().default(false),
  hasLiverCondition: z.boolean().default(false),
  hasKidneyCondition: z.boolean().default(false),
  hasBloodCondition: z.boolean().default(false),
  surgeryDate: z.date().optional().nullable(),
  detailedFindings: z.string().optional(),
  googleDriveLink: z.string().url('유효한 URL을 입력해주세요.').optional().or(z.literal('')),
  surgeryStartTime: z.date().nullable(),
  surgeryEndTime: z.date().nullable(),
  anesthesiaDuration: z.number().optional(),
  catheterSize: z.string().optional(),
  cuffGuide: z.string().optional(),
});

export const statusMap: { [key: string]: { label: string; value?: string[] } } = {
  PD: { label: '치주염', value: ['1', '2', '3', '4'] },
  GR: { label: '치은염', value: ['1', '2', '3'] },
  FX: { label: '치아파절' },
  AT: { label: '치아마모' },
  M: { label: '실종치' },
  CR: { label: '치석', value: ['1', '2', '3'] },
};

export const procedureMap: { [key: string]: { label: string } } = {
  SURG_EXT: { label: '수술적 발치' },
  EXT: { label: '단순 발치' },
  RESIN: { label: '레진' },
  SC: { label: '스케일링' },
  RP: { label: '루트 플래닝' },
};

export interface Costs {
  procedure: number;
  additional: number;
  anesthesia: number;
  checkup: number; // For health checkup packages
}

export type SelectedTreatment = {
  id: string; // e.g., 'anesthesia_extension'
  optionKey: string; // e.g., '30min_under_5kg' or '3days'
  price: number;
  name: string; // e.g., '마취 시간 연장 (30분)'
  category: 'scaling' | 'checkup'; // To distinguish package types
};

export type AnalysisResult = {
  liver: string[];
  blood: string[];
  kidney: string[];
  heart: string[];
};


export interface Patient {
  id: string;
  name: string;
  species: Species;
  breed: string;
  birthDate: Timestamp | Date;
  gender: '수컷' | '암컷';
  isNeutered: boolean;
  weight: number; 
  
  hasHeartCondition: boolean;
  hasLiverCondition: boolean;
  hasKidneyCondition: boolean;
  hasBloodCondition: boolean;
  
  guardianName: string;
  guardianPhone: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  surgeryDate?: Timestamp | null;
  detailedFindings?: string;
  googleDriveLink?: string;

  dentalData?: DentalData;
  costs?: Costs;
  dischargeMeds?: string[];
  additionalTreatments?: SelectedTreatment[];
  selectedPackages?: SelectedTreatment[]; // Changed to array

  surgeryStartTime?: Timestamp | null | Date;
  surgeryEndTime?: Timestamp | null | Date;
  anesthesiaDuration?: number;

  catheterSize?: string;
  cuffGuide?: string;

  analysisResult?: AnalysisResult | null;
  analysisText?: string;
}


export interface ImageRecord {
  id: string;
  imageUrl: string;
  storagePath: string;
  category: 'general' | 'pre-surgery' | 'post-surgery';
  uploadedAt: Timestamp;
}


export interface Tooth {
  id: string;
  status: string[];
  procedures: string[];
  isCompleted?: boolean;
}

export interface DentalData {
  [toothId: string]: Tooth;
}

export interface SodalimeRecord {
    totalMinutes: number;
    usage: { [date: string]: number }; // e.g. { '2023-10-27': 120 }
    lastResetDate?: Timestamp;
}

export interface AnalysisFileRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  storagePath: string;
  uploadedAt: Timestamp;
}

export type Procedure = {
    id: string;
    name: string;
    price: number;
    tooth?: string;
    isCanine?: boolean;
    isMolar?: boolean;
    isPremolar?: boolean;
    isIncisor?: boolean;
    rootCount?: number;
    category?: string;
    toothType?: 'carnassial' | 'incisor' | null;
}
    
