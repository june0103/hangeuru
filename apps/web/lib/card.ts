// 수확 카드 이미지 (spec 4.7). 브라우저의 캔버스 2D로 그린다. 받는 사람 화면과 상관없이 같아 보이도록 색은 라이트 값으로 고정한다.
import { CARD } from './copy';
import { fruitShapes, type Shape } from './tree';
import type { CardModel } from './view';

const W = 360;
const H = 480;
const SCALE = 2;
const INK = '#171719';
const SUB = 'rgba(46,47,51,.88)';
const MUTE = 'rgba(55,56,60,.61)';
const FILL = '#F7F7F8';
const LINE = 'rgba(112,115,124,.22)';
const DOT = '#00BF40';
const font = (weight: number, size: number) =>
  `${weight} ${size}px "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;

function drawShapes(ctx: CanvasRenderingContext2D, list: Shape[], x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  for (const s of list) {
    const p = new Path2D(s.d);
    ctx.globalAlpha = s.o ?? 1;
    if (s.fill) { ctx.fillStyle = s.fill; ctx.fill(p); }
    if (s.stroke) { ctx.strokeStyle = s.stroke; ctx.lineWidth = s.sw ?? 1; ctx.lineCap = 'round'; ctx.stroke(p); }
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 카드 PNG를 그려 Blob과 data URL로 돌려준다 */
export async function drawHarvestCard(m: CardModel): Promise<{ blob: Blob; url: string }> {
  try { await document.fonts.ready; } catch { /* 글꼴을 못 기다려도 그린다 */ }
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const x = canvas.getContext('2d')!;
  x.scale(SCALE, SCALE);

  x.fillStyle = '#EAEBEC';
  x.fillRect(0, 0, W, H);
  x.fillStyle = '#FFFFFF';
  roundRect(x, 8, 8, W - 16, H - 16, 20);
  x.fill();

  x.textBaseline = 'alphabetic';
  x.fillStyle = INK; x.font = font(700, 15); x.textAlign = 'left'; x.fillText(CARD.brand, 24, 40);
  x.fillStyle = MUTE; x.font = font(500, 13); x.textAlign = 'right'; x.fillText(CARD.tag, W - 24, 40);

  x.fillStyle = FILL; x.beginPath(); x.arc(W / 2, 118, 54, 0, Math.PI * 2); x.fill();
  drawShapes(x, fruitShapes(m.seed, 30), W / 2, 126);

  x.textAlign = 'center';
  x.fillStyle = INK; x.font = font(700, 22); x.fillText(m.heading, W / 2, 214);
  x.fillStyle = SUB; x.font = font(400, 14); x.fillText(m.sub, W / 2, 238);

  x.textAlign = 'left';
  m.cells.forEach(([label, value], i) => {
    const px = 24 + (i % 2) * 162;
    const py = 258 + Math.floor(i / 2) * 66;
    x.fillStyle = FILL; roundRect(x, px, py, 150, 56, 12); x.fill();
    x.fillStyle = MUTE; x.font = font(500, 12); x.fillText(label, px + 14, py + 22);
    x.fillStyle = INK; x.font = font(600, 16); x.fillText(value, px + 14, py + 43);
  });

  x.fillStyle = MUTE; x.font = font(500, 12); x.fillText(m.dotsLabel, 24, 410);
  let dx = 28;
  let prev: string | null = null;
  for (const d of m.dots) {
    if (prev && d.week !== prev) dx += 6;
    prev = d.week;
    x.beginPath(); x.arc(dx, 428, 4, 0, Math.PI * 2);
    if (d.attended) { x.fillStyle = DOT; x.fill(); } else { x.strokeStyle = LINE; x.lineWidth = 1.5; x.stroke(); }
    dx += 10.4;
  }

  x.textAlign = 'center'; x.fillStyle = MUTE; x.font = font(400, 12); x.fillText(CARD.foot, W / 2, 460);

  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('toBlob'))), 'image/png'));
  return { blob, url: canvas.toDataURL('image/png') };
}
