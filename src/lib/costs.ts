

import type { Patient, Procedure, Species } from './types';

type WeightCategory = '<5' | '5-10' | '10-15' | '15-20' | '20-30' | '30-40' | '>40';


const getWeightCategory = (weight: number, species: Species): WeightCategory => {
  if (weight < 5) return '<5';
  if (weight < 10) return '5-10';
  if (weight < 15) return '10-15';
  if (species === '고양이') {
      if (weight >=15) return '10-15'; // Cats > 15kg are treated as 10-15kg
  }
  if (weight < 20) return '15-20';
  if (weight < 30) return '20-30';
  if (weight < 40) return '30-40';
  return '>40';
};

// Type Definitions
type PriceOptions = { [key: string]: number };
type TreatmentOption = { key: string; label: string; price: number };
export type TreatmentCategory = {
    id: 'additionalAnesthesiaDrugs' | 'anesthesia' | 'pain' | 'recovery' | 'homeCare';
    name: string;
    description: string;
}
export type PackageCategory = {
    id: 'scalingPackages' | 'checkupPackages';
    name: string;
    description: string;
}


// Helper function to generate options from a price map
const generateOptions = (prices: PriceOptions, labelPrefix: string = ''): TreatmentOption[] => {
  return Object.entries(prices).map(([key, price]) => ({
    key,
    label: `${labelPrefix} ${key}`.trim(),
    price,
  }));
};

