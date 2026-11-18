import { describe, expect, it } from 'vitest';

import { fruitShapes, stemHeight, treeModel } from './tree';

const count = (days: number, harvested = false) => {
  const m = treeModel('apple', days, harvested);
  const by = (p: string) => m.parts.filter(x => x.key.startsWith(p)).length;
  return { leaves: by('leaf-'), blobs: by('blob-'), flowers: by('flower-'), fruit: !!m.fruit, basket: !!m.basket };
};

describe('fruitShapes (4.4)', () => {
  it('도형 수가 사과 4개, 귤 4개, 복숭아 5개, 커피 6개다', () => {
    expect(fruitShapes('apple', 18)).toHaveLength(4);
    expect(fruitShapes('tangerine', 18)).toHaveLength(4);
    expect(fruitShapes('peach', 18)).toHaveLength(5);
    expect(fruitShapes('coffee', 18)).toHaveLength(6);
  });
});

describe('나무 수치 (4.1)', () => {
  it.each([[0, 0], [1, 21.2], [5, 42], [10, 68], [15, 94], [20, 120]])('%i일의 줄기 높이는 %d', (n, h) => {
    expect(stemHeight(n)).toBeCloseTo(h, 5);
  });

  it('20일을 넘으면 모양이 더 변하지 않는다', () => {
    expect(treeModel('peach', 27, false)).toEqual(treeModel('peach', 20, false));
  });
});

describe('그리는 순서 (4.2)', () => {
  it('0일은 씨앗만 있다', () => {
    expect(count(0)).toEqual({ leaves: 0, blobs: 0, flowers: 0, fruit: false, basket: false });
    expect(treeModel('apple', 0, false).base.map(p => p.type)).toEqual(['ellipse', 'ellipse', 'path']);
  });

  it.each([1, 4, 5, 9])('%i일은 잎이 그 수만큼 있다', n => {
    expect(count(n)).toMatchObject({ leaves: n, blobs: 0 });
  });

  it('줄기는 5일 미만이면 짙은 잎색, 5일부터 줄기색이다', () => {
    const stem = (n: number) => treeModel('apple', n, false).base[1];
    expect(stem(4)).toMatchObject({ stroke: 'leafDark' });
    expect(stem(5)).toMatchObject({ stroke: 'trunk' });
  });

  it.each([[10, 3, 0], [14, 7, 0], [15, 8, 1], [19, 12, 5], [20, 13, 0]])('%i일은 잎 덩어리 %i개, 꽃 %i송이', (n, blobs, flowers) => {
    expect(count(n)).toMatchObject({ leaves: 0, blobs, flowers });
  });

  it('20일 이상이고 수확 전이면 열매가 (150, cy + 28)에 열린다', () => {
    const m = treeModel('apple', 20, false);
    expect(m.fruit).toMatchObject({ x: 150, y: +(m.cy + 28).toFixed(1), r: 18, ringR: 28, hitR: 32 });
    expect(m.basket).toBeNull();
  });

  it('수확 완료는 잎 덩어리 13개에 꽃과 열매 없이 바구니만 더한다', () => {
    expect(count(20, true)).toEqual({ leaves: 0, blobs: 13, flowers: 0, fruit: false, basket: true });
    expect(treeModel('apple', 20, true).basket).toMatchObject({ x: 172, y: 228 });
  });

  it('잎은 두 장씩 같은 높이에 마주 보고, 새 잎일수록 아래쪽에 난다 (n = 4)', () => {
    const leaves = treeModel('apple', 4, false).parts;
    const y = (i: number) => leaves.find(p => p.key === `leaf-${i}`)!.origin.y;
    expect(y(1)).toBe(y(2));
    expect(y(3)).toBe(y(4));
    expect(y(3)).toBeGreaterThan(y(1));
  });
});

describe('새로 생긴 요소 (4.6)', () => {
  const newest = (days: number, harvested = false) => {
    const m = treeModel('apple', days, harvested);
    return [...m.parts.filter(p => p.newest).map(p => p.key), ...(m.fruit ? ['fruit'] : [])];
  };

  it.each([
    [1, ['leaf-1']], [9, ['leaf-9']], [10, ['blob-2']], [14, ['blob-6']], [15, ['flower-0']], [19, ['flower-4']], [20, ['fruit']],
  ])('%i일에 튀어 오르는 것은 %j', (days, keys) => {
    expect(newest(days)).toEqual(keys);
  });
});
