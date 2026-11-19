// extras.js 의 타입 선언
export type LevelKind = 'circle' | 'leaf2' | 'leaf3' | 'leaf4' | 'flower' | 'fruit' | 'star';
export interface Look { hue: string; deep: string; name: string }
export interface LevelLook {
  /** 레벨 1~6 */
  lv: number;
  days: number;
  kind: LevelKind;
  /** 다음 레벨까지의 진행 0~1 */
  progress: number;
  /** 가장 높은 레벨인지 */
  max: boolean;
  /** 레벨 색(몽타주 atomic 50)과 한 단계 짙은 색(40) */
  hue: string;
  deep: string;
  /** 모양 이름(원, 잎 두 장, …) */
  name: string;
  look: Look;
}

/** 단계 기준일(spec 2.6): 1, 5, 10, 15, 20 */
export const STEPS: number[];
export const LOOKS: Record<LevelKind, Look>;
export function levelOf(days: number): { days: number; lv: number; max: boolean; progress: number };
/** 0일 원, 1일 잎 두 장, 5일 잎 세 장, 10일 잎 네 장, 15일 꽃, 20일 과일, 수확하면 별 */
export function levelLook(days: number, harvested: boolean): LevelLook;
/** 도형의 반지름. a 는 위쪽에서 시계 방향으로 잰 각(라디안) */
export function shapeRadius(kind: LevelKind, a: number): number;
/** 도형의 SVG path. radius: 가장 먼 점까지의 거리 */
export function shapePath(kind: LevelKind, radius: number): string;
/** 레벨 표시 안쪽의 SVG 마크업(.l 겹 넷, .t 테두리, .p 진행 테두리, .n 숫자) */
export function levelBadgeSvg(look: LevelLook): string;
/** 진행 테두리(.p)에 줄 stroke-dasharray 값 */
export function dashOf(look: LevelLook): string;
/** 화면 낭독기용 이름 */
export function levelLabel(look: LevelLook): string;
/** 성장 막대의 채움(퍼센트 0~100) */
export function trackFill(days: number): number;
/** 성장 막대에서 다섯 단계 점의 자리(퍼센트) */
export function trackStops(): number[];
/** 잎이 흩날린다. x, y 는 화면(client) 좌표, n 은 잎 수 */
export function burst(x: number, y: number, n: number): void;
/** 글자가 떠올랐다 사라진다("+1일") */
export function floatChip(x: number, y: number, text: string): void;
/** 화면의 수확 카드 요소를 PNG 로 그려 내려받는다. dark: 지금 다크 테마인지 */
export function saveCard(card: HTMLElement, fileName: string, dark: boolean): HTMLCanvasElement;
