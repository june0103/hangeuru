// @ts-nocheck
/* 과수원 화면 도우미. 보드의 디자인 레이어(orchard.js)에서 계산과 작은 연출만 그대로 옮겼다(스냅샷을 고쳐 쓰던 부분은 뺐다).
   레벨 표시의 모양과 색, 성장 막대의 채움, 잎이 흩날리는 연출, 떠오르는 글자, 수확 카드를 그림으로 저장하기 */
import { A } from './engine.js';

function reducedMotion() { return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

/* ---------- 레벨: 기준일과 모양 ---------- */
  export var STEPS = [1, 5, 10, 15, 20];   // 지금 규칙의 단계 기준일(spec 2.6)
  export function levelOf(days) {
    var lv = 1, from = 0, to = STEPS[0];
    for (var i = 0; i < STEPS.length; i++) if (days >= STEPS[i]) { lv = i + 2; from = STEPS[i]; to = STEPS[i + 1] || STEPS[i]; }
    return { days: days, lv: lv, max: lv === STEPS.length + 1, progress: to > from ? (days - from) / (to - from) : 1 };
  }
  /* 레벨 표시: 겹겹이 포갠 부드러운 도형. 레벨이 오르면 모양과 색이 바뀐다(레퍼런스: 감정 상태에 따라 도형과 색이 바뀌는 화면).
     모양은 원에서 크게 벗어나지 않는다: 원(씨앗) → 잎 두 장·세 장·네 장(새싹·묘목·나무) → 꽃 → 과일(열매) → 별(수확 완료)
     색은 몽타주 atomic 다섯 가지: 하늘(lightBlue) → 초록(green) → 분홍(pink) → 주홍(redOrange) → 보라(violet). 같은 색을 성장 막대에도 쓴다 */
  export var LOOKS = {
    circle: { hue: A.lightBlue[50], deep: A.lightBlue[40], name: '원' },
    leaf2:  { hue: A.green[50], deep: A.green[40], name: '잎 두 장' },
    leaf3:  { hue: A.green[50], deep: A.green[40], name: '잎 세 장' },
    leaf4:  { hue: A.green[50], deep: A.green[40], name: '잎 네 장' },
    flower: { hue: A.pink[50], deep: A.pink[40], name: '꽃' },
    fruit:  { hue: A.redOrange[50], deep: A.redOrange[40], name: '과일' },
    star:   { hue: A.violet[50], deep: A.violet[40], name: '별' }
  };
  export function levelLook(days, harvested) {
    var L = levelOf(days), kind = 'circle';
    if (harvested) kind = 'star';
    else if (L.days >= 20) kind = 'fruit';
    else if (L.days >= 15) kind = 'flower';
    else if (L.days >= 10) kind = 'leaf4';
    else if (L.days >= 5) kind = 'leaf3';
    else if (L.days >= 1) kind = 'leaf2';
    return { lv: L.lv, days: L.days, kind: kind, progress: kind === 'star' ? 1 : L.progress, max: L.max, hue: LOOKS[kind].hue, deep: LOOKS[kind].deep, name: LOOKS[kind].name, look: LOOKS[kind] };
  }
  // 도형의 반지름. a 는 위쪽에서 시계 방향으로 잰 각
  export function shapeRadius(kind, a) {
    var w = Math.atan2(Math.sin(a), Math.cos(a));
    if (kind === 'leaf2') return 0.92 - 0.13 * Math.cos(2 * a);
    if (kind === 'leaf3') return 0.92 + 0.11 * Math.cos(3 * a);
    if (kind === 'leaf4') return 0.93 - 0.1 * Math.cos(4 * a);
    if (kind === 'flower') return 0.8 + 0.24 * Math.pow(Math.abs(Math.cos(2.5 * a)), 0.55);
    if (kind === 'fruit') return 1 - 0.2 * Math.exp(-Math.pow(w / 0.36, 2)) - 0.07 * Math.exp(-Math.pow((Math.abs(w) - Math.PI) / 0.3, 2)) + 0.03 * Math.cos(a);
    if (kind === 'star') return 0.74 + 0.34 * Math.pow((1 + Math.cos(5 * a)) / 2, 1.5);
    return 1;
  }
  export function shapePath(kind, radius) {
    var n = 96, max = 0, i, pts = [];
    for (i = 0; i < n; i++) max = Math.max(max, shapeRadius(kind, i / n * Math.PI * 2));
    for (i = 0; i < n; i++) { var a = i / n * Math.PI * 2, r = shapeRadius(kind, a) / max * radius; pts.push((Math.sin(a) * r).toFixed(2) + ' ' + (-Math.cos(a) * r).toFixed(2)); }
    return 'M' + pts.join('L') + 'Z';
  }
  /* 레벨 표시 안쪽의 SVG. 겹겹이 포갠 도형 네 겹, 바깥 테두리(진행), 가운데 숫자.
     look 은 levelLook() 의 결과. 진행 테두리(.p)의 stroke-dasharray 는 '0 100' 으로 시작하니, 붙인 뒤 dashOf(look) 값으로 바꿔 채운다 */
  export function levelBadgeSvg(look) {
    var k = look.kind;
    var layers = [[26, 0.18], [21.5, 0.34], [17.5, 0.58], [13.8, 1]].map(function (c, i) {
      return '<path class="l" style="--i:' + i + '" d="' + shapePath(k, c[0]) + '" fill-opacity="' + c[1] + '"/>';
    }).join('');
    return '<svg viewBox="-32 -32 64 64" aria-hidden="true">' +
      '<path class="t" d="' + shapePath(k, 30) + '"/><path class="p" pathLength="100" stroke-dasharray="0 100" d="' + shapePath(k, 30) + '"' + (look.progress < 0.01 ? ' style="display:none"' : '') + '/>' + layers +
      '<text class="n" y="5.8">' + look.lv + '</text></svg>';
  }
  export function dashOf(look) { return (look.progress * 100).toFixed(1) + ' 100'; }
  export function levelLabel(look) {
    return '레벨 ' + look.lv + ', ' + look.name + ' 모양' + (look.max ? ', 가장 높은 레벨' : ', 다음 레벨까지 ' + Math.round(look.progress * 100) + '퍼센트');
  }

  /* 성장 막대의 채움(퍼센트): 다섯 단계를 같은 간격(0·25·50·75·100%)에 놓고, 단계 사이는 날짜로 나눠 잇는다
     (예: 19일 = 꽃과 열매 사이의 4/5 지점). 점의 자리는 trackStops() */
  export function trackFill(days) {
    var idx = -1, i, n = STEPS.length - 1;
    for (i = 0; i < STEPS.length; i++) if (days >= STEPS[i]) idx = i;
    if (idx >= n) return 100;
    if (idx >= 0) return (idx + (days - STEPS[idx]) / (STEPS[idx + 1] - STEPS[idx])) / n * 100;
    return 0;
  }
  export function trackStops() { var n = STEPS.length - 1; return STEPS.map(function (_, i) { return i / n * 100; }); }

  /* ---------- 연출 ---------- */
  // 잎이 흩날리는 연출(출근, 수확)
  var BURST = ['#7CC646', '#A4E05E', '#5DB843', A.pink[80], A.orange[70]];
  export function burst(x, y, n) {
    if (reducedMotion() || !document.body.animate) return;
    var layer = document.createElement('div'); layer.className = 'orchard-burst'; layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    for (var i = 0; i < n; i++) {
      var s = document.createElement('i'), a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, d = 60 + Math.random() * 120, dx = Math.cos(a) * d, dy = Math.sin(a) * d, sz = 8 + Math.random() * 9;
      s.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + sz + 'px;height:' + sz * 1.5 + 'px;background:' + BURST[i % BURST.length];
      layer.appendChild(s);
      s.animate([
        { transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)', opacity: 0 },
        { transform: 'translate(calc(-50% + ' + dx * 0.7 + 'px),calc(-50% + ' + dy + 'px)) scale(1) rotate(' + (Math.random() * 240 - 120) + 'deg)', opacity: 1, offset: 0.35 },
        { transform: 'translate(calc(-50% + ' + dx + 'px),calc(-50% + ' + (dy + 120 + Math.random() * 90) + 'px)) scale(.9) rotate(' + (Math.random() * 720 - 360) + 'deg)', opacity: 0 }
      ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.22,.7,.3,1)', fill: 'forwards' });
    }
    setTimeout(function () { layer.remove(); }, 1900);
  }
  export function floatChip(x, y, text) {
    if (reducedMotion() || !document.body.animate) return;
    var c = document.createElement('span'); c.className = 'orchard-plus'; c.textContent = text; c.setAttribute('aria-hidden', 'true');
    c.style.left = x + 'px'; c.style.top = y + 'px'; document.body.appendChild(c);
    c.animate([{ transform: 'translate(-50%,0) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-28px) scale(1)', opacity: 1, offset: 0.3 }, { transform: 'translate(-50%,-34px) scale(1)', opacity: 1, offset: 0.75 }, { transform: 'translate(-50%,-64px) scale(1)', opacity: 0 }],
      { duration: 1500, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' });
    setTimeout(function () { c.remove(); }, 1600);
  }

  /* ---------- 수확 카드를 그림으로 ----------
     화면의 수확 카드(.orchard-card)를 그림(PNG, 두 배 크기)으로 그려 내려받는다. 요소의 자리와 글꼴을 화면에서 읽어 그대로 옮긴다.
     그림 안에서는 뒤가 비치는 유리를 쓸 수 없어, 칸은 같은 농도의 반투명 색으로 칠한다. dark: 지금 다크 테마인지 */
  export function saveCard(card, fileName, dark) {
    var R = card.getBoundingClientRect(), k = 2, c = document.createElement('canvas'), g = c.getContext('2d'), W = R.width, H = R.height;
    c.width = Math.round(W * k); c.height = Math.round(H * k); g.scale(k, k);
    function box(el) { var b = el.getBoundingClientRect(); return { x: b.left - R.left, y: b.top - R.top, w: b.width, h: b.height }; }
    function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function fade(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
    rr(0, 0, W, H, 24); g.save(); g.clip();
    g.fillStyle = dark ? '#1B1C1E' : '#FFFFFF'; g.fillRect(0, 0, W, H);
    [[0.08, 0, dark ? A.pink[60] : A.pink[90]], [1, 0.14, dark ? A.orange[50] : A.orange[90]], [0.92, 1, dark ? A.lightBlue[50] : A.lightBlue[90]], [0, 0.92, dark ? A.violet[50] : A.violet[90]]].forEach(function (b) {
      var x = b[0] * W, y = b[1] * H, rad = Math.max(W * 0.86, H * 0.58), gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, fade(b[2], dark ? 0.32 : 1)); gr.addColorStop(0.62, fade(b[2], 0)); gr.addColorStop(1, fade(b[2], 0));
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    });
    [].slice.call(card.querySelectorAll('.oc-fruit, .oc-cells > div')).forEach(function (el) {
      var b = box(el); rr(b.x, b.y, b.w, b.h, el.classList.contains('oc-fruit') ? b.w / 2 : 14);
      g.fillStyle = dark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.62)'; g.fill();
      g.strokeStyle = dark ? 'rgba(255,255,255,.14)' : 'rgba(112,115,124,.14)'; g.lineWidth = 1; g.stroke();
    });
    var fc = card.querySelector('.oc-fruit canvas');
    if (fc) { var fb = box(fc); try { g.drawImage(fc, fb.x, fb.y, fb.w, fb.h); } catch (e) {} }
    var tr = card.querySelector('.oc-bar'), fi = tr && tr.firstElementChild;
    if (tr) { var tb = box(tr), fw = tb.w * (parseFloat(fi.style.width) || 0) / 100; /* 채워지는 움직임이 끝나기 전에도 다 찬 길이로 그린다 */ rr(tb.x, tb.y, tb.w, tb.h, tb.h / 2); g.fillStyle = 'rgba(112,115,124,.16)'; g.fill(); rr(tb.x, tb.y, fw, tb.h, tb.h / 2); g.fillStyle = getComputedStyle(fi).backgroundColor; g.fill(); }
    [].slice.call(card.querySelectorAll('.oc-head > span, .oc-title, .oc-sub, dt, dd, .oc-rec-head span, .oc-rec-head b, .oc-rec-foot, .oc-foot')).forEach(function (el) {
      var cs = getComputedStyle(el), b = box(el), center = cs.textAlign === 'center';
      g.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily; g.fillStyle = cs.color; g.textBaseline = 'middle'; g.textAlign = center ? 'center' : 'left';
      try { g.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing; } catch (e) {}
      g.fillText((el.textContent || '').trim(), center ? b.x + b.w / 2 : b.x, b.y + b.h / 2 + 0.5);
    });
    g.restore();
    function down(url) { var a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove(); }
    if (c.toBlob) c.toBlob(function (blob) { if (!blob) return; var u = URL.createObjectURL(blob); down(u); setTimeout(function () { URL.revokeObjectURL(u); }, 2000); floatChip(R.left + W / 2, R.top + H - 8, '카드를 저장했어요'); }, 'image/png');
    else down(c.toDataURL('image/png'));
    return c;
  }

/* ---------- 수확 카드 등장: 반짝이는 컨페티 ----------
   카드 둘레 위쪽에서 작은 별과 조각이 조금 흩날려 떨어진다(spec 3.9). 카드가 돌아 멈춘 뒤에 시작하고 3초 안에 사라진다.
   rect: 카드의 화면 위치(getBoundingClientRect), n: 조각 수(기본 26), delay: 시작까지 기다리는 시간(ms) */
export function sparkleRain(rect, n, delay) {
  if (typeof document === 'undefined' || reducedMotion() || !document.body.animate) return;
  n = n || 26; delay = delay == null ? 900 : delay;
  var COLORS = [A.yellow ? A.yellow[70] : A.orange[80], A.pink[80], A.lightBlue[70], A.violet[80], A.lime[80], '#FFFFFF'];
  var STAR = 'polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)';
  var layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483600;overflow:hidden';
  document.body.appendChild(layer);
  var cx = rect.left + rect.width / 2, spread = rect.width * 0.75, longest = 0;
  for (var i = 0; i < n; i++) {
    var s = document.createElement('i'), star = i % 3 !== 2, size = star ? 7 + Math.random() * 7 : 4 + Math.random() * 3;
    var x0 = cx + (Math.random() * 2 - 1) * spread, y0 = rect.top - 10 - Math.random() * rect.height * 0.25;
    var fall = rect.height * (0.55 + Math.random() * 0.7), drift = (Math.random() * 2 - 1) * 40, spin = (Math.random() * 2 - 1) * 260;
    var dur = 1800 + Math.random() * 1100, wait = delay + Math.random() * 700;
    longest = Math.max(longest, dur + wait);
    s.style.cssText = 'position:fixed;left:' + x0 + 'px;top:' + y0 + 'px;width:' + size + 'px;height:' + (star ? size : size * 1.8) + 'px;background:' + COLORS[i % COLORS.length] +
      ';border-radius:' + (star ? '0' : '1px') + ';clip-path:' + (star ? STAR : 'none') + ';filter:drop-shadow(0 0 4px rgba(255,255,255,.85));opacity:0;will-change:transform,opacity';
    layer.appendChild(s);
    s.animate([
      { transform: 'translate(-50%,-50%) translate(0,0) rotate(0deg) scale(.4)', opacity: 0 },
      { transform: 'translate(-50%,-50%) translate(' + drift * 0.3 + 'px,' + fall * 0.18 + 'px) rotate(' + spin * 0.25 + 'deg) scale(1)', opacity: 1, offset: 0.15 },
      { transform: 'translate(-50%,-50%) translate(' + drift * 0.75 + 'px,' + fall * 0.7 + 'px) rotate(' + spin * 0.75 + 'deg) scale(.9)', opacity: 0.9, offset: 0.7 },
      { transform: 'translate(-50%,-50%) translate(' + drift + 'px,' + fall + 'px) rotate(' + spin + 'deg) scale(.6)', opacity: 0 }
    ], { duration: dur, delay: wait, easing: 'cubic-bezier(.25,.6,.35,1)', fill: 'forwards' });
    // 별은 떨어지는 동안 한두 번 반짝인다
    if (star) s.animate([{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,.85)) brightness(1)' }, { filter: 'drop-shadow(0 0 8px rgba(255,255,255,1)) brightness(1.8)' }, { filter: 'drop-shadow(0 0 4px rgba(255,255,255,.85)) brightness(1)' }],
      { duration: 520, delay: wait + 200 + Math.random() * 600, iterations: 2, easing: 'ease-in-out' });
  }
  setTimeout(function () { layer.remove(); }, longest + 200);
}
