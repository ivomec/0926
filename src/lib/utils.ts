
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/**
 * 애플리케이션 전체에서 사용될 공통 유틸리티 함수 및 타입 정의
 */

/**
 * 진료 및 수술과 관련된 예상 비용의 구조를 정의하는 타입입니다.
 * 각 항목은 선택적이며, 값이 없을 경우 0으로 처리됩니다.
 */
export interface EstimatedCosts {
  procedure?: number;  // 치과 수술 비용
  anesthesia?: number; // 스케일링 패키지 비용
  checkup?: number;    // 건강검진 비용
  additional?: number; // 추가 처치 비용
}

/**
 * EstimatedCosts 객체를 받아 모든 비용 항목의 총합을 계산합니다.
 * @param costs - EstimatedCosts 타입의 비용 객체
 * @returns 모든 비용의 합계 (number)
 */
export const calculateTotalCost = (costs: EstimatedCosts): number => {
  // costs 객체의 모든 값들을 배열로 만들고, 각 값이 유효하지 않으면 0으로 대체한 뒤 합산합니다.
  return Object.values(costs).reduce((sum, cost) => sum + (cost || 0), 0);
};

/**
 * 숫자 값을 대한민국 원화(KRW) 형식의 문자열로 변환합니다.
 * 예: 1234567 => "1,234,567 원"
 * @param amount - 포맷할 숫자 값
 * @returns 포맷된 원화 문자열
 */
export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('ko-KR')} 원`;
};
