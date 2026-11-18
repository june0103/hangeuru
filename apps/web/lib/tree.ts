// docs/spec.md 4장의 나무 좌표와 열매 도형. 그림 데이터만 만들고 그리는 일은 components/TreeFigure.tsx가 한다.
// 디자이너 시안이 오면 이 파일이 가장 먼저 바뀌므로 규칙 코드(lib/rules.ts)와 섞지 않는다.
import { FRUIT_DAYS, type SEEDS } from './rules';

export type Seed = keyof typeof SEEDS;

const n1 = (v: number) => +v.toFixed(1);

/* ---------- 4.4 열매 도형: 테마와 상관없는 고정색 ---------- */

const FC = { apple: '#FF4242', tangerine: '#FF9200', peach: '#FF9B61', coffee: '#E52222',
             leaf: '#00BF40', stalk: '#9C5800', crease: '#F55A00', white: '#FFFFFF' };
export const BLOSSOM: Record<Seed, string> = { apple: '#FED3F7', tangerine: '#FFFFFF', peach: '#FF94ED', coffee: '#FFFFFF' };
export const FLOWER_CENTER = '#FFC06E';

/** 열매 중심을 원점으로 한 path. fill이 있으면 채우고, stroke가 있으면 굵기 sw의 둥근 끝 선으로 그리고, o는 불투명도 */
export type Shape = { d: string; fill?: string; stroke?: string; sw?: number; o?: number };

// 원이나 타원을 path 문자열로
const circ = (cx: number, cy: number, rx: number, ry = rx) =>
  `M${n1(cx - rx)} ${n1(cy)}a${n1(rx)} ${n1(ry)} 0 1 0 ${n1(rx * 2)} 0a${n1(rx)} ${n1(ry)} 0 1 0 ${n1(-rx * 2)} 0Z`;

export function fruitShapes(seed: Seed, r: number): Shape[] {
  const hl = { d: circ(-r * .38, -r * .42, r * .24, r * .15), fill: FC.white, o: .32 };
  const stalk = { d: `M0 ${n1(-r * .8)}Q${n1(r * .05)} ${n1(-r * 1.15)} ${n1(r * .3)} ${n1(-r * 1.3)}`,
                  stroke: FC.stalk, sw: n1(Math.max(1.5, r * .12)) };
  const leaf = { d: `M${n1(r * .12)} ${n1(-r * 1.05)}Q${n1(r * .5)} ${n1(-r * 1.5)} ${n1(r * .95)} ${n1(-r * 1.15)}`
                  + `Q${n1(r * .55)} ${n1(-r * .8)} ${n1(r * .12)} ${n1(-r * 1.05)}Z`, fill: FC.leaf };
  if (seed === 'apple') return [stalk, leaf, { d: circ(0, 0, r), fill: FC.apple }, hl];
  if (seed === 'tangerine') return [leaf, { d: circ(0, 0, r, r * .9), fill: FC.tangerine },
                                    { d: circ(0, -r * .8, r * .15), fill: FC.leaf }, hl];
  if (seed === 'peach') return [stalk, leaf, { d: circ(0, 0, r), fill: FC.peach },
    { d: `M${n1(r * .05)} ${n1(-r * .92)}Q${n1(r * .5)} ${n1(-r * .1)} ${n1(r * .1)} ${n1(r * .92)}`,
      stroke: FC.crease, sw: n1(Math.max(1.2, r * .09)), o: .7 }, hl];
  const c = r * .54; // 커피 열매 3알
  return [stalk, leaf, { d: circ(-r * .5, -r * .05, c), fill: FC.coffee }, { d: circ(r * .5, -r * .05, c), fill: FC.coffee },
          { d: circ(0, r * .5, c), fill: FC.apple }, { d: circ(-r * .66, -r * .26, c * .3, c * .2), fill: FC.white, o: .32 }];
}

/* ---------- 4.6 쓰는 곳별 크기 ---------- */

