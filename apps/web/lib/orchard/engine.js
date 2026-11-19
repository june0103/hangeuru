// @ts-nocheck
/* 과수원 그리기 엔진. 보드의 디자인 레이어(design/local/preview/orchard/orchard.js)에서 그리는 부분만 그대로 옮겼다.
   - 배경: 몽타주 atomic 색으로 만든 꽃이 물 흐르듯 떠다니고, 포인터에 밀리고, 누르면 물결이 번진다
   - 에셋: three.js 로 만든 과일 4종, 자라는 단계의 나무, 심는 장면, 스플래시 여정, 열매가 맺히는 장면, 물 주기
   화면(React)은 createOrchard() 로 받은 API 만 부른다. 서버에서 불러와도 되고(window 는 함수 안에서만 쓴다),
   브라우저에서 처음 부를 때 한 번 시작한다. 색은 아래 A(몽타주 atomic 4.3.2)의 값만 쓴다 */
import * as THREE from 'three';

  /* ---------- 몽타주 atomic 색 (4.3.2). 배경과 에셋은 여기 있는 값만 쓴다 ---------- */
  export var A = {
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
  export var FRUIT_COLOR = { apple: A.red[50], tangerine: A.orange[50], peach: A.redOrange[70], coffee: A.red[30] };
  export var SEED_OF = { '사과': 'apple', '귤': 'tangerine', '복숭아': 'peach', '커피': 'coffee' };

/* 자라는 단계(지금 규칙, spec 2.6): 새싹 1, 묘목 5, 나무 10, 꽃 15, 열매 20 */
export function stageOf(days, harvested) {
  if (harvested) return 'harvested';
  return days >= 20 ? 4 : days >= 15 ? 'bloom' : days >= 10 ? 3 : days >= 5 ? 2 : days >= 1 ? 1 : 0;
}
/* 열매 수: 20일에 다섯 개가 맺히고, 그 뒤로 출근한 날마다 하나씩 는다 */
export var FRUIT_BASE = 5;
export function fruitsOf(days) { return FRUIT_BASE + Math.max(0, days - 20); }

var instance = null;
/* options.layout: 배경 꽃이 머무는 자리(splash | auth | seeds | app), options.scheme: 꽃 색 계열(씨앗 이름 또는 base) */
export function createOrchard(options) {
  if (instance) return instance;
  if (typeof window === 'undefined') throw new Error('createOrchard 는 브라우저에서만 부른다');
  instance = boot(options || {});
  return instance;
}

function boot(options) {
  var root = document.documentElement;
  var STILL = false;   // 보드의 화면 목록용 정지 모드. 앱에서는 쓰지 않는다
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LAYOUT = options.layout || 'app';
  var state = { scheme: options.scheme || 'base' };
  var clock = { t: 0, last: performance.now() };

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

    var homes = (HOMES[LAYOUT] || HOMES.app).slice(), start = STILL ? 1 : 0.5;
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
    function setHomes(name) { var h = HOMES[name] || HOMES.app; for (var i = 0; i < 8; i++) homes[i] = h[i]; }
    return { frame: frame, resize: resize, ripple: ripple, setTarget: setTarget, freeze: freeze, setHomes: setHomes };
  }

  /* ---------- 에셋 ---------- */
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
    /* 열매별 씨앗(로그인 뒤 고른 씨앗을 심을 때, 씨앗 단계의 나무). 스플래시·온보딩의 씨앗은 treeKit 의 seedGeo 하나를 그대로 쓴다.
       모양은 실제 씨앗을 참고했다(사과·귤·복숭아·커피, 2026-11-20 웹 검색). 지금 씨앗과 같은 매끄러운 3D(공을 빚어 만든 몸통 + 유광 재질)
       - 사과: 한쪽 끝이 뾰족한 작은 눈물방울, 짙은 적갈색, 반들반들
       - 귤: 미색(크림), 한쪽이 뾰족한 쐐기형 눈물방울, 세로로 잔주름
       - 복숭아: 큰 타원형 씨(핵), 끝이 뾰족하고 표면에 깊은 골, 붉은 갈색, 무광. 한쪽 옆에 솔기
       - 커피: 생두. 한쪽은 둥글고 반대쪽은 평평하며 가운데에 S자 골, 옅은 회녹색 */
    var seedCache = {};
    function seedOf(kind) {
      if (seedCache[kind]) return seedCache[kind];
      var q = treeKit(), S;
      if (kind === 'apple') S = {
        geo: ball(function (v, u) {
          var t = (u.y + 1) / 2;                                            // 0 아래(둥근 쪽) ~ 1 위(뾰족한 끝)
          var w = Math.pow(Math.sin(Math.PI * Math.min(1, 0.24 + t * 0.84)), 0.6);
          v.x = u.x * 0.6 * w; v.z = u.z * 0.42 * w; v.y = u.y * (u.y > 0 ? 1.25 : 0.95);
        }, 40, 28),
        mat: clay('#4E2410', { roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.18, sheen: lin('#5C2A14') }),
        scale: 1
      };
      else if (kind === 'tangerine') S = {
        geo: ball(function (v, u) {
          var t = (u.y + 1) / 2, a = Math.atan2(u.z, u.x);
          var w = Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)), 0.7);
          var ridge = 1 + 0.045 * Math.sin(a * 9 + u.y * 2) + (fbm(u.x * 5, u.y * 5, u.z * 5, 2) - 0.5) * 0.1;
          v.x = u.x * 0.66 * w * ridge; v.z = u.z * 0.46 * w * ridge; v.y = u.y * (u.y > 0 ? 1.15 : 0.9);
        }, 48, 32),
        mat: clay('#EADBB6', { roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
        scale: 1.05
      };
      else if (kind === 'peach') S = {
        geo: ball(function (v, u) {
          var t = (u.y + 1) / 2;
          var w = Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.95)), 0.6);
          // 깊은 골: 길게 이어지는 굵은 주름 + 잔구멍
          var g1 = fbm(u.x * 3.2 + 1, u.y * 1.6, u.z * 3.2, 3), g2 = fbm(u.x * 9, u.y * 9 + 3, u.z * 9, 2);
          var groove = 1 - 0.14 * Math.pow(Math.abs(Math.sin(g1 * 9)), 0.5) - 0.04 * g2;
          var seam = 1 + 0.06 * Math.exp(-Math.pow(u.z / 0.12, 2)) * (u.x > 0 ? 1 : 0);   // 한쪽 옆 솔기
          v.x = u.x * 0.72 * w * groove * seam; v.z = u.z * 0.56 * w * groove; v.y = u.y * (u.y > 0 ? 1.12 : 0.92) * (0.97 + 0.03 * groove);
        }, 72, 52),
        mat: clay('#8A4E33', { roughness: 0.82, clearcoat: 0.05 }),
        scale: 1.35
      };
      else if (kind === 'coffee') S = {
        geo: ball(function (v, u) {
          // 둥근 등(+z)과 평평한 배(-z), 배 가운데로 S자 골
          v.x = u.x * 0.6; v.y = u.y * 0.92;
          v.z = u.z > 0 ? u.z * 0.42 : Math.max(u.z * 0.42, -0.14);
          if (u.z < 0) {
            var cx = 0.05 * Math.sin(u.y * 3.2), d = (u.x * 0.6 - cx) / 0.07;
            v.z += 0.09 * Math.exp(-d * d) * Math.min(1, (1 - Math.abs(u.y)) * 3);
          }
        }, 56, 40),
        mat: clay('#AEB48A', { roughness: 0.62, clearcoat: 0.15, clearcoatRoughness: 0.6 }),
        scale: 1.1
      };
      else S = { geo: q.seedGeo, mat: q.seed, scale: 1 };
      return (seedCache[kind] = S);
    }
    // 씨앗 하나(크기 s). 열매를 모르면 온보딩의 기본 씨앗
    function seedMesh(kind, s) {
      var S = seedOf(kind), m = new THREE.Mesh(S.geo, S.mat);
      m.scale.setScalar(s * S.scale);
      if (kind === 'coffee') m.rotation.x = -0.5;   // 생두는 평평한 배와 골이 살짝 보이게
      return m;
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
      0: function (seed) { var g = ground(), sd = seedMesh(seed, 0.2); sd.rotation.set(sd.rotation.x + 0.3, 0, 0.6); g.add(at(sd, 0.02, 0.12, 0.06)); return g; },
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
        var q = treeKit(), g = tree(seed, true), b = new THREE.Group(), rig = g.userData.rig;
        rig.fruits = rig.spots.map(function (c) { var m = at(mini(seed), c[0], c[1], c[2]); rig.inner.add(m); return m; });
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
      v.redraw = function () { v.dirty = true; };
      v.dispose = function () {
        var i = views.indexOf(v); if (i >= 0) views.splice(i, 1);
        if (c.parentNode) c.parentNode.removeChild(c);
        if (v.shaft && v.shaft.parentNode) v.shaft.parentNode.removeChild(v.shaft);
        v.shaft = null; v.live = false; v.disposed = true;
      };
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
      var shown = fruits.length ? Math.max(0, Math.min(fruits.length, opt.fruits == null ? (kind === 'harvested' ? 0 : 5) : opt.fruits)) : 0;
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
        if (!fruits.length || !rig.bloom) { if (done) done(); return; }   // 꽃이 지며 열매가 맺히는 장면은 열매가 달린 나무(4)에만 있다
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
      var sd = seedMesh(seed, 0.13); root.add(sd);   // 고른 열매의 씨앗
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
      // 고른 열매가 바뀌면 잎 모양과 심는 씨앗을 같이 바꾼다
      v.setSeed = function (name) {
        var n = leafOf(LEAF[name] ? name : 'apple'); leaves.forEach(function (L) { L.m.geometry = n.geo; L.m.material = n.mats[L.k]; });
        var S = seedOf(name); sd.geometry = S.geo; sd.material = S.mat; sd.scale.setScalar(0.13 * S.scale);
      };
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

  function markTheme() { root.classList.toggle('orchard-dark', isDark()); }
  markTheme();

  function setScheme(name) {
    state.scheme = SCHEME[name] ? name : 'base';
    if (bg) bg.setTarget();
  }

  /* ---------- 포인터 ---------- */
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

  /* ---------- 시작: 처음 무언가를 붙일 때 한 번 돈다 ---------- */
  var running = false;
  function loop(now) {
    var dt = Math.min(0.05, (now - clock.last) / 1000); clock.last = now;
    clock.t += dt * (reduce ? 0.25 : 1);
    if (!document.hidden) { if (bg) bg.frame(dt); if (fx) fx.frame(dt); }
    requestAnimationFrame(loop);
  }
  function run() { if (running) return; running = true; clock.last = performance.now(); requestAnimationFrame(loop); }
  function assets() { if (!fx) fx = initAssets(); run(); return fx; }
  function refreshTheme() { markTheme(); if (bg) bg.setTarget(); if (fx) fx.redraw(); }

  // 몽타주 ThemeProvider 는 html 의 data-theme 을 light | dark 로 바꾼다. 없으면 기기 설정을 따른다
  new MutationObserver(refreshTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', refreshTheme);
  window.addEventListener('resize', function () { if (bg) bg.resize(); if (fx) fx.redraw(); });

  return {
    reduce: reduce,
    isDark: isDark,
    refreshTheme: refreshTheme,
    mountBackground: function () { if (!bg) { try { bg = initBackground(); } catch (e) { bg = null; } } run(); },
    setLayout: function (name) { LAYOUT = HOMES[name] ? name : 'app'; if (bg) bg.setHomes(LAYOUT); },
    setScheme: setScheme,
    ripple: function (cx, cy) { if (bg) { var p = toP(cx == null ? window.innerWidth / 2 : cx, cy == null ? window.innerHeight / 2 : cy); bg.ripple(p[0], p[1]); } },
    fruit: function (el, seed, opt) { return assets().fruit(el, seed, opt); },
    stage: function (el, kind, seed, opt) { return assets().stage(el, kind, seed, opt); },
    grow: function (el, seed) { return assets().grow(el, seed); },
    cluster: function (el) { return assets().cluster(el); },
    journey: function (el) { return assets().journey(el); },
    showcase: function (el, first) { return assets().showcase(el, first); },
    planting: function (el, seed) { return assets().planting(el, seed); },
    redraw: function () { if (fx) fx.redraw(); }
  };
}
