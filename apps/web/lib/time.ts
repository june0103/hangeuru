// docs/spec.md 6.3. 오늘 날짜와 표시 시각은 서버에서만 만든다. 브라우저 시계를 쓰지 않는다
export const todayKST = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now);           // '2026-12-03'

export const hhmmKST = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(iso));                                                             // '09:48'

// 3단계: 개발 환경에서만 DEV_TODAY(YYYY-MM-DD)로 오늘을 덮어쓴다(spec 13.2). 운영(production)에서는 무시한다
const devToday = () => {
  const v = process.env.DEV_TODAY;
  return process.env.NODE_ENV !== 'production' && v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

/** 서버가 판단하는 오늘(KST) */
export const serverToday = () => devToday() ?? todayKST();

/** 서버의 현재 시각(ISO). DEV_TODAY가 있으면 그 날짜에 지금 KST 시각을 붙인다 */
export const serverNow = (now = new Date()) => {
  const d = devToday();
  if (!d) return now.toISOString();
  const t = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now);
  return new Date(`${d}T${t}+09:00`).toISOString();
};
