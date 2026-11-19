// 데이터 모델 (spec 7장). 화면과 데이터 계층이 같이 쓴다
import type { PLANS, SEEDS } from './rules';

export type PlanKey = keyof typeof PLANS;
export type SeedKey = keyof typeof SEEDS;

/** profiles 1행 */
export type Profile = {
  id: string;
  name: string;
  plan: PlanKey;
  /** 가입한 뒤 씨앗 고르기 화면에서 정한다. 그 전에는 null */
  seed: SeedKey | null;
  /** 가입한 날의 KST 날짜 YYYY-MM-DD */
  joinDate: string;
  /** 수확한 시각(ISO). 수확 전에는 null */
  harvestedAt: string | null;
};

/** 씨앗을 심은 구성원. 홈·캘린더·과수원은 이 상태에서만 들어온다 */
export type Member = Profile & { seed: SeedKey };

/** attendance 1행 */
export type Attendance = {
  userId: string;
  /** 출근한 날의 KST 날짜 YYYY-MM-DD */
  workDate: string;
  /** 운영자가 넣은 기록은 null일 수 있다 */
  checkInAt: string | null;
  checkOutAt: string | null;
};

/** 서버 액션의 반환값 (spec 8.1) */
export type ActionResult =
  | { ok: true; message?: string; harvestedAt?: string }
  | { ok: false; errors?: Record<string, string>; message?: string };