export const VIEWBOX = { w: 240, h: 260 } as const;
export const SIZES = {
  home: 240,                                            // 홈 내 나무 폭(768px 이상)
  homeMobile: 220,
  mini: { w: 72, h: 78 },                               // 과수원 카드
  seedPicker: { r: 15, viewBox: '-20 -28 40 48', w: 36 }, // 씨앗 선택
  brand: { r: 9, viewBox: '-12 -15 24 26', w: 24, h: 26 }, // 브랜드 마크(사과)
} as const;

/* ---------- 4.1 ~ 4.3 나무 ---------- */

export const GX = 120;
export const GY = 232;

/**
 * 나무 색은 테마에 따라 바뀌므로 헥스 대신 역할 이름으로 넘기고, TreeFigure가 몽타주 토큰으로 바꾼다(4.5).
 * leaf: 잎색, leafDark: 짙은 잎색과 어린 줄기, trunk: 줄기색, soil: 흙색, seed: 씨앗색과 바구니
 * 헥스 문자열은 4.4의 고정색(꽃잎, 꽃 가운데)이다
 */
export type TreeColor = 'leaf' | 'leafDark' | 'trunk' | 'soil' | 'seed';
export type Paint = TreeColor | `#${string}`;

export type Primitive =
  | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rotate?: number; fill: Paint }
  | { type: 'circle'; cx: number; cy: number; r: number; fill: Paint }
  | { type: 'path'; d: string; fill?: Paint; stroke?: Paint; strokeWidth?: number };

/** 한 번에 튀어 오르는 단위. 잎 한 장, 잎 덩어리 하나, 꽃 한 송이 */
export type TreePart = {
  key: string;
  items: Primitive[];
  /** 모션의 기준점(그 요소의 중심, 4.6) */
  origin: { x: number; y: number };
  /** 오늘 출근으로 새로 생긴 요소인가. 출근 직후에만 이 요소를 튀어 오르게 한다 */
  newest: boolean;
};

export type TreeModel = {
  n: number;
  height: number;
  topY: number;
  cy: number;
  /** 흙, 씨앗, 줄기처럼 튀어 오르지 않는 바탕 */
  base: Primitive[];
  /** 그리는 순서대로 */
  parts: TreePart[];
  /** 20일 이상이고 수확 전일 때만. 중심과 열매 도형, 고리 r 28, 터치 영역 r 32 */
  fruit: { x: number; y: number; r: number; ringR: number; hitR: number; shapes: Shape[]; newest: boolean } | null;
  /** 수확한 뒤에만. 기준점에서 손잡이, 열매(fruitAt), 몸통 순서로 겹쳐 그린다 */
  basket: { x: number; y: number; handle: Primitive; fruitAt: { x: number; y: number }; fruitShapes: Shape[]; body: Primitive; newest: boolean } | null;
};

/** 4.2 잎 덩어리 [dx, dy, r]. cy 기준 */
export const BLOBS: readonly (readonly [number, number, number])[] = [
  [0, 0, 38], [-32, 9, 30], [32, 9, 30], [-18, -27, 30], [18, -27, 30], [-50, -9, 25], [50, -9, 25],
  [0, -48, 28], [-39, -41, 23], [39, -41, 23], [-14, 25, 25], [14, 25, 25], [0, -11, 34],
];
/** 4.2 꽃 [dx, dy]. cy 기준 */
export const FLOWERS: readonly (readonly [number, number])[] = [[-25, -7], [23, -21], [2, 16], [-9, -39], [44, -5]];

/** 4.1 줄기 높이 */
export const stemHeight = (n: number) => (n === 0 ? 0 : 16 + n * 5.2);

/**
 * 씨앗 종류, 총 출근 일수, 수확 여부만으로 나무 모양을 정한다(4.2).
 * 잎은 prototype.html의 treeSVG와 같이 새 잎(i = n)부터 그려서 오래된 잎이 위에 온다.
 */
