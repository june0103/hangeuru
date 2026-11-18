// 데이터 모델 (spec 7장). 화면과 데이터 계층이 같이 쓴다
import type { PLANS, SEEDS } from './rules';

export type PlanKey = keyof typeof PLANS;
export type SeedKey = keyof typeof SEEDS;

/** profiles 1행 */
export type Profile = {
  id: string;
  name: string;
  plan: PlanKey;
  seed: SeedKey;
  /** 가입한 날의 KST 날짜 YYYY-MM-DD */
  joinDate: string;
  /** 수확한 시각(ISO). 수확 전에는 null */
  harvestedAt: string | null;
};

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