// Pricing Data
const prices = {
  healthCheckup: {
    dog: {
      '기본검사': { '<5': 190000, '5-10': 210000, '10-15': 230000, '15-20': 240000, '20-30': 240000, '30-40': 240000, '>40': 240000 },
      '일반검사': { '<5': 290000, '5-10': 310000, '10-15': 330000, '15-20': 340000, '20-30': 340000, '30-40': 340000, '>40': 340000 },
      '종합검사': { '<5': 390000, '5-10': 410000, '10-15': 430000, '15-20': 440000, '20-30': 440000, '30-40': 440000, '>40': 440000 },
      '심화검사': { '<5': 490000, '5-10': 510000, '10-15': 530000, '15-20': 530000, '20-30': 530000, '30-40': 530000, '>40': 530000 },
    },
    cat: {
      '기본검사': { '<5': 190000, '5-10': 210000, '10-15': 230000 },
      '일반검사': { '<5': 290000, '5-10': 310000, '10-15': 330000 },
      '종합검사': { '<5': 390000, '5-10': 410000, '10-15': 430000 },
      '심화검사': { '<5': 490000, '5-10': 510000, '10-15': 530000 },
    }
  },
  scalingPackage: {
      dog: { '<5': 399000, '5-10': 449000, '10-15': 499000, '15-20': 549000, '20-30': 599000, '30-40': 649000, '>40': 699000 },
      cat: { '<5': 399000, '5-10': 449000, '10-15': 499000 },
  },
  anesthesiaPackage: {
      dog: { '<5': 360000, '5-10': 410000, '10-15': 460000, '15-20': 510000, '20-30': 560000, '30-40': 610000, '>40': 660000 },
      cat: { '<5': 360000, '5-10': 410000, '10-15': 460000 },
  },
  additionalAnesthesiaDrugs: {
    'bradycardia': { name: '서맥 대응 약물', priceByWeight: { '<5': 11000, '5-10': 12000, '10-15': 13000, '15-20': 14000, '20-30': 15000, '30-40': 16000, '>40': 17000 } },
    'hypotension': { name: '저혈압 대응 약물', priceByWeight: { '<5': 33000, '5-10': 34000, '10-15': 35000, '15-20': 36000, '20-30': 38000, '30-40': 39000, '>40': 40000 } },
    'cpa': { name: '심정지 대응 약물', priceByWeight: { '<5': 110000, '5-10': 120000, '10-15': 130000, '15-20': 140000, '20-30': 150000, '30-40': 160000, '>40': 170000 } },
    'liver_recovery': { name: '간기능 회복제', priceByWeight: { '<5': 11000, '5-10': 12000, '10-15': 13000, '15-20': 14000, '20-30': 15000, '30-40': 16000, '>40': 17000 } }
  },
  anesthesiaChange: {
    common: { '<5': 33000, '5-10': 35000, '10-15': 37000, '15-20': 38000, '20-30': 40000, '30-40': 43000, '>40': 47000 },
  },
  anesthesiaExtension: {
    common: { '<5': 66000, '5-10': 70000, '10-15': 73000, '15-20': 76000, '20-30': 80000, '30-40': 99000, '>40': 110000 },
  },
  localAnesthesia: {
    common: {
      '<5':    { '1': 10000, '2': 15000, '3': 18000, '4': 20000 },
      '5-10':   { '1': 11000, '2': 16000, '3': 19000, '4': 21000 },
      '10-15':  { '1': 12000, '2': 17000, '3': 20000, '4': 22000 },
      '15-20':  { '1': 13000, '2': 18000, '3': 21000, '4': 23000 },
      '20-30':  { '1': 14000, '2': 19000, '3': 22000, '4': 24000 },
      '30-40':  { '1': 15000, '2': 23000, '3': 28000, '4': 30000 },
      '>40':    { '1': 16000, '2': 25000, '3': 30000, '4': 32000 },
    },
  },
  narcoticInjection: {
    common: { '<5': 20000, '5-10': 21000, '10-15': 22000, '15-20': 23000, '20-30': 24000, '30-40': 30000, '>40': 32000 },
  },
  sustainedAnalgesia: {
    common: { '<5': 15000, '5-10': 16500, '10-15': 18000, '15-20': 19500, '20-30': 21000, '30-40': 22500, '>40': 24000 },
  },
  painControlPump: {
    common: { '<5': 40000, '5-10': 42000, '10-15': 44000, '15-20': 46000, '20-30': 48000, '30-40': 60000, '>40': 64000 },
  },
  narcoticPatch: {
    '5ug': 40000,
    '10ug': 50000,
    '20ug': 60000,
  },
  antibioticInjection: {
    common: { '<5': 11000, '5-10': 12000, '10-15': 13000, '15-20': 14000, '20-30': 15000, '30-40': 17000, '>40': 18000 },
  },
  longActingInjection: {
    common: { '<5': 15000, '5-10': 16000, '10-15': 17000, '15-20': 18000, '20-30': 19000, '30-40': 22000, '>40': 24000 },
  },
  laserTherapy: {
    common: {
        local: { '<5': 20000, '5-10': 21000, '10-15': 22000, '15-20': 23000, '20-30': 24000, '30-40': 30000, '>40': 32000 },
        full: { '<5': 25000, '5-10': 26250, '10-15': 27500, '15-20': 28750, '20-30': 30000, '30-40': 37500, '>40': 40000 },
    }
  },
  fluoride: {
    common: { '<5': 35000, '5-10': 36000, '10-15': 39000, '15-20': 40000, '20-30': 42000, '30-40': 45000, '>40': 48000 },
  },
  oralMeds: {
    common: { '<5': 3300, '5-10': 3500, '10-15': 3800, '15-20': 4000, '20-30': 4500, '30-40': 5000, '>40': 5500 },
  },
  capsule: {
    '3d': 3000,
    '7d': 5500,
  },
  liquidAnalgesicRate: 8000, // per ml
  hexidineSpray: { '헥시딘 스프레이': 10000 },
  oralOintment: { '구강 항생연고': 15000 },
  oralCoatingSpray: { '구강점막 보호제': 33000 },
  parodonGel: { '파로돈 겔': 25000 },
  oralProbiotics: { '구강 유산균': 50000 },
  neckCollar: { '8cm': 8000, '10cm': 10000, '13cm': 12000, '15cm': 15000, '17cm': 17000, '20cm': 20000, '25cm': 25000, '35cm': 30000 },
};

export const packagesConfig = (patient: Patient) => {
    const { species, weight } = patient;
    if (!species || !weight || weight <= 0) return null;
    const speciesKey = species === '개' ? 'dog' : 'cat';
    const weightCat = getWeightCategory(weight, species);

    const categories: PackageCategory[] = [
        { id: 'scalingPackages', name: '스케일링 & 마취', description: '스케일링 및 마취 관련 패키지' },
        { id: 'checkupPackages', name: '건강검진', description: '건강검진 패키지를 선택합니다.' },
    ];

    const itemsByCategoryId = {
        scalingPackages: [
            { id: 'scaling_package', name: '스케일링 패키지', category: 'scaling' as const, options: [{ key: 'full_scaling', label: '스케일링 패키지', price: (prices.scalingPackage[speciesKey] as any)[weightCat] || 0 }] },
            { id: 'anesthesia_package', name: '스케일링 제외 패키지', category: 'scaling' as const, options: [{ key: 'anesthesia_only', label: '치과 수술 마취', price: (prices.anesthesiaPackage[speciesKey] as any)[weightCat] || 0 }] },
        ],
        checkupPackages: [
            {
                id: 'health_checkup', name: '건강검진 패키지', category: 'checkup' as const,
                options: Object.entries(prices.healthCheckup[speciesKey]).map(([tier, priceMap]) => ({
                    key: tier,
                    label: tier,
                    price: (priceMap as any)[weightCat] || 0,
                }))
            },
        ]
    };
    return { categories, itemsByCategoryId };
}

