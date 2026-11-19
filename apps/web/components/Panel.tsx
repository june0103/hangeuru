'use client';

import { Box } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import type { ComponentProps } from 'react';

// 공통 패널 (spec 3.2)
const RADIUS = 20;
const RADIUS_M = 16;
const PADDING = 24;
const PADDING_M = 20;

// 유리 패널: 뒤의 꽃 배경이 흐리게 비친다. 농도와 빛은 app/orchard.css 의 [data-orchard-glass="panel"]
export const GLASS = { 'data-orchard-glass': 'panel' } as const;

export const panelStyle = (theme: Theme) => ({
  '--og-c': theme.semantic.background.neutral.primary,
  backgroundColor: theme.semantic.background.neutral.primary,
  border: `1px solid ${theme.semantic.line.neutral.secondary}`,
  borderRadius: RADIUS,
  padding: PADDING,
  minWidth: 0,
  '@media (max-width: 767px)': { borderRadius: RADIUS_M, padding: PADDING_M },
});

type Props = ComponentProps<typeof Box> & { as?: 'section' | 'div' | 'li'; /** 떠오르는 순서(0부터) */ order?: number };

export default function Panel({ sx, as = 'section', order = 0, style, ...rest }: Props) {
  return (
    <Box as={as} {...GLASS} style={{ '--oi': order, ...style } as React.CSSProperties}
      sx={[panelStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} {...rest} />
  );
}
