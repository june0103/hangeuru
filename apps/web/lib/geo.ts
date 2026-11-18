// 브라우저에서 지금 위치를 구한다 (spec 2.8). 위치는 서버 액션에 넘겨 판정에만 쓰고 저장하지 않는다
export type Position = { lat: number; lng: number };
export type PositionError = 'denied' | 'unavailable';

const TIMEOUT_MS = 10000;

export function getPosition(): Promise<Position | PositionError> {
  return new Promise(resolve => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve('unavailable');
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      e => resolve(e.code === e.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, timeout: TIMEOUT_MS, maximumAge: 0 },
    );
  });
}