// Exported Treatment Definitions
export const additionalTreatmentsConfig = (patient: Patient) => {
  const { species, weight } = patient;
  if (!species || !weight || weight <= 0) return {};
  const weightCat = getWeightCategory(weight, species);

  const categories: TreatmentCategory[] = [
    { id: 'additionalAnesthesiaDrugs', name: '마취중 대응 약물', description: '마취 중 발생할 수 있는 상황에 대비한 약물입니다.' },
    { id: 'anesthesia', name: '마취', description: '마취 관련 추가 처치 항목입니다.' },
    { id: 'pain', name: '통증 관리', description: '수술 중 및 수술 후 통증 관리를 위한 항목입니다.' },
    { id: 'recovery', name: '회복 촉진', description: '빠른 회복을 돕는 주사, 레이저, 불소 도포 등입니다.' },
    { id: 'homeCare', name: '홈케어', description: '퇴원 후 가정에서 필요한 약물 및 용품입니다.' },
  ];
  
  const additionalAnesthesiaDrugOptions = () => {
    return Object.entries(prices.additionalAnesthesiaDrugs).map(([key, value]) => ({
      key: key,
      label: value.name,
      price: (value.priceByWeight as any)[weightCat] || 0,
    }));
  };
  
  const itemsByCategoryId = {
    additionalAnesthesiaDrugs: [
      { id: 'additional_anesthesia_drug', name: '추가 약물', options: additionalAnesthesiaDrugOptions(), isMultiSelect: true },
    ],
    anesthesia: [
      { id: 'anesthesia_change', name: '도입마취 변경: 알팍산', options: [{ key: weightCat, label: ``, price: (prices.anesthesiaChange.common as any)?.[weightCat] || 0 }] },
      {
        id: 'anesthesia_extension',
        name: '마취 연장',
        options: [1, 2, 3, 4, 5, 6, 7, 8].map(i => {
            const minutes = i * 30;
            const pricePer30min = (prices.anesthesiaExtension.common as any)?.[weightCat] || 0;
            return {
                key: `${minutes}min`,
                label: `${minutes}분`,
                price: pricePer30min * i,
            }
        })
      },
       {
        id: 'local_anesthesia',
        name: '국소마취',
        options: Object.entries((prices.localAnesthesia.common as any)?.[weightCat] || {}).map(([sites, price]) => ({
            key: `${sites}_sites`,
            label: `${sites} site`,
            price: price as number,
        })),
      },
    ],
    pain: [
      { id: 'narcotic_injection', name: '마약성 진통 혈관주사', options: [{ key: weightCat, label: ``, price: (prices.narcoticInjection.common as any)?.[weightCat] || 0 }] },
      { id: 'sustained_analgesia', name: '24시간 지속 진통 주사', options: [{ key: weightCat, label: ``, price: (prices.sustainedAnalgesia.common as any)?.[weightCat] || 0 }] },
      { id: 'pain_control_pump', name: '무통주사 (시린지펌프)', options: [{ key: weightCat, label: ``, price: (prices.painControlPump.common as any)?.[weightCat] || 0 }] },
      { id: 'narcotic_patch', name: '마약성 진통패취', options: generateOptions(prices.narcoticPatch, '노스판') },
    ],
    recovery: [
       { id: 'antibiotic_injection', name: '항생/소염 주사 (일반)', options: [{ key: weightCat, label: `일반`, price: (prices.antibioticInjection.common as any)?.[weightCat] || 0 }] },
      { id: 'long_acting_injection', name: '1주 지속 항생/소염 주사', options: [{ key: weightCat, label: ``, price: (prices.longActingInjection.common as any)?.[weightCat] || 0 }] },
       {
        id: 'laser_therapy',
        name: '레이저 치료',
        options: Object.entries(prices.laserTherapy.common).map(([type, priceMap]) => ({
            key: type,
            label: type === 'local' ? '국소' : '구강 전체',
            price: (priceMap as any)[weightCat] || 0,
        })),
      },
      { id: 'fluoride', name: '불소 도포', options: [{ key: weightCat, label: ``, price: (prices.fluoride.common as any)?.[weightCat] || 0 }] },
    ],
    homeCare: [
      {
        id: 'oral_meds',
        name: '내복약',
        options: Array.from({ length: 7 }, (_, i) => i + 1).map(days => ({
            key: `${days}d`,
            label: `${days}일`,
            price: ((prices.oralMeds.common as any)?.[weightCat] || 0) * days
        })),
      },
      {
        id: 'capsule',
        name: '캡슐 조제',
        options: [
            { key: '3d', label: '3일', price: prices.capsule['3d'] },
            { key: '7d', label: '7일(1주)', price: prices.capsule['7d'] },
        ]
      },
      {
        id: 'liquid_analgesic',
        name: '액상 진통제(NSAID)',
        options: Array.from({ length: 7 }, (_, i) => i + 1).map(days => {
            const firstDayMl = weight * 0.2;
            const otherDaysMl = (days > 1) ? (days - 1) * weight * 0.1 : 0;
            const totalMl = Math.ceil((firstDayMl + otherDaysMl) * 10) / 10; // 소수점 한자리 올림
            const price = Math.ceil(totalMl * prices.liquidAnalgesicRate / 100) * 100; // 백원단위 올림
            return {
                key: `${days}d`,
                label: `${days}일 (${totalMl.toFixed(1)}ml)`,
                price,
            };
        }),
      },
      { id: 'hexidine_spray', name: '헥시딘 스프레이', options: generateOptions(prices.hexidineSpray), isMultiSelect: true },
      { id: 'oral_ointment', name: '구강 항생연고', options: generateOptions(prices.oralOintment), isMultiSelect: true },
      { id: 'oral_coating_spray', name: '구강점막 보호제', options: generateOptions(prices.oralCoatingSpray), isMultiSelect: true },
      { id: 'parodon_gel', name: '파로돈 겔', options: generateOptions(prices.parodonGel), isMultiSelect: true },
      { id: 'oral_probiotics', name: '구강 유산균', options: generateOptions(prices.oralProbiotics), isMultiSelect: true },
      { id: 'neck_collar', name: '넥카라', options: generateOptions(prices.neckCollar) },
    ],
  };

  return {
    categories,
    itemsByCategoryId
  }
};

