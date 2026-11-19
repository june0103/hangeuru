'use client';

import { Button } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import type { ComponentProps } from 'react';

// 파란 주 버튼의 찰랑이는 물(spec 3.2). 평소에는 그대로이고, 올리거나 누르면 바탕이 비치며 수면이 조금 내려와 출렁인다.
// 물 층은 버튼 바탕 위·글자 아래에 깔려 글자와 누르는 영역을 건드리지 않는다. 움직임과 값은 app/orchard.css 의 .orchard-fill, .orchard-water

// 물결 한 줄. 같은 모양이 이어져 끊김 없이 흐른다
function wavePath(period: number, amp: number, invert = false, open = false) {
  const count = Math.round(400 / period);
  const q = period / 4;
  const a = invert ? amp : -amp;
  let d = 'M 0 15';
  for (let i = 0; i < count; i++) {
    const x0 = i * period;
    d += ` C ${x0 + q} ${15 + a}, ${x0 + period - q} ${15 - a}, ${x0 + period} 15`;
  }
  return open ? d : `${d} V 40 H 0 Z`;
}

const BACK = wavePath(200, 9, true);
const FRONT = wavePath(100, 10);
const GLINT = wavePath(100, 10, false, true);

export function WaterFill() {
  return (
    <span className="orchard-water" aria-hidden="true">
      <span className="tilt">
        <span className="crest">
          <svg className="back" viewBox="0 0 400 30" preserveAspectRatio="none"><path d={BACK} /></svg>
          <svg className="front" viewBox="0 0 400 30" preserveAspectRatio="none"><path d={FRONT} /><path className="glint" d={GLINT} /></svg>
        </span>
        <span className="body" />
      </span>
    </span>
  );
}

type Props = Omit<ComponentProps<typeof Button>, 'variant' | 'color'>;

/** 몽타주 Button(solid, primary)에 물결을 입힌 주 버튼 */
export default function PrimaryButton({ children, className, sx, ...rest }: Props) {
  return (
    <Button
      variant="solid"
      color="primary"
      className={className ? `orchard-fill ${className}` : 'orchard-fill'}
      sx={[(theme: Theme) => ({ '--o-base': theme.semantic.foreground.brand.primary }), ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...rest}
    >
      <WaterFill />
      {children}
    </Button>
  );
}