export function treeModel(seed: Seed, days: number, harvested: boolean): TreeModel {
  const n = Math.min(days, FRUIT_DAYS);
  const height = stemHeight(n);
  const topY = n1(GY - height);
  const cy = n1(topY - 4);
  const base: Primitive[] = [{ type: 'ellipse', cx: GX, cy: GY + 4, rx: 72, ry: 12, fill: 'soil' }];
  const parts: TreePart[] = [];
  let fruit: TreeModel['fruit'] = null;

  if (n === 0) {
    base.push(
      { type: 'ellipse', cx: GX, cy: GY - 6, rx: 9, ry: 6.5, rotate: -20, fill: 'seed' },
      { type: 'path', d: `M${GX - 20} ${GY + 3}Q${GX} ${GY - 5} ${GX + 20} ${GY + 3}Z`, fill: 'soil' },
    );
  } else {
    base.push({ type: 'path', d: `M${GX} ${GY}V${topY}`, stroke: n < 5 ? 'leafDark' : 'trunk', strokeWidth: n1(3 + n * .55) });

    if (n < 10) {
      const rx = 10 + n * .6;
      const ry = rx / 2;
      for (let i = n; i >= 1; i--) {
        const side = i % 2 ? 1 : -1;
        const x = n1(GX + side * rx * .9);
        const y = n1(GY - height * (1 - Math.floor((i - 1) / 2) * .2) - 3);
        parts.push({
          key: `leaf-${i}`,
          items: [{ type: 'ellipse', cx: x, cy: y, rx: n1(rx), ry: n1(ry), rotate: -28 * side, fill: i % 3 ? 'leaf' : 'leafDark' }],
          origin: { x, y },
          newest: i === n,
        });
      }
    } else {
      const k = n - 7;
      BLOBS.slice(0, k).forEach(([dx, dy, r], i) => {
        const x = GX + dx;
        const y = n1(cy + dy);
        parts.push({
          key: `blob-${i}`,
          items: [{ type: 'circle', cx: x, cy: y, r, fill: i % 2 ? 'leafDark' : 'leaf' }],
          origin: { x, y },
          newest: i === k - 1 && n < 15,
        });
      });

      if (n >= 15 && n < FRUIT_DAYS) {
        FLOWERS.slice(0, n - 14).forEach(([dx, dy], i) => {
          const x = GX + dx;
          const y = n1(cy + dy);
          const items: Primitive[] = [];
          for (let p = 0; p < 5; p++) {
            const a = (p * 72 * Math.PI) / 180;
            items.push({ type: 'circle', cx: n1(x + Math.sin(a) * 4.2), cy: n1(y - Math.cos(a) * 4.2), r: 3.2, fill: BLOSSOM[seed] as Paint });
          }
          items.push({ type: 'circle', cx: x, cy: y, r: 2.2, fill: FLOWER_CENTER as Paint });
          parts.push({ key: `flower-${i}`, items, origin: { x, y }, newest: i === n - 15 });
        });
      }

      if (n >= FRUIT_DAYS && !harvested) {
        fruit = { x: GX + 30, y: n1(cy + 28), r: 18, ringR: 28, hitR: 32, shapes: fruitShapes(seed, 18), newest: true };
      }
    }
  }

  const basket: TreeModel['basket'] = harvested
    ? {
        x: GX + 52,
        y: GY - 4,
        handle: { type: 'path', d: 'M-13 -8Q0 -32 13 -8', stroke: 'trunk', strokeWidth: 2.5 },
        fruitAt: { x: 0, y: -11 },
        fruitShapes: fruitShapes(seed, 9),
        body: { type: 'path', d: 'M-17 -8H17L13 10H-13Z', fill: 'seed', stroke: 'trunk', strokeWidth: 1.5 },
        newest: true,
      }
    : null;

  return { n, height, topY, cy, base, parts, fruit, basket };
}
