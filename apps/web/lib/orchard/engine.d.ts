// engine.js 의 타입 선언. 구현은 보드의 디자인 레이어에서 그대로 옮긴 자바스크립트라 타입 검사를 하지 않는다
export type SeedKey = 'apple' | 'tangerine' | 'peach' | 'coffee';
/** 자라는 단계: 0 씨앗, 1 새싹, 2 묘목, 3 나무, 'bloom' 꽃 핀 나무, 4 열매가 달린 나무, 'harvested' 수확한 뒤(나무와 바구니) */
export type StageKind = 0 | 1 | 2 | 3 | 'bloom' | 4 | 'harvested';
/** 배경 꽃이 머무는 자리 */
export type OrchardLayout = 'splash' | 'auth' | 'seeds' | 'app';

/** 몽타주 atomic 색(4.3.2). 색 이름 → 단계 → 헥스 */
export const A: Record<string, Record<number, string>>;
export const FRUIT_COLOR: Record<SeedKey, string>;
/** 열매 이름(사과, 귤, 복숭아, 커피) → 씨앗 키 */
export const SEED_OF: Record<string, SeedKey>;
/** 20일에 맺히는 열매 수 */
export const FRUIT_BASE: number;
export function stageOf(days: number, harvested: boolean): StageKind;
/** 열매 수: FRUIT_BASE + (출근일 − 20), 20일 전에는 FRUIT_BASE */
export function fruitsOf(days: number): number;

/** 모든 뷰가 같이 가진 것. 화면에서 뺄 때 dispose() 를 부른다 */
export interface OrchardView {
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  /** 다음 프레임에 다시 그린다 */
  redraw(): void;
  /** 그리기 목록에서 빼고 캔버스(와 빛줄기 요소)를 지운다 */
  dispose(): void;
}

export interface FruitOptions {
  /** 올리면 반응할 요소(없으면 자리 자체) */
  hover?: Element | null;
  /** 참이면 고른 상태로 그린다 */
  selected?: () => boolean;
}
export type FruitView = OrchardView;
export interface ClusterView extends OrchardView { replay(): void }
export interface JourneyView extends OrchardView {
  /** 진행도 0~1: 과일 넷 → 씨앗 하나 → 흙에 내려앉음 */
  set(p: number): void;
  /** 시선(포인터). x, y 는 -1~1 */
  look(x: number, y: number): void;
  replay(): void;
}
export interface ShowcaseView extends OrchardView {
  /** 큰 과일을 바꾼다. dir: 1 이면 오른쪽에서, -1 이면 왼쪽에서 들어온다 */
  set(seed: SeedKey, dir?: number): void;
}
export interface PlantingView extends OrchardView {
  /** 심는 장면을 처음부터 */
  play(): void;
  bounce(): void;
  /** 새싹의 잎 모양을 고른 씨앗에 맞춘다 */
  setSeed(seed: SeedKey): void;
}
export interface GrowView extends OrchardView { replay(): void }

export interface StageOptions {
  /** false 면 움직일 때만 그린다(작은 나무 여러 그루) */
  live?: boolean;
  /** 좌우로 천천히 도는 폭(라디안). 기본 0.32 */
  sway?: number;
  scale?: number;
  strip?: boolean;
  /** 달려 있는 열매 수. 열매가 달린 나무(4)는 기본 5, 수확한 뒤('harvested')는 기본 0 */
  fruits?: number;
  /** 누르고 흔드는 손길을 받을 요소. 엔진이 여기에 __view(이 뷰)와 __dragged(끌어서 흔들었는지)를 적는다 */
  touch?: HTMLElement | null;
}
export interface StageView extends OrchardView {
  /** 톡 친다. dir: -1(왼쪽을 침) ~ 1(오른쪽을 침), power: 세기 */
  poke(dir?: number, power?: number): void;
  /** 잡고 흔든다. dx: 움직인 픽셀 */
  shake(dx: number): void;
  /** 잎을 n 장 떨군다 */
  shower(n: number): void;
  /** 한 번 통 튄다 */
  bounce(delay?: number): void;
  /** 열매가 맺히는 장면(열매가 달린 나무 4 에서만). n: 맺힐 열매 수, done: 끝나면 부른다 */
  ripen(n?: number, done?: () => void): void;
  /** 열매 하나 더. 달 자리가 없으면 false */
  addFruit(): boolean;
  fruitCount(): number;
  fruitMax(): number;
  /** 물뿌리개가 나와 물을 준다. done: 물러난 뒤 부른다 */
  water(done?: () => void): void;
  setSeed(): void;
}

export interface Orchard {
  /** 움직임 줄이기 설정이 켜져 있는지 */
  reduce: boolean;
  isDark(): boolean;
  /** 테마가 바뀌었을 때: 배경 색을 다시 맞추고 모든 뷰를 다시 그린다(html 의 data-theme 이 바뀌면 스스로도 부른다) */
  refreshTheme(): void;
  /** 화면 전체 배경(#orchard-bg)을 한 번 붙인다. 여러 번 불러도 하나만 생긴다 */
  mountBackground(): void;
  /** 배경 꽃이 머무는 자리를 바꾼다(화면이 바뀔 때) */
  setLayout(name: OrchardLayout): void;
  /** 배경 꽃의 색 계열. 씨앗 키 또는 'base' */
  setScheme(name: SeedKey | 'base'): void;
  /** 배경에 물결을 일으킨다. 좌표는 화면(client) 기준, 생략하면 화면 가운데 */
  ripple(clientX?: number, clientY?: number): void;
  fruit(el: HTMLElement, seed: SeedKey, opt?: FruitOptions): FruitView;
  cluster(el: HTMLElement): ClusterView;
  journey(el: HTMLElement): JourneyView;
  showcase(el: HTMLElement, first: SeedKey): ShowcaseView;
  planting(el: HTMLElement, seed: SeedKey): PlantingView;
  stage(el: HTMLElement, kind: StageKind, seed: SeedKey, opt?: StageOptions): StageView;
  grow(el: HTMLElement, seed: SeedKey): GrowView;
  /** 모든 뷰를 다시 그린다 */
  redraw(): void;
}

/** 엔진은 하나만 만든다. 두 번째부터는 같은 것을 돌려주고 options 는 무시한다. 브라우저에서만 부른다 */
export function createOrchard(options?: { layout?: OrchardLayout; scheme?: SeedKey | 'base' }): Orchard;
