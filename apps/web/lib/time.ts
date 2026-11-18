// docs/spec.md 6.3. 오늘 날짜와 표시 시각은 서버에서만 만든다. 브라우저 시계를 쓰지 않는다
export const todayKST = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now);           // '2026-12-03'

export const hhmmKST = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(iso));                                                             // '09:48'
