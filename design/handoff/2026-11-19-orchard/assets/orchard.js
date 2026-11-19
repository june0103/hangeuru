/* 과수원 디자인 레이어 (시안). 보드의 모든 화면이 같이 쓴다.
   - 배경: 몽타주 atomic 색으로 만든 꽃이 물 흐르듯 떠다니고, 포인터에 밀리고, 누르면 물결이 번진다
   - 에셋: three.js 로우폴리 과일 4종과 자라는 단계(씨앗·새싹·나뭇가지·나무·과일나무)
   - 앱 화면(스냅샷)에서는 씨앗 선택의 열매 그림과 나무 그림을 로우폴리로 바꿔 보여 준다(adopt)
   원본: design/local/preview/orchard/orchard.js → apply.mjs 가 current/assets/orchard.js 로 복사한다.
   html 속성: data-orchard-layout = splash | auth | seeds | app, data-orchard-seed = apple | tangerine | peach | coffee
   주소: ?mode=static 이면 한 장만 그리고 멈춘다(보드의 화면 목록용) */
(function () {
  'use strict';
  var THREE = window.THREE;
  if (!THREE || window.Orchard) return;
  var root = document.documentElement;
  var STILL = new URLSearchParams(location.search).get('mode') === 'static';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LAYOUT = root.getAttribute('data-orchard-layout') || 'app';
  var state = { scheme: root.getAttribute('data-orchard-seed') || 'base' };
  var clock = { t: STILL ? 6 : 0, last: performance.now() };

  /* ---------- 몽타주 atomic 색 (4.3.2). 배경과 에셋은 여기 있는 값만 쓴다 ---------- */
  var A = {
    orange:    { 10: '#361E00', 20: '#663A00', 30: '#9C5800', 40: '#D47800', 50: '#FF9200', 60: '#FFA938', 70: '#FFC06E', 80: '#FFD49C', 90: '#FEE6C6', 95: '#FEF4E6', 99: '#FFFCF7' },
    redOrange: { 10: '#290F00', 20: '#592100', 30: '#913500', 40: '#C94A00', 50: '#FF5E00', 60: '#FF7B2E', 70: '#FF9B61', 80: '#FFBD96', 90: '#FED9C4', 95: '#FEEEE5', 99: '#FFFAF7' },
    red:       { 10: '#3B0101', 20: '#730303', 30: '#B00C0C', 40: '#E52222', 50: '#FF4242', 60: '#FF6363', 70: '#FF8C8C', 80: '#FFB5B5', 90: '#FED5D5', 95: '#FEECEC', 99: '#FFFAFA' },
    pink:      { 10: '#3D0133', 20: '#730560', 30: '#A81690', 40: '#D331B8', 50: '#F553DA', 60: '#FA73E3', 70: '#FF94ED', 80: '#FFB8F3', 90: '#FED3F7', 95: '#FEECFB', 99: '#FFFAFE' },
    purple:    { 10: '#290247', 20: '#580A7D', 30: '#861CB8', 40: '#AD36E3', 50: '#CB59FF', 60: '#D478FF', 70: '#DE96FF', 80: '#E9BAFF', 90: '#F2D6FF', 95: '#F9EDFF', 99: '#FEFBFF' },
    violet:    { 10: '#11024D', 20: '#23098F', 30: '#3A16C9', 40: '#4F29E5', 50: '#6541F2', 60: '#7D5EF7', 70: '#9E86FC', 80: '#C0B0FF', 90: '#DBD3FE', 95: '#F0ECFE', 99: '#FBFAFF' },
    lightBlue: { 10: '#002130', 20: '#004261', 30: '#006796', 40: '#008DCF', 50: '#00AEFF', 60: '#3DC2FF', 70: '#70D2FF', 80: '#A1E1FF', 90: '#C4ECFE', 95: '#E5F6FE', 99: '#F7FDFF' },
    cyan:      { 10: '#00252B', 20: '#004854', 30: '#006F82', 40: '#0098B2', 50: '#00BDDE', 60: '#28D0ED', 70: '#57DFF7', 80: '#8AEDFF', 90: '#B5F4FF', 95: '#DEFAFF', 99: '#F7FEFF' },
    green:     { 10: '#00240C', 20: '#004517', 30: '#006E25', 40: '#009632', 50: '#00BF40', 60: '#1ED45A', 70: '#49E57D', 80: '#7DF5A5', 90: '#ACFCC7', 95: '#D9FFE6', 99: '#F2FFF6' },
    lime:      { 10: '#112900', 20: '#225200', 30: '#347D00', 40: '#48AD00', 50: '#58CF04', 60: '#6BE016', 70: '#88F03E', 80: '#AEF779', 90: '#CCFCA9', 95: '#E6FFD4', 99: '#F8FFF2' },
    coolNeutral: { 5: '#0F0F10', 99: '#F7F7F8' }
  };

  /* 꽃 한 송이는 안쪽 색(petal)에서 가장자리 색(edge)으로 번지고, 가운데에 심(core)이 있다.
     바닥에는 색 번짐(field) 다섯 겹이 겹쳐 흐른다. 씨앗마다 이 조합이 바뀐다 */
  var SCHEME = {
    base: {
      petal: ['orange', 'pink', 'redOrange', 'lightBlue', 'purple', 'lime', 'orange', 'red'],
      edge:  ['pink', 'orange', 'orange', 'cyan', 'pink', 'green', 'redOrange', 'pink'],
      core:  ['redOrange', 'redOrange', 'orange', 'violet', 'pink', 'lime', 'redOrange', 'redOrange'],
      field: ['lightBlue', 'pink', 'lime', 'purple', 'orange']
    },
    apple: {
      petal: ['red', 'pink', 'redOrange', 'red', 'lime', 'red', 'pink', 'orange'],
      edge:  ['pink', 'red', 'orange', 'redOrange', 'green', 'pink', 'purple', 'red'],
      core:  ['redOrange', 'red', 'red', 'orange', 'orange', 'red', 'redOrange', 'redOrange'],
      field: ['red', 'lime', 'pink', 'orange', 'lightBlue']
    },
    tangerine: {
      petal: ['orange', 'redOrange', 'orange', 'lime', 'orange', 'pink', 'redOrange', 'orange'],
      edge:  ['redOrange', 'orange', 'pink', 'green', 'lime', 'orange', 'orange', 'pink'],
      core:  ['redOrange', 'orange', 'redOrange', 'orange', 'redOrange', 'redOrange', 'red', 'redOrange'],
      field: ['orange', 'lime', 'redOrange', 'pink', 'lightBlue']
    },
    peach: {
      petal: ['pink', 'redOrange', 'pink', 'orange', 'purple', 'redOrange', 'lime', 'pink'],
      edge:  ['redOrange', 'pink', 'purple', 'pink', 'pink', 'orange', 'green', 'orange'],
      core:  ['red', 'redOrange', 'redOrange', 'redOrange', 'pink', 'red', 'orange', 'redOrange'],
      field: ['pink', 'redOrange', 'purple', 'lime', 'orange']
    },
    coffee: {
      petal: ['purple', 'pink', 'red', 'violet', 'pink', 'lightBlue', 'purple', 'redOrange'],
      edge:  ['pink', 'purple', 'pink', 'purple', 'violet', 'violet', 'violet', 'pink'],
      core:  ['red', 'red', 'redOrange', 'pink', 'red', 'violet', 'pink', 'red'],
      field: ['purple', 'pink', 'violet', 'lightBlue', 'red']
    }
  };
  var PETAL_L = [80, 80, 70, 80, 80, 80, 80, 80], EDGE_L = 90, CORE_L = [70, 60, 60, 70, 60, 70, 60, 70], FIELD_L = 90;
  var PETAL_D = [40, 30, 30, 30, 40, 30, 30, 30], EDGE_D = 20, CORE_D = [50, 40, 40, 50, 40, 50, 40, 50], FIELD_D = 20;
  /* 연두·초록·청록은 같은 단계에서도 진하게 보여 라이트에서는 한 단계 밝게 쓴다 */
  var VIVID = { lime: 1, green: 1, cyan: 1 }, LIGHTER = { 60: 70, 70: 80, 80: 90, 90: 95 };
  /* 보라·분홍·빨강은 다크에서 넓게 깔리면 화면을 덮어 번짐에는 한 단계 어둡게 쓴다 */
  var DEEP = { purple: 1, violet: 1, pink: 1, red: 1 };
  var FRUIT_COLOR = { apple: A.red[50], tangerine: A.orange[50], peach: A.redOrange[70], coffee: A.red[30] };
  var SEED_OF = { '사과': 'apple', '귤': 'tangerine', '복숭아': 'peach', '커피': 'coffee' };

  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function paletteFor(name, dark) {
    var s = SCHEME[name] || SCHEME.base, petals = [], edges = [], cores = [], fields = [];
    function pick(hue, level) { return A[hue][!dark && VIVID[hue] ? LIGHTER[level] || level : level]; }
    for (var i = 0; i < 8; i++) {
      petals.push(pick(s.petal[i], dark ? PETAL_D[i] : PETAL_L[i]));
      edges.push(pick(s.edge[i], dark ? EDGE_D : EDGE_L));
      cores.push(pick(s.core[i], dark ? CORE_D[i] : CORE_L[i]));
    }
    for (var j = 0; j < 5; j++) fields.push(pick(s.field[j], dark ? (DEEP[s.field[j]] ? 10 : FIELD_D) : FIELD_L));
    return dark
      ? { base: A.coolNeutral[5], fields: fields, fieldAmt: 0.62, halo: A.orange[20], haloAmt: 0.25, alpha: 0.68, grain: 0.03, petals: petals, edges: edges, cores: cores }
      : { base: A.coolNeutral[99], fields: fields, fieldAmt: 0.8, halo: A.orange[99], haloAmt: 0.5, alpha: 1, grain: 0.04, petals: petals, edges: edges, cores: cores };
  }

  /* ---------- 스타일: 배경 캔버스, 유리 패널, 에셋 자리 ---------- */
  var css = document.createElement('style');
  css.setAttribute('data-orchard', '');
  css.textContent = [
    'html{background:' + A.coolNeutral[99] + ';--o-page:' + A.coolNeutral[99] + ';--o-tint:54%;--o-inset:44%;--o-edge:rgba(255,255,255,.7);--o-sheen:rgba(255,255,255,.8);--o-shadow:rgba(23,23,25,.24);--o-fg2:rgba(46,47,51,.88);--o-fg3:rgba(55,56,60,.61);--o-line:rgba(112,115,124,.16);--o-accent:#0066FF}',
    'html.orchard-dark{background:' + A.coolNeutral[5] + ';--o-page:' + A.coolNeutral[5] + ';--o-tint:46%;--o-inset:40%;--o-edge:rgba(255,255,255,.1);--o-sheen:rgba(255,255,255,.1);--o-shadow:rgba(0,0,0,.7);--o-fg2:rgba(194,196,200,.88);--o-fg3:rgba(174,176,182,.61);--o-line:rgba(112,115,124,.28);--o-accent:#3385FF}',
    'body{background:transparent !important}',
    '#orchard-bg{position:fixed;inset:0;width:100%;height:100%;display:block;z-index:-1;pointer-events:none}',
    '.orchard-slot{display:block;width:100%;height:100%}',
    '.orchard-fruit{display:block;flex:none}',
    '.orchard-tree{position:relative;display:block}',
    '.orchard-tree > svg{opacity:0}',
    '.orchard-tree > .orchard-fig{position:absolute;inset:0;pointer-events:none}',
    '.orchard-tree{-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}',
    '.orchard-tree[role="button"]{border-radius:16px}',
    /* 레벨 고리 */
    '.orchard-lv{position:absolute;top:-18px;right:-30px;width:54px;height:54px;pointer-events:none;filter:drop-shadow(0 6px 10px color-mix(in srgb,var(--o-lv) 34%,transparent))}',
    '.orchard-lv svg{display:block;width:100%;height:100%;overflow:visible}',
    '.orchard-lv .l{fill:var(--o-lv);transform-origin:center;transform-box:fill-box}',
    '.orchard-lv .t,.orchard-lv .p{fill:none;stroke:var(--o-lv);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.orchard-lv .t{stroke-opacity:.2}.orchard-lv .p{transition:stroke-dasharray 1.4s cubic-bezier(.32,.72,0,1) .3s}',
    '.orchard-lv text{fill:#fff;text-anchor:middle;font-family:inherit}.orchard-lv .n{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}',
    '@keyframes orchard-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}',
    STILL || reduce ? '' : '.orchard-lv .l{animation:orchard-breathe 3.6s cubic-bezier(.45,0,.55,1) infinite;animation-delay:calc(var(--i,0) * -0.5s)}',
    /* 배지 타일 */
    '.p-badges{min-width:0}',
    '.orchard-badges{list-style:none;margin:16px 0 0;padding:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}',
    '.orchard-badges li{display:grid;justify-items:center;gap:6px;text-align:center;min-width:0}',
    '.orchard-badges .m{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:var(--o-accent);background:color-mix(in srgb,var(--o-accent) 12%,transparent);box-shadow:inset 0 1px 0 var(--o-sheen),inset 0 0 0 1px color-mix(in srgb,var(--o-accent) 24%,transparent)}',
    '.orchard-badges .off .m{color:var(--o-fg3);background:color-mix(in srgb,var(--o-fg2) 7%,transparent);box-shadow:inset 0 0 0 1px var(--o-line)}',
    '.orchard-badges svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}',
    '.orchard-badges .t{font-size:12px;line-height:16px;font-weight:500;letter-spacing:.0252em;color:var(--o-fg2);white-space:nowrap}.orchard-badges .off .t{color:var(--o-fg3)}',
    '@keyframes orchard-pop{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}',
    STILL || reduce ? '' : '.orchard-badges .on .m{animation:orchard-pop .7s cubic-bezier(.34,1.4,.64,1) backwards;animation-delay:calc(var(--i,0) * 90ms + 500ms)}',
    '@media (max-width:991px){.p-badges{order:5}}',
    /* 흩날리는 잎, 떠오르는 +1일 */
    '.orchard-burst{position:fixed;inset:0;pointer-events:none;z-index:2147483000;overflow:hidden}.orchard-burst i{position:fixed;border-radius:80% 12% 80% 12%;will-change:transform,opacity}',
    '.orchard-plus{position:fixed;z-index:2147483000;pointer-events:none;padding:6px 12px;border-radius:9999px;background:var(--o-accent);color:#fff;font-weight:700;font-size:15px;line-height:20px;box-shadow:0 12px 24px -12px var(--o-shadow)}',
    /* 헤더: 색 띠를 없애고 배경에 녹인다. 아래로 갈수록 옅어지는 흐림만 남겨, 내용이 밑으로 지나갈 때만 드러난다 */
    'body > header{background:transparent !important;border-bottom-color:transparent !important;-webkit-backdrop-filter:none !important;backdrop-filter:none !important}',
    'body > header::before{content:"";position:absolute;inset:0 0 -18px 0;z-index:-1;pointer-events:none;background:linear-gradient(to bottom,color-mix(in srgb,var(--o-page) 22%,transparent),transparent);-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);-webkit-mask-image:linear-gradient(to bottom,#000 45%,transparent);mask-image:linear-gradient(to bottom,#000 45%,transparent)}',
    /* 로그아웃은 헤더에서 빼고 내 설정 창 맨 아래에 둔다(시안, 사용자 지시). 모바일 프로필 아이콘은 24px, 누르는 영역은 44px */
    '[data-orchard-hide]{display:none !important}',
    '@media (max-width:767px){body > header button[data-component="icon-button"]{width:44px !important;height:44px !important;margin-right:-10px}body > header button[data-component="icon-button"] svg{width:24px !important;height:24px !important}}',
    '.orchard-signout{margin-top:4px;padding-top:12px;border-top:1px solid var(--o-line);display:flex}',
    '.orchard-signout button{appearance:none;-webkit-appearance:none;border:0;background:none;min-height:44px;padding:0 2px;font-family:inherit;font-weight:600;font-size:15px;line-height:22px;letter-spacing:.0096em;color:var(--o-fg2);cursor:pointer;border-radius:8px;transition:opacity .3s cubic-bezier(.32,.72,0,1)}',
    '.orchard-signout button:hover{opacity:.72}',
    /* 헤더(768px 이상): 로고 왼쪽, 탭 셋 가운데, 화면 테마 전환과 이름 오른쪽. 탭 모양은 앱의 몽타주 탭(밑줄) 그대로다(알약 바탕으로 바꿨다가 되돌림) */
    '@media (min-width:768px){[data-orchard-head="bar"]{display:grid !important;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center !important}[data-orchard-head="tabs"]{margin-left:0 !important;align-self:end !important;justify-self:center}[data-orchard-head="user"]{margin-left:0 !important;justify-self:end}}',
    /* 내 씨앗 패널의 글: 지금 모습을 말하듯 한 줄, 그 아래 작은 글씨로 다음까지 남은 날 */
    '[data-orchard-lead]{display:grid !important;gap:6px;margin:0}',
    '.orchard-now{font-size:16px;line-height:26px;font-weight:500;letter-spacing:.0057em;color:#171719;text-wrap:pretty}html.orchard-dark .orchard-now{color:#F7F7F8}',
    '.orchard-next{font-size:13px;line-height:20px;font-weight:400;letter-spacing:.0194em;color:var(--o-fg3)}',
    /* 씨앗 칩을 누르면 뜨는 안내(툴팁 모양) */
    '.orchard-seedtip{position:relative;display:inline-flex;flex:none}',
    '.orchard-seedtip > [role="button"]{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .2s cubic-bezier(.2,0,0,1),opacity .2s cubic-bezier(.2,0,0,1)}',
    '.orchard-seedtip > [role="button"]:hover{opacity:.78}.orchard-seedtip > [role="button"]:active{transform:scale(.96)}',
    '.orchard-seedtip > [role="button"]:focus-visible{outline:2px solid var(--o-accent);outline-offset:2px}',
    '.orchard-seedtip [role="tooltip"]{position:absolute;top:calc(100% + 10px);right:0;z-index:6;width:max-content;max-width:min(260px,72vw);padding:10px 14px;border-radius:12px;background:rgba(27,28,30,.92);color:#fff;font-size:13px;line-height:20px;font-weight:500;letter-spacing:.0194em;text-align:left;box-shadow:0 8px 24px -10px rgba(23,23,25,.4);transform-origin:top right;animation:orchard-menu .2s cubic-bezier(.2,0,0,1) backwards}',
    '.orchard-seedtip [role="tooltip"]::before{content:"";position:absolute;top:-5px;right:16px;width:10px;height:10px;border-radius:2px;background:inherit;transform:rotate(45deg)}',
    '.orchard-seedtip [role="tooltip"] span{display:block;position:relative}.orchard-seedtip [role="tooltip"] span + span{font-weight:400;opacity:.78}',
    'html.orchard-dark .orchard-seedtip [role="tooltip"]{background:rgba(247,247,248,.94);color:#171719;box-shadow:0 8px 24px -10px rgba(0,0,0,.7)}',
    '.orchard-seedtip [role="tooltip"][hidden]{display:none}',
    '@media (prefers-reduced-motion:reduce){.orchard-seedtip [role="tooltip"]{animation:none}}',
    /* 빛줄기: 그림 상자 안에서 끊기지 않게, 화면 맨 위에서 흙까지 내려오는 빛을 그림 뒤에 따로 둔다(위는 좁고 아래로 퍼진다) */
    '.orchard-shaft{position:absolute;left:50%;width:92%;transform:translateX(-50%);z-index:0;pointer-events:none;opacity:0;background:linear-gradient(to bottom,rgba(255,255,244,.42) 0,rgba(255,255,244,.9) 46%,rgba(255,255,244,.6) 84%,rgba(255,255,244,0) 100%);-webkit-mask-image:linear-gradient(to right,transparent 2%,#000 50%,transparent 98%);mask-image:linear-gradient(to right,transparent 2%,#000 50%,transparent 98%);clip-path:polygon(34% 0,66% 0,100% 100%,0 100%);filter:blur(10px)}',
    '.orchard-shaft + canvas,.orchard-shaft ~ .orchard-slot{position:relative;z-index:1}',
    /* 수확 카드(시안): 앱의 카드 그림 대신 같은 내용을 지금 디자인으로. 꽃 색이 번진 바탕 위에 유리 칸, 과일은 3D 에셋, 출근 기록은 한 줄 막대 */
    '.orchard-card{--oc-fg:#171719;--oc-fg2:rgba(46,47,51,.88);--oc-fg3:rgba(55,56,60,.61);--oc-glass:rgba(255,255,255,.62);--oc-edge:rgba(112,115,124,.14);position:relative;isolation:isolate;overflow:hidden;box-sizing:border-box;width:100%;max-width:296px;padding:16px;border-radius:20px;color:var(--oc-fg);text-align:left;background:radial-gradient(90% 60% at 8% 0%,' + A.pink[90] + ' 0,transparent 62%),radial-gradient(80% 55% at 100% 14%,' + A.orange[90] + ' 0,transparent 60%),radial-gradient(90% 60% at 92% 100%,' + A.lightBlue[90] + ' 0,transparent 62%),radial-gradient(80% 50% at 0% 92%,' + A.violet[90] + ' 0,transparent 60%),#fff;box-shadow:inset 0 0 0 1px rgba(112,115,124,.12),0 16px 36px -20px rgba(23,23,25,.28)}',
    'html.orchard-dark .orchard-card{--oc-fg:#F7F7F8;--oc-fg2:rgba(194,196,200,.88);--oc-fg3:rgba(174,176,182,.61);--oc-glass:rgba(255,255,255,.08);--oc-edge:rgba(255,255,255,.14);background:radial-gradient(90% 60% at 8% 0%,rgba(250,115,227,.34) 0,transparent 62%),radial-gradient(80% 55% at 100% 14%,rgba(255,146,0,.3) 0,transparent 60%),radial-gradient(90% 60% at 92% 100%,rgba(0,174,255,.28) 0,transparent 62%),radial-gradient(80% 50% at 0% 92%,rgba(101,65,242,.34) 0,transparent 60%),#1B1C1E;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 16px 36px -20px rgba(0,0,0,.7)}',
    '.orchard-card .oc-head{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;line-height:18px;font-weight:600;letter-spacing:.0194em}.orchard-card .oc-head span + span{font-weight:500;color:var(--oc-fg3)}',
    '.orchard-card .oc-fruit{width:104px;height:104px;margin:10px auto 0;border-radius:50%;background:var(--oc-glass);-webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4);box-shadow:inset 0 0 0 1px var(--oc-edge),inset 0 1px 0 var(--oc-edge)}.orchard-card .oc-fruit > span{display:block;width:100%;height:100%}',
    '.orchard-card .oc-title{margin:10px 0 0;text-align:center;font-size:20px;line-height:28px;font-weight:700;letter-spacing:-.0194em;color:var(--oc-fg)}.orchard-card .oc-sub{margin:2px 0 0;text-align:center;font-size:14px;line-height:22px;letter-spacing:.0145em;color:var(--oc-fg2)}',
    '.orchard-card .oc-cells{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:12px 0 0;padding:0}.orchard-card .oc-cells > div{padding:8px 10px;border-radius:12px;background:var(--oc-glass);-webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4);box-shadow:inset 0 0 0 1px var(--oc-edge),inset 0 1px 0 var(--oc-edge)}',
    '.orchard-card dt{font-size:12px;line-height:16px;letter-spacing:.0252em;color:var(--oc-fg3)}.orchard-card dd{margin:2px 0 0;font-size:16px;line-height:24px;font-weight:700;letter-spacing:.0057em;color:var(--oc-fg)}',
    '.orchard-card .oc-rec{margin-top:16px}.orchard-card .oc-rec-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:12px;line-height:16px;letter-spacing:.0252em;color:var(--oc-fg3)}.orchard-card .oc-rec-head b{font-size:14px;line-height:20px;font-weight:700;color:var(--oc-fg);font-variant-numeric:tabular-nums}',
    '.orchard-card .oc-bar{height:10px;margin-top:8px;border-radius:9999px;background:rgba(112,115,124,.16);overflow:hidden}.orchard-card .oc-bar i{display:block;height:100%;border-radius:inherit;transform-origin:left center;animation:orchard-card-fill .9s cubic-bezier(.2,0,0,1) .35s backwards}',
    '.orchard-card .oc-rec-foot{margin-top:6px;font-size:12px;line-height:16px;letter-spacing:.0252em;color:var(--oc-fg3)}.orchard-card .oc-foot{margin:14px 0 0;text-align:center;font-size:12px;line-height:16px;letter-spacing:.0252em;color:var(--oc-fg3)}',
    '@keyframes orchard-card-fill{from{transform:scaleX(0)}to{transform:none}}',
    '@media (prefers-reduced-motion:reduce){.orchard-card .oc-bar i{animation:none}}html[data-still] .orchard-card .oc-bar i{animation:none}',
    /* 수확 카드 창: 패널과 같은 유리(뒤가 비치고 흐려진다), 카드에 맞춘 작은 크기 */
    '[data-orchard-modal="glass"]{background:color-mix(in srgb,var(--o-page) var(--o-tint),transparent) !important;-webkit-backdrop-filter:blur(22px) saturate(1.5);backdrop-filter:blur(22px) saturate(1.5);box-shadow:inset 0 0 0 1px var(--o-edge),inset 0 1px 0 var(--o-sheen),0 24px 48px -24px var(--o-shadow) !important}',
    '[data-orchard-modal="glass"] div:not(.orchard-card):not(.orchard-card div):not(button div){background-color:transparent !important}',
    '@media (min-width:768px){[data-orchard-modal="glass"]{width:344px !important;max-width:344px !important;min-width:0 !important}}',
    '@media (max-width:767px){[data-orchard-modal="glass"]{height:auto !important;max-height:92dvh !important}}',
    '[data-orchard-card-src]{position:absolute !important;width:1px !important;height:1px !important;overflow:hidden;clip:rect(0 0 0 0);opacity:0}',
    /* 화면 테마 전환: 지금 테마의 아이콘 + 화살표, 누르면 Light·Dark·Auto 메뉴 */
    '.orchard-theme{position:relative;display:flex;align-items:center;color:#171719}html.orchard-dark .orchard-theme{color:#F7F7F8}',
    '.orchard-theme svg{display:block;flex:none;fill:currentColor}',
    '.orchard-theme > button{appearance:none;-webkit-appearance:none;border:0;background:none;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-height:32px;padding:6px 8px;border-radius:8px;color:inherit;cursor:pointer;transition:background-color .2s cubic-bezier(.2,0,0,1)}',
    '.orchard-theme > button:hover,.orchard-theme > button[aria-expanded="true"]{background:rgba(112,115,124,.1)}',
    '.orchard-theme > button:focus-visible,.orchard-theme [role="menuitemradio"]:focus-visible{outline:2px solid var(--o-accent);outline-offset:2px}',
    '.orchard-theme > button .i{width:18px;height:18px}.orchard-theme > button .v{width:14px;height:14px;opacity:.7;transition:transform .24s cubic-bezier(.2,0,0,1)}.orchard-theme > button[aria-expanded="true"] .v{transform:rotate(180deg)}',
    '.orchard-theme [role="menu"]{position:absolute;top:calc(100% + 8px);right:0;z-index:30;min-width:144px;padding:8px 20px;border-radius:16px;background:#fff;box-shadow:0 0 0 1px var(--o-line),0 2px 4px -2px rgba(23,23,23,.06),0 4px 6px -1px rgba(23,23,23,.06),0 16px 32px -12px rgba(23,23,23,.18);display:grid;gap:4px;transform-origin:top right;animation:orchard-menu .2s cubic-bezier(.2,0,0,1) backwards}',
    'html.orchard-dark .orchard-theme [role="menu"]{background:#212225;box-shadow:0 0 0 1px var(--o-line),0 16px 32px -12px rgba(0,0,0,.6)}',
    '.orchard-theme [role="menu"][hidden]{display:none}',
    '.orchard-theme [role="menuitemradio"]{appearance:none;-webkit-appearance:none;border:0;background:none;display:flex;align-items:center;gap:8px;width:100%;min-height:48px;padding:12px 0;border-radius:12px;font-family:inherit;font-size:14px;line-height:20px;font-weight:400;letter-spacing:.0145em;color:inherit;text-align:left;cursor:pointer;white-space:nowrap}',
    '.orchard-theme [role="menuitemradio"] .i{width:20px;height:20px;opacity:.6}.orchard-theme [role="menuitemradio"] .c{width:18px;height:18px;margin-left:auto;visibility:hidden}',
    '.orchard-theme [role="menuitemradio"]:hover{opacity:.72}',
    '.orchard-theme [role="menuitemradio"][aria-checked="true"]{color:var(--o-accent);font-weight:600}.orchard-theme [role="menuitemradio"][aria-checked="true"] .i{opacity:1}.orchard-theme [role="menuitemradio"][aria-checked="true"] .c{visibility:visible}',
    '@keyframes orchard-menu{from{opacity:0;transform:translate3d(0,-4px,0) scale(.98)}to{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion:reduce){.orchard-theme [role="menu"]{animation:none}}',
    /* 모바일: 프로필 아이콘과 같은 크기(24px, 누르는 영역 44px), 화살표는 뺀다 */
    '@media (max-width:767px){.orchard-theme > button{min-width:44px;min-height:44px;padding:0}.orchard-theme > button .i{width:24px;height:24px}.orchard-theme > button .v{display:none}.orchard-theme{color:rgba(46,47,51,.88)}html.orchard-dark .orchard-theme{color:rgba(194,196,200,.88)}[data-orchard-head="user"]{gap:0 !important}}',
    /* 캘린더(시안, 사용자 지시): '출근 캘린더' 제목은 보이지 않게 하고(스크린리더용으로는 남긴다) 연·월을 가운데에 둔다. 출근 표시는 작은 네모 */
    'section[aria-labelledby="h-cal"] #h-cal{position:absolute !important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    'section[aria-labelledby="h-cal"] > div:first-of-type{justify-content:center !important}',
    /* 모바일 캘린더의 기록 표: 네 칸(날짜, 출근, 퇴근, 머문 시간)이 가로 스크롤 없이 한 화면에 들어오고, 칸마다 좌우 여백이 같다 */
    '@media (max-width:767px){section[aria-labelledby="h-cal"] table{width:100% !important;min-width:0 !important;table-layout:auto}section[aria-labelledby="h-cal"] th,section[aria-labelledby="h-cal"] td{padding-left:8px !important;padding-right:0 !important;font-size:13px !important;line-height:18px !important;white-space:nowrap;overflow-wrap:normal !important}section[aria-labelledby="h-cal"] th *,section[aria-labelledby="h-cal"] td *{font-size:inherit !important;line-height:inherit !important}section[aria-labelledby="h-cal"] th:last-child,section[aria-labelledby="h-cal"] td:last-child{padding-right:8px !important}section[aria-labelledby="h-cal"] td{padding-top:14px !important;padding-bottom:14px !important}}',
    'section[aria-labelledby="h-cal"] [role="img"]{width:8px !important;height:8px !important;border-radius:50% !important}',
    /* 파란 주 버튼의 찰랑이는 물. 물 층은 버튼 바탕 위·글자 아래(z-index:-1)에 깔려 글자와 누르는 영역을 건드리지 않는다.
       들어올 때는 물처럼 느긋하게(0.7초, 살짝 넘쳤다 돌아옴), 나갈 때는 빠르게(0.36초) */
    '.orchard-fill{position:relative;overflow:hidden;isolation:isolate;transition:background-color .36s cubic-bezier(.4,0,1,1)}',
    '.orchard-fill:hover,.orchard-fill:focus-visible,.orchard-fill:active{background-color:color-mix(in srgb,var(--o-base) 58%,transparent) !important;transition:background-color .6s cubic-bezier(.2,0,0,1)}',
    '.orchard-water{position:absolute;inset:0;z-index:-1;pointer-events:none;transform:translate3d(0,0,0);transition:transform .36s cubic-bezier(.4,0,1,1)}',
    '.orchard-fill:hover > .orchard-water,.orchard-fill:focus-visible > .orchard-water,.orchard-fill:active > .orchard-water{transform:translate3d(0,22%,0);transition:transform .7s cubic-bezier(.34,1.25,.64,1)}',
    '.orchard-fill[aria-disabled="true"] > .orchard-water,.orchard-fill:disabled > .orchard-water{display:none}',
    '.orchard-water .tilt{position:absolute;top:0;bottom:-70%;left:-8%;right:-8%;transform-origin:50% 0}',
    '.orchard-water .crest{position:absolute;top:-9px;left:0;right:0;height:10px}',
    '.orchard-water .body{position:absolute;inset:0;background:var(--o-base)}',
    '.orchard-water svg{position:absolute;top:0;left:0;width:200%;height:100%;fill:var(--o-base);animation-play-state:paused}',
    '.orchard-water .back{opacity:.5;animation:orchard-wave-back 9s linear infinite paused}.orchard-water .front{animation:orchard-wave-front 6.5s linear infinite paused}',
    '.orchard-water .glint{fill:none;stroke:rgba(255,255,255,.4);stroke-width:1.2;vector-effect:non-scaling-stroke}',
    '.orchard-fill:hover .orchard-water svg,.orchard-fill:focus-visible .orchard-water svg,.orchard-fill:active .orchard-water svg{animation-play-state:running}',
    '.orchard-fill:hover .tilt,.orchard-fill:focus-visible .tilt,.orchard-fill:active .tilt{animation:orchard-slosh-in .9s cubic-bezier(.3,.6,.4,1) both,orchard-slosh 3.6s ease-in-out .9s infinite alternate}',
    '@keyframes orchard-wave-back{from{transform:translateX(0)}to{transform:translateX(-50%)}}@keyframes orchard-wave-front{from{transform:translateX(-50%)}to{transform:translateX(0)}}',
    '@keyframes orchard-slosh-in{0%{transform:rotate(0)}32%{transform:rotate(-2.2deg)}64%{transform:rotate(1.3deg)}100%{transform:rotate(-.8deg)}}',
    '@keyframes orchard-slosh{from{transform:rotate(-.8deg) translateY(.5px)}to{transform:rotate(.8deg) translateY(-.5px)}}',
    '@media (prefers-reduced-motion:reduce){.orchard-fill,.orchard-water{transition-duration:.01s !important}.orchard-water svg,.orchard-water .tilt{animation:none !important}}',
    /* 패널: 유리. 뒤가 흐리게 비치고, 위쪽 가장자리에 빛이 맺힌다 */
    '[data-orchard-glass="panel"]{background-color:color-mix(in srgb,var(--og-c) var(--o-tint),transparent) !important;border-color:var(--o-edge) !important;-webkit-backdrop-filter:blur(22px) saturate(1.6);backdrop-filter:blur(22px) saturate(1.6);box-shadow:inset 0 1px 0 var(--o-sheen),0 28px 64px -36px var(--o-shadow),0 2px 8px -5px var(--o-shadow)}',
    '[data-orchard-glass="inset"]{background-color:color-mix(in srgb,var(--og-c) var(--o-inset),transparent) !important}',
    /* 모바일 아래 탭: 화면에서 띄운 유리 알약 */
    'body > nav{left:12px !important;right:12px !important;bottom:calc(10px + env(safe-area-inset-bottom,0px)) !important;padding-bottom:0 !important}',
    'body > nav > *{border-radius:22px !important;overflow:hidden;background-color:color-mix(in srgb,var(--o-page) 56%,transparent) !important;border:1px solid var(--o-edge) !important;-webkit-backdrop-filter:blur(22px) saturate(1.6);backdrop-filter:blur(22px) saturate(1.6);box-shadow:inset 0 1px 0 var(--o-sheen),0 18px 40px -22px var(--o-shadow)}',
    'body > nav *{background-color:transparent !important}',
    '[data-orchard-glass="dock"]{background:none !important;bottom:calc(74px + env(safe-area-inset-bottom,0px)) !important;padding:8px 16px !important}',
    /* 홈: 벤토 그리드(992px 이상). 스크롤 없이 한 화면에 다 보이도록 세 칸 두 줄로 놓는다.
       12칸에 왼쪽 4(오늘, 이번 주) · 가운데 5(내 씨앗, 두 줄 높이) · 오른쪽 3(오늘 그라운드, 배지). 세로가 낮은 화면(760px 이하)은 여백을 더 줄인다 */
    '@media (min-width:992px){' +
      'main:has(.p-today){padding-top:20px !important;padding-bottom:20px !important}' +
      'main div:has(> div > .p-today){display:grid !important;grid-template-columns:repeat(12,minmax(0,1fr));grid-template-rows:auto auto;gap:16px !important;align-items:stretch !important}' +
      'main div:has(> div > .p-today) > div{display:contents !important}' +
      '.p-today{grid-column:1 / span 4;grid-row:1}.p-week{grid-column:1 / span 4;grid-row:2}.p-tree{grid-column:5 / span 5;grid-row:1 / span 2}.p-camp{grid-column:10 / span 3;grid-row:1}.p-badges{grid-column:10 / span 3;grid-row:2}' +
      '.p-today > *,.p-week > *,.p-tree > *,.p-camp > *,.p-badges > *{height:100%;box-sizing:border-box}' +
      /* 내 씨앗 타일은 좁고 높다: 그림을 위에, 글과 막대를 아래에 둔다 */
      '.p-tree > section{display:flex;flex-direction:column}.p-tree > section > div:last-child{flex:1;flex-direction:column !important;align-items:center !important;justify-content:center;gap:12px !important}.p-tree > section > div:last-child > div:first-child{flex:0 0 auto !important;width:min(100%,264px)}.p-tree > section > div:last-child > div:last-child{flex:0 0 auto !important;width:100%;padding-top:0 !important}' +
      /* 오른쪽 좁은 칸: 배지는 한 줄에 셋, 작은 원 */
      '.p-badges .orchard-badges{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 6px;margin-top:12px}.p-badges .orchard-badges .m{width:40px;height:40px}.p-badges .orchard-badges svg{width:20px;height:20px}' +
    '}',
    '@media (min-width:992px) and (max-height:760px){main:has(.p-today){padding-top:12px !important;padding-bottom:12px !important}main div:has(> div > .p-today){gap:12px !important}.p-today > section,.p-week > section,.p-tree > section,.p-camp > section,.p-badges > section{padding:16px 20px !important}.p-tree > section > div:last-child > div:first-child{width:min(100%,224px)}}',
    '@media (min-width:992px) and (max-height:680px){.p-tree > section > div:last-child > div:first-child{width:min(100%,188px)}}',
    /* 이번 주: 보라색 대신 배지와 같은 파랑 유리(옅은 파랑 바탕, 파란 테두리와 아이콘) */
    '[data-orchard-dot="done"]{background:color-mix(in srgb,var(--o-accent) 12%,transparent) !important;color:var(--o-accent) !important;box-shadow:inset 0 1px 0 var(--o-sheen),inset 0 0 0 1px color-mix(in srgb,var(--o-accent) 24%,transparent) !important;-webkit-backdrop-filter:blur(10px) saturate(1.4);backdrop-filter:blur(10px) saturate(1.4)}',
    '[data-orchard-dot="today"]{background:color-mix(in srgb,var(--o-accent) 6%,transparent) !important;box-shadow:inset 0 0 0 1.5px var(--o-accent) !important;-webkit-backdrop-filter:blur(10px) saturate(1.4);backdrop-filter:blur(10px) saturate(1.4)}[data-orchard-dot="today"] *{color:var(--o-accent) !important}',
    '[data-orchard-chip="accent"]{background:color-mix(in srgb,var(--o-accent) 12%,transparent) !important;color:var(--o-accent) !important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--o-accent) 24%,transparent)}[data-orchard-chip="accent"] *{color:inherit !important;background:none !important}',
    /* 모바일: 출근하기 버튼을 화면 아래에 띄우지 않고, 웹처럼 인사 패널(오늘) 안에 둔다 */
    '@media (max-width:767px){.p-today section > div:has(> button){display:block !important}[data-orchard-glass="dock"]{display:none !important}}',
    '@keyframes orchard-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
    /* 패널이 차례로 떠오른다. main 에 걸면 그 안의 고정 버튼(모바일 출근 버튼)이 화면 밖으로 밀려서 패널마다 건다 */
    STILL || reduce ? '' : '[data-orchard-glass="panel"]{animation:orchard-rise .8s cubic-bezier(.32,.72,0,1) backwards;animation-delay:calc(var(--oi,0) * 70ms)}'
  ].join('\n');
  function markTheme() { root.classList.toggle('orchard-dark', isDark()); }
  markTheme();
  document.head.appendChild(css);

  /* ---------- 배경: 흐르는 꽃 ---------- */
  var HOMES = {
    splash: [[-0.72, 0.62], [0.78, 0.52], [-0.55, -0.70], [0.60, -0.62], [0.05, 0.96], [-0.98, -0.05], [0.98, -0.08], [0.00, -1.00]],
    auth:   [[-0.95, 0.80], [0.95, 0.75], [-0.90, -0.85], [0.92, -0.80], [0.30, 1.10], [-1.15, 0.00], [1.15, -0.05], [-0.25, -1.15]],
    seeds:  [[-0.90, 0.90], [0.85, 0.95], [-1.00, -0.60], [1.00, -0.55], [-0.15, 1.10], [-0.50, -1.10], [0.55, -1.10], [1.10, 0.25]],
    app:    [[-0.98, 0.78], [0.96, 0.84], [-1.02, -0.62], [0.98, -0.70], [-0.30, 1.12], [0.42, -1.14], [-1.16, 0.08], [1.14, 0.12]]
  };
  /* soft 가 작을수록 꽃잎이 또렷하다. 큰 꽃 몇 송이만 초점이 더 나가 있다 */
  var FL = [
    { r: 0.34, soft: 0.40, petals: 5, alpha: 0.88, core: 0.42, spin: 0.05 },
    { r: 0.26, soft: 0.24, petals: 5, alpha: 0.86, core: 0.38, spin: -0.07 },
    { r: 0.30, soft: 0.32, petals: 6, alpha: 0.82, core: 0.45, spin: 0.04 },
    { r: 0.21, soft: 0.18, petals: 5, alpha: 0.86, core: 0.36, spin: -0.09 },
    { r: 0.25, soft: 0.28, petals: 5, alpha: 0.78, core: 0.40, spin: 0.06 },
    { r: 0.19, soft: 0.16, petals: 6, alpha: 0.86, core: 0.34, spin: -0.05 },
    { r: 0.29, soft: 0.36, petals: 5, alpha: 0.74, core: 0.42, spin: 0.03 },
    { r: 0.17, soft: 0.15, petals: 5, alpha: 0.86, core: 0.36, spin: 0.08 }
  ];
  var pointer = { x: 0, y: 0, lt: 0, active: 0, down: 0, vx: 0, vy: 0, tvx: 0, tvy: 0 };
  var bg = null, fx = null;

  function toP(cx, cy) {
    var w = window.innerWidth, h = window.innerHeight, m = Math.min(w, h);
    return [(cx - w / 2) / m, (h / 2 - cy) / m];
  }

  function initBackground() {
    var canvas = document.createElement('canvas');
    canvas.id = 'orchard-bg';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    var scene = new THREE.Scene();
    var cam = new THREE.Camera();
    var U = {
      uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(9, 9) }, uVel: { value: new THREE.Vector2() }, uPress: { value: 0 },
      uRip: { value: [new THREE.Vector3(0, 0, -99), new THREE.Vector3(0, 0, -99), new THREE.Vector3(0, 0, -99), new THREE.Vector3(0, 0, -99)] },
      uFl: { value: [] }, uFs: { value: [] }, uPetal: { value: [] }, uEdge: { value: [] }, uCore: { value: [] },
      uBase: { value: new THREE.Color() }, uField: { value: [] }, uFieldAmt: { value: 0.8 },
      uHalo: { value: new THREE.Color() }, uHaloAmt: { value: 0.5 }, uAlpha: { value: 1 }, uGrain: { value: 0.04 }
    };
    for (var i = 0; i < 8; i++) {
      U.uFl.value.push(new THREE.Vector4());
      U.uFs.value.push(new THREE.Vector4(FL[i].soft, FL[i].petals, FL[i].alpha, FL[i].core));
      U.uPetal.value.push(new THREE.Color());
      U.uEdge.value.push(new THREE.Color());
      U.uCore.value.push(new THREE.Color());
    }
    for (var j = 0; j < 5; j++) U.uField.value.push(new THREE.Color());
    var mat = new THREE.ShaderMaterial({
      uniforms: U, depthTest: false, depthWrite: false,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'uniform vec2 uRes; uniform float uTime;',
        'uniform vec2 uPointer; uniform vec2 uVel; uniform float uPress;',
        'uniform vec3 uRip[4];',
        'uniform vec4 uFl[8]; uniform vec4 uFs[8]; uniform vec3 uPetal[8]; uniform vec3 uEdge[8]; uniform vec3 uCore[8];',
        'uniform vec3 uBase; uniform vec3 uField[5]; uniform vec3 uHalo;',
        'uniform float uFieldAmt; uniform float uHaloAmt; uniform float uAlpha; uniform float uGrain;',
        'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
        // 색 번짐: 휘어진 사인 물결. 격자 잡음은 네모난 경계가 비쳐서 쓰지 않는다
        'float field(vec2 p, float s, float t){',
        '  vec2 w = p + 0.32 * vec2(sin(p.y * 1.9 + s * 1.7 + t * 0.11), cos(p.x * 1.6 - s * 1.3 - t * 0.09));',
        '  float a = sin(w.x * 2.6 + s) * sin(w.y * 2.2 - s * 0.6 + t * 0.07);',
        '  float b = sin((w.x + w.y) * 1.7 + s * 2.3 - t * 0.05);',
        '  return 0.5 + 0.3 * a + 0.2 * b;',
        '}',
        'void main(){',
        '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
        '  float t = uTime;',
        // 포인터가 물을 끌고 간다
        '  vec2 dp = p - uPointer; float g = exp(-dot(dp, dp) * 14.0);',
        '  p -= uVel * g * 0.6;',
        '  p -= dp * g * 0.22 * uPress;',
        // 누른 자리에서 번지는 물결
        '  for (int i = 0; i < 4; i++) {',
        '    vec3 r = uRip[i]; float age = t - r.z;',
        '    if (age > 0.0 && age < 4.0) {',
        '      vec2 d = p - r.xy; float l = length(d) + 0.0001; float front = age * 0.45;',
        '      float w = sin((l - front) * 38.0) * exp(-pow((l - front) * 7.0, 2.0)) * exp(-age * 1.1);',
        '      p += d / l * w * 0.028;',
        '    }',
        '  }',
        // 물 흐르듯 느리게 휘는 좌표
        '  vec2 q = p;',
        '  q += 0.07 * vec2(sin(q.y * 2.6 + t * 0.23), cos(q.x * 2.2 - t * 0.19));',
        '  q += 0.035 * vec2(sin(q.y * 5.3 - t * 0.31 + 1.7), cos(q.x * 4.9 + t * 0.27 + 0.6));',
        '  float f1 = field(q, 0.0, t);',
        '  float f2 = field(q * 0.85 + 3.1, 2.4, t);',
        '  float f3 = field(q * 1.20 - 1.7, 4.9, t);',
        '  float f4 = field(q * 0.75 + 5.3, 7.1, t);',
        '  float f5 = field(q * 1.05 - 4.2, 9.6, t);',
        '  vec3 col = uBase;',
        '  col = mix(col, uField[0], smoothstep(0.38, 0.98, f1) * uFieldAmt);',
        '  col = mix(col, uField[1], smoothstep(0.40, 1.00, f2) * uFieldAmt);',
        '  col = mix(col, uField[2], smoothstep(0.42, 1.00, f3) * uFieldAmt * 0.85);',
        '  col = mix(col, uField[3], smoothstep(0.40, 1.00, f4) * uFieldAmt);',
        '  col = mix(col, uField[4], smoothstep(0.42, 1.00, f5) * uFieldAmt * 0.9);',
        // 꽃: 둥근 꽃잎 다섯(여섯) 장, 그 안에 반 칸 돌아간 속꽃잎, 가운데 심
        '  for (int i = 0; i < 8; i++) {',
        '    vec4 fl = uFl[i]; vec4 fs = uFs[i];',
        '    vec2 d = q - fl.xy; float len = length(d); float a = atan(d.y, d.x) + fl.w;',
        '    float s = fs.x; float k = fs.y * 0.5;',
        '    float lob = abs(cos(k * a));',
        '    float n = len / (fl.z * mix(0.54, 1.0, pow(lob, 0.5)));',
        '    float halo = 1.0 - smoothstep(0.6, 1.0 + s * 2.4, len / fl.z);',
        '    float petal = 1.0 - smoothstep(1.0 - s, 1.0 + s * 0.6, n);',
        '    float lob2 = abs(sin(k * a));',
        '    float n2 = len / (fl.z * 0.56 * mix(0.58, 1.0, pow(lob2, 0.5)));',
        '    float inner = 1.0 - smoothstep(1.0 - s, 1.0 + s * 0.6, n2);',
        '    float cr = fs.w * 0.5;',
        '    float core = 1.0 - smoothstep(cr * (1.0 - s), cr * (1.0 + s * 1.6), len / (fl.z * 0.9));',
        '    float al = fs.z * uAlpha;',
        '    vec3 pc = mix(uPetal[i], uEdge[i], smoothstep(0.30, 1.05, n + (f3 - 0.5) * 0.4));',
        // 꽃잎 사이 골은 가장자리 색 쪽으로 살짝 기운다
        '    pc = mix(pc, uEdge[i], (1.0 - lob) * 0.4 * smoothstep(0.15, 0.9, n));',
        '    col = mix(col, uHalo, halo * uHaloAmt * al);',
        '    col = mix(col, pc, petal * al);',
        '    col = mix(col, mix(uPetal[i], uCore[i], 0.28), inner * al * 0.5);',
        '    col = mix(col, uCore[i], core * al * 0.78);',
        '  }',
        '  col += (hash(gl_FragCoord.xy + fract(t) * 91.7) - 0.5) * uGrain;',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

    var homes = HOMES[LAYOUT] || HOMES.app, start = STILL ? 1 : 0.5;
    var flowers = FL.map(function (f, i) { return { x: homes[i][0] * start, y: homes[i][1] * start, vx: 0, vy: 0, rot: i * 1.3, spinV: 0, ph: i * 2.17 }; });
    var target = paletteFor(state.scheme, isDark());
    var tmp = new THREE.Color(), first = true, ripIndex = 0;

    function setTarget() { target = paletteFor(state.scheme, isDark()); if (STILL) first = true; }
    function lerpColor(c, hex, k) { tmp.set(hex); if (first) c.copy(tmp); else c.lerp(tmp, k); }
    function resize() {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      renderer.getDrawingBufferSize(U.uRes.value);
    }
    function ripple(px, py) {
      U.uRip.value[ripIndex].set(px, py, clock.t);
      ripIndex = (ripIndex + 1) % 4;
      flowers.forEach(function (f) {
        var dx = f.x - px, dy = f.y - py, l = Math.sqrt(dx * dx + dy * dy) + 0.001, k = 1.4 * Math.exp(-l * 2.2);
        f.vx += dx / l * k; f.vy += dy / l * k; f.spinV += (dx > 0 ? 1 : -1) * k * 0.8;
      });
    }
    function frame(dt) {
      var w = window.innerWidth, h = window.innerHeight, m = Math.min(w, h), hx = w / m / 2, hy = h / m / 2, t = clock.t;
      var k = 1 - Math.exp(-dt * 2.2);
      lerpColor(U.uBase.value, target.base, k);
      for (var j = 0; j < 5; j++) lerpColor(U.uField.value[j], target.fields[j], k);
      lerpColor(U.uHalo.value, target.halo, k);
      U.uFieldAmt.value += (target.fieldAmt - U.uFieldAmt.value) * (first ? 1 : k);
      U.uHaloAmt.value += (target.haloAmt - U.uHaloAmt.value) * (first ? 1 : k);
      U.uAlpha.value += (target.alpha - U.uAlpha.value) * (first ? 1 : k);
      U.uGrain.value = target.grain;
      // 포인터 속도는 부드럽게 따라오다 잦아든다
      pointer.vx += (pointer.tvx - pointer.vx) * (1 - Math.exp(-dt * 8));
      pointer.vy += (pointer.tvy - pointer.vy) * (1 - Math.exp(-dt * 8));
      pointer.tvx *= Math.exp(-dt * 5); pointer.tvy *= Math.exp(-dt * 5);
      pointer.active = Math.max(0, pointer.active - dt);
      U.uVel.value.set(pointer.vx, pointer.vy);
      U.uPress.value += ((pointer.down ? 1 : 0) - U.uPress.value) * (1 - Math.exp(-dt * 6));
      if (pointer.active > 0) U.uPointer.value.set(pointer.x, pointer.y);
      for (var i = 0; i < 8; i++) {
        var f = flowers[i], F = FL[i];
        var hxp = homes[i][0] * hx + 0.07 * Math.sin(t * 0.21 + f.ph), hyp = homes[i][1] * hy + 0.07 * Math.cos(t * 0.17 + f.ph * 1.7);
        if (STILL) { f.x = hxp; f.y = hyp; }
        else {
          var ax = 5.5 * (hxp - f.x) - 3.0 * f.vx, ay = 5.5 * (hyp - f.y) - 3.0 * f.vy;
          if (pointer.active > 0) {
            var dx = f.x - pointer.x, dy = f.y - pointer.y, l = Math.sqrt(dx * dx + dy * dy) + 0.001, R = F.r + 0.24;
            if (l < R) { var push = Math.pow(1 - l / R, 2) * 10; ax += dx / l * push; ay += dy / l * push; f.spinV += (dx * pointer.vy - dy * pointer.vx) * 6 * dt; }
          }
          f.vx += ax * dt; f.vy += ay * dt; f.x += f.vx * dt; f.y += f.vy * dt;
          f.spinV *= Math.exp(-dt * 1.5); f.rot += (F.spin + f.spinV) * dt;
        }
        U.uFl.value[i].set(f.x, f.y, F.r, f.rot);
        lerpColor(U.uPetal.value[i], target.petals[i], k);
        lerpColor(U.uEdge.value[i], target.edges[i], k);
        lerpColor(U.uCore.value[i], target.cores[i], k);
      }
      first = false;
      U.uTime.value = t;
      renderer.render(scene, cam);
    }
    // 정지 화면: 지금 그림을 2D 캔버스로 옮기고 WebGL을 놓아 준다(보드 목록에 화면이 많아서)
    function freeze() {
      var ok = !renderer.getContext().isContextLost();
      if (ok) {
        var flat = document.createElement('canvas');
        flat.id = 'orchard-bg'; flat.setAttribute('aria-hidden', 'true');
        flat.width = canvas.width; flat.height = canvas.height;
        flat.getContext('2d').drawImage(canvas, 0, 0);
        canvas.parentNode.replaceChild(flat, canvas);
      } else canvas.parentNode.removeChild(canvas);
      renderer.dispose(); renderer.forceContextLoss();
      return ok;
    }
    resize();
    return { frame: frame, resize: resize, ripple: ripple, setTarget: setTarget, freeze: freeze };
  }

  /* ---------- 에셋: three.js 로우폴리 ---------- */
  function initAssets() {
    var BUF = 720;
    var gl = null, renderer = null;
    function wake() {
      gl = document.createElement('canvas');
      renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true, alpha: true });
      renderer.setPixelRatio(1);
      renderer.setSize(BUF, BUF, false);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.setClearColor(0x000000, 0);
      renderer.setScissorTest(true);
      if (envMats.length) { env = makeEnv(); envMats.forEach(function (m) { m.envMap = env; m.needsUpdate = true; }); }
    }
    // 스튜디오 조명(위·왼쪽 앞·오른쪽·바닥의 밝은 판)을 굽는다. 매끄러운 과일의 윤기는 여기서 나온다
    var env = null, envMats = [];
    function makeEnv() {
      var pm = new THREE.PMREMGenerator(renderer), sc = new THREE.Scene();
      sc.add(new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.21, 0.23), side: THREE.BackSide })));
      function panel(w, h, x, y, z, r, g, b) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), side: THREE.DoubleSide }));
        m.position.set(x, y, z); m.lookAt(0, 0, 0); sc.add(m);
      }
      panel(7, 7, 0, 5.6, 0, 1.9, 1.9, 1.9);
      panel(3.4, 4.4, -4.6, 2.8, 4, 4.4, 4.3, 4.1);
      panel(3, 4, 5.2, 1.4, 1, 1.0, 1.15, 1.4);
      panel(8, 8, 0, -5.6, 0, 0.45, 0.4, 0.35);
      var tex = pm.fromScene(sc, 0.035).texture;
      pm.dispose();
      return tex;
    }
    function glossy(opt) {
      if (!env) env = makeEnv();
      var m = new THREE.MeshPhysicalMaterial(Object.assign({ metalness: 0, envMap: env, envMapIntensity: 0.7 }, opt));
      envMats.push(m);
      return m;
    }
    wake();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var views = [];

    function lin(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
    function at(o, x, y, z) { o.position.set(x, y, z); return o; }
    function clamp01(x) { return Math.min(1, Math.max(0, x)); }
    function smooth(a, b, x) { var t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
    function h3(x, y, z) { var n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return n - Math.floor(n); }
    function n3(x, y, z) {
      var ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
      function l(a, b, t) { return a + (b - a) * t; }
      return l(l(l(h3(ix, iy, iz), h3(ix + 1, iy, iz), fx), l(h3(ix, iy + 1, iz), h3(ix + 1, iy + 1, iz), fx), fy),
               l(l(h3(ix, iy, iz + 1), h3(ix + 1, iy, iz + 1), fx), l(h3(ix, iy + 1, iz + 1), h3(ix + 1, iy + 1, iz + 1), fx), fy), fz);
    }
    function fbm(x, y, z, oct) { var a = 0.5, sum = 0, tot = 0; for (var i = 0; i < oct; i++) { sum += a * n3(x, y, z); tot += a; x = x * 2.03 + 17.1; y = y * 2.03 + 9.2; z = z * 2.03 + 5.7; a *= 0.5; } return sum / tot; }
    function rgb(hex) { var c = new THREE.Color(hex); return [c.r, c.g, c.b]; }
    function mix3(o, a, b, t) { o[0] = a[0] + (b[0] - a[0]) * t; o[1] = a[1] + (b[1] - a[1]) * t; o[2] = a[2] + (b[2] - a[2]) * t; return o; }

    // 구에 입히는 그림: 구 표면의 점마다 색을 정한다(이음매와 극점이 뭉개지지 않는다)
    function sphereCanvas(w, h, fn) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var ctx = c.getContext('2d'), img = ctx.createImageData(w, h), px = img.data, o = [0, 0, 0], d = { x: 0, y: 0, z: 0 };
      for (var j = 0; j < h; j++) {
        var th = (j + 0.5) / h * Math.PI, sy = Math.cos(th), sr = Math.sin(th);
        for (var i = 0; i < w; i++) {
          var ph = (i + 0.5) / w * Math.PI * 2;
          d.x = -Math.cos(ph) * sr; d.y = sy; d.z = Math.sin(ph) * sr;
          fn(o, d);
          var k = (j * w + i) * 4;
          px[k] = clamp01(o[0]) * 255; px[k + 1] = clamp01(o[1]) * 255; px[k + 2] = clamp01(o[2]) * 255; px[k + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      return c;
    }
    // 구 위의 점(위도 y, 경도)에 작은 점을 찍는다. 극에 가까울수록 가로로 늘려 둥글게 보이게 한다
    function dots(c, n, y0, y1, rMin, rMax, style, alpha, seed) {
      var ctx = c.getContext('2d'), w = c.width, h = c.height;
      ctx.fillStyle = style;
      for (var i = 0; i < n; i++) {
        var y = y0 + (y1 - y0) * h3(i * 1.31, seed, 0.7), u = h3(i * 0.73, seed + 3.1, 1.9), th = Math.acos(y), sr = Math.max(0.3, Math.sin(th));
        var r = rMin + (rMax - rMin) * h3(i * 2.17, seed + 7.7, 0.3);
        ctx.globalAlpha = alpha * (0.5 + 0.5 * h3(i * 3.3, seed, 2.2));
        ctx.beginPath(); ctx.ellipse(u * w, th / Math.PI * h, r / sr, r, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      return c;
    }
    function tex(canvas, color) {
      var t = new THREE.CanvasTexture(canvas);
      t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
      if (color) t.encoding = THREE.sRGBEncoding;
      return t;
    }
    // 매끄러운 몸통: 촘촘한 구를 빚은 뒤, 같은 자리에 겹친 꼭짓점(이음매, 극점)의 법선을 평균해 줄이 보이지 않게 한다
    function weld(geo) {
      geo.computeVertexNormals();
      var p = geo.attributes.position, n = geo.attributes.normal, map = {}, i, k;
      for (i = 0; i < p.count; i++) { k = Math.round(p.getX(i) * 5e3) + ',' + Math.round(p.getY(i) * 5e3) + ',' + Math.round(p.getZ(i) * 5e3); (map[k] = map[k] || []).push(i); }
      for (k in map) {
        var a = map[k]; if (a.length < 2) continue;
        var x = 0, y = 0, z = 0;
        a.forEach(function (q) { x += n.getX(q); y += n.getY(q); z += n.getZ(q); });
        var l = Math.sqrt(x * x + y * y + z * z) || 1;
        a.forEach(function (q) { n.setXYZ(q, x / l, y / l, z / l); });
      }
      return geo;
    }
    function ball(shape, ws, hs) {
      var geo = new THREE.SphereGeometry(1, ws || 96, hs || 64), p = geo.attributes.position, v = new THREE.Vector3(), u = new THREE.Vector3();
      for (var i = 0; i < p.count; i++) { u.fromBufferAttribute(p, i).normalize(); v.copy(u); shape(v, u); p.setXYZ(i, v.x, v.y, v.z); }
      return weld(geo);
    }
    function hollow(v, u, top, topR, bottom, bottomR) {
      var r = Math.sqrt(u.x * u.x + u.z * u.z);
      if (u.y > 0) v.y -= top * Math.pow(Math.max(0, 1 - r / topR), 1.7);
      else v.y += bottom * Math.pow(Math.max(0, 1 - r / bottomR), 1.7);
    }
    function tube(pts, r, mat, seg) {
      var curve = new THREE.CatmullRomCurve3(pts.map(function (q) { return new THREE.Vector3(q[0], q[1], q[2]); }));
      return new THREE.Mesh(new THREE.TubeGeometry(curve, seg || 14, r, 8, false), mat);
    }
    // 잎: 밑동에서 +z로 뻗는다. 가운데 잎맥을 따라 살짝 접히고 끝이 처진다
    function leafTex(base, tip, vein) {
      var c = document.createElement('canvas'); c.width = 128; c.height = 256;
      var x = c.getContext('2d'), g = x.createLinearGradient(0, 256, 0, 0);
      g.addColorStop(0, base); g.addColorStop(1, tip); x.fillStyle = g; x.fillRect(0, 0, 128, 256);
      var side = x.createLinearGradient(0, 0, 128, 0);
      side.addColorStop(0, 'rgba(0,0,0,.16)'); side.addColorStop(0.5, 'rgba(0,0,0,0)'); side.addColorStop(1, 'rgba(255,255,255,.08)');
      x.fillStyle = side; x.fillRect(0, 0, 128, 256);
      x.strokeStyle = vein; x.lineCap = 'round';
      x.globalAlpha = 0.9; x.lineWidth = 3; x.beginPath(); x.moveTo(64, 256); x.lineTo(64, 6); x.stroke();
      x.globalAlpha = 0.6; x.lineWidth = 1.6;
      for (var i = 1; i <= 9; i++) { var y = 256 - i * 25; x.beginPath(); x.moveTo(64, y); x.quadraticCurveTo(30, y - 20, 2, y - 44); x.moveTo(64, y); x.quadraticCurveTo(98, y - 20, 126, y - 44); x.stroke(); }
      var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
      return t;
    }
    function realLeaf(len, wid, mat, o) {
      o = o || {};
      var geo = new THREE.PlaneGeometry(1, 1, 10, 24), p = geo.attributes.position, uv = geo.attributes.uv;
      for (var i = 0; i < p.count; i++) {
        var u = uv.getY(i), sgn = uv.getX(i) * 2 - 1, prof = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.72)), 0.8);
        var x = sgn * wid * 0.5 * prof;
        var y = (o.fold == null ? 0.22 : o.fold) * Math.abs(x) - (o.droop == null ? 0.18 : o.droop) * len * u * u + (o.wave || 0) * Math.sin(u * 9 + sgn * 2) * Math.abs(sgn) * wid * 0.12;
        p.setXYZ(i, x, y, u * len);
      }
      geo.computeVertexNormals();
      var g = new THREE.Group(); g.add(new THREE.Mesh(geo, mat));
      g.rotation.order = 'YXZ'; g.rotation.set(-(o.tilt || 0), o.heading || 0, o.roll || 0);
      return g;
    }
    function leafMat(base, tip, vein, gloss) {
      return glossy({ map: leafTex(base, tip, vein), side: THREE.DoubleSide, roughness: gloss ? 0.34 : 0.6, clearcoat: gloss ? 0.5 : 0.12, clearcoatRoughness: 0.3, envMapIntensity: gloss ? 0.8 : 0.45 });
    }
    var shadowTex = (function () {
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
      g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(0.6, 'rgba(0,0,0,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();
    function shadow(r, y, o) {
      var m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: o, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.y = y;
      return m;
    }
    var grain = null;
    function grainTex() {   // 고운 결(범프용)
      if (!grain) grain = tex(sphereCanvas(256, 128, function (o, d) { var g = 0.5 + (fbm(d.x * 26, d.y * 26, d.z * 26, 2) - 0.5) * 0.9; o[0] = o[1] = o[2] = g; }));
      return grain;
    }
    var twig = null;
    function twigMat() { return twig || (twig = new THREE.MeshStandardMaterial({ color: lin('#7A4A12'), roughness: 0.78, metalness: 0 })); }

    /* 과일 4종. 반지름 1 안팎, 중심이 원점. 보내 주신 사진을 보고 모양·색·질감을 다시 만들었다.
       한 번 만든 몸통·재질은 여러 자리에서 같이 쓴다 */
    var parts = {};
    var FRUIT = {
      // 사과: 어깨가 넓고 꼭지가 깊다. 붉은 바탕에 꼭지 둘레와 한쪽 볼이 노랗게 비치고, 옅은 점이 박혀 있다
      apple: function () {
        var q = parts.apple;
        if (!q) {
          var deep = rgb(A.red[30]), red = rgb(A.red[40]), bright = rgb(A.red[50]), yg = rgb('#DDE38A'), blush = rgb('#F5A23C'), side = [-0.8, 0.25, 0.55];
          var map = sphereCanvas(512, 256, function (o, d) {
            var th = Math.atan2(d.z, d.x), streak = fbm(Math.cos(th) * 9, d.y * 1.3, Math.sin(th) * 9, 3), blot = fbm(d.x * 2.2 + 5, d.y * 2.2, d.z * 2.2, 3);
            mix3(o, deep, red, smooth(0.25, 0.8, blot));
            mix3(o, o, bright, smooth(0.55, 0.85, streak) * 0.22);
            mix3(o, o, blush, smooth(0.62, 1.05, d.x * side[0] + d.y * side[1] + d.z * side[2] + (streak - 0.5) * 0.8) * 0.42);
            mix3(o, o, yg, smooth(0.74, 1.02, d.y + (streak - 0.5) * 0.5) * 0.9);
            var k = 1 - 0.14 * smooth(-0.35, -1, d.y); o[0] *= k; o[1] *= k; o[2] *= k;
          });
          dots(map, 240, -0.9, 0.5, 0.6, 1.4, A.orange[80], 0.7, 1.7);
          q = parts.apple = {
            body: ball(function (v, u) {
              var th = Math.atan2(u.z, u.x), y = u.y, w = 1.06 + 0.07 * y - 0.08 * y * y;
              if (y < 0) w *= 1 + 0.03 * Math.cos(5 * th) * Math.pow(-y, 1.5);
              w *= 1 + 0.012 * Math.sin(3 * th + 1);
              v.x *= w; v.z *= w; v.y *= 0.92;
              hollow(v, u, 0.36, 0.52, 0.18, 0.4);
            }),
            skin: glossy({ map: tex(map, true), bumpMap: grainTex(), bumpScale: 0.004, roughness: 0.36, clearcoat: 0.55, clearcoatRoughness: 0.28 }),
            leaf: leafMat(A.green[40], A.green[50], A.lime[80], false)
          };
        }
        var g = new THREE.Group();
        g.add(new THREE.Mesh(q.body, q.skin));
        g.add(tube([[0, 0.5, 0], [0.02, 0.8, 0], [0.1, 1.12, 0.03]], 0.04, twigMat()));
        var tip = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), twigMat()); tip.scale.set(1, 0.8, 1); g.add(at(tip, 0.1, 1.13, 0.03));
        g.add(at(realLeaf(0.98, 0.6, q.leaf, { heading: 1.2, tilt: 0.8, roll: 1.15, fold: 0.2, droop: 0.12 }), 0.05, 0.78, 0.02));
        return g;
      },
      // 귤: 납작하고 껍질이 오돌토돌하다. 꼭지에서 골이 퍼지고 별 모양 초록 꼭지가 있다
      tangerine: function () {
        var q = parts.tangerine;
        if (!q) {
          var c0 = rgb('#FF8400'), c1 = rgb(A.orange[50]), c2 = rgb('#EE6F00');
          var map = sphereCanvas(512, 256, function (o, d) {
            var blot = fbm(d.x * 2.4, d.y * 2.4 + 3, d.z * 2.4, 3), fine = fbm(d.x * 22, d.y * 22, d.z * 22, 2);
            mix3(o, c0, c1, smooth(0.3, 0.8, blot + 0.2 * d.y));
            mix3(o, o, c2, smooth(0.5, 0.85, 1 - blot) * 0.4);
            var k = 0.95 + fine * 0.1; o[0] *= k; o[1] *= k; o[2] *= k;
          });
          var pores = sphereCanvas(512, 256, function (o, d) { var g = 0.62 + (fbm(d.x * 9, d.y * 9, d.z * 9, 2) - 0.5) * 0.35; o[0] = o[1] = o[2] = g; });
          dots(pores, 3200, -0.98, 0.98, 1.1, 2.2, '#1c1c1c', 0.6, 4.2);
          var star = new THREE.Shape();
          for (var i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2, r = i % 2 ? 0.1 : 0.22; if (i) star.lineTo(Math.cos(a) * r, Math.sin(a) * r); else star.moveTo(r, 0); }
          var starGeo = new THREE.ExtrudeGeometry(star, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 });
          starGeo.rotateX(-Math.PI / 2);
          q = parts.tangerine = {
            body: ball(function (v, u) {
              var th = Math.atan2(u.z, u.x), y = u.y, w = 1.08 * (1 + 0.012 * Math.sin(2 * th + 0.6));
              w *= 1 - 0.06 * smooth(0.25, 0.97, y) * (0.5 + 0.5 * Math.cos(8 * th));
              v.x *= w; v.z *= w; v.y *= 0.88;
              hollow(v, u, 0.13, 0.34, 0.05, 0.3);
              v.multiplyScalar(1 + (fbm(u.x * 3, u.y * 3, u.z * 3, 2) - 0.5) * 0.03);
            }),
            skin: glossy({ map: tex(map, true), bumpMap: tex(pores), bumpScale: 0.016, roughness: 0.52, clearcoat: 0.3, clearcoatRoughness: 0.45 }),
            star: starGeo,
            green: new THREE.MeshStandardMaterial({ color: lin('#6FA53A'), roughness: 0.7 }),
            nub: new THREE.MeshStandardMaterial({ color: lin('#B8BE95'), roughness: 0.8 })
          };
        }
        var g = new THREE.Group();
        g.add(new THREE.Mesh(q.body, q.skin));
        g.add(at(new THREE.Mesh(q.star, q.green), 0, 0.745, 0));
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.06, 10), q.nub), 0, 0.81, 0));
        return g;
      },
      // 복숭아: 앞쪽에 골이 지고 양 볼이 통통하다. 크림색 바탕에 분홍이 번지고 솜털처럼 보송하다
      peach: function () {
        var q = parts.peach;
        if (!q) {
          var cream = rgb(A.orange[90]), yel = rgb(A.orange[80]), p1 = rgb(A.red[80]), p2 = rgb(A.red[70]), p3 = rgb('#FF6F86');
          var map = sphereCanvas(512, 256, function (o, d) {
            var n = fbm(d.x * 1.8 + 2, d.y * 1.8, d.z * 1.8, 3), m = fbm(d.x * 4 + 9, d.y * 4, d.z * 4, 3), fine = fbm(d.x * 40, d.y * 40, d.z * 40, 2);
            var crease = Math.exp(-Math.pow(d.x / 0.14, 2)) * (d.z > 0 ? 1 : 0.2);
            mix3(o, cream, yel, smooth(0.3, 0.8, m));
            mix3(o, o, p1, smooth(0.22, 0.6, n + 0.22 * d.x - 0.3 * crease + 0.08));
            mix3(o, o, p2, smooth(0.36, 0.72, n + 0.3 * d.x - 0.35 * crease));
            mix3(o, o, p3, smooth(0.48, 0.86, m + 0.35 * d.x - 0.2 * d.y - 0.4 * crease) * 0.7);
            var k = 0.96 + fine * 0.08; o[0] *= k; o[1] *= k; o[2] *= k;
          });
          q = parts.peach = {
            body: ball(function (v, u) {
              var y = u.y, front = u.z > 0 ? 1 : 0.22;
              var c = Math.exp(-Math.pow(u.x / 0.17, 2)) * front * (0.45 + 0.55 * smooth(-1, 0.9, y));
              var w = 1.03 + 0.05 * y - 0.04 * y * y;
              v.x *= w; v.z *= w; v.y *= 0.95;
              v.multiplyScalar(1 - 0.12 * c);
              var cheek = Math.exp(-Math.pow((Math.abs(u.x) - 0.42) / 0.3, 2)) * (u.z > 0 ? 1 : 0.3);
              v.x += (u.x > 0 ? 1 : -1) * 0.04 * cheek; v.z += 0.03 * cheek * (u.z > 0 ? 1 : 0);
              hollow(v, u, 0.24, 0.46, 0, 1);
              if (y < -0.7) v.y -= 0.05 * smooth(-0.7, -1, y);
            }),
            skin: glossy({ map: tex(map, true), bumpMap: grainTex(), bumpScale: 0.006, roughness: 0.95, sheen: new THREE.Color(0.95, 0.72, 0.72), envMapIntensity: 0.4 }),
            leaf: leafMat(A.green[30], A.green[40], A.lime[70], false)
          };
        }
        var g = new THREE.Group();
        g.add(new THREE.Mesh(q.body, q.skin));
        g.add(tube([[0, 0.66, 0.02], [0.0, 0.84, 0.03]], 0.04, twigMat(), 4));
        g.add(at(realLeaf(0.8, 0.3, q.leaf, { heading: 1.35, tilt: 0.5, roll: -0.5, droop: 0.25 }), 0.02, 0.8, 0.04));
        g.add(at(realLeaf(0.62, 0.26, q.leaf, { heading: -1.5, tilt: 0.85, roll: 0.45, droop: 0.2 }), -0.02, 0.8, 0.02));
        return g;
      },
      // 커피 열매: 가지에 다닥다닥 달린 윤기 나는 붉은 열매와 넓은 잎 두 장. 열매 끝에 배꼽이 있다
      coffee: function () {
        var q = parts.coffee;
        if (!q) {
          var skin = function (a, b, hi, seed) {
            var c0 = rgb(a), c1 = rgb(b), c2 = rgb(hi);
            var map = sphereCanvas(256, 128, function (o, d) {
              var n = fbm(d.x * 2.6 + seed, d.y * 2.6, d.z * 2.6, 3);
              mix3(o, c0, c1, smooth(0.25, 0.75, n + 0.2 * d.y));
              mix3(o, o, c2, smooth(0.6, 0.95, n + 0.3 * d.x) * 0.35);
            });
            return glossy({ map: tex(map, true), roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1 });
          };
          q = parts.coffee = {
            body: ball(function (v, u) { v.y *= 1.1; var w = 1 + 0.04 * u.y; v.x *= w; v.z *= w; hollow(v, u, 0.05, 0.2, 0.07, 0.24); }),
            skins: [skin(A.red[30], A.red[40], A.red[50], 1), skin('#8E0808', A.red[30], A.red[40], 5), skin(A.red[20], '#8E0808', A.red[30], 9)],
            navel: new THREE.MeshStandardMaterial({ color: lin(A.red[10]), roughness: 0.6 }),
            stalk: new THREE.MeshStandardMaterial({ color: lin('#6E8B2E'), roughness: 0.6 }),
            leaf: leafMat(A.green[20], A.green[40], A.lime[60], true)
          };
        }
        var g = new THREE.Group();
        g.add(tube([[1.12, 0.84, -0.05], [0.6, 0.52, 0], [0.05, 0.24, 0], [-0.42, 0.02, 0]], 0.05, twigMat(), 20));
        // [x, y, z, 크기, 색, 배꼽이 향하는 쪽 x, z]
        [[0.5, 0.2, 0.3, 0.33, 0, 0.5, 0.55], [0.02, 0.6, 0.26, 0.31, 0, -0.1, 0.7], [-0.02, -0.2, 0.34, 0.36, 1, 0.1, 0.6], [-0.72, 0.24, 0.2, 0.32, 1, -0.5, 0.5], [-0.8, -0.56, 0.16, 0.34, 2, -0.3, 0.6]].forEach(function (c) {
          var b = new THREE.Group(), m = new THREE.Mesh(q.body, q.skins[c[4]]);
          b.add(m);
          var ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 8, 20), q.navel); ring.rotation.x = Math.PI / 2; b.add(at(ring, 0, -1.02, 0));
          b.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.15, 16).rotateX(Math.PI / 2), q.navel), 0, -1.03, 0));
          b.scale.setScalar(c[3]);
          b.rotation.set(-c[6], 0, c[5]);
          g.add(at(b, c[0], c[1], c[2]));
        });
        g.add(tube([[0.05, 0.24, 0], [-0.02, 0.0, 0.2]], 0.026, q.stalk, 4));
        g.add(tube([[-0.42, 0.02, 0], [-0.74, -0.24, 0.1]], 0.026, q.stalk, 4));
        g.add(at(realLeaf(1.5, 0.7, q.leaf, { heading: -1.25, tilt: 0.55, roll: -1.0, fold: 0.16, droop: 0.1, wave: 1 }), 0.3, 0.42, -0.14));
        g.add(at(realLeaf(1.35, 0.62, q.leaf, { heading: -2.1, tilt: -0.5, roll: -0.9, fold: 0.16, droop: 0.06, wave: 1 }), -0.3, 0.0, -0.18));
        g.scale.setScalar(0.96); g.position.set(0.12, -0.04, 0);
        return g;
      }
    };
    // 카메라 쪽으로 기울여 꼭지가 보이게 한다
    var TILT = { apple: 0.3, tangerine: 0.62, peach: 0.22, coffee: 0.05 };

    /* 자라는 단계. 바닥이 y = 0. 실제 나무처럼 만든다: 줄기에서 큰 가지가 갈라지고, 큰 가지에서 잔가지가 나오고, 가지 끝마다 잎이 한 다발씩 달린다.
       씨앗마다 나무 꼴이 다르다. 사과: 둥글게 퍼진 수관 · 귤: 낮고 빽빽한 수관에 짙은 잎 · 복숭아: 옆으로 벌어진 가지에 길고 처진 잎 · 커피: 가는 줄기에 층층이 뻗은 가지 */
    // 굵기가 변하는 줄기. flare 는 밑동이 퍼지는 정도, flute 는 세로 골의 깊이
    function limb(pts, r0, r1, mat, flare, seg, flute) {
      var curve = new THREE.CatmullRomCurve3(pts.map(function (q) { return new THREE.Vector3(q[0], q[1], q[2]); }));
      var rad = 12; seg = seg || 18;
      var geo = new THREE.TubeGeometry(curve, seg, 1, rad, false), p = geo.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
      for (var i = 0; i < p.count; i++) {
        var t = Math.floor(i / (rad + 1)) / seg;
        curve.getPointAt(t, c); v.fromBufferAttribute(p, i).sub(c);
        var lobes = Math.cos(5 * Math.atan2(v.z, v.x) + 0.6 + t * 1.2);
        var r = (r0 + (r1 - r0) * t) * (1 + (flare || 0) * Math.pow(1 - t, 5) * (1 + 0.35 * lobes)) * (1 + (flute || 0) * lobes * (1 - 0.7 * t)) * (1 + (fbm(v.x * 2 + t * 5, t * 6, v.z * 2, 2) - 0.5) * 0.14);
        v.multiplyScalar(r).add(c); p.setXYZ(i, v.x, v.y, v.z);
      }
      return new THREE.Mesh(weld(geo), mat);
    }
    function clay(hex, o) { return glossy(Object.assign({ color: lin(hex), roughness: 0.6, clearcoat: 0.18, clearcoatRoughness: 0.6, envMapIntensity: 0.55 }, o || {})); }
    function rng(seed) { var s = seed * 9301 + 49297; return function () { s = (s * 16807 + 11) % 2147483647; return (s & 0xffffff) / 0x1000000; }; }
    // 씨앗마다 잎 모양과 색이 다르다. fall 은 떨어지는 잎의 크기
    var LEAF = {
      apple:     { len: 0.4, wid: 0.24, base: '#3C8A34', tip: '#74B84C', vein: '#BEE092', gloss: false, fall: 0.62 },
      tangerine: { len: 0.38, wid: 0.2, base: '#1E6A2E', tip: '#3F9642', vein: '#9AD486', gloss: true, fall: 0.6 },
      peach:     { len: 0.5, wid: 0.15, base: '#4F9638', tip: '#98C858', vein: '#D6EEA6', gloss: false, fall: 0.62 },
      coffee:    { len: 0.5, wid: 0.25, base: '#1D6A30', tip: '#3A9444', vein: '#8FD07A', gloss: true, wave: 1, fall: 0.75 }
    };
    var leafCache = {};
    function leafOf(seed) {
      if (leafCache[seed]) return leafCache[seed];
      var L = LEAF[seed] || LEAF.apple, m0 = leafMat(L.base, L.tip, L.vein, L.gloss), m1 = leafMat(L.tip, L.tip, L.vein, L.gloss);
      return (leafCache[seed] = { L: L, mats: [m0, m1], geo: realLeaf(L.len, L.wid, m0, { fold: 0.28, droop: 0.22, wave: L.wave || 0 }).children[0].geometry });
    }
    // 꽃: 꽃잎 다섯 장이 오목하게 벌어지고 가운데에 꽃술이 있다
    var FLOWER = {
      apple:     { base: '#FFC9E0', tip: '#FFFFFF', wid: 0.085, size: 1.25, cup: 0.22 },
      tangerine: { base: '#F4FBE8', tip: '#FFFFFF', wid: 0.06, size: 1.05, cup: 0.2 },
      peach:     { base: '#FF7FBE', tip: '#FFC4E2', wid: 0.085, size: 1.3, cup: 0.22 },
      coffee:    { base: '#FFFFFF', tip: '#FFFFFF', wid: 0.045, size: 1.0, cup: 0.15 }
    };
    var flowerCache = {};
    function flowerOf(seed) {
      if (flowerCache[seed]) return flowerCache[seed];
      var F = FLOWER[seed] || FLOWER.apple, m = glossy({ map: leafTex(F.base, F.tip, F.tip), side: THREE.DoubleSide, roughness: 0.7, envMapIntensity: 0.5 });
      return (flowerCache[seed] = { F: F, mat: m, geo: realLeaf(0.1, F.wid, m, { fold: 0.22, droop: -0.18 }).children[0].geometry });
    }
    var kit = null;
    function treeKit() {
      if (kit) return kit;
      var i, j, k, o = [0, 0, 0];
      // 나무껍질: 세로로 갈라진 결. 관의 uv 는 x 가 길이, y 가 둘레
      var bark = document.createElement('canvas'), barkBump = document.createElement('canvas');
      bark.width = bark.height = barkBump.width = barkBump.height = 256;
      var bx = bark.getContext('2d'), bi = bx.createImageData(256, 256), bbx = barkBump.getContext('2d'), bbi = bbx.createImageData(256, 256);
      var dark = rgb('#3C2A1C'), mid = rgb('#6C4E34'), lite = rgb('#94745A');
      for (j = 0; j < 256; j++) for (i = 0; i < 256; i++) {
        var a = j / 256 * Math.PI * 2, len = i / 256;
        var n = fbm(Math.cos(a) * 5, len * 2.6, Math.sin(a) * 5, 4), fine = fbm(Math.cos(a) * 17, len * 7, Math.sin(a) * 17, 2), groove = smooth(0.36, 0.62, n);
        mix3(o, dark, mid, groove); mix3(o, o, lite, smooth(0.55, 0.9, fine) * 0.5);
        k = (j * 256 + i) * 4;
        bi.data[k] = o[0] * 255; bi.data[k + 1] = o[1] * 255; bi.data[k + 2] = o[2] * 255; bi.data[k + 3] = 255;
        bbi.data[k] = bbi.data[k + 1] = bbi.data[k + 2] = (0.2 + 0.62 * groove + 0.18 * fine) * 255; bbi.data[k + 3] = 255;
      }
      bx.putImageData(bi, 0, 0); bbx.putImageData(bbi, 0, 0);
      var barkMap = tex(bark, true), barkB = tex(barkBump); barkMap.wrapT = barkB.wrapT = THREE.RepeatWrapping;
      // 흙: 어두운 갈색에 밝은 알갱이
      var s0 = rgb('#3A2410'), s1 = rgb('#5E3C1A'), s2 = rgb('#7A5228');
      var soil = sphereCanvas(256, 128, function (o, d) {
        var n = fbm(d.x * 5, d.y * 5, d.z * 5, 3), m = fbm(d.x * 18 + 3, d.y * 18, d.z * 18, 2);
        mix3(o, s0, s1, smooth(0.3, 0.7, n)); mix3(o, o, s2, smooth(0.6, 0.9, m) * 0.6);
      });
      dots(soil, 260, 0.1, 0.98, 0.8, 1.8, '#9A7340', 0.6, 3.3);
      var soilBump = sphereCanvas(256, 128, function (o, d) { var g = 0.5 + (fbm(d.x * 16, d.y * 16, d.z * 16, 3) - 0.5) * 1.1; o[0] = o[1] = o[2] = g; });
      var weave = document.createElement('canvas'); weave.width = weave.height = 64;
      var wx = weave.getContext('2d'); wx.fillStyle = '#777'; wx.fillRect(0, 0, 64, 64);
      for (j = 0; j < 8; j++) for (i = 0; i < 8; i++) { wx.fillStyle = (i + j) % 2 ? '#d8d8d8' : '#3c3c3c'; wx.fillRect(i * 8 + 1, j * 8 + 1, 6, 6); }
      var weaveTex = new THREE.CanvasTexture(weave); weaveTex.wrapS = weaveTex.wrapT = THREE.RepeatWrapping; weaveTex.repeat.set(5, 2);
      var blade = leafMat('#3A8632', '#7DBE4E', '#A9DA7A', false);
      kit = {
        bark: glossy({ map: barkMap, bumpMap: barkB, bumpScale: 0.03, roughness: 0.92, envMapIntensity: 0.4 }),
        stalk: clay('#6FAE3E'),
        soilGeo: ball(function (v, u) {
          var w = 0.95 * (1 + (fbm(u.x * 3, u.y * 3, u.z * 3, 3) - 0.5) * 0.2);
          v.x *= w; v.z *= w; v.y *= u.y > 0 ? 0.1 : 0.06;
          v.y += (fbm(u.x * 6 + 2, u.y * 6, u.z * 6, 2) - 0.5) * 0.03 * (u.y > 0 ? 1 : 0);
        }, 48, 24),
        soil: glossy({ map: tex(soil, true), bumpMap: tex(soilBump), bumpScale: 0.03, roughness: 1, envMapIntensity: 0.35 }),
        blade: blade, bladeGeo: realLeaf(0.24, 0.04, blade, { fold: 0.5, droop: 0.5 }).children[0].geometry,
        stoneGeo: ball(function (v, u) { v.multiplyScalar(1 + (fbm(u.x * 2 + 4, u.y * 2, u.z * 2, 2) - 0.5) * 0.35); v.y *= 0.7; }, 20, 14),
        stone: clay('#8E8680', { roughness: 0.85, clearcoat: 0 }),
        seedGeo: ball(function (v, u) { v.x *= 0.72; v.z *= 0.56; v.y *= 1 + 0.25 * u.y; }, 32, 20),
        seed: clay('#9A6420', { roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.4 }),
        dotGeo: new THREE.SphereGeometry(1, 10, 8),
        pollen: clay('#F0C24A'),
        basketGeo: new THREE.LatheGeometry([[0.001, 0], [0.24, 0], [0.29, 0.1], [0.33, 0.26], [0.35, 0.3], [0.33, 0.3], [0.3, 0.12], [0.001, 0.06]].map(function (q) { return new THREE.Vector2(q[0], q[1]); }), 28),
        basket: glossy({ color: lin('#C98D42'), bumpMap: weaveTex, bumpScale: 0.03, roughness: 0.8, envMapIntensity: 0.4 })
      };
      return kit;
    }
    var _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4();
    // 물체의 +z 를 z 쪽으로, +y 를 되도록 y 쪽으로 돌린다
    function aim(obj, zx, zy, zz, yx, yy, yz) {
      _z.set(zx, zy, zz).normalize(); _y.set(yx, yy, yz); _x.crossVectors(_y, _z).normalize(); _y.crossVectors(_z, _x).normalize();
      _m.makeBasis(_x, _y, _z); obj.quaternion.setFromRotationMatrix(_m);
      return obj;
    }
    // 흙바닥: 가장자리에 풀이 돋아 있고 돌이 두 개 있다
    function ground() {
      var q = treeKit(), g = new THREE.Group(), o = new THREE.Object3D(), n = 110, i;
      g.add(at(new THREE.Mesh(q.soilGeo, q.soil), 0, -0.05, 0));
      var blades = new THREE.InstancedMesh(q.bladeGeo, q.blade, n); blades.frustumCulled = false;
      for (i = 0; i < n; i++) {
        var a = h3(i, 1, 2) * Math.PI * 2, r = 0.4 + Math.pow(h3(i, 2, 3), 0.6) * 0.52;
        o.position.set(Math.cos(a) * r, 0.01, Math.sin(a) * r);
        aim(o, (h3(i, 3, 1) - 0.5) * 0.9 + Math.cos(a) * 0.3, 1, (h3(i, 4, 1) - 0.5) * 0.9 + Math.sin(a) * 0.3, Math.cos(a), 0.2, Math.sin(a));
        o.scale.setScalar(0.6 + h3(i, 5, 1) * 0.9); o.updateMatrix(); blades.setMatrixAt(i, o.matrix);
      }
      g.add(blades);
      var s1 = new THREE.Mesh(q.stoneGeo, q.stone); s1.scale.setScalar(0.09); g.add(at(s1, 0.62, 0.05, 0.5));
      var s2 = new THREE.Mesh(q.stoneGeo, q.stone); s2.scale.setScalar(0.05); s2.rotation.y = 2; g.add(at(s2, -0.7, 0.04, 0.38));
      return g;
    }
    // 잎을 한꺼번에 놓는다. 한 장은 [x, y, z, 뻗는 쪽 xyz, 윗면이 보는 쪽 xyz, 크기]
    function sprays(grp, geo, mats, list) {
      var o = new THREE.Object3D(), sets = mats.map(function () { return []; });
      list.forEach(function (c, i) { sets[i % mats.length].push(c); });
      sets.forEach(function (arr, mi) {
        if (!arr.length) return;
        var im = new THREE.InstancedMesh(geo, mats[mi], arr.length); im.frustumCulled = false;
        arr.forEach(function (c, i) { o.position.set(c[0], c[1], c[2]); aim(o, c[3], c[4], c[5], c[6], c[7], c[8]); o.scale.setScalar(c[9]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
        grp.add(im);
      });
    }
    // 가지 마디(nodes: [x, y, z, 가지가 뻗는 쪽 xyz])에 꽃을 피운다
    function blossoms(grp, seed, nodes, count) {
      var q = treeKit(), fl = flowerOf(seed), R = rng(97), o = new THREE.Object3D(), c = new THREE.Object3D(), M = new THREE.Matrix4();
      var petals = new THREE.InstancedMesh(fl.geo, fl.mat, count * 5), mids = new THREE.InstancedMesh(q.dotGeo, q.pollen, count), n = 0;
      petals.frustumCulled = mids.frustumCulled = false; c.rotation.order = 'YXZ';
      for (var i = 0; i < count; i++) {
        var tp = nodes[Math.floor(R() * nodes.length)];
        var nx = tp[3] + (R() - 0.5) * 0.9, ny = tp[4] + 0.7 + R() * 0.4, nz = tp[5] + (R() - 0.5) * 0.9 + 0.3;   // 꽃은 바깥·위·앞을 본다
        o.position.set(tp[0] + (R() - 0.5) * 0.24, tp[1] + (R() - 0.3) * 0.18 + 0.04, tp[2] + (R() - 0.5) * 0.24);
        aim(o, ny, -nx, 0.013, nx, ny, nz);
        o.scale.setScalar(fl.F.size * (0.85 + R() * 0.45)); o.updateMatrix();
        for (var p = 0; p < 5; p++) {
          c.position.set(0, 0, 0); c.scale.setScalar(1); c.rotation.set(-fl.F.cup, p / 5 * Math.PI * 2 + i, 0); c.updateMatrix();
          M.multiplyMatrices(o.matrix, c.matrix); petals.setMatrixAt(n++, M);
        }
        c.rotation.set(0, 0, 0); c.position.set(0, 0.012, 0); c.scale.setScalar(0.024); c.updateMatrix();
        M.multiplyMatrices(o.matrix, c.matrix); mids.setMatrixAt(i, M);
      }
      grp.add(petals); grp.add(mids);
    }
    // 나무에 달리는 작은 열매: 과일의 몸통과 껍질을 그대로 줄여 쓴다
    function mini(seed) {
      if (!FRUIT[seed]) seed = 'apple';
      if (!parts[seed]) FRUIT[seed]();
      var q = parts[seed], g = new THREE.Group();
      if (seed === 'coffee') {
        [[0, 0, 0, 0], [0.11, -0.06, 0.04, 1], [-0.09, -0.08, 0.06, 2]].forEach(function (c) { var m = new THREE.Mesh(q.body, q.skins[c[3]]); m.scale.setScalar(0.085); g.add(at(m, c[0], c[1], c[2])); });
      } else { var m = new THREE.Mesh(q.body, q.skin); m.scale.setScalar(seed === 'tangerine' ? 0.125 : 0.135); g.add(m); }
      return g;
    }
    /* 나무 꼴. H: 줄기 높이, boughs: 큰 가지 수, from: 큰 가지가 나오기 시작하는 높이(줄기의 몇 할),
       elev: 큰 가지가 올라가는 각(라디안), len: 큰 가지 길이, subs: 잔가지 수, per: 가지 끝 잎 수, leaf: 잎 크기, droop: 잎이 처지는 정도 */
    var SPEC = {
      apple:     { seed: 11, H: 1.15, r0: 0.17, r1: 0.105, lean: 0.04, boughs: 8, from: 0.5, elev: [0.5, 1.0], len: 0.98, subs: 4, per: 11, leaf: 0.6, droop: 0.3 },
      tangerine: { seed: 23, H: 0.85, r0: 0.16, r1: 0.105, lean: 0.02, boughs: 9, from: 0.45, elev: [0.55, 1.1], len: 0.84, subs: 4, per: 15, leaf: 0.58, droop: 0.15 },
      peach:     { seed: 37, H: 0.74, r0: 0.15, r1: 0.1, lean: 0.1, boughs: 5, from: 0.62, elev: [0.45, 0.8], len: 1.0, subs: 3, per: 8, leaf: 0.6, droop: 0.7 }
    };
    /* 나무 한 그루. rig 에 흔들리는 축(crown), 잎이 떨어져 나오는 자리(drops), 열매 자리(spots), 꽃이 피는 마디(nodes)를 담아 준다 */
    function tree(seed, big) {
      if (!LEAF[seed]) seed = 'apple';
      var q = treeKit(), g = ground(), pivot = new THREE.Group(), crown = new THREE.Group(), lf = leafOf(seed), nodes = [], spots = [], pv;
      function hinge(y) { pv = y; pivot.position.y = y; crown.position.y = -y; pivot.add(crown); g.add(pivot); }
      if (seed === 'coffee') {
        g.add(limb([[0, -0.04, 0], [0.03, 0.6, 0], [-0.02, 1.25, 0], [0, 1.95, 0]], 0.085, 0.03, q.bark, 0.5, 20, 0.03));
        g.add(limb([[0.06, -0.04, 0.02], [0.26, 0.5, 0.05], [0.4, 1.0, 0], [0.4, 1.45, 0]], 0.065, 0.025, q.bark, 0.4, 16, 0.03));
        g.add(limb([[-0.06, -0.04, -0.02], [-0.24, 0.45, -0.04], [-0.36, 0.9, 0], [-0.34, 1.25, 0]], 0.06, 0.025, q.bark, 0.4, 16, 0.03));
        hinge(0.5);
        var ys = [0.62, 0.95, 1.28, 1.6, 1.86], lens = [0.72, 0.66, 0.54, 0.4, 0.22], pairs = [3, 3, 2, 2, 1], list = [], tiers = big ? 5 : 4;
        ys.slice(0, tiers).forEach(function (y, ti) {
          for (var b = 0; b < 4; b++) {
            var ang = b / 4 * Math.PI * 2 + ti * 0.8, cx = Math.cos(ang), cz = Math.sin(ang), len = lens[ti];
            crown.add(limb([[0, y, 0], [cx * len * 0.5, y - len * 0.03, cz * len * 0.5], [cx * len, y - len * 0.14, cz * len]], 0.022, 0.011, q.bark, 0, 5, 0));
            nodes.push([cx * len * 0.6, y - len * 0.05, cz * len * 0.6, cx, 0.2, cz]);
            for (var n = 1; n <= pairs[ti]; n++) {
              var f = n / pairs[ti], px = cx * len * f, py = y - len * 0.14 * f * f, pz = cz * len * f;
              [1.15, -1.15].forEach(function (side) { list.push([px, py, pz, Math.cos(ang + side) * 0.8 + cx * 0.35, -0.3, Math.sin(ang + side) * 0.8 + cz * 0.35, 0, 1, 0, 0.72 + 0.25 * h3(n, b, ti)]); });
            }
          }
        });
        [[0.4, 1.45, 0], [-0.34, 1.25, 0], [0, 1.95, 0]].forEach(function (c, ci) {
          for (var i = 0; i < 7; i++) { var a = i / 7 * Math.PI * 2 + ci; list.push([c[0], c[1], c[2], Math.cos(a), 0.15 + (i % 2) * 0.5, Math.sin(a), 0, 1, 0, 0.7]); }
        });
        sprays(crown, lf.geo, lf.mats, list);
        spots = [[0.1, 0.66, 0.14], [-0.11, 0.99, 0.13], [0.1, 1.32, 0.11], [-0.07, 1.63, 0.09], [0.45, 1.08, 0.1], [-0.4, 0.94, 0.1], [0.28, 0.88, 0.3], [-0.26, 1.22, 0.28], [0.22, 1.52, 0.2], [-0.3, 0.7, 0.24]];
        g.userData.rig = { crown: pivot, inner: crown, spots: spots, nodes: nodes, drops: [[0, 1.3, 0, 0.6], [0.4, 1.3, 0, 0.35], [-0.34, 1.1, 0, 0.35]] };
        return g;
      }
      var P = SPEC[seed], R = rng(P.seed), k = big ? 1 : 0.82, nB = big ? P.boughs : P.boughs - 2, H = P.H * (big ? 1 : 0.92), tips = [], leaves = [], b, s2;
      g.add(limb([[0, -0.04, 0], [P.lean, H * 0.4, 0.01], [-P.lean * 0.6, H * 0.75, 0], [P.lean * 0.4, H * 1.03, 0]], P.r0 * k, P.r1 * k, q.bark, 0.6, 18, 0.05));
      hinge(H * 0.72);
      for (b = 0; b < nB; b++) {
        var lead = b === nB - 1, f = nB > 1 ? b / (nB - 1) : 1;
        var az = b * 2.4 + R() * 0.5, el = lead ? 1.3 : P.elev[0] + R() * (P.elev[1] - P.elev[0]), L = P.len * k * (lead ? 0.8 : 0.82 + R() * 0.36), y0 = H * (P.from + (1 - P.from) * f);
        var dx = Math.cos(az) * Math.cos(el), dy = Math.sin(el), dz = Math.sin(az) * Math.cos(el);
        var a1 = [dx * L * 0.5, y0 + dy * L * 0.5 - 0.04 * L, dz * L * 0.5], a2 = [dx * L * 0.96, y0 + dy * L + 0.14 * L, dz * L * 0.96];
        crown.add(limb([[0, y0, 0], a1, a2], P.r1 * k * 0.6, 0.02 * k, q.bark, 0, 10, 0.03));
        tips.push([a2[0], a2[1], a2[2], dx, dy + 0.3, dz, 1]);
        for (s2 = 0; s2 < P.subs; s2++) {
          var t = 0.38 + 0.5 * (P.subs > 1 ? s2 / (P.subs - 1) : 0.5) + (R() - 0.5) * 0.1, u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
          var bx = t < 0.5 ? a1[0] * u : a1[0] + (a2[0] - a1[0]) * u, by = t < 0.5 ? y0 + (a1[1] - y0) * u : a1[1] + (a2[1] - a1[1]) * u, bz = t < 0.5 ? a1[2] * u : a1[2] + (a2[2] - a1[2]) * u;
          var az2 = az + (s2 % 2 ? 1 : -1) * (0.7 + R() * 0.5), el2 = el * 0.55 + 0.2 + R() * 0.35, L2 = L * (0.4 + R() * 0.22);
          var ex = Math.cos(az2) * Math.cos(el2), ey = Math.sin(el2), ez = Math.sin(az2) * Math.cos(el2);
          var m = [bx + ex * L2 * 0.5, by + ey * L2 * 0.5 - 0.03 * L2, bz + ez * L2 * 0.5], e = [bx + ex * L2, by + ey * L2 + 0.08 * L2, bz + ez * L2];
          crown.add(limb([[bx, by, bz], m, e], 0.028 * k, 0.01 * k, q.bark, 0, 6, 0));
          tips.push([e[0], e[1], e[2], ex, ey + 0.2, ez, 1]); tips.push([m[0], m[1], m[2], ex, ey, ez, 0.55]);
        }
      }
      // 잎: 가지 끝과 마디마다 한 다발
      tips.forEach(function (tp) {
        var n = Math.round(P.per * tp[6] * (big ? 1 : 0.85));
        for (var i = 0; i < n; i++) {
          var ux = R() * 2 - 1, uy = R() * 2 - 1, uz = R() * 2 - 1, back = R() * 0.24;
          leaves.push([tp[0] - tp[3] * back + ux * 0.05, tp[1] - tp[4] * back + uy * 0.05, tp[2] - tp[5] * back + uz * 0.05,
            tp[3] * 0.8 + ux, tp[4] * 0.8 + uy * 0.7 - P.droop * R(), tp[5] * 0.8 + uz, ux * 0.4, 1, uz * 0.4 + 0.25, P.leaf * k * (0.75 + R() * 0.5)]);
        }
      });
      sprays(crown, lf.geo, lf.mats, leaves);
      // 열매는 앞쪽 가지 끝 아래에 매달린다. 서로 너무 붙지 않게 고른다
      tips.filter(function (tp) { return tp[6] === 1 && tp[2] > -0.15; }).sort(function (a, c) { return c[2] - a[2]; }).forEach(function (tp) {
        var p = [tp[0], tp[1] - 0.17, tp[2] + 0.04];
        if (spots.length < 10 && !spots.some(function (s) { var x = s[0] - p[0], y = s[1] - p[1], z = s[2] - p[2]; return x * x + y * y + z * z < 0.12; })) spots.push(p);
      });
      g.userData.rig = {
        crown: pivot, inner: crown, spots: spots, nodes: tips,
        drops: tips.filter(function (tp) { return tp[6] === 1; }).map(function (tp) { return [tp[0], tp[1], tp[2], 0.14]; })
      };
      return g;
    }
    function sapling(seed, tall) {
      // 새싹(줄기 하나에 잎 두 장)과 나뭇가지(가는 줄기에 가지 둘, 잎 여덟 장). 잎은 씨앗마다 다르다
      if (!LEAF[seed]) seed = 'apple';
      var q = treeKit(), g = ground(), pivot = new THREE.Group(), lf = leafOf(seed);
      pivot.position.y = 0.05; g.add(pivot);
      function put(x, y, z, heading, tilt, s, n) {
        var m = new THREE.Mesh(lf.geo, lf.mats[n % 2]); m.position.set(x, y - 0.05, z); m.scale.setScalar(s);
        aim(m, Math.sin(heading) * Math.cos(tilt), Math.sin(tilt), Math.cos(heading) * Math.cos(tilt), 0, 0.75, 0.65);
        pivot.add(m);
      }
      if (!tall) {
        pivot.add(at(limb([[0, 0, 0], [0.03, 0.26, 0.01], [0, 0.56, 0]], 0.03, 0.018, q.stalk, 0, 8, 0), 0, -0.05, 0));
        put(0, 0.56, 0, 1.4, 0.5, 0.95, 1); put(0, 0.56, 0, -1.75, 0.58, 0.9, 1);
        g.userData.rig = { crown: pivot };
      } else {
        pivot.add(at(limb([[0, 0, 0], [0.04, 0.44, 0.01], [-0.01, 0.82, 0], [0.04, 1.14, 0]], 0.055, 0.02, q.bark, 0.5, 14, 0.04), 0, -0.05, 0));
        pivot.add(at(limb([[0.02, 0.54, 0], [0.2, 0.74, 0.03], [0.36, 0.88, 0.04]], 0.026, 0.012, q.bark, 0, 6, 0), 0, -0.05, 0));
        pivot.add(at(limb([[0.01, 0.72, 0], [-0.17, 0.9, -0.01], [-0.32, 1.02, -0.02]], 0.026, 0.012, q.bark, 0, 6, 0), 0, -0.05, 0));
        [[0.36, 0.88, 0.04, 1.3, 0.5], [0.36, 0.88, 0.04, 2.6, 0.15], [0.36, 0.88, 0.04, 0.2, 0.75], [-0.32, 1.02, -0.02, -1.5, 0.55], [-0.32, 1.02, -0.02, -2.7, 0.3], [0.04, 1.14, 0, 0.5, 0.9], [0.04, 1.14, 0, -2.4, 0.8], [0.04, 1.14, 0, 2.2, 1.0]].forEach(function (c, i) { put(c[0], c[1], c[2], c[3], c[4], 0.9, i); });
        g.userData.rig = { crown: pivot, drops: [[0.02, 0.95, 0, 0.36]] };
      }
      return g;
    }
    /* 화면 맨 위에서 내려오는 빛줄기. el(그림 상자) 뒤에 두고, 길이는 화면 위 끝에서 흙(상자 높이의 foot)까지로 맞춘다 */
    function shaftOf(el, foot) {
      var s = document.createElement('i'); s.className = 'orchard-shaft'; s.setAttribute('aria-hidden', 'true');
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      s.style.bottom = Math.round((1 - foot) * 100) + '%';
      el.insertBefore(s, el.firstChild);
      return s;
    }
    function shaftSet(s, el, foot, k) {
      if (k <= 0.004) { if (s.__k) { s.style.opacity = '0'; s.__k = 0; } return; }
      var r = el.getBoundingClientRect(), h = Math.round(r.top + (window.pageYOffset || 0) + r.height * foot);
      if (h !== s.__h) { s.style.height = h + 'px'; s.__h = h; }
      s.style.opacity = k.toFixed(3); s.__k = k;
    }
    /* 위에서 내려오는 빛줄기와 바닥에 번지는 빛(열매가 맺히는 장면). 그림은 한 번만 만든다 */
    var lightTex = null;
    function lightKit() {
      if (!lightTex) {
        var bc = document.createElement('canvas'); bc.width = 96; bc.height = 192;
        var bx = bc.getContext('2d'), bim = bx.createImageData(96, 192), bi, bj;
        for (bj = 0; bj < 192; bj++) for (bi = 0; bi < 96; bi++) {
          var by = bj / 191, bw = 0.2 + 0.34 * by, bd = (bi / 95 - 0.5) * 2 / bw, ba = Math.exp(-bd * bd * 1.6) * smooth(0, 0.3, by) * (1 - 0.8 * smooth(0.7, 1, by)), bk = (bj * 96 + bi) * 4;
          bim.data[bk] = 255; bim.data[bk + 1] = 255; bim.data[bk + 2] = 244; bim.data[bk + 3] = ba * 255;
        }
        bx.putImageData(bim, 0, 0);
        var gc = document.createElement('canvas'); gc.width = gc.height = 64;
        var gx = gc.getContext('2d'), gg = gx.createRadialGradient(32, 32, 2, 32, 32, 32);
        gg.addColorStop(0, 'rgba(255,255,240,0.9)'); gg.addColorStop(1, 'rgba(255,255,240,0)'); gx.fillStyle = gg; gx.fillRect(0, 0, 64, 64);
        lightTex = { beam: new THREE.CanvasTexture(bc), glow: new THREE.CanvasTexture(gc) };
      }
      var beam = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 3.5), new THREE.MeshBasicMaterial({ map: lightTex.beam, transparent: true, opacity: 0, depthWrite: false }));
      beam.position.set(0, 1.5, -0.4);
      var glow = new THREE.Mesh(new THREE.CircleGeometry(1.3, 32), new THREE.MeshBasicMaterial({ map: lightTex.glow, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      glow.rotation.x = -Math.PI / 2; glow.position.y = 0.15;
      return { beam: beam, glow: glow };
    }
    /* 물뿌리개(출근할 때 물 주기). 푸른 양철 몸통, 위로 뻗은 주둥이와 살수구, 손잡이 둘.
       pivot 을 기울이면 주둥이 쪽(왼쪽)이 내려간다. nozzle 의 자리에서 물방울이 나온다 */
    function pipe(pts, r0, r1, mat, seg) {
      var curve = new THREE.CatmullRomCurve3(pts.map(function (q) { return new THREE.Vector3(q[0], q[1], q[2]); })), rad = 16;
      var geo = new THREE.TubeGeometry(curve, seg, 1, rad, false), p = geo.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
      for (var i = 0; i < p.count; i++) {
        var t = Math.floor(i / (rad + 1)) / seg;
        curve.getPointAt(t, c); v.fromBufferAttribute(p, i).sub(c).multiplyScalar(r0 + (r1 - r0) * t).add(c); p.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return new THREE.Mesh(geo, mat);
    }
    function wateringCan() {
      var tin = glossy({ color: lin('#86AACC'), roughness: 0.36, metalness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 1.0 });
      var deep = glossy({ color: lin('#4A6B8C'), roughness: 0.5, metalness: 0.4, envMapIntensity: 0.7 });
      var pivot = new THREE.Group(), inner = new THREE.Group(), m;
      inner.rotation.y = Math.PI; pivot.add(inner);
      inner.add(new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.265, 0.44, 48), tin));
      m = new THREE.Mesh(new THREE.TorusGeometry(0.236, 0.018, 10, 48), tin); m.rotation.x = Math.PI / 2; inner.add(at(m, 0, 0.22, 0));
      m = new THREE.Mesh(new THREE.TorusGeometry(0.262, 0.013, 10, 48), deep); m.rotation.x = Math.PI / 2; inner.add(at(m, 0, -0.19, 0));
      m = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.01, 10, 48), deep); m.rotation.x = Math.PI / 2; inner.add(at(m, 0, 0.08, 0));
      m = new THREE.Mesh(new THREE.CircleGeometry(0.222, 40), deep); m.rotation.x = -Math.PI / 2; inner.add(at(m, 0, 0.222, 0));
      inner.add(pipe([[0.19, -0.13, 0], [0.44, 0.0, 0], [0.7, 0.24, 0]], 0.064, 0.034, tin, 14));
      var rose = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.04, 0.11, 28), tin);
      rose.rotation.z = -0.83; inner.add(at(rose, 0.745, 0.28, 0));
      m = new THREE.Mesh(new THREE.CircleGeometry(0.086, 28), deep); m.rotation.x = -Math.PI / 2; rose.add(at(m, 0, 0.056, 0));
      var nozzle = new THREE.Object3D(); rose.add(at(nozzle, 0, 0.07, 0));
      m = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 10, 28, Math.PI), tin); m.rotation.z = Math.PI / 2; inner.add(at(m, -0.25, 0.0, 0));
      m = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.017, 10, 28, Math.PI), tin); inner.add(at(m, 0, 0.21, 0));
      pivot.userData.nozzle = nozzle;
      return pivot;
    }
    var STAGE = {
      // 씨앗: 흙에 반쯤 묻힌 씨
      0: function () { var q = treeKit(), g = ground(), sd = new THREE.Mesh(q.seedGeo, q.seed); sd.scale.setScalar(0.2); sd.rotation.set(0.3, 0, 0.6); g.add(at(sd, 0.02, 0.12, 0.06)); return g; },
      1: function (seed) { return sapling(seed, false); },
      2: function (seed) { return sapling(seed, true); },
      3: function (seed) { return tree(seed, false); },
      // 꽃이 핀 나무(지금 규칙의 15~19일): 가지 마디마다 꽃이 핀다
      bloom: function (seed) { var g = tree(seed, true), rig = g.userData.rig; blossoms(rig.inner, seed, rig.nodes, seed === 'coffee' ? 40 : 64); return g; },
      4: function (seed) {
        var g = tree(seed, true), rig = g.userData.rig, bl = new THREE.Group();
        rig.fruits = rig.spots.map(function (c) { var m = at(mini(seed), c[0], c[1], c[2]); rig.inner.add(m); return m; });
        // 열매가 맺히는 장면에서만 보이는 꽃. 열매가 차오르는 동안 서서히 사라진다
        blossoms(bl, seed, rig.nodes, seed === 'coffee' ? 40 : 64);
        rig.bloomMats = [];
        bl.traverse(function (o) { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; rig.bloomMats.push(o.material); } });
        bl.visible = false; rig.inner.add(bl); rig.bloom = bl;
        return g;
      },
      // 수확한 뒤: 나무 옆에 열매를 담은 바구니
      harvested: function (seed) {
        var q = treeKit(), g = tree(seed, true), b = new THREE.Group();
        b.add(new THREE.Mesh(q.basketGeo, q.basket));
        [[-0.12, 0.3, 0.05], [0.13, 0.31, -0.03], [0, 0.42, 0.03]].forEach(function (c) { b.add(at(mini(seed), c[0], c[1], c[2])); });
        g.add(at(b, 0.95, 0.03, 0.5));
        return g;
      }
    };
    var SCALE = { 0: 1.5, 1: 1.4, 2: 1.22, 3: 1.16, bloom: 1.03, 4: 1.03, harvested: 0.98 };
    var STRIP = SCALE;

    function stageCam() { var c = new THREE.PerspectiveCamera(28, 1, 0.1, 50); c.position.set(0, 1.95, 6.9); c.lookAt(0, 1.08, 0); return c; }
    function fruitCam() { var c = new THREE.PerspectiveCamera(28, 1, 0.1, 50); c.position.set(0, 0.7, 5.9); c.lookAt(0, 0.02, 0); return c; }
    function back(x) { var c = 1.70158, d = c + 1; x = Math.min(1, Math.max(0, x)); return 1 + d * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }

    function mount(el, v) {
      var c = document.createElement('canvas');
      c.className = 'orchard-slot'; c.setAttribute('aria-hidden', 'true');
      el.appendChild(c);
      v.el = el; v.canvas = c; v.ctx = c.getContext('2d'); v.dirty = true;
      views.push(v);
      return v;
    }
    function draw(v, t, dt) {
      var r = v.el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      var pw = Math.min(BUF, Math.round(r.width * dpr)), ph = Math.min(BUF, Math.round(r.height * dpr));
      if (v.canvas.width !== pw || v.canvas.height !== ph) { v.canvas.width = pw; v.canvas.height = ph; }
      v.tick(t, dt);
      renderer.setViewport(0, 0, pw, ph); renderer.setScissor(0, 0, pw, ph);
      // 세로로 긴 자리에서는 좌우가 잘리지 않게 화각을 넓힌다
      var asp = pw / ph; v.fov = v.fov || v.cam.fov;
      v.cam.fov = asp < 1 ? 2 * Math.atan(Math.tan(v.fov * Math.PI / 360) / asp) * 180 / Math.PI : v.fov;
      v.cam.aspect = asp; v.cam.updateProjectionMatrix();
      renderer.render(v.scene, v.cam);
      v.ctx.clearRect(0, 0, pw, ph);
      v.ctx.drawImage(gl, 0, BUF - ph, pw, ph, 0, 0, pw, ph);
      return true;
    }

    /* 과일 하나. opt.selected() 가 참이면 커지고 빨리 돈다 */
    function fruitScene() {
      var sc = new THREE.Scene();
      sc.add(new THREE.HemisphereLight(0xffffff, lin(A.orange[90]), 0.2));
      var key = new THREE.DirectionalLight(0xffffff, 0.7); key.position.set(-2.4, 4, 3.4); sc.add(key);
      var rim = new THREE.DirectionalLight(lin(A.lightBlue[90]), 0.3); rim.position.set(3, 1.5, -2.5); sc.add(rim);
      return sc;
    }
    function fruit(el, seed, opt) {
      opt = opt || {};
      if (!FRUIT[seed]) seed = 'apple';
      var scene = fruitScene(), g = FRUIT[seed](), spin = new THREE.Group(), holder = new THREE.Group();
      spin.add(g); holder.add(spin); holder.rotation.x = TILT[seed];
      scene.add(holder); scene.add(shadow(1.2, -1.1, 0.13));
      var v = { scene: scene, cam: fruitCam(), hover: false, q: 0, qv: 0, ph: views.length * 1.7, live: true };
      spin.rotation.y = seed === 'coffee' ? 0 : v.ph;
      v.tick = function (t, dt) {
        dt = Math.min(dt || 0.016, 0.05);
        var sel = opt.selected ? opt.selected() : false;
        v.qv += (-170 * v.q - 14 * v.qv) * dt; v.q += v.qv * dt;   // 눌림: 움츠렸다 돌아오는 용수철. 고른다고 커지지는 않는다
        holder.scale.setScalar(1 - v.q);
        // 가지째 달린 커피 열매는 한 바퀴 돌지 않고 좌우로만 흔들린다
        if (seed === 'coffee') spin.rotation.y = Math.sin(t * (sel ? 1.1 : 0.6) + v.ph) * (sel ? 0.5 : 0.28);
        else spin.rotation.y += dt * (sel ? 0.9 : v.hover ? 0.7 : 0.22);
        holder.rotation.z = Math.sin(t * 1.1 + v.ph) * 0.05;
        holder.position.y = Math.sin(t * 1.5 + v.ph) * 0.05;
      };
      var host = opt.hover || el;
      host.addEventListener('pointerenter', function () { v.hover = true; });
      host.addEventListener('pointerleave', function () { v.hover = false; });
      if (!STILL) host.addEventListener('pointerdown', function () { v.qv += 2.8; });
      return mount(el, v);
    }
    /* 과일 네 개가 함께 떠 있는 모음(스플래시) */
    function cluster(el) {
      var scene = fruitScene(), items = [];
      [['apple', 0.0, -0.3, 0.7, 0.66], ['tangerine', -1.0, 0.2, 0.0, 0.5], ['peach', 1.0, 0.12, 0.1, 0.52], ['coffee', 0.05, 0.9, -0.5, 0.52]].forEach(function (c, i) {
        var g = FRUIT[c[0]](), spin = new THREE.Group(), holder = new THREE.Group();
        spin.add(g); holder.add(spin); holder.rotation.x = TILT[c[0]]; holder.scale.setScalar(c[4]);
        spin.rotation.y = i * 1.3;
        scene.add(at(holder, c[1], c[2], c[3]));
        items.push({ name: c[0], spin: spin, holder: holder, y: c[2], s: c[4], ph: i * 1.9 });
      });
      scene.add(shadow(1.9, -1.25, 0.16));
      var cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50); cam.position.set(0, 0.9, 6.6); cam.lookAt(0, 0.12, 0);
      var v = { scene: scene, cam: cam, live: true, pop: clock.t };
      v.tick = function (t, dt) {
        items.forEach(function (it, i) {
          var e = back((t - v.pop - i * 0.12) / 0.7);
          it.holder.scale.setScalar(it.s * (STILL || reduce ? 1 : Math.max(0.001, e)));
          it.holder.position.y = it.y + Math.sin(t * 0.9 + it.ph) * 0.07;
          if (it.name === 'coffee') it.spin.rotation.y = Math.sin(t * 0.5 + it.ph) * 0.3; else it.spin.rotation.y += dt * 0.25;
          it.holder.rotation.z = Math.sin(t * 0.7 + it.ph) * 0.06;
        });
      };
      v.replay = function () { v.pop = clock.t; };
      return mount(el, v);
    }
    /* 자라는 단계 하나. kind: 0~4, 'bloom', 'harvested'
       만질 수 있다: 톡 치면(poke) 반대쪽으로 휘청이고 잎이 몇 장 떨어진다. 잡고 흔들면(shake) 흔든 만큼 흔들리고 잎이 더 떨어진다 */
    function stage(el, kind, seed, opt) {
      opt = opt || {};
      if (!FRUIT[seed]) seed = 'apple';
      var scene = fruitScene(), g = STAGE[kind](seed), rig = g.userData.rig || {}, holder = new THREE.Group();
      holder.add(g); scene.add(holder); scene.add(shadow(1.35, -0.115, 0.18));
      var size = (opt.strip ? STRIP : SCALE)[kind] * (opt.scale || 1), idx = views.length, sway = opt.sway == null ? 0.32 : opt.sway;
      var MAX_A = 0.105, MAX_V = 0.7;   // 아무리 세게 흔들어도 이 이상 기울지 않는다
      var S = { a: 0, av: 0, b: 0, bv: 0, q: 0, qv: 0 }, fallen = [], energy = 0, lf = rig.drops ? leafOf(seed) : null;
      var v = { scene: scene, cam: stageCam(), pop: -9, live: opt.live !== false, awake: 0 };
      function wake() { v.awake = clock.t + 5; }
      // 열매: 처음에는 opt.fruits 개(기본 5)만 달려 있다. 출근이 이어지면 하나씩 늘어난다
      var fruits = (rig.fruits || []).map(function (m) { return { m: m, on: false, t0: -9 }; });
      var shown = fruits.length ? Math.max(1, Math.min(fruits.length, opt.fruits == null ? 5 : opt.fruits)) : 0;
      fruits.forEach(function (f, i) { f.on = i < shown; });
      var rip = null, kit = null, wat = null, can = null, beads = [], NOZ = new THREE.Vector3();
      var CAN_Y = { 0: 1.5, 1: 1.78, 2: 2.12, 3: 2.2, bloom: 2.2, 4: 2.2, harvested: 2.2 };
      function drop(n) {
        if (!lf || STILL || reduce) return;
        for (var i = 0; i < n && fallen.length < 28; i++) {
          var c = rig.drops[Math.floor(Math.random() * rig.drops.length)], a = Math.random() * Math.PI * 2, y = -0.1 - Math.random() * 0.7, r = Math.sqrt(1 - y * y);
          var m = new THREE.Mesh(lf.geo, lf.mats[i % 2]);
          m.scale.setScalar(lf.L.fall * (0.7 + Math.random() * 0.5));
          m.position.set(c[0] + Math.cos(a) * r * c[3], c[1] + y * c[3], c[2] + Math.sin(a) * r * c[3]);
          m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
          g.add(m);
          fallen.push({ m: m, s: m.scale.x, vx: (Math.random() - 0.5) * 0.5 + S.av * 0.12, vy: 0.25 + Math.random() * 0.3, vz: (Math.random() - 0.5) * 0.5, sx: (Math.random() - 0.5) * 5, sz: (Math.random() - 0.5) * 5, ph: Math.random() * 6, rest: -1 });
        }
      }
      v.tick = function (t, dt) {
        dt = Math.min(dt || 0.016, 0.05);
        // 용수철: 휘청임(좌우 a, 앞뒤 b)과 눌림(q)
        S.av += (-20 * S.a - 5 * S.av) * dt; S.av = Math.max(-MAX_V, Math.min(MAX_V, S.av)); S.a = Math.max(-MAX_A, Math.min(MAX_A, S.a + S.av * dt));
        S.bv += (-20 * S.b - 5 * S.bv) * dt; S.bv = Math.max(-MAX_V, Math.min(MAX_V, S.bv)); S.b = Math.max(-MAX_A * 0.5, Math.min(MAX_A * 0.5, S.b + S.bv * dt));
        S.qv += (-110 * S.q - 10 * S.qv) * dt; S.q += S.qv * dt;
        var pop = size * (0.82 + 0.18 * back((t - v.pop) / 0.5));
        holder.scale.set(pop * (1 + S.q * 0.5), pop * (1 - S.q), pop * (1 + S.q * 0.5));
        holder.rotation.y = Math.sin(t * 0.7 + idx * 0.9) * sway;
        g.rotation.z = S.a * 0.2; g.rotation.x = S.b * 0.2;
        if (rig.crown) { rig.crown.rotation.z = S.a + Math.sin(t * 1.1 + idx) * 0.018; rig.crown.rotation.x = S.b + Math.cos(t * 0.9 + idx) * 0.012; }
        // 떨어지는 잎: 좌우로 팔랑이며 내려와 풀밭에 잠깐 누웠다가 사라진다
        for (var i = fallen.length - 1; i >= 0; i--) {
          var f = fallen[i], m = f.m;
          if (f.rest < 0) {
            f.vy += (-1.25 - f.vy * 1.5) * dt;
            m.position.x += (f.vx + Math.sin(t * 3.1 + f.ph) * 0.42) * dt;
            m.position.z += (f.vz + Math.cos(t * 2.6 + f.ph) * 0.3) * dt;
            m.position.y += f.vy * dt;
            m.rotation.x += f.sx * dt; m.rotation.z += f.sz * dt;
            f.vx *= 1 - dt * 0.8; f.vz *= 1 - dt * 0.8;
            if (m.position.y <= 0.03) {
              m.position.y = 0.03; f.rest = 0;
              m.rotation.x = Math.atan2(Math.sin(m.rotation.x), Math.cos(m.rotation.x)); m.rotation.z = Math.atan2(Math.sin(m.rotation.z), Math.cos(m.rotation.z));
            }
          } else {
            // 풀밭에 닿으면 납작하게 눕는다
            f.rest += dt;
            m.rotation.x *= 1 - Math.min(1, dt * 10); m.rotation.z *= 1 - Math.min(1, dt * 10);
            if (f.rest > 1.6) { var k = 1 - (f.rest - 1.6) / 0.5; if (k <= 0) { g.remove(m); fallen.splice(i, 1); continue; } m.scale.setScalar(f.s * k); }
          }
        }
        var i2, e2;
        /* 열매가 맺히는 장면(약 4.5초): 꽃이 핀 나무에 빛이 내려오고 → 열매가 앞쪽 가지부터 하나씩 톡톡 맺히며 꽃이 진다
           → 다 맺히면 나무가 한 번 통 튀고 잎이 떨어진다 → 빛이 걷힌다 */
        if (rip) {
          e2 = t - rip.t0; var last = 1.0 + (rip.n - 1) * 0.3;
          var fade = 1 - smooth(0.9, last + 0.25, e2);
          rig.bloomMats.forEach(function (m) { m.opacity = fade; });
          for (i2 = 0; i2 < rip.n; i2++) if (!fruits[i2].on && e2 >= 1.0 + i2 * 0.3) {
            fruits[i2].on = true; fruits[i2].t0 = t; S.qv += 0.42; S.av += i2 % 2 ? 0.13 : -0.13; if (i2 % 2 === 0) drop(1);
          }
          var lit = smooth(0.15, 1.1, e2) * (1 - smooth(last + 0.9, last + 2.1, e2));
          kit.beam.material.opacity = 0; kit.glow.material.opacity = (isDark() ? 0.42 : 0.26) * lit;
          if (!v.shaft) v.shaft = shaftOf(el, 0.88);
          shaftSet(v.shaft, el, 0.88, (isDark() ? 0.36 : 0.62) * lit);
          if (!rip.done && e2 > last + 0.55) { rip.done = true; v.pop = t; drop(5); }
          if (e2 > last + 2.2) { rig.bloom.visible = false; kit.beam.visible = kit.glow.visible = false; if (v.shaft) shaftSet(v.shaft, el, 0.88, 0); var cb = rip.cb; rip = null; if (cb) cb(); }
          wake();
        }
        for (i2 = 0; i2 < fruits.length; i2++) {
          var fr = fruits[i2], fk = fr.on ? back((t - fr.t0) / 0.5) : 0;
          fr.m.visible = fk > 0.001;
          if (fr.m.visible) { fr.m.scale.setScalar(fk); fr.m.rotation.z = Math.sin(t * 1.3 + i2 * 1.9) * 0.05 - S.a * 0.5; }
        }
        /* 물 주기(약 2.7초): 물뿌리개가 오른쪽 위에서 들어와 기울고 → 물방울이 쏟아지는 동안 나무가 잘게 흔들리고 → 물뿌리개가 물러난다 */
        if (wat) {
          e2 = t - wat.t0;
          var inK = back(e2 / 0.5), outK = smooth(2.2, 2.7, e2), tilt = smooth(0.4, 0.85, e2) * (1 - smooth(1.95, 2.3, e2));
          can.visible = true;
          can.position.set(0.86 + (1 - inK) * 1.5 + outK * 1.7, wat.y + (1 - inK) * 0.7 + outK * 0.8 + Math.sin(t * 5) * 0.012 * tilt, 0.9);
          can.rotation.z = 0.06 + 0.66 * tilt + Math.sin(t * 9) * 0.012 * tilt;
          can.scale.setScalar(0.92);
          if (e2 > 0.8 && e2 < 2.0) {
            can.updateMatrixWorld(true); can.userData.nozzle.getWorldPosition(NOZ);
            wat.acc += dt;
            while (wat.acc > 0.026) {
              wat.acc -= 0.026;
              var bead = null; for (i2 = 0; i2 < beads.length; i2++) if (!beads[i2].m.visible) { bead = beads[i2]; break; }
              if (!bead) break;
              bead.m.visible = true; bead.m.position.set(NOZ.x + (Math.random() - 0.5) * 0.1, NOZ.y + (Math.random() - 0.5) * 0.06, NOZ.z + (Math.random() - 0.5) * 0.1);
              bead.vx = -(0.08 + Math.random() * 0.3); bead.vy = -(0.1 + Math.random() * 0.35); bead.vz = (Math.random() - 0.5) * 0.3;
              bead.m.scale.set(0.8 + Math.random() * 0.5, 1.5 + Math.random() * 0.8, 0.8 + Math.random() * 0.5);
            }
            if (t > wat.next) { wat.next = t + 0.26; S.qv += 0.12; S.av += Math.random() < 0.5 ? 0.05 : -0.05; }
          }
          if (!wat.done && e2 > 2.25) { wat.done = true; v.pop = t; }
          if (e2 > 2.75) { can.visible = false; var wcb = wat.cb; wat = null; if (wcb) wcb(); }
          wake();
        }
        for (i2 = 0; i2 < beads.length; i2++) {
          var bd = beads[i2];
          if (!bd.m.visible) continue;
          bd.vy -= 5.2 * dt; bd.vx *= 1 - dt * 1.2;
          bd.m.position.x += bd.vx * dt; bd.m.position.y += bd.vy * dt; bd.m.position.z += bd.vz * dt;
          if (bd.m.position.y < 0.08) bd.m.visible = false;
          wake();
        }
        if (fallen.length || Math.abs(S.a) > 0.002 || Math.abs(S.av) > 0.01 || Math.abs(S.q) > 0.002) wake();
      };
      /* 열매가 맺히는 장면을 처음부터. n: 맺힐 열매 수(기본은 지금 달린 수), done: 끝나면 부른다 */
      v.ripen = function (n, done) {
        if (!fruits.length) { if (done) done(); return; }
        shown = Math.max(1, Math.min(fruits.length, n || shown));
        if (STILL || reduce) { fruits.forEach(function (f, i) { f.on = i < shown; f.t0 = -9; }); if (done) done(); return; }
        if (!kit) { kit = lightKit(); scene.add(kit.beam); scene.add(kit.glow); }
        kit.beam.visible = kit.glow.visible = true; rig.bloom.visible = true;
        fruits.forEach(function (f) { f.on = false; });
        rip = { t0: clock.t, n: shown, cb: done, done: false };
        wake();
      };
      /* 열매 하나 더(20일을 넘겨 출근한 날). 달 자리가 없으면 false */
      v.addFruit = function () {
        if (shown >= fruits.length) return false;
        var f = fruits[shown++]; f.on = true; f.t0 = STILL || reduce ? -9 : clock.t;
        S.qv += 0.6; S.av += 0.16; drop(2); wake();
        return true;
      };
      v.fruitCount = function () { return shown; };
      v.fruitMax = function () { return fruits.length; };
      /* 물 주기. done: 물뿌리개가 물러난 뒤 부른다 */
      v.water = function (done) {
        if (STILL || reduce) { if (done) done(); return; }
        if (!can) {
          can = wateringCan(); can.visible = false; scene.add(can);
          var bg = new THREE.SphereGeometry(0.026, 10, 8), bm = glossy({ color: lin('#A9D8FF'), roughness: 0.08, transparent: true, opacity: 0.82, envMapIntensity: 1.3 });
          for (var i = 0; i < 60; i++) { var b = new THREE.Mesh(bg, bm); b.visible = false; scene.add(b); beads.push({ m: b, vx: 0, vy: 0, vz: 0 }); }
        }
        wat = { t0: clock.t, y: CAN_Y[kind] || 2.2, cb: done, acc: 0, next: 0, done: false };
        wake();
      };
      /* dir: -1(왼쪽을 침) ~ 1(오른쪽을 침), power: 세기 */
      v.poke = function (dir, power) {
        power = power || 1;
        S.av += -(dir || (Math.random() - 0.5)) * 0.55 * power; S.bv += (Math.random() - 0.5) * 0.25 * power; S.qv += 0.9 * power;
        drop(Math.round(1 + 2 * power)); wake();
      };
      v.shake = function (dx) {
        S.av += Math.max(-0.12, Math.min(0.12, dx * 0.006)); energy += Math.min(24, Math.abs(dx));
        if (energy > 46) { energy = 0; drop(1 + (Math.random() < 0.4 ? 1 : 0)); }
        wake();
      };
      v.shower = function (n) { drop(n); wake(); };
      v.setSeed = function () {};
      v.bounce = function (delay) { v.pop = clock.t + (delay || 0); wake(); };
      if (opt.touch && !STILL) bindTouch(opt.touch, v);
      return mount(el, v);
    }
    // 나무를 만지는 손: 누르면 톡, 누른 채 움직이면 흔들기. 마우스가 빠르게 스치면 살짝 흔들린다
    function bindTouch(host, v) {
      var down = false, lx = 0, moved = 0;
      host.style.touchAction = 'pan-y'; host.style.cursor = 'grab';
      host.__view = v;
      host.addEventListener('pointerdown', function (e) {
        var r = host.getBoundingClientRect();
        down = true; lx = e.clientX; moved = 0; host.__dragged = false; host.style.cursor = 'grabbing';
        try { host.setPointerCapture(e.pointerId); } catch (err) {}
        v.poke(((e.clientX - r.left) / r.width - 0.5) * 2, 0.9);
      });
      host.addEventListener('pointermove', function (e) {
        var dx = e.clientX - lx; lx = e.clientX;
        if (down) { moved += Math.abs(dx); if (moved > 10) host.__dragged = true; v.shake(dx); }
        else if (e.pointerType === 'mouse' && Math.abs(dx) > 5) v.shake(dx * 0.22);
      });
      host.addEventListener('pointerenter', function (e) { lx = e.clientX; });
      function up() { down = false; host.style.cursor = 'grab'; }
      host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    }
    /* 씨앗에서 과일나무까지 한 번에 자란다(지금은 쓰지 않는다: 자라는 모습을 미리 보여 주지 않기로 했다) */
    function grow(el, seed) {
      var scene = fruitScene(), order = [0, 1, 2, 3, 4];
      var groups = order.map(function (k) { var g = STAGE[k](seed); g.visible = false; scene.add(g); return g; });
      scene.add(shadow(1.35, -0.115, 0.18));
      var v = { scene: scene, cam: stageCam(), idx: -1, pop: 0, t0: clock.t, live: true };
      v.tick = function (t) {
        var e = t - v.t0, idx = reduce || STILL ? 4 : Math.min(4, Math.max(0, Math.floor((e - 0.25) / 0.72)));
        if (idx !== v.idx) { v.idx = idx; v.pop = t; groups.forEach(function (g, i) { g.visible = i === idx; }); }
        var g = groups[idx];
        g.scale.setScalar(SCALE[order[idx]] * (0.7 + 0.3 * back((t - v.pop) / 0.55)));
        g.rotation.y = Math.sin(t * 0.6) * 0.38;
      };
      v.replay = function () { v.t0 = clock.t; v.idx = -1; };
      return mount(el, v);
    }

    /* 심는 장면: 파 놓은 흙에 씨앗이 톡 떨어지고, 흙이 튀고, 흙이 덮이고, 위에서 빛이 내려오며 작은 새싹이 올라온다.
       v.play() 로 처음부터 다시, v.setSeed(name) 로 잎 모양을 바꾼다. 누르면 새싹이 살짝 흔들린다 */
    function planting(el, seed) {
      if (!LEAF[seed]) seed = 'apple';
      var q = treeKit(), scene = fruitScene(), root = new THREE.Group(), R = rng(5), o = new THREE.Object3D(), i;
      var dirt = glossy({ map: q.soil.map, bumpMap: q.soil.bumpMap, bumpScale: 0.05, roughness: 1, color: new THREE.Color(0.5, 0.45, 0.42), envMapIntensity: 0.3 });
      // 흙더미: 가운데가 파여 있고 둘레가 살짝 도드라진다
      root.add(new THREE.Mesh(ball(function (v, u) {
        var w = 0.98 * (1 + (fbm(u.x * 3, u.y * 3, u.z * 3, 3) - 0.5) * 0.22);
        v.x *= w; v.z *= w; v.y *= u.y > 0 ? 0.13 : 0.06;
        if (u.y > 0) { var r = Math.sqrt(v.x * v.x + v.z * v.z); v.y += 0.035 * Math.exp(-Math.pow((r - 0.27) / 0.1, 2)) - 0.12 * Math.exp(-Math.pow(r / 0.17, 2)) + (fbm(u.x * 7, u.y * 7, u.z * 7, 2) - 0.5) * 0.035; }
      }, 72, 36), dirt));
      var clods = new THREE.InstancedMesh(q.stoneGeo, dirt, 64); clods.frustumCulled = false;
      for (i = 0; i < 64; i++) {
        var a = R() * 6.283, r = 0.24 + R() * 0.64, s = 0.018 + R() * 0.04;
        o.position.set(Math.cos(a) * r, 0.13 * Math.sqrt(Math.max(0, 1 - Math.pow(r / 0.98, 2))) + s * 0.3, Math.sin(a) * r);
        o.rotation.set(R() * 6, R() * 6, R() * 6); o.scale.setScalar(s); o.updateMatrix(); clods.setMatrixAt(i, o.matrix);
      }
      root.add(clods);
      var cap = new THREE.Mesh(q.soilGeo, dirt); root.add(cap);            // 씨앗을 덮는 흙
      var sd = new THREE.Mesh(q.seedGeo, q.seed); sd.scale.setScalar(0.13); root.add(sd);
      // 튀는 흙 알갱이
      var bits = [];
      for (i = 0; i < 12; i++) { var b = new THREE.Mesh(q.stoneGeo, dirt); b.visible = false; root.add(b); bits.push({ m: b, vx: 0, vy: 0, vz: 0 }); }
      // 새싹: 가는 줄기에 아래 잎 두 장, 위에 갓 나온 잎 두 장. 접혀 있다가 올라오면서 펴진다
      var lf = leafOf(seed), shoot = new THREE.Group(), leaves = [];
      shoot.add(limb([[0, 0, 0], [0.015, 0.16, 0.005], [0, 0.34, 0]], 0.016, 0.011, q.stalk, 0, 8, 0));
      [[1.45, 0.2, 0.3, 0.5, 0, 0.7], [-1.65, 0.2, 0.36, 0.47, 0, -0.7], [0.5, 0.34, 1.0, 0.4, 1, 0.5], [-2.5, 0.34, 0.95, 0.38, 1, -0.4]].forEach(function (c) {
        var h = new THREE.Group(), m = new THREE.Mesh(lf.geo, lf.mats[c[4]]);
        h.rotation.order = 'YXZ'; h.position.y = c[1]; h.rotation.y = c[0]; m.scale.setScalar(c[3]); m.rotation.z = c[5];
        h.add(m); shoot.add(h); leaves.push({ h: h, m: m, open: c[2], k: c[4] });
      });
      shoot.position.y = 0.06; shoot.visible = false; root.add(shoot);
      // 위에서 내려오는 빛과 흙 위에 번지는 빛
      var bc = document.createElement('canvas'); bc.width = 96; bc.height = 192;
      var bx = bc.getContext('2d'), bim = bx.createImageData(96, 192), bi, bj;
      for (bj = 0; bj < 192; bj++) for (bi = 0; bi < 96; bi++) {
        // 위는 좁고 아래로 갈수록 퍼진다. 맨 위와 아래 끝은 사라진다
        var by = bj / 191, bw = 0.16 + 0.3 * by, bd = (bi / 95 - 0.5) * 2 / bw, ba = Math.exp(-bd * bd * 1.6) * smooth(0, 0.3, by) * (1 - 0.75 * smooth(0.72, 1, by)), bk = (bj * 96 + bi) * 4;
        bim.data[bk] = 255; bim.data[bk + 1] = 255; bim.data[bk + 2] = 246; bim.data[bk + 3] = ba * 255;
      }
      bx.putImageData(bim, 0, 0);
      var beam = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.0), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bc), transparent: true, opacity: 0, depthWrite: false }));
      beam.position.set(0, 1.08, -0.05);
      var gc = document.createElement('canvas'); gc.width = gc.height = 64;
      var gx = gc.getContext('2d'), gg = gx.createRadialGradient(32, 32, 2, 32, 32, 32);
      gg.addColorStop(0, 'rgba(255,255,240,0.9)'); gg.addColorStop(1, 'rgba(255,255,240,0)'); gx.fillStyle = gg; gx.fillRect(0, 0, 64, 64);
      var glow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      glow.rotation.x = -Math.PI / 2; glow.position.y = 0.17;
      scene.add(root); scene.add(beam); scene.add(glow); scene.add(shadow(1.1, -0.06, 0.2));
      var cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50); cam.position.set(0, 0.8, 4.0); cam.lookAt(0, 0.42, 0);
      var v = { scene: scene, cam: cam, live: true, t0: STILL ? -99 : clock.t, burst: false }, W = { a: 0, av: 0 };
      v.tick = function (t, dt) {
        dt = Math.min(dt || 0.016, 0.05);
        var e = reduce ? 9 : t - v.t0;
        // 씨앗이 떨어진다(가속) → 바닥에서 톡 튄다
        var fall = clamp01((e - 0.25) / 0.5), hit = e - 0.75, cover = smooth(1.05, 1.5, e);
        var hop = hit > 0 && hit < 0.26 ? Math.sin(hit / 0.26 * Math.PI) * 0.055 : 0;
        sd.visible = e > 0.2 && cover < 0.98;
        sd.position.set(0, 1.4 + (0.035 - 1.4) * fall * fall + hop - 0.03 * cover, 0);
        sd.rotation.set(0.3 + (1 - fall) * 4, (1 - fall) * 2, 0.6 + (1 - fall) * 3);
        // 닿는 순간 흙 알갱이가 튄다
        if (hit > 0 && !v.burst) {
          v.burst = true;
          bits.forEach(function (b, n) { var a = n / bits.length * 6.283 + Math.random(), sp = 0.5 + Math.random() * 0.7; b.m.visible = true; b.m.scale.setScalar(0.016 + Math.random() * 0.02); b.m.position.set(Math.cos(a) * 0.1, 0.06, Math.sin(a) * 0.1); b.vx = Math.cos(a) * sp; b.vz = Math.sin(a) * sp; b.vy = 1.4 + Math.random() * 1.1; });
        }
        bits.forEach(function (b) {
          if (!b.m.visible) return;
          b.vy -= 6.5 * dt; b.m.position.x += b.vx * dt; b.m.position.y += b.vy * dt; b.m.position.z += b.vz * dt; b.m.rotation.x += 6 * dt;
          if (b.vy < 0 && b.m.position.y < 0.1) b.m.visible = false;
        });
        // 흙더미가 한 번 눌렸다 돌아오고, 흙이 씨앗을 덮는다
        // 흙더미가 자리 밖으로 잘리지 않게 조금 줄여 놓는다
        root.scale.set(0.84, 0.84 * (1 - 0.07 * (hit > 0 && hit < 0.3 ? Math.sin(hit / 0.3 * Math.PI) : 0)), 0.84);
        cap.visible = cover > 0.01; cap.scale.set(0.26 * cover, 1.1 * cover, 0.26 * cover); cap.position.y = -0.07 + 0.11 * cover;
        // 새싹이 올라오며 잎이 펴진다
        var g1 = e - 1.75, up = g1 <= 0 ? 0 : back(g1 / 0.95), unfold = smooth(0.25, 1.15, g1);
        W.av += (-40 * W.a - 4 * W.av) * dt; W.a += W.av * dt;
        shoot.visible = g1 > 0;
        shoot.scale.set(1.78 * (0.55 + 0.45 * Math.min(1, up)), 1.78 * Math.max(0.0001, up), 1.78 * (0.55 + 0.45 * Math.min(1, up)));
        shoot.rotation.z = Math.sin(t * 1.5) * 0.045 * unfold + W.a; shoot.rotation.x = Math.cos(t * 1.2) * 0.03 * unfold;
        leaves.forEach(function (L, n) { L.h.rotation.x = -(1.45 + (L.open - 1.45) * unfold + Math.sin(t * 1.9 + n * 1.7) * 0.05 * unfold); });
        // 빛
        var lit = smooth(1.5, 2.9, e);
        beam.material.opacity = 0; glow.material.opacity = (isDark() ? 0.5 : 0.3) * lit;   // 빛줄기는 그림 뒤의 .orchard-shaft 가 화면 위에서부터 그린다
        if (!v.shaft) v.shaft = shaftOf(el, 0.72);
        shaftSet(v.shaft, el, 0.72, (isDark() ? 0.4 : 0.7) * lit);
        root.rotation.y = Math.sin(t * 0.35) * 0.22;
      };
      v.play = function () { v.t0 = clock.t; v.burst = false; bits.forEach(function (b) { b.m.visible = false; }); };
      v.setSeed = function (name) { var n = leafOf(LEAF[name] ? name : 'apple'); leaves.forEach(function (L) { L.m.geometry = n.geo; L.m.material = n.mats[L.k]; }); };
      v.bounce = v.play;
      el.addEventListener('pointerdown', function (ev) { var r = el.getBoundingClientRect(); W.av += ((ev.clientX - r.left) / r.width - 0.5) * -3.2 || 1; });
      return mount(el, v);
    }

    /* 스플래시의 여정: 스크롤을 따라 장면이 이어진다.
       과일 넷이 떠 있다가 → 가운데로 모여 씨앗 하나가 되고 → 씨앗이 풀밭의 흙에 내려앉는다.
       v.set(0~1) 로 진행도를, v.look(x, y) 로 시선(포인터)을 준다 */
    function journey(el) {
      var scene = fruitScene(), q = treeKit(), items = [], cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
      [['apple', 0.0, 0.0, 0.7, 0.64], ['tangerine', -1.02, 0.5, 0.0, 0.5], ['peach', 1.02, 0.42, 0.1, 0.52], ['coffee', 0.05, 1.22, -0.5, 0.52]].forEach(function (c, i) {
        var g = FRUIT[c[0]](), spin = new THREE.Group(), holder = new THREE.Group();
        spin.add(g); holder.add(spin); holder.rotation.x = TILT[c[0]]; spin.rotation.y = i * 1.3;
        scene.add(holder);
        items.push({ name: c[0], spin: spin, holder: holder, x: c[1], y: c[2], z: c[3], s: c[4], ph: i * 1.9 });
      });
      var seed = new THREE.Mesh(q.seedGeo, q.seed), land = ground(), sh = shadow(1.9, -1.3, 0.16);
      seed.scale.setScalar(0.0001); scene.add(seed);
      land.scale.setScalar(1.25); land.position.y = -4.8; land.visible = false; scene.add(land); scene.add(sh);
      var v = { scene: scene, cam: cam, live: true, p: STILL ? 0 : 0, target: 0, lx: 0, ly: 0, tx: 0, ty: 0, pop: clock.t };
      v.tick = function (t, dt) {
        dt = Math.min(dt || 0.016, 0.05);
        v.p += (v.target - v.p) * (STILL ? 1 : 1 - Math.exp(-dt * 5));
        v.lx += (v.tx - v.lx) * (1 - Math.exp(-dt * 3)); v.ly += (v.ty - v.ly) * (1 - Math.exp(-dt * 3));
        var p = v.p, a = smooth(0.06, 0.5, p), b = smooth(0.5, 0.94, p);
        items.forEach(function (it, i) {
          var enter = STILL || reduce ? 1 : Math.max(0.001, back((t - v.pop - i * 0.12) / 0.7));
          var ang = a * (1.6 + i * 0.5), r = 1 - a, cx = it.x * Math.cos(ang) - it.z * Math.sin(ang), cz = it.x * Math.sin(ang) + it.z * Math.cos(ang);
          it.holder.position.set(cx * r, 0.35 + (it.y - 0.35) * r + Math.sin(t * 0.9 + it.ph) * 0.07 * r, cz * r);
          it.holder.scale.setScalar(Math.max(0.0001, it.s * enter * (1 - smooth(0.2, 1, a))));
          it.holder.visible = a < 0.995;
          if (it.name === 'coffee') it.spin.rotation.y = Math.sin(t * 0.5 + it.ph) * 0.3 + a * 2; else it.spin.rotation.y += dt * (0.25 + a * 3);
          it.holder.rotation.z = Math.sin(t * 0.7 + it.ph) * 0.06;
        });
        // 씨앗: 과일이 모인 자리에서 생겨나 흙으로 떨어진다. 닿을 때 살짝 튄다
        var born = smooth(0.34, 0.52, p), landY = -1.02, fall = b * b, hop = Math.sin(Math.min(1, Math.max(0, (b - 0.82) / 0.18)) * Math.PI) * 0.1;
        seed.scale.setScalar(Math.max(0.0001, 0.3 * born));
        seed.position.set(0, 0.35 + (landY + 0.34 - 0.35) * fall + hop, 0);
        seed.rotation.set(0.3 + t * 0.6 * (1 - b), t * 0.4 * (1 - b), 0.6);
        land.position.y = -4.8 + (landY + 4.8) * smooth(0.42, 0.85, p); land.visible = p > 0.4;   // 올라오기 전에는 풀 끝이 화면 아래로 비치지 않게 숨긴다
        land.rotation.y = t * 0.08;
        sh.position.y = land.position.y - 0.16; sh.material.opacity = 0.16 * (0.4 + 0.6 * b + 0.6 * (1 - a));
        cam.position.set(v.lx * 0.7, 0.9 + v.ly * 0.35 - b * 0.25, 6.7 - a * 0.5 + b * 0.2);
        cam.lookAt(v.lx * 0.1, 0.22 - b * 0.55, 0);
      };
      v.set = function (p) { v.target = Math.min(1, Math.max(0, p)); };
      v.look = function (x, y) { v.tx = x; v.ty = y; };
      v.replay = function () { v.pop = clock.t; };
      return mount(el, v);
    }
    /* 씨앗 고르기의 큰 과일: 고른 과일이 가운데에 서 있다. 바꾸면 크기는 그대로인 채 옆으로 밀려 나가고 다음 과일이 들어온다(커지는 움직임 없음).
       잡고 좌우로 끌면 끄는 쪽으로 돌고, 놓으면 서서히 느려져 마지막으로 돌린 쪽으로 천천히 돈다. 누르면 잠깐 움츠렸다가 제 크기로 돌아온다 */
    function showcase(el, first) {
      var scene = fruitScene(), slots = {}, cur = FRUIT[first] ? first : 'apple', dir = 1, OUT = 3.1;
      ['apple', 'tangerine', 'peach', 'coffee'].forEach(function (name) {
        var g = FRUIT[name](), spin = new THREE.Group(), holder = new THREE.Group();
        spin.add(g); holder.add(spin); holder.rotation.x = TILT[name];
        scene.add(holder);
        slots[name] = { holder: holder, spin: spin, x: name === cur ? 0 : OUT, rot: 0 };
      });
      scene.add(shadow(1.3, -1.12, 0.16));
      var v = { scene: scene, cam: fruitCam(), live: true }, P = { q: 0, qv: 0 }, spinV = 0.5, auto = 0.5, down = false, lx = 0, lt = 0;
      v.tick = function (t, dt) {
        dt = Math.min(dt || 0.016, 0.05);
        P.qv += (-170 * P.q - 14 * P.qv) * dt; P.q += P.qv * dt;          // 눌림: 움츠렸다 돌아오는 용수철
        var idle = cur === 'coffee' ? 0 : auto;                               // 가지째 달린 커피 열매는 혼자 돌지 않는다
        if (!down) spinV += (idle - spinV) * (1 - Math.exp(-dt * 1.6));
        for (var name in slots) {
          var it = slots[name], on = name === cur;
          it.x += ((on ? 0 : -dir * OUT) - it.x) * (STILL ? 1 : 1 - Math.exp(-dt * 8));
          it.holder.visible = Math.abs(it.x) < OUT - 0.06;
          it.holder.position.set(it.x, Math.sin(t * 1.4) * 0.05, 0);
          it.holder.scale.setScalar(on ? 1 - P.q : 1);
          if (on && !down) it.rot += spinV * dt;
          it.spin.rotation.y = it.rot + (name === 'coffee' ? Math.sin(t * 0.8) * 0.25 : 0);
          it.holder.rotation.z = Math.sin(t * 1.1) * 0.04;
        }
      };
      v.set = function (name, d) {
        if (!slots[name] || name === cur) return;
        dir = d || 1; cur = name; slots[name].x = dir * OUT;
      };
      v.press = function () { P.qv += 2.8; };
      if (!STILL) {
        el.style.touchAction = 'pan-y';
        el.addEventListener('pointerdown', function (e) {
          down = true; lx = e.clientX; lt = performance.now(); spinV = 0; v.press();
          try { el.setPointerCapture(e.pointerId); } catch (err) {}
        });
        el.addEventListener('pointermove', function (e) {
          if (!down) return;
          var now = performance.now(), dx = e.clientX - lx, ds = Math.max(8, now - lt) / 1000;
          lx = e.clientX; lt = now;
          slots[cur].rot += dx * 0.012;
          spinV = Math.max(-9, Math.min(9, dx * 0.012 / ds));
        });
        var up = function () { if (!down) return; down = false; if (Math.abs(spinV) > 0.3) auto = spinV > 0 ? 0.5 : -0.5; };
        el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      }
      return mount(el, v);
    }

    function frame(dt) {
      var H = window.innerHeight, t = clock.t;
      for (var i = 0; i < views.length; i++) {
        var v = views[i];
        if (!v.live && !v.dirty && !(v.awake > t)) continue;
        if (!v.el.isConnected) continue;
        var r = v.el.getBoundingClientRect();
        if (!STILL && (r.bottom < -40 || r.top > H + 40)) continue;
        if (draw(v, t, dt)) v.dirty = false;
      }
    }
    // 정지 화면: 한 번 그리고 WebGL을 놓아 준다. 그리는 사이 컨텍스트를 잃었으면 false
    function shot() {
      if (!renderer) wake();
      views.forEach(function (v) { v.dirty = true; });
      frame(0.016);
      var ok = !renderer.getContext().isContextLost();
      renderer.dispose(); renderer.forceContextLoss(); renderer = null; gl = null;
      return ok;
    }
    return { frame: frame, fruit: fruit, stage: stage, grow: grow, cluster: cluster, journey: journey, showcase: showcase, planting: planting, shot: shot, redraw: function () { views.forEach(function (v) { v.dirty = true; }); } };
  }

  /* ---------- 앱 화면(스냅샷)에 입히기 ---------- */
  function stageOf(label) {
    var d = /출근\s*(\d+)\s*일/.exec(label), days = d ? Number(d[1]) : 0;
    if (/수확 완료/.test(label)) return 'harvested';
    // 지금 규칙(spec 2.6): 새싹 1, 묘목 5, 나무 10, 꽃 15, 열매 20
    return days >= 20 ? 4 : days >= 15 ? 'bloom' : days >= 10 ? 3 : days >= 5 ? 2 : days >= 1 ? 1 : 0;
  }
  /* 수확 카드(시안): 앱은 카드를 그림 한 장(PNG)으로 그려 보여 준다. 여기서는 그 그림을 숨기고 같은 내용을 지금 디자인으로 다시 짠다.
     값은 그림의 설명 글(alt)에서 읽는다. 첫 출근일과 시즌 기간은 설명 글에 없어 미리보기 데이터(가짜 구성원)의 값을 쓴다 */
  var CARD_FIX = { first: '11월 18일', from: '11월 18일', to: '12월 24일', total: 27 };
  function harvestCard() {
    var img = document.querySelector('[role="dialog"] img[alt*="수확 카드"]');
    if (!img || img.hasAttribute('data-orchard-card-src')) return;
    var m = /^(.+?)님의 수확 카드\. (.+?), 총 출근 (\d+)일, 출근 플랜 (.+?), 수확한 날 (.+?)\.$/.exec(img.getAttribute('alt') || '');
    if (!m) return;
    var name = m[1], fruit = m[2], days = +m[3], plan = m[4], day = m[5], seed = SEED_OF[fruit] || 'apple';
    var pct = Math.round(Math.min(1, days / CARD_FIX.total) * 100);
    var card = document.createElement('div');
    card.className = 'orchard-card'; card.setAttribute('role', 'img'); card.setAttribute('aria-label', img.getAttribute('alt'));
    card.innerHTML = '<div class="oc-head"><span>커리어캠프 출근부</span><span>수확 카드</span></div>' +
      '<div class="oc-fruit"><span></span></div>' +
      '<p class="oc-title"></p><p class="oc-sub"></p>' +
      '<dl class="oc-cells"><div><dt>총 출근</dt><dd></dd></div><div><dt>출근 플랜</dt><dd></dd></div><div><dt>첫 출근</dt><dd></dd></div><div><dt>수확한 날</dt><dd></dd></div></dl>' +
      '<div class="oc-rec"><div class="oc-rec-head"><span></span><b></b></div><div class="oc-bar"><i></i></div></div>' +
      '<p class="oc-foot">이 이미지를 운영진에게 DM으로 보내 주세요</p>';
    var q = function (sel) { return card.querySelector(sel); }, dd = card.querySelectorAll('dd');
    q('.oc-title').textContent = name + '님의 ' + fruit; q('.oc-sub').textContent = days + '일 출근해서 열매를 수확했어요';
    dd[0].textContent = days + '일'; dd[1].textContent = plan; dd[2].textContent = CARD_FIX.first; dd[3].textContent = day;
    q('.oc-rec-head span').textContent = '출근일 ' + CARD_FIX.total + '일 중 ' + days + '일'; q('.oc-rec-head b').textContent = pct + '%';
    q('.oc-bar i').style.width = pct + '%'; q('.oc-bar i').style.background = A.green[50];   // 막대는 과일과 상관없이 초록
    img.setAttribute('data-orchard-card-src', '');
    img.parentNode.insertBefore(card, img);
    if (fx) fx.fruit(q('.oc-fruit > span'), seed, {});
    // 카드 아래의 안내 문장은 뺀다. 버튼은 왼쪽 닫기, 오른쪽 저장하기(누르면 지금 보이는 카드를 그림으로 저장)
    var dlg = img.closest('[role="dialog"]');
    dlg.setAttribute('data-orchard-modal', 'glass');   // 창 자체도 패널처럼 유리로, 크기는 카드에 맞춰 작게
    [].slice.call(dlg.querySelectorAll('p')).forEach(function (p) { if (/^이 이미지를 복사해/.test((p.textContent || '').trim())) p.setAttribute('data-orchard-hide', ''); });
    [].slice.call(dlg.querySelectorAll('button')).forEach(function (b) {
      var t = (b.textContent || '').replace(/\s+/g, ''), to = t === '이미지저장' ? '닫기' : t === '이미지복사' ? '저장하기' : '';
      if (!to) return;
      var w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) if (n.nodeValue.trim()) { n.nodeValue = to; break; }
      b.removeAttribute('disabled'); b.setAttribute('aria-disabled', 'false');
      if (to === '저장하기' && !STILL) b.addEventListener('click', function (e) { e.preventDefault(); saveCard(card, 'harvest-' + name + '.png'); });
    });
  }
  /* 화면의 수확 카드를 그림(PNG, 두 배 크기)으로 그려 내려받는다. 요소의 자리와 글꼴을 화면에서 읽어 그대로 옮긴다.
     그림 안에서는 뒤가 비치는 유리를 쓸 수 없어, 칸은 같은 농도의 반투명 색으로 칠한다 */
  function saveCard(card, fileName) {
    var R = card.getBoundingClientRect(), k = 2, c = document.createElement('canvas'), g = c.getContext('2d'), dark = isDark(), W = R.width, H = R.height;
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
    [].slice.call(card.querySelectorAll('.oc-head span, .oc-title, .oc-sub, dt, dd, .oc-rec-head span, .oc-rec-head b, .oc-rec-foot, .oc-foot')).forEach(function (el) {
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

  /* 열매 수: 20일에 다섯 개가 맺히고, 그 뒤로 출근한 날마다 하나씩 는다 */
  var FRUIT_BASE = 5;
  function daysOf(label) { var d = /출근\s*(\d+)\s*일/.exec(label || ''); return d ? Number(d[1]) : 0; }
  function fruitsOf(label) { return FRUIT_BASE + Math.max(0, daysOf(label) - 20); }
  function adopt() {
    if (!fx) return;
    // 씨앗 선택의 열매 그림
    document.querySelectorAll('button[role="radio"][aria-label]').forEach(function (b) {
      var seed = SEED_OF[b.getAttribute('aria-label')], box = b.parentElement;
      var svg = seed && box ? box.querySelector('svg') : null;
      if (!svg || svg.hasAttribute('data-orchard')) return;
      var side = Math.round(Number(svg.getAttribute('height')) || 44) + 8;
      var slot = document.createElement('span');
      slot.className = 'orchard-fruit'; slot.style.width = slot.style.height = side + 'px';
      svg.setAttribute('data-orchard', ''); svg.style.display = 'none';
      svg.parentNode.insertBefore(slot, svg);
      fx.fruit(slot, seed, { hover: box, selected: function () { return b.getAttribute('aria-checked') === 'true'; } });
    });
    // 나무 그림. 원래 SVG는 자리와 누르는 영역을 지키도록 투명하게 남긴다
    var mine = null;
    document.querySelectorAll('svg[role="img"][viewBox="0 0 240 260"]').forEach(function (svg) {
      if (svg.parentElement.classList.contains('orchard-tree')) return;
      var label = svg.getAttribute('aria-label') || '', s = /(사과|귤|복숭아|커피)/.exec(label), seed = s ? SEED_OF[s[1]] : 'apple';
      var mini = svg.hasAttribute('height'), wrap = document.createElement('span');
      wrap.className = 'orchard-tree';
      if (mini) { wrap.style.width = svg.getAttribute('width') + 'px'; wrap.style.flex = 'none'; }
      svg.parentNode.insertBefore(wrap, svg); wrap.appendChild(svg);
      var fig = document.createElement('span'); fig.className = 'orchard-fig'; wrap.appendChild(fig);
      var btn = svg.querySelector('.fruit-btn');
      if (btn) { wrap.setAttribute('role', 'button'); wrap.setAttribute('aria-label', btn.getAttribute('aria-label')); }
      if (/^내 /.test(label)) mine = seed;
      if (mini) wrap.setAttribute('data-mini', '');
      fx.stage(fig, stageOf(label), seed, { live: !mini, sway: mini ? 0.16 : 0.24, scale: mini ? 1.04 : 1, touch: wrap, fruits: fruitsOf(label) });
      if (!mini && !wrap.closest('[role="dialog"]')) levelBadge(wrap, label);
    });
    // 내 나무가 있는 화면은 배경 꽃도 내 씨앗 색으로
    if (mine && !root.hasAttribute('data-orchard-seed')) setScheme(mine);
    try { harvestCard(); } catch (e) {}
  }
  /* ---------- 게임 요소(시안): 레벨, 배지, 출근·수확 순간의 연출 ---------- */
  var STEPS = [1, 5, 10, 15, 20];   // 지금 규칙의 단계 기준일(spec 2.6)
  function levelOf(label) {
    var d = /출근\s*(\d+)\s*일/.exec(label), days = d ? Number(d[1]) : 0, lv = 1, from = 0, to = STEPS[0];
    for (var i = 0; i < STEPS.length; i++) if (days >= STEPS[i]) { lv = i + 2; from = STEPS[i]; to = STEPS[i + 1] || STEPS[i]; }
    return { days: days, lv: lv, max: lv === STEPS.length + 1, progress: to > from ? (days - from) / (to - from) : 1 };
  }
  /* 레벨 표시: 겹겹이 포갠 부드러운 도형. 레벨이 오르면 모양과 색이 바뀐다(레퍼런스: 감정 상태에 따라 도형과 색이 바뀌는 화면).
     모양은 원에서 크게 벗어나지 않는다: 원(씨앗) → 잎 두 장·세 장·네 장(새싹·묘목·나무) → 꽃 → 과일(열매) → 별(수확 완료)
     색은 몽타주 atomic 다섯 가지: 하늘(lightBlue) → 초록(green) → 분홍(pink) → 주홍(redOrange) → 보라(violet). 같은 색을 성장 막대에도 쓴다 */
  var LOOKS = {
    circle: { hue: A.lightBlue[50], deep: A.lightBlue[40], name: '원' },
    leaf2:  { hue: A.green[50], deep: A.green[40], name: '잎 두 장' },
    leaf3:  { hue: A.green[50], deep: A.green[40], name: '잎 세 장' },
    leaf4:  { hue: A.green[50], deep: A.green[40], name: '잎 네 장' },
    flower: { hue: A.pink[50], deep: A.pink[40], name: '꽃' },
    fruit:  { hue: A.redOrange[50], deep: A.redOrange[40], name: '과일' },
    star:   { hue: A.violet[50], deep: A.violet[40], name: '별' }
  };
  function levelLook(label) {
    var L = levelOf(label), kind = 'circle';
    if (/수확 완료/.test(label)) kind = 'star';
    else if (L.days >= 20) kind = 'fruit';
    else if (L.days >= 15) kind = 'flower';
    else if (L.days >= 10) kind = 'leaf4';
    else if (L.days >= 5) kind = 'leaf3';
    else if (L.days >= 1) kind = 'leaf2';
    return { lv: L.lv, days: L.days, kind: kind, progress: kind === 'star' ? 1 : L.progress, max: L.max, look: LOOKS[kind] };
  }
  // 도형의 반지름. a 는 위쪽에서 시계 방향으로 잰 각
  function shapeRadius(kind, a) {
    var w = Math.atan2(Math.sin(a), Math.cos(a));
    if (kind === 'leaf2') return 0.92 - 0.13 * Math.cos(2 * a);
    if (kind === 'leaf3') return 0.92 + 0.11 * Math.cos(3 * a);
    if (kind === 'leaf4') return 0.93 - 0.1 * Math.cos(4 * a);
    if (kind === 'flower') return 0.8 + 0.24 * Math.pow(Math.abs(Math.cos(2.5 * a)), 0.55);
    if (kind === 'fruit') return 1 - 0.2 * Math.exp(-Math.pow(w / 0.36, 2)) - 0.07 * Math.exp(-Math.pow((Math.abs(w) - Math.PI) / 0.3, 2)) + 0.03 * Math.cos(a);
    if (kind === 'star') return 0.74 + 0.34 * Math.pow((1 + Math.cos(5 * a)) / 2, 1.5);
    return 1;
  }
  function shapePath(kind, radius) {
    var n = 96, max = 0, i, pts = [];
    for (i = 0; i < n; i++) max = Math.max(max, shapeRadius(kind, i / n * Math.PI * 2));
    for (i = 0; i < n; i++) { var a = i / n * Math.PI * 2, r = shapeRadius(kind, a) / max * radius; pts.push((Math.sin(a) * r).toFixed(2) + ' ' + (-Math.cos(a) * r).toFixed(2)); }
    return 'M' + pts.join('L') + 'Z';
  }
  function levelBadge(wrap, label) {
    if (wrap.querySelector('.orchard-lv')) return;
    var L = levelLook(label), el = document.createElement('span'), k = L.kind;
    el.className = 'orchard-lv'; el.setAttribute('role', 'img');
    el.setAttribute('aria-label', '레벨 ' + L.lv + ', ' + L.look.name + ' 모양' + (L.max ? ', 가장 높은 레벨' : ', 다음 레벨까지 ' + Math.round(L.progress * 100) + '퍼센트'));
    el.style.setProperty('--o-lv', L.look.hue); el.style.setProperty('--o-lv-deep', L.look.deep);
    var layers = [[26, 0.18], [21.5, 0.34], [17.5, 0.58], [13.8, 1]].map(function (c, i) {
      return '<path class="l" style="--i:' + i + '" d="' + shapePath(k, c[0]) + '" fill-opacity="' + c[1] + '"/>';
    }).join('');
    el.innerHTML = '<svg viewBox="-32 -32 64 64" aria-hidden="true">' +
      '<path class="t" d="' + shapePath(k, 30) + '"/><path class="p" pathLength="100" stroke-dasharray="0 100" d="' + shapePath(k, 30) + '"/>' + layers +
      '<text class="n" y="5.8">' + L.lv + '</text></svg>';
    wrap.appendChild(el);
    var arc = el.querySelector('.p'), dash = (L.progress * 100).toFixed(1) + ' 100';
    if (L.progress < 0.01) arc.style.display = 'none';   // 아직 진행이 없으면 시작점의 점도 그리지 않는다
    if (STILL || reduce) arc.setAttribute('stroke-dasharray', dash);
    else requestAnimationFrame(function () { requestAnimationFrame(function () { arc.style.strokeDasharray = dash; }); });
    paintTrack(L.look, L.days);
  }
  /* 성장 막대(시안): 다섯 단계를 같은 간격으로 놓고, 레벨 색으로 칠하고, 마지막 단계 이름을 에셋에 맞춘다.
     앱은 점을 날짜 비율(1·5·10·15·20일 → 5·25·50·75·100%)에 놓아서 앞쪽이 몰려 있다. 여기서는 0·25·50·75·100%에 놓고,
     채워진 길이는 단계 사이를 날짜로 나눠 잇는다(예: 19일 = 꽃과 과일나무 사이의 4/5 지점).
     단계와 나무 에셋: 새싹(잎 두 장) · 묘목(가는 줄기에 가지) · 나무(잎이 무성한 어린 나무) · 꽃(꽃이 핀 나무) · 열매(열매가 달린 나무) */
  var STEP_NAMES = {};   // 마지막 단계 이름은 앱 그대로 "열매"(과일나무로 바꿨다가 되돌림)
  function paintTrack(look, days) {
    var track = document.querySelector('main [role="img"][aria-label^="열매까지"]'), bar = track && track.firstElementChild, labels = bar && bar.nextElementSibling;
    if (!bar) return;
    var idx = -1, i, pos = 0, n = STEPS.length - 1;
    for (i = 0; i < STEPS.length; i++) if (days >= STEPS[i]) idx = i;
    if (idx >= n) pos = 100;
    else if (idx >= 0) pos = (idx + (days - STEPS[idx]) / (STEPS[idx + 1] - STEPS[idx])) / n * 100;
    for (i = 0; i < bar.children.length; i++) {
      var c = bar.children[i];
      if (i === 0) { c.style.setProperty('background-color', look.hue, 'important'); c.style.setProperty('width', pos + '%', 'important'); continue; }
      c.style.setProperty('left', (i - 1) / n * 100 + '%', 'important');
      if (getComputedStyle(c).boxShadow === 'none') c.style.setProperty('background-color', look.deep, 'important');
    }
    if (labels) for (i = 0; i < labels.children.length; i++) {
      var box = labels.children[i], name = box.firstElementChild;
      box.style.setProperty('left', i / n * 100 + '%', 'important');
      if (name && STEP_NAMES[name.textContent.trim()]) name.textContent = STEP_NAMES[name.textContent.trim()];
    }
  }
  var ICON = {
    sprout: 'M12 20v-8M12 12c0-3 2-5 6-5 0 3-2 5-6 5zM12 14c0-2.5-1.8-4.2-5-4.2 0 2.6 1.8 4.2 5 4.2z',
    target: 'M12 4a8 8 0 1 0 0 16a8 8 0 0 0 0-16zM12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6z',
    flame: 'M12 3c1 3 4.5 4.8 4.5 9a4.5 4.5 0 0 1-9 0c0-1.6.7-2.7 1.6-3.6.3 1.2 1 1.9 1.7 2.1C10.3 8.2 10.8 5.2 12 3z',
    calendar: 'M6 6h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM5 10h14M9 4v3M15 4v3M9.5 14.6l1.8 1.8 3.3-3.5',
    basket: 'M5 11h14l-1.4 7.2a1 1 0 0 1-1 .8H7.4a1 1 0 0 1-1-.8zM8 11l3-6M16 11l-3-6M10 14.5v2M14 14.5v2',
    lock: 'M7 11h10v8H7zM9 11V8a3 3 0 0 1 6 0v3'
  };
  // 홈에 배지 타일을 하나 더한다. 아직 못 모은 배지는 이름을 가리고 자물쇠로 보여 준다
  function gamify() {
    var camp = document.querySelector('.p-camp'), campSec = camp && camp.querySelector('section');
    if (!campSec || document.querySelector('.p-badges')) return;
    var tree = document.querySelector('svg[role="img"][viewBox="0 0 240 260"]'), label = tree ? tree.getAttribute('aria-label') || '' : '';
    var days = levelOf(label).days, text = document.body.textContent || '', wk = /(\d+)주 연속/.exec(text);
    var list = [
      { on: days >= 1, name: '첫 출근', icon: ICON.sprout },
      { on: /목표 달성/.test(text), name: '주간 목표', icon: ICON.target },
      { on: !!wk, name: wk ? wk[1] + '주 연속' : '', icon: ICON.flame },
      { on: days >= 10, name: '10일 출근', icon: ICON.calendar },
      { on: /수확 완료/.test(label), name: '첫 수확', icon: ICON.basket }
    ];
    var got = list.filter(function (b) { return b.on; }).length, h = campSec.querySelector('h2'), p = campSec.querySelector('p');
    var box = document.createElement('div'), sec = document.createElement('section');
    box.className = 'p-badges'; sec.className = campSec.className; sec.setAttribute('aria-labelledby', 'h-badges');
    sec.innerHTML = '<h2 id="h-badges" class="' + (h ? h.className : '') + '">배지</h2>' +
      '<p class="' + (p ? p.className : '') + '">' + (got === list.length ? '배지를 모두 모았어요.' : got + '개를 모았어요. 남은 배지는 모으면 열려요.') + '</p>' +
      '<ul class="orchard-badges">' + list.map(function (b, i) {
        return '<li class="' + (b.on ? 'on' : 'off') + '" style="--i:' + i + '"><span class="m" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="' + (b.on ? b.icon : ICON.lock) + '"/></svg></span><span class="t">' + (b.on ? b.name : '잠김') + '</span></li>';
      }).join('') + '</ul>';
    box.appendChild(sec);
    camp.parentNode.insertBefore(box, camp.nextSibling);
  }
  // 잎이 흩날리는 연출(출근, 수확)
  var BURST = ['#7CC646', '#A4E05E', '#5DB843', A.pink[80], A.orange[70]];
  function burst(x, y, n) {
    if (reduce || !document.body.animate) return;
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
  function floatChip(x, y, text) {
    if (reduce || !document.body.animate) return;
    var c = document.createElement('span'); c.className = 'orchard-plus'; c.textContent = text; c.setAttribute('aria-hidden', 'true');
    c.style.left = x + 'px'; c.style.top = y + 'px'; document.body.appendChild(c);
    c.animate([{ transform: 'translate(-50%,0) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-28px) scale(1)', opacity: 1, offset: 0.3 }, { transform: 'translate(-50%,-34px) scale(1)', opacity: 1, offset: 0.75 }, { transform: 'translate(-50%,-64px) scale(1)', opacity: 0 }],
      { duration: 1500, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' });
    setTimeout(function () { c.remove(); }, 1600);
  }
  var SCREEN = root.getAttribute('data-orchard-screen') || '';
  /* 20일 이후 화면에서 하루가 지났을 때: 그림의 이름과 패널의 작은 글을 새 출근일과 열매 수로 맞춘다 */
  function dayPassed(svg, days, count) {
    if (svg) svg.setAttribute('aria-label', (svg.getAttribute('aria-label') || '').replace(/출근\s*\d+\s*일/, '출근 ' + days + '일'));
    var next = document.querySelector('[data-orchard-lead] .orchard-next');
    if (next) next.textContent = '출근 ' + days + '일 · 열매 ' + count + '개';
  }
  function mainTree() { return document.querySelector('.orchard-tree:not([data-mini])'); }
  function textOf(el) { return (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim(); }
  var passing = false;
  // 로그아웃(시안): 로그인해 있다는 기록만 지운다. 다시 열면 스플래시 없이 로그인 화면부터다
  if (!STILL) window.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('button');
    if (b && (b.textContent || '').replace(/\s+/g, '') === '로그아웃') { try { localStorage.removeItem('orchard-signed'); } catch (err) {} }
  }, true);
  function replay(el) { passing = true; try { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); } finally { passing = false; } }
  // 출근하기와 수확은 바로 넘어가지 않고, 나무가 흔들리고 잎이 흩날린 뒤에 넘어간다
  if (!STILL) window.addEventListener('click', function (e) {
    var t = e.target;
    if (passing || !t || !t.closest) return;
    var w = t.closest('.orchard-tree[role="button"]');
    if (w) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (w.__dragged) { w.__dragged = false; return; }   // 흔든 것은 수확이 아니다
      if (w.__busy) return; w.__busy = true;
      if (w.__view) w.__view.poke(0, 1.5);
      var r = w.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height * 0.4, 14);
      setTimeout(function () { w.__busy = false; replay(w.querySelector('.fruit-btn') || w); }, reduce ? 0 : 800);
      return;
    }
    var b = t.closest('button');
    if (b && textOf(b) === '출근하기') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (b.__busy) return; b.__busy = true;
      var br = b.getBoundingClientRect(), tw = mainTree(), tr = tw && tw.getBoundingClientRect();
      var svg0 = tw && tw.querySelector('svg[role="img"]'), label0 = svg0 ? svg0.getAttribute('aria-label') || '' : '', days0 = daysOf(label0), view0 = tw && tw.__view;
      if (SCREEN === 'home-fruit' && view0 && view0.addFruit) {
        // 20일 이후의 출근: 화면은 그대로이고 열매가 하나 더 맺힌다(프로토타입에서는 누를 때마다 하루가 지난 것으로 본다)
        try { tw.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (err) {}
        var more = view0.addFruit(); tr = tw.getBoundingClientRect();
        burst(tr.left + tr.width / 2, tr.top + tr.height * 0.4, 10);
        floatChip(tr.left + tr.width / 2, tr.top + 24, more ? '+1일 · 열매 +1' : '+1일');
        dayPassed(svg0, days0 + 1, view0.fruitCount());
        setTimeout(function () { b.__busy = false; }, 900);
        return;
      }
      if (view0 && view0.water && days0 < 20 && !/수확 완료/.test(label0) && !reduce) {
        // 열매를 맺기 전: 물뿌리개가 나와 물을 준 뒤에 넘어간다
        var out = tr.top < 56 || tr.bottom > window.innerHeight - 72;
        if (out) { try { tw.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (err) {} }
        setTimeout(function () {
          view0.water();
          setTimeout(function () { var r2 = tw.getBoundingClientRect(); floatChip(r2.left + r2.width / 2, r2.top + 24, '+1일'); }, 1900);
        }, out ? 420 : 0);
        try { sessionStorage.setItem('orchard-grew', '1'); } catch (err) {}
        setTimeout(function () { b.__busy = false; replay(b); }, (out ? 420 : 0) + 2850);
        return;
      }
      burst(br.left + br.width / 2, br.top + br.height / 2, 18);
      if (tw && tw.__view) tw.__view.poke(0, 1.2);
      if (tr && tr.top < window.innerHeight && tr.bottom > 0) floatChip(tr.left + tr.width / 2, tr.top + 24, '+1일');
      else floatChip(br.left + br.width / 2, br.top - 8, '+1일');
      try { sessionStorage.setItem('orchard-grew', '1'); } catch (err) {}
      setTimeout(function () { b.__busy = false; replay(b); }, reduce ? 0 : 950);
    }
  }, true);
  // 출근하고 넘어온 화면: 자란 나무가 통통 튀고 잎이 떨어진다
  function arrive() {
    var grew = false;
    try { grew = sessionStorage.getItem('orchard-grew') === '1'; sessionStorage.removeItem('orchard-grew'); } catch (err) {}
    var tw = mainTree();
    if (!grew || !tw || !tw.__view || STILL) return;
    var svg = tw.querySelector('svg[role="img"]'), label = svg ? svg.getAttribute('aria-label') || '' : '';
    // 20일을 채우고 넘어온 화면: 열매가 맺히는 장면을 보여 준다
    if (daysOf(label) === 20 && !/수확 완료/.test(label) && tw.__view.ripen && tw.__view.fruitMax()) {
      try { tw.scrollIntoView({ block: 'center' }); } catch (err) {}
      setTimeout(function () { tw.__view.ripen(FRUIT_BASE); }, 350);
      return;
    }
    setTimeout(function () { tw.__view.bounce(); tw.__view.shower(7); var r = tw.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height * 0.35, 12); }, 450);
  }

  /* 화면의 이름 바꾸기(시안): "내 나무" → "내 씨앗". 탭, 아래 탭, 패널 제목, 창 제목. 글자 전체가 이 말인 곳만 바꾼다 */
  var RENAME = { '내 나무': '내 씨앗' };
  function rename() {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n, hit = [];
    while ((n = w.nextNode())) if (RENAME[n.nodeValue.trim()]) hit.push(n);
    hit.forEach(function (n) { var t = n.nodeValue.trim(); n.nodeValue = n.nodeValue.replace(t, RENAME[t]); });
    Object.keys(RENAME).forEach(function (k) { if (document.title.indexOf(k) >= 0) document.title = document.title.replace(k, RENAME[k]); });
  }

  /* 내 씨앗 패널의 글(시안)
     - "지금까지 N일 출근했고, 지금은 꽃 단계예요. M일 더 나오면 열매가 열려요." 한 문단을 둘로 나눈다.
       윗줄은 "단계"라는 말 없이 지금 모습을 말하듯 쓰고, 아랫줄은 출근한 날과 다음까지 남은 날을 작은 글씨로 둔다
     - 맨 아래 "열매는 출근 20일에 열리고…" 문단은 숨기고, 그 내용은 씨앗 칩을 누르면 뜨는 안내로 옮긴다 */
  var NOW_COPY = {
    '씨앗': '아직 씨앗이에요. 첫 출근으로 싹을 틔워 주세요.',
    '새싹': '아직 새싹이에요. 물을 더 줘서 가꿔 주세요.',
    '묘목': '묘목으로 자랐어요. 꾸준히 물을 주면 나무가 돼요.',
    '나무': '어느새 나무가 됐어요. 곧 꽃망울이 맺혀요.',
    '꽃': '지금은 꽃이 피었네요. 열매가 머지않았어요.',
    '열매': '열매가 열렸어요. 출근할 때마다 하나씩 더 열려요.'
  };
  function treeCopy() {
    var panel = document.querySelector('section[aria-labelledby="h-tree"]');
    if (!panel) return;
    [].slice.call(panel.querySelectorAll('p')).forEach(function (p) {
      if (p.hasAttribute('data-orchard-lead')) return;
      var t = (p.textContent || '').trim(), m, days = 0, stage = '씨앗', next = '';
      if (/^열매는 출근 \d+일에 열리고/.test(t)) { p.setAttribute('data-orchard-hide', ''); return; }
      if ((m = /^지금까지 (\d+)일 출근했고, 지금은 (\S+) 단계예요\.\s*(.*)$/.exec(t))) { days = +m[1]; stage = m[2]; next = m[3]; }
      else if ((m = /^아직 출근한 날이 없어요\.\s*(.*)$/.exec(t))) { next = m[1]; }
      else return;
      if (!NOW_COPY[stage]) return;
      var a = document.createElement('span'), b = document.createElement('span');
      a.className = 'orchard-now'; a.textContent = NOW_COPY[stage];
      b.className = 'orchard-next'; b.textContent = (days ? '출근 ' + days + '일 · ' : '') + next.replace(/\.$/, '');
      p.textContent = ''; p.setAttribute('data-orchard-lead', ''); p.appendChild(a); if (b.textContent) p.appendChild(b);
    });
    var text = panel.querySelector('[data-role="content-badge-text"]'), chip = text && (text.closest('[data-component]') || text.parentElement);
    if (!chip || chip.parentElement.classList.contains('orchard-seedtip')) return;
    var seedName = (text.textContent || '').trim(), fig = panel.querySelector('[aria-label*="출근 "]'), label = fig ? fig.getAttribute('aria-label') : '';
    var d = /출근 (\d+)일/.exec(label), grown = /수확 완료/.test(label) || (d && +d[1] >= 20);
    var wrap = document.createElement('span'), tip = document.createElement('span');
    wrap.className = 'orchard-seedtip';
    tip.setAttribute('role', 'tooltip'); tip.id = 'orchard-seedtip'; tip.hidden = true;
    tip.innerHTML = '<span></span>' + (grown ? '' : '<span>열매는 출근 20일에 열려요.</span>');
    tip.firstChild.textContent = seedName + ' 씨앗을 골랐어요.';
    chip.parentElement.insertBefore(wrap, chip); wrap.appendChild(chip); wrap.appendChild(tip);
    chip.setAttribute('role', 'button'); chip.setAttribute('tabindex', '0'); chip.setAttribute('aria-expanded', 'false'); chip.setAttribute('aria-describedby', tip.id);
    if (STILL) return;
    var timer = 0;
    function show(on) {
      clearTimeout(timer);
      tip.hidden = !on; chip.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) timer = setTimeout(function () { show(false); }, 5000);
    }
    chip.addEventListener('click', function () { show(tip.hidden); });
    chip.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(tip.hidden); } });
    document.addEventListener('click', function (e) { if (!tip.hidden && !wrap.contains(e.target)) show(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !tip.hidden) { e.stopPropagation(); show(false); } }, true);
  }

  /* 헤더(시안): 탭 셋을 가운데에 두고, 오른쪽에 화면 테마 전환을 둔다.
     아이콘은 몽타주(@montage-ui/icon)의 sun · moon · desktop · chevron-down · check 를 그대로 옮겼다.
     고른 테마는 주소의 ?theme= 에 적어 다음 화면으로 들고 간다(Auto 는 지우고 기기 설정을 따른다) */
  var THEME_ICON = {"light":["M11.1001 21.9996C11.1001 22.4967 11.5031 22.8996 12.0001 22.8996C12.4972 22.8996 12.9001 22.4967 12.9001 21.9996V19.9996C12.9001 19.5026 12.4972 19.0996 12.0001 19.0996C11.5031 19.0996 11.1001 19.5026 11.1001 19.9996V21.9996Z","M11.1001 3.99961C11.1001 4.49667 11.5031 4.89961 12.0001 4.89961C12.4972 4.89961 12.9001 4.49667 12.9001 3.99961V1.99961C12.9001 1.50255 12.4972 1.09961 12.0001 1.09961C11.5031 1.09961 11.1001 1.50255 11.1001 1.99961V3.99961Z","M6.6 11.9968C6.6 9.01444 9.01766 6.59678 12 6.59678C14.9823 6.59678 17.4 9.01444 17.4 11.9968C17.4 14.9791 14.9823 17.3968 12 17.3968C9.01766 17.3968 6.6 14.9791 6.6 11.9968ZM12 8.39678C10.0118 8.39678 8.4 10.0086 8.4 11.9968C8.4 13.985 10.0118 15.5968 12 15.5968C13.9882 15.5968 15.6 13.985 15.6 11.9968C15.6 10.0086 13.9882 8.39678 12 8.39678Z","M1.1001 11.9995C1.1001 11.5024 1.50304 11.0995 2.0001 11.0995H4.0001C4.49715 11.0995 4.9001 11.5024 4.9001 11.9995C4.9001 12.4965 4.49715 12.8995 4.0001 12.8995H2.0001C1.50304 12.8995 1.1001 12.4965 1.1001 11.9995Z","M19.1001 11.9995C19.1001 11.5024 19.503 11.0995 20.0001 11.0995H22.0001C22.4972 11.0995 22.9001 11.5024 22.9001 11.9995C22.9001 12.4965 22.4972 12.8995 22.0001 12.8995H20.0001C19.503 12.8995 19.1001 12.4965 19.1001 11.9995Z","M4.29266 19.707C3.94119 19.3555 3.94119 18.7857 4.29266 18.4342L5.70687 17.02C6.05834 16.6685 6.62819 16.6685 6.97966 17.02C7.33114 17.3714 7.33114 17.9413 6.97966 18.2928L5.56545 19.707C5.21398 20.0584 4.64413 20.0584 4.29266 19.707Z","M17.0206 6.97905C16.6691 6.62758 16.6691 6.05773 17.0206 5.70626L18.4348 4.29205C18.7863 3.94058 19.3561 3.94058 19.7076 4.29205C20.0591 4.64352 20.0591 5.21337 19.7076 5.56484L18.2934 6.97905C17.9419 7.33053 17.3721 7.33053 17.0206 6.97905Z","M18.4347 19.707C18.7861 20.0584 19.356 20.0584 19.7075 19.707C20.0589 19.3555 20.0589 18.7857 19.7075 18.4342L18.2932 17.02C17.9418 16.6685 17.3719 16.6685 17.0205 17.02C16.669 17.3714 16.669 17.9413 17.0205 18.2928L18.4347 19.707Z","M5.70675 6.97905C6.05822 7.33053 6.62807 7.33053 6.97954 6.97905C7.33101 6.62758 7.33101 6.05773 6.97954 5.70626L5.56533 4.29205C5.21386 3.94058 4.64401 3.94058 4.29254 4.29205C3.94106 4.64352 3.94106 5.21337 4.29254 5.56484L5.70675 6.97905Z"],"dark":["M9.76131 2.54296C10.0164 2.81236 10.08 3.21069 9.92157 3.54615C9.42707 4.59301 9.1501 5.76348 9.1501 7.00115C9.1501 11.4747 12.7766 15.1011 17.2501 15.1011C18.3319 15.1011 19.362 14.8896 20.303 14.5064C20.6466 14.3665 21.0408 14.4517 21.2959 14.7211C21.551 14.9905 21.6146 15.3888 21.4562 15.7243C19.8723 19.0775 16.4584 21.4005 12.5001 21.4005C7.03248 21.4005 2.6001 16.9681 2.6001 11.5005C2.6001 7.35162 5.15198 3.80089 8.76835 2.32821C9.11196 2.18829 9.50623 2.27355 9.76131 2.54296ZM7.53222 5.10214C5.62565 6.58467 4.4001 8.9001 4.4001 11.5005C4.4001 15.974 8.02659 19.6005 12.5001 19.6005C14.9431 19.6005 17.1345 18.519 18.6202 16.807C18.1722 16.8691 17.7147 16.9011 17.2501 16.9011C11.7825 16.9011 7.3501 12.4688 7.3501 7.00115C7.3501 6.35203 7.41268 5.71707 7.53222 5.10214Z"],"auto":["M5.11676 3.1001C4.72531 3.10008 4.37873 3.10007 4.09161 3.12353C3.78583 3.14851 3.46898 3.20452 3.16052 3.36169C2.70893 3.59178 2.34178 3.95894 2.11169 4.41053C1.95452 4.71898 1.89851 5.03583 1.87353 5.34162C1.85007 5.62874 1.85008 5.97519 1.8501 6.36664V14.1334C1.85008 14.5249 1.85007 14.8715 1.87353 15.1586C1.89851 15.4644 1.95452 15.7812 2.11169 16.0897C2.34178 16.5413 2.70893 16.9084 3.16052 17.1385C3.46898 17.2957 3.78583 17.3517 4.09161 17.3767C4.37874 17.4001 4.72519 17.4001 5.11666 17.4001L11.1001 17.4001V19.5998H6.99973C6.50268 19.5998 6.09974 20.0028 6.09974 20.4998C6.09974 20.9969 6.50268 21.3998 6.99973 21.3998H16.9997C17.4967 21.3998 17.8997 20.9969 17.8997 20.4998C17.8997 20.0028 17.4967 19.5998 16.9997 19.5998H12.9001V17.4001L18.8834 17.4001C19.2748 17.4001 19.6214 17.4001 19.9085 17.3767C20.2143 17.3517 20.5312 17.2957 20.8396 17.1385C21.2912 16.9084 21.6584 16.5413 21.8885 16.0897C22.0456 15.7812 22.1016 15.4644 22.1266 15.1586C22.1501 14.8714 22.1501 14.525 22.15 14.1335V6.36677C22.1501 5.97527 22.1501 5.62876 22.1266 5.34162C22.1016 5.03583 22.0456 4.71898 21.8885 4.41053C21.6584 3.95894 21.2912 3.59178 20.8396 3.36169C20.5312 3.20452 20.2143 3.14851 19.9085 3.12353C19.6214 3.10007 19.275 3.10008 18.8835 3.1001H5.11676ZM4.06454 4.92966C4.12074 4.9114 4.22151 4.9003 4.84995 4.9003H19.1499C19.7783 4.9003 19.8791 4.9114 19.9353 4.92966C20.118 4.98901 20.2612 5.13222 20.3205 5.31489C20.3388 5.37109 20.3499 5.47186 20.3499 6.1003V14.4003C20.3499 15.0287 20.3388 15.1295 20.3205 15.1857C20.2612 15.3684 20.118 15.5116 19.9353 15.5709C19.8791 15.5892 19.7783 15.6003 19.1499 15.6003H4.84995C4.22152 15.6003 4.12074 15.5892 4.06454 15.5709C3.88188 15.5116 3.73867 15.3684 3.67932 15.1857C3.66105 15.1295 3.64995 15.0287 3.64995 14.4003V6.1003C3.64995 5.47186 3.66105 5.37109 3.67932 5.31489C3.73867 5.13222 3.88188 4.98901 4.06454 4.92966Z"],"chevron":["M3.3637 7.36346C3.71517 7.01199 4.28502 7.01199 4.63649 7.36346L12.0001 14.7271L19.3637 7.36346C19.7152 7.01199 20.285 7.01199 20.6365 7.36346C20.988 7.71493 20.988 8.28478 20.6365 8.63625L12.6365 16.6362C12.285 16.9877 11.7152 16.9877 11.3637 16.6362L3.3637 8.63625C3.01223 8.28478 3.01223 7.71493 3.3637 7.36346Z"],"check":["M19.3864 6.86346C19.7379 7.21493 19.7379 7.78478 19.3864 8.13625L10.3865 17.1362C10.035 17.4877 9.46515 17.4877 9.11368 17.1362L4.6137 12.6362C4.26223 12.2848 4.26223 11.7149 4.6137 11.3635C4.96517 11.012 5.53502 11.012 5.88649 11.3635L9.75008 15.2271L18.1136 6.86346C18.4651 6.51199 19.035 6.51199 19.3864 6.86346Z"]};
  var THEME_LABEL = { light: 'Light', dark: 'Dark', auto: 'Auto' };
  function glyph(name, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + THEME_ICON[name].map(function (d) { return '<path fill-rule="evenodd" clip-rule="evenodd" d="' + d + '"/>'; }).join('') + '</svg>';
  }
  function themeMode() {
    var t = null;
    try { t = new URLSearchParams(location.search).get('theme'); } catch (e) {}
    return t === 'light' || t === 'dark' ? t : 'auto';
  }
  function setTheme(mode) {
    var real = mode === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode;
    try {
      var u = new URL(location.href);
      if (mode === 'auto') u.searchParams.delete('theme'); else u.searchParams.set('theme', mode);
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    } catch (e) {}
    root.style.colorScheme = real;
    root.setAttribute('data-theme', real);
  }
  function headerLayout() {
    var bar = document.querySelector('body > header > div');
    if (!bar) return;
    var tabs = bar.querySelector('[role="tablist"]'), user = bar.lastElementChild;
    while (tabs && tabs.parentNode !== bar) tabs = tabs.parentNode;
    if (!tabs || !user || user === tabs) return;   // 로그인·가입 화면의 헤더에는 탭과 이름이 없다
    bar.setAttribute('data-orchard-head', 'bar'); tabs.setAttribute('data-orchard-head', 'tabs'); user.setAttribute('data-orchard-head', 'user');
    if (user.querySelector('.orchard-theme')) return;
    var wrap = document.createElement('div'), modes = ['light', 'dark', 'auto'];
    wrap.className = 'orchard-theme';
    wrap.innerHTML = '<button type="button" aria-label="화면 테마" aria-haspopup="menu" aria-expanded="false"></button>' +
      '<div role="menu" aria-label="화면 테마" hidden>' + modes.map(function (m) {
        return '<button type="button" role="menuitemradio" data-mode="' + m + '" aria-checked="false" tabindex="-1">' + glyph(m, 'i') + '<span>' + THEME_LABEL[m] + '</span>' + glyph('check', 'c') + '</button>';
      }).join('') + '</div>';
    user.insertBefore(wrap, user.firstChild);
    var btn = wrap.firstChild, menu = wrap.lastChild, items = [].slice.call(menu.children);
    function sync() {
      var m = themeMode();
      btn.innerHTML = glyph(m, 'i') + glyph('chevron', 'v');
      items.forEach(function (it) { it.setAttribute('aria-checked', it.getAttribute('data-mode') === m ? 'true' : 'false'); });
    }
    function open(on) {
      menu.hidden = !on; btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) { var cur = menu.querySelector('[aria-checked="true"]') || items[0]; try { cur.focus({ preventScroll: true }); } catch (e) {} }
    }
    sync();
    if (STILL) return;
    btn.addEventListener('click', function () { open(menu.hidden); });
    menu.addEventListener('click', function (e) {
      var it = e.target.closest('[data-mode]');
      if (!it) return;
      setTheme(it.getAttribute('data-mode')); sync(); open(false);
      try { btn.focus({ preventScroll: true }); } catch (err) {}
    });
    menu.addEventListener('keydown', function (e) {
      var i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus(); }
    });
    document.addEventListener('click', function (e) { if (!menu.hidden && !wrap.contains(e.target)) open(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { e.stopPropagation(); open(false); btn.focus(); } }, true);
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', function () { if (themeMode() === 'auto') setTheme('auto'); });
  }

  // 로그아웃: 헤더의 버튼은 숨기고, 내 설정 창(출근 플랜이 있는 창)의 내용 맨 아래에 둔다
  function moveSignOut() {
    document.querySelectorAll('body > header button').forEach(function (b) {
      if ((b.textContent || '').replace(/\s+/g, '') === '로그아웃') b.setAttribute('data-orchard-hide', '');
    });
    var dlg = document.querySelector('[role="dialog"]'), plan = dlg && dlg.querySelector('input[name="plan"]');
    if (!plan || dlg.querySelector('.orchard-signout')) return;
    var field = plan.closest('[data-component="form-control"]') || plan.parentElement, stack = field && field.parentElement;
    if (!stack) return;
    var row = document.createElement('div'), btn = document.createElement('button');
    row.className = 'orchard-signout'; btn.type = 'button'; btn.textContent = '로그아웃';
    row.appendChild(btn); stack.appendChild(row);
  }
  // 패널과 고정된 띠를 찾아 배경이 비치게 한다
  /* ---------- 파란 주 버튼: 물이 찰랑이는 효과 ----------
     버튼을 물이 가득 찬 유리잔처럼 다룬다. 평소에는 물이 끝까지 차 있어 지금 버튼과 똑같이 보인다.
     올리거나(hover) 초점이 가거나 누르면: 버튼 바탕이 물처럼 조금 비치고, 수면이 살짝 내려와 위쪽에 맑은 띠가 생기며, 수면이 한 번 출렁인 뒤 잔잔하게 찰랑인다.
     크기·모양·글꼴·파란색은 그대로다. 글자는 늘 물(원래 파랑) 안에 있어 읽기에 지장이 없다.
     움직임은 편안한 정도로만: 수면은 버튼 높이의 22%만 내려오고, 기울기는 처음 한 번 2.2도, 그 뒤로 0.8도 안에서 3.6초에 한 번 오간다.
     물결 모양은 사용자가 준 Slide Fill Button(Originkit)의 물결 경로를 그대로 쓴다 */
  function wavePath(period, amp, invert, open) {
    var count = Math.round(400 / period), q = period / 4, a = invert ? amp : -amp, d = 'M 0 15';
    for (var i = 0; i < count; i++) { var x0 = i * period; d += ' C ' + (x0 + q) + ' ' + (15 + a) + ', ' + (x0 + period - q) + ' ' + (15 - a) + ', ' + (x0 + period) + ' 15'; }
    return open ? d : d + ' V 40 H 0 Z';
  }
  // 버튼 바탕이 몽타주 브랜드 파랑(blue 50, 다크는 blue 60)인 것만 고른다
  var BRAND = { 'rgb(0, 102, 255)': 1, 'rgb(51, 133, 255)': 1 };
  function fillButtons() {
    var list = document.querySelectorAll('button, a'), back = wavePath(200, 9, true), front = wavePath(100, 10), line = wavePath(100, 10, false, true);
    for (var i = 0; i < list.length; i++) {
      var b = list[i], old = b.querySelector(':scope > .orchard-water');
      if (b.matches(':hover, :focus-visible, :active') && old) continue;   // 비쳐 보이는 동안의 색으로 다시 판단하지 않는다
      var base = getComputedStyle(b).backgroundColor, r = b.getBoundingClientRect();
      if (!BRAND[base] || (r.width && (r.width < 72 || r.height < 28))) { if (old) { old.remove(); b.classList.remove('orchard-fill'); } continue; }
      b.style.setProperty('--o-base', base);
      if (old) continue;
      var w = document.createElement('span');
      w.className = 'orchard-water'; w.setAttribute('aria-hidden', 'true');
      w.innerHTML = '<span class="tilt"><span class="crest">' +
        '<svg class="back" viewBox="0 0 400 30" preserveAspectRatio="none"><path d="' + back + '"/></svg>' +
        '<svg class="front" viewBox="0 0 400 30" preserveAspectRatio="none"><path d="' + front + '"/><path class="glint" d="' + line + '"/></svg>' +
        '</span><span class="body"></span></span>';
      b.classList.add('orchard-fill');
      b.insertBefore(w, b.firstChild);
    }
  }

  // 이번 주: 출근한 날의 원, 오늘의 원, "목표 달성" 칩을 찾아 표시한다(색은 CSS 가 배지와 같은 파랑 유리로 바꾼다)
  function weekLook() {
    var sec = document.querySelector('section[aria-labelledby="h-week"]');
    if (!sec) return;
    [].slice.call(sec.querySelectorAll('ol > li')).forEach(function (li) {
      var c = li.children[1]; if (!c) return;
      if (c.querySelector('svg')) c.setAttribute('data-orchard-dot', 'done');
      else if ((c.textContent || '').trim() === '오늘') c.setAttribute('data-orchard-dot', 'today');
    });
    [].slice.call(sec.querySelectorAll('[data-role="content-badge-text"]')).forEach(function (t) {
      if ((t.textContent || '').trim() === '목표 달성') (t.closest('[data-component]') || t.parentElement).setAttribute('data-orchard-chip', 'accent');
    });
  }
  function glassify() {
    markTheme();
    try { weekLook(); } catch (e) {}
    try { gamify(); } catch (e) {}
    document.querySelectorAll('[data-orchard-glass]').forEach(function (e) { e.removeAttribute('data-orchard-glass'); e.style.removeProperty('--og-c'); });
    var all = document.querySelectorAll('main section, main li, main div, main label, main input, main textarea'), panels = [];
    function opaque(c) { var m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return false; var q = m[1].split(/[ ,/]+/); return q.length < 4 || Number(q[3]) >= 0.95; }
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.closest('[role="dialog"]')) continue;
      var cs = getComputedStyle(e), r = e.getBoundingClientRect();
      if (cs.position === 'fixed' && /gradient/.test(cs.backgroundImage)) { e.setAttribute('data-orchard-glass', 'dock'); continue; }
      if (!opaque(cs.backgroundColor)) continue;
      var rad = parseFloat(cs.borderTopLeftRadius);
      if (rad >= 16 && r.width > 200 && r.height > 80) { e.style.setProperty('--og-c', cs.backgroundColor); e.setAttribute('data-orchard-glass', 'panel'); e.style.setProperty('--oi', panels.length); panels.push(e); }
    }
    // 유리 패널 안에서 흰색으로 꽉 찬 칸(입력 칸, 선택 상자)은 반투명하게
    panels.forEach(function (panel) {
      var base = panel.style.getPropertyValue('--og-c');
      panel.querySelectorAll('div, label, input, textarea, li').forEach(function (e) {
        if (e.hasAttribute('data-orchard-glass')) return;
        var cs = getComputedStyle(e);
        if (cs.backgroundColor !== base) return;
        var r = e.getBoundingClientRect();
        if (r.width < 40 || r.height < 28 || r.width * r.height < 2400) return;
        e.style.setProperty('--og-c', base); e.setAttribute('data-orchard-glass', 'inset');
      });
    });
  }

  function setScheme(name) {
    state.scheme = SCHEME[name] ? name : 'base';
    if (bg) bg.setTarget();
  }

  /* ---------- 포인터 ---------- */
  if (!STILL) {
    window.addEventListener('pointermove', function (e) {
      var p = toP(e.clientX, e.clientY), now = performance.now(), dt = Math.max(8, now - pointer.lt) / 1000;
      if (pointer.active > 0) {
        var vx = (p[0] - pointer.x) / dt * 0.045, vy = (p[1] - pointer.y) / dt * 0.045, l = Math.sqrt(vx * vx + vy * vy);
        if (l > 0.16) { vx *= 0.16 / l; vy *= 0.16 / l; }
        pointer.tvx = vx; pointer.tvy = vy;
      }
      pointer.x = p[0]; pointer.y = p[1]; pointer.lt = now; pointer.active = e.pointerType === 'mouse' ? 3 : 1.2;
    }, { passive: true });
    window.addEventListener('pointerdown', function (e) {
      var p = toP(e.clientX, e.clientY);
      pointer.x = p[0]; pointer.y = p[1]; pointer.lt = performance.now(); pointer.active = 1.5; pointer.down = 1;
      if (bg) bg.ripple(p[0], p[1]);
    }, { passive: true });
    window.addEventListener('pointerup', function () { pointer.down = 0; }, { passive: true });
    window.addEventListener('pointercancel', function () { pointer.down = 0; }, { passive: true });
  }

  /* ---------- 시작 ---------- */
  var api = window.Orchard = {
    still: STILL,
    level: function (el, label) { levelBadge(el, label); },
    setScheme: setScheme,
    ripple: function (cx, cy) { if (bg) { var p = toP(cx == null ? window.innerWidth / 2 : cx, cy == null ? window.innerHeight / 2 : cy); bg.ripple(p[0], p[1]); } },
    fruit: function (el, seed, opt) { return fx ? fx.fruit(el, seed, opt) : null; },
    stage: function (el, kind, seed, opt) { return fx ? fx.stage(el, kind, seed, opt) : null; },
    grow: function (el, seed) { return fx ? fx.grow(el, seed) : null; },
    cluster: function (el) { return fx ? fx.cluster(el) : null; },
    journey: function (el) { return fx ? fx.journey(el) : null; },
    showcase: function (el, first) { return fx ? fx.showcase(el, first) : null; },
    planting: function (el, seed) { return fx ? fx.planting(el, seed) : null; },
    ready: []
  };

  // 정지 화면(보드 목록): 한 장 그리고 바로 WebGL을 놓는다. 화면이 수십 개여도 동시에 잡는 수가 늘지 않는다
  function still() {
    var needBg = true, needFx = true, tries = 0;
    try { rename(); } catch (e) {} try { headerLayout(); } catch (e) {} try { treeCopy(); } catch (e) {}
    try { glassify(); } catch (e) {} try { moveSignOut(); } catch (e) {} try { fillButtons(); } catch (e) {}
    (function attempt() {
      // 에셋을 먼저 붙여야 내 씨앗 색(배경 꽃 색)이 정해진다
      if (needFx && !fx) {
        try { fx = initAssets(); adopt(); (window.OrchardReady || []).forEach(function (fn) { try { fn(api); } catch (e) {} }); } catch (e) { fx = null; needFx = false; }
      }
      if (needBg) {
        var b = null;
        try { b = initBackground(); b.frame(0.016); needBg = !b.freeze(); } catch (e) { needBg = true; }
      }
      if (needFx && fx) { try { needFx = !fx.shot(); } catch (e) { needFx = false; } }
      if ((needBg || needFx) && ++tries < 5) setTimeout(attempt, 250 + Math.random() * 500);
    })();
  }
  function start() {
    if (STILL) { still(); return; }
    try { bg = initBackground(); } catch (e) { bg = null; }
    try { fx = initAssets(); } catch (e) { fx = null; }
    try { rename(); } catch (e) {} try { headerLayout(); } catch (e) {} try { treeCopy(); } catch (e) {}
    try { glassify(); } catch (e) {} try { moveSignOut(); } catch (e) {} try { fillButtons(); } catch (e) {}
    try { adopt(); } catch (e) {}
    (window.OrchardReady || []).forEach(function (fn) { try { fn(api); } catch (e) {} });
    try { arrive(); } catch (e) {}

    function themed() { try { glassify(); } catch (e) {} try { moveSignOut(); } catch (e) {} try { fillButtons(); } catch (e) {} if (bg) bg.setTarget(); if (fx) fx.redraw(); }
    new MutationObserver(themed).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', themed);
    window.addEventListener('resize', function () { if (bg) bg.resize(); if (fx) fx.redraw(); });

    function loop(now) {
      var dt = Math.min(0.05, (now - clock.last) / 1000); clock.last = now;
      clock.t += dt * (reduce ? 0.25 : 1);
      if (!document.hidden) { if (bg) bg.frame(dt); if (fx) fx.frame(dt); }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
