// 이 브라우저에서 로그인한 적이 있는지 적어 두는 쿠키. 있으면 스플래시(/start)를 다시 보여 주지 않는다(spec 3.1, 8.4)
export const SEEN_COOKIE = 'cc_seen';
export const SEEN_MAX_AGE = 60 * 60 * 24 * 365;