export const toothGroups = {
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
            premolars: ['506', '507', '508', '606', '607', '608', '707', '708', '807', '808'], // 706, 806 in dogs are not in cats
        }
    }
};

export const quadrants = {
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

const groupLabels: { [key: string]: string } = {
    incisors: '앞니',
    canines: '송곳니',
    premolars: '소구치',
    molars: '어금니',
};

export const getToothDescription = (toothId: string, species: Species) => {
    if (!species || species === '기타') return toothId;

    let location = '';
    if (quadrants.permanent.upperRight.includes(toothId)) location = '상악 우측';
    else if (quadrants.permanent.upperLeft.includes(toothId)) location = '상악 좌측';
    else if (quadrants.permanent.lowerLeft.includes(toothId)) location = '하악 좌측';
    else if (quadrants.permanent.lowerRight.includes(toothId)) location = '하악 우측';

    const speciesToothGroups = species === '개' ? toothGroups.permanent.dog : toothGroups.permanent.cat;
    let type = '';
    for (const groupName in speciesToothGroups) {
        if ((speciesToothGroups as any)[groupName].includes(toothId)) {
            type = groupLabels[groupName];
            break;
        }
    }
    return `${toothId}(${location} ${type})`;
}

export const toothRootMap = {
  dog: {
    '1': ['101','102','103','105', '201','202','203','205', '301','302','303','305','401','402','403','405','311', '411', '501', '502', '503', '505', '601', '602', '603', '605', '701', '702', '703', '705', '801', '802', '803', '805'],
    '2': ['106', '107', '110', '206', '207', '210', '306','307','308','310', '406','407','408','410', '506', '507', '606', '607', '706', '707', '708', '806', '807', '808'],
    '3': ['108', '109', '208', '209', '309', '409', '508', '608'],
    'incisor': [...toothGroups.permanent.dog.incisors, ...toothGroups.deciduous.dog.incisors],
    'molar': toothGroups.permanent.dog.molars,
    'premolar': [...toothGroups.permanent.dog.premolars, ...toothGroups.deciduous.dog.premolars],
    'carnassial_upper': ['108', '208'], // P4
    'carnassial_lower': ['309', '409'], // M1
    'canine': [...toothGroups.permanent.dog.canines, ...toothGroups.deciduous.dog.canines],
    'upper_jaw': [...quadrants.permanent.upperRight, ...quadrants.permanent.upperLeft, ...quadrants.deciduous.upperRight, ...quadrants.deciduous.upperLeft],
    'lower_jaw': [...quadrants.permanent.lowerRight, ...quadrants.permanent.lowerLeft, ...quadrants.deciduous.lowerRight, ...quadrants.deciduous.lowerLeft],
  },
  cat: {
    '1': ['101','102','103','106', '109', '201','202','203','206', '209', '301','302','303', '309', '401','402','403', '409', '307', '407', '501', '502', '503', '601', '602', '603', '701', '702', '703', '801', '802', '803'],
    '2': ['107', '207', '308', '408', '506', '507', '606', '607', '707', '708', '807', '808'],
    '3': ['108', '208', '508', '608'],
    'incisor': [...toothGroups.permanent.cat.incisors, ...toothGroups.deciduous.cat.incisors],
    'molar': toothGroups.permanent.cat.molars,
    'premolar': [...toothGroups.permanent.cat.premolars, ...toothGroups.deciduous.cat.premolars],
    'carnassial_upper': ['108', '208'], //P4
    'canine': [...toothGroups.permanent.cat.canines, ...toothGroups.deciduous.cat.canines],
    'upper_jaw': [...quadrants.permanent.upperRight, ...quadrants.permanent.upperLeft, ...quadrants.deciduous.upperRight, ...quadrants.deciduous.upperLeft],
    'lower_jaw': [...quadrants.permanent.lowerRight, ...quadrants.permanent.lowerLeft, ...quadrants.deciduous.lowerRight, ...quadrants.deciduous.lowerLeft],
  }
};

const procedureDefinitions = [
  // 발치 (Extraction) - 10
  { id: 'ext_surg_1', name: '단근치 수술적 발치', category: 'extraction', rootCount: 1, isCanine: false },
  { id: 'ext_norm_1', name: '단근치 일반 발치', category: 'extraction', rootCount: 1, isCanine: false },
  { id: 'ext_surg_2', name: '2근치 수술적 발치', category: 'extraction', rootCount: 2 },
  { id: 'ext_norm_2', name: '2근치 일반 발치', category: 'extraction', rootCount: 2 },
  { id: 'ext_surg_3', name: '3근치 수술적 발치', category: 'extraction', rootCount: 3 },
  { id: 'ext_norm_3', name: '3근치 일반 발치', category: 'extraction', rootCount: 3 },
  { id: 'ext_surg_canine_lower', name: '송곳니 수술적 발치(하악)', category: 'extraction', isCanine: true, jaw: 'lower' },
  { id: 'ext_norm_canine_lower_suture', name: '송곳니 일반 발치(하악)-봉합', category: 'extraction', isCanine: true, jaw: 'lower' },
  { id: 'ext_surg_canine_upper', name: '송곳니 수술적 발치(상악)', category: 'extraction', isCanine: true, jaw: 'upper' },
  { id: 'ext_norm_canine_upper_suture', name: '송곳니 일반 발치(상악)-봉합', category: 'extraction', isCanine: true, jaw: 'upper' },
  
  // 치아흡수병변 발치 (FORL Extraction) - 4
  { id: 'forl_crown_1', name: '뿌리 1개 치관절제술', category: 'forl_extraction', rootCount: 1, isCanine: false },
  { id: 'forl_root_1', name: '뿌리 1개 흡수 치근 제거', category: 'forl_extraction', rootCount: 1, isCanine: false },
  { id: 'forl_crown_2', name: '뿌리 2개 치관절제술', category: 'forl_extraction', rootCount: 2, isCanine: false },
  { id: 'forl_root_2', name: '뿌리 2개 흡수 치근 제거', category: 'forl_extraction', rootCount: 2, isCanine: false },

  // 유치 발치 (Deciduous Extraction) - 8
  { id: 'dec_ext_gingival', name: '치은 위 유치', category: 'deciduous_extraction' },
  { id: 'dec_ext_canine_no_xray', name: '유치 송곳니(X-ray 없이)', category: 'deciduous_extraction', isCanine: true },
  { id: 'dec_ext_canine_xray', name: '유치 송곳니(X-ray 포함)', category: 'deciduous_extraction', isCanine: true },
  { id: 'dec_ext_canine_surg', name: '유치 송곳니(수술 발치)', category: 'deciduous_extraction', isCanine: true },
  { id: 'pdt_ext_surg_1', name: '단근치 수술적 발치 (유치)', category: 'deciduous_extraction', rootCount: 1, isCanine: false },
  { id: 'pdt_ext_norm_1', name: '단근치 일반 발치 (유치)', category: 'deciduous_extraction', rootCount: 1, isCanine: false },
  { id: 'pdt_ext_surg_2', name: '2근치 수술적 발치 (유치)', category: 'deciduous_extraction', rootCount: 2 },
  { id: 'pdt_ext_norm_2', name: '2근치 일반 발치 (유치)', category: 'deciduous_extraction', rootCount: 2 },
  { id: 'pdt_ext_surg_3', name: '3근치 수술적 발치 (유치)', category: 'deciduous_extraction', rootCount: 3 },
  { id: 'pdt_ext_norm_3', name: '3근치 일반 발치 (유치)', category: 'deciduous_extraction', rootCount: 3 },

  // 신경/보존 치료 (Nerve Treatment) - 9
  { id: 'vpt_canine', name: 'VPT (송곳니)', category: 'nerve_treatment', isCanine: true },
  { id: 'vpt_single_root', name: 'VPT (1홀-송곳니 제외)', category: 'nerve_treatment' },
  { id: 'vpt_double_root', name: 'VPT (2홀)', category: 'nerve_treatment', rootCount: 2 },
  { id: 'vpt_triple_root', name: 'VPT (3홀)', category: 'nerve_treatment', rootCount: 3 },
  { id: 'endo_incisor', name: '신경치료 (앞이빨)', category: 'nerve_treatment', rootCount: 1, toothType: 'incisor' },
  { id: 'endo_double_root', name: '신경치료 (뿌리 2개 치아)', category: 'nerve_treatment', rootCount: 2 },
  { id: 'endo_canine', name: '신경치료 (송곳니)', category: 'nerve_treatment', isCanine: true, rootCount: 1 },
  { id: 'endo_molar', name: '신경치료 (대구치)', category: 'nerve_treatment', isMolar: true },
  { id: 'endo_carnassial', name: '신경치료 (열육치)', category: 'nerve_treatment', toothType: 'carnassial' },
  
  // 레진 치료 (Resin Treatment) - 5
  { id: 'resin_small', name: '레진 (3mm 이하)', category: 'resin_treatment' },
  { id: 'resin_normal', name: '레진 (송곳니, 어금니 제외 3mm 이상)', category: 'resin_treatment' },
  { id: 'resin_canine', name: '레진 (송곳니)', category: 'resin_treatment', isCanine: true },
  { id: 'resin_molar', name: '레진 (어금니)', category: 'resin_treatment', isMolar: true },
  { id: 'resin_etching_bonding', name: '에칭&본딩 시술', category: 'resin_treatment' },

  // 기타 수술 (Other Surgery) - 4
  { id: 'crown_reduction', name: '치아 단축술(Crown Reduction)', category: 'other_surgery' },
  { id: 'gingival_tumor_small', name: '잇몸 종양 (1cm 이하)', category: 'other_surgery' },
  { id: 'gingival_tumor_large', name: '잇몸 종양 (1cm 이상)', category: 'other_surgery' },
  { id: 'dentigerous_cyst', name: '함치성 치낭 제거술', category: 'other_surgery' },
  
  // 교정 치료 (Orthodontics) - 1
  { id: 'ortho_canine_resin', name: '송곳니 레진 교정', category: 'orthodontics', isCanine: true },

  // 검사 (Diagnostics) - 2
  { id: 'biopsy', name: '조직검사 (1 site)', category: 'diagnostics' },
  { id: 'antibiotic_sensitivity', name: '항생제 감수성 검사 (1 site)', category: 'diagnostics' },
  
  // 치주 치료 (Periodontal Treatment) - 9
  { id: 'root_planing', name: '치근활택술', category: 'periodontal_treatment' },
  { id: 'open_root_planing', name: '개방 치근활택술(봉합)', category: 'periodontal_treatment' },
  { id: 'minocycline', name: '미노클린', category: 'periodontal_treatment' },
  { id: 'emdogain', name: '엠도게인', category: 'periodontal_treatment' },
  { id: 'gbr_membrane', name: '차폐막', category: 'periodontal_treatment' },
  { id: 'bone_graft', name: '인공뼈 이식', category: 'periodontal_treatment' },
  { id: 'i_and_d', name: 'I&D', category: 'periodontal_treatment' },
  { id: 'gingivoplasty', name: '잇몸 성형', category: 'periodontal_treatment' },
  { id: 'gingival_suture', name: '잇몸봉합', category: 'periodontal_treatment' },

  // 모니터링
  { id: 'monitoring', name: '모니터링', category: 'extraction' },
];

const procedurePrices: { [id: string]: number[] } = {
  ext_surg_1: [44000, 46000, 48000, 50000, 52000, 54000, 56000],
  ext_norm_1: [22000, 24000, 26000, 28000, 30000, 32000, 34000],
  ext_surg_2: [120000, 125000, 130000, 135000, 140000, 145000, 150000],
  ext_norm_2: [66000, 68000, 70000, 75000, 80000, 85000, 90000],
  ext_surg_3: [250000, 270000, 290000, 310000, 350000, 375000, 400000],
  ext_norm_3: [88000, 99000, 110000, 130000, 140000, 150000, 160000],
  ext_surg_canine_lower: [300000, 350000, 380000, 390000, 400000, 410000, 450000],
  ext_norm_canine_lower_suture: [200000, 210000, 220000, 260000, 280000, 300000, 320000],
  ext_surg_canine_upper: [250000, 270000, 290000, 320000, 350000, 375000, 400000],
  ext_norm_canine_upper_suture: [200000, 210000, 220000, 260000, 280000, 300000, 320000],
  forl_crown_1: [44000, 46000, 48000, 50000, 52000, 54000, 56000],
  forl_root_1: [88000, 92400, 96800, 114400, 123200, 132000, 140800],
  forl_crown_2: [88000, 99000, 110000, 130000, 140000, 150000, 160000],
  forl_root_2: [150000, 157500, 165000, 195000, 210000, 225000, 240000],
  dec_ext_gingival: [22000, 24000, 26000, 28000, 30000, 32000, 34000],
  dec_ext_canine_no_xray: [33000, 35000, 37000, 40000, 43000, 46000, 49000],
  dec_ext_canine_xray: [44000, 47000, 49000, 51000, 55000, 57000, 59000],
  dec_ext_canine_surg: [88000, 99000, 110000, 130000, 140000, 150000, 160000],
  pdt_ext_surg_1: [44000, 46000, 48000, 50000, 52000, 54000, 56000],
  pdt_ext_norm_1: [22000, 24000, 26000, 28000, 30000, 32000, 34000],
  pdt_ext_surg_2: [120000, 125000, 130000, 135000, 140000, 145000, 150000],
  pdt_ext_norm_2: [66000, 68000, 70000, 75000, 80000, 85000, 90000],
  pdt_ext_surg_3: [250000, 270000, 290000, 310000, 350000, 375000, 400000],
  pdt_ext_norm_3: [88000, 99000, 110000, 130000, 140000, 150000, 160000],
  vpt_canine: [450000, 450000, 450000, 450000, 450000, 450000, 450000],
  vpt_single_root: [250000, 250000, 250000, 250000, 250000, 250000, 250000],
  vpt_double_root: [660000, 660000, 660000, 660000, 660000, 660000, 660000],
  vpt_triple_root: [770000, 770000, 770000, 770000, 770000, 770000, 770000],
  endo_incisor: [450000, 450000, 450000, 450000, 450000, 450000, 450000],
  endo_double_root: [660000, 660000, 660000, 660000, 660000, 660000, 660000],
  endo_canine: [770000, 770000, 770000, 770000, 770000, 770000, 770000],
  endo_molar: [880000, 880000, 880000, 880000, 880000, 880000, 880000],
  endo_carnassial: [880000, 880000, 880000, 880000, 880000, 880000, 880000],
  resin_small: [55000, 55000, 55000, 55000, 55000, 55000, 55000],
  resin_normal: [77000, 77000, 77000, 77000, 77000, 77000, 77000],
  resin_canine: [110000, 110000, 110000, 110000, 110000, 110000, 110000],
  resin_molar: [130000, 130000, 130000, 130000, 130000, 130000, 130000],
  resin_etching_bonding: [33000, 33000, 33000, 33000, 33000, 33000, 33000],
  crown_reduction: [110000, 115500, 121000, 143000, 154000, 165000, 176000],
  gingival_tumor_small: [110000, 115500, 121000, 143000, 154000, 165000, 176000],
  gingival_tumor_large: [220000, 231000, 242000, 286000, 308000, 330000, 352000],
  dentigerous_cyst: [220000, 231000, 242000, 286000, 308000, 330000, 352000],
  ortho_canine_resin: [660000, 660000, 660000, 660000, 660000, 660000, 660000],
  biopsy: [170000, 170000, 170000, 170000, 170000, 170000, 170000],
  antibiotic_sensitivity: [143000, 143000, 143000, 143000, 143000, 143000, 143000],
  root_planing: [45000, 45000, 45000, 45000, 45000, 45000, 45000],
  open_root_planing: [220000, 220000, 220000, 220000, 220000, 220000, 220000],
  minocycline: [22000, 24000, 26000, 28000, 30000, 32000, 34000],
  emdogain: [99000, 110000, 130000, 150000, 170000, 180000, 190000],
  gbr_membrane: [100000, 110000, 130000, 150000, 170000, 180000, 190000],
  bone_graft: [200000, 210000, 220000, 260000, 280000, 300000, 320000],
  i_and_d: [33000, 35000, 37000, 39000, 41000, 43000, 45000],
  gingivoplasty: [50000, 55000, 60000, 65000, 70000, 75000, 80000],
  gingival_suture: [33000, 40000, 45000, 50000, 55000, 60000, 65000],
  monitoring: [0, 0, 0, 0, 0, 0, 0],
};


type ProcedureCategoryKey = 'extraction' | 'deciduous_extraction' | 'forl_extraction' | 'other_surgery' | 'nerve_treatment' | 'resin_treatment' | 'orthodontics' | 'periodontal_treatment' | 'diagnostics';

export const procedureCategories: { id: ProcedureCategoryKey; name: string }[] = [
    { id: 'extraction', name: '🦷 발치' },
    { id: 'forl_extraction', name: '💔 치아흡수병변 발치' },
    { id: 'deciduous_extraction', name: '🍼 유치 발치' },
    { id: 'nerve_treatment', name: '❤️‍🩹 신경/보존 치료' },
    { id: 'resin_treatment', name: '💎 레진 치료' },
    { id: 'periodontal_treatment', name: '✨ 치주 치료' },
    { id: 'other_surgery', name: '⚡ 기타 수술/검사' },
    { id: 'orthodontics', name: '📐 교정 치료' },
    { id: 'diagnostics', name: '🔬 검사' },
];


export const getProcedureCosts = (species: Species, weight: number): Record<ProcedureCategoryKey, Procedure[]> => {
  if (!species || weight <= 0) return {} as Record<ProcedureCategoryKey, Procedure[]>;

  const weightCategoryIndex = {
    '<5': 0, '5-10': 1, '10-15': 2, '15-20': 3, '20-30': 4, '30-40': 5, '>40': 6
  };

  const weightCat = getWeightCategory(weight, species);
  const priceIndex = weightCategoryIndex[weightCat];
  
  const allProcedures = procedureDefinitions.map((proc) => {
    const pricesForProc = procedurePrices[proc.id] || [];
    const price = pricesForProc[priceIndex] ?? 0;
    
    return {
      ...proc,
      price: price, 
      available: pricesForProc.length > 0, 
    };
  });

  const categorizedProcedures = {} as Record<ProcedureCategoryKey, Procedure[]>;
  procedureCategories.forEach(cat => {
      categorizedProcedures[cat.id] = allProcedures.filter(proc => proc.category === cat.id && proc.available);
  });

  return categorizedProcedures;
}
    
    
