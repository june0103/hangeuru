'use client';

import { useThemeControl } from '@montage-ui/core';
import { IconCheck, IconChevronDown, IconDesktop, IconMoon, IconSun } from '@montage-ui/icon';
import { type KeyboardEvent, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { HEADER } from '@/lib/copy';

// 헤더의 화면 테마 전환(spec 3.2): 지금 테마의 아이콘과 화살표, 누르면 Light·Dark·Auto 메뉴.
// 고른 값은 몽타주 ThemeProvider 가 기억한다. 모양은 app/orchard.css 의 .orchard-theme
const MODES = ['light', 'dark', 'system'] as const;
type Mode = (typeof MODES)[number];
const ICON = { light: IconSun, dark: IconMoon, system: IconDesktop } as const;

export default function ThemeControl() {
  const { themeOriginValue, setTheme } = useThemeControl();
  const [open, setOpen] = useState(false);
  // 서버가 그린 화면과 어긋나지 않게, 고른 값은 화면이 뜬 뒤에 읽는다
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const mode: Mode = ready && themeOriginValue ? themeOriginValue : 'system';
  const Now = ICON[mode];

  useEffect(() => {
    if (!open) return;
    items.current[MODES.indexOf(mode)]?.focus({ preventScroll: true });
    const away = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('click', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('click', away); document.removeEventListener('keydown', esc); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = items.current.findIndex(el => el === document.activeElement);
    items.current[(i + (e.key === 'ArrowDown' ? 1 : MODES.length - 1)) % MODES.length]?.focus();
  };

  return (
    <div className="orchard-theme" ref={wrap}>
      <button type="button" ref={trigger} aria-label={HEADER.theme} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        <Now className="i" aria-hidden />
        <IconChevronDown className="v" aria-hidden />
      </button>
      <div role="menu" aria-label={HEADER.theme} hidden={!open} onKeyDown={onKey}>
        {MODES.map((m, i) => {
          const Icon = ICON[m];
          return (
            <button
              key={m}
              type="button"
              role="menuitemradio"
              aria-checked={mode === m}
              tabIndex={-1}
              ref={el => { items.current[i] = el; }}
              onClick={() => { setTheme(m); setOpen(false); trigger.current?.focus({ preventScroll: true }); }}
            >
              <Icon className="i" aria-hidden />
              <span>{HEADER.themeModes[m]}</span>
              <IconCheck className="c" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}
