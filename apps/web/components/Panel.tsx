'use client';

import { Box } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import type { ComponentProps } from 'react';

// 공통 패널 (spec 3.2)
const RADIUS = 20;
const RADIUS_M = 16;
const PADDING = 24;
const PADDING_M = 20;

export const panelStyle = (theme: Theme) => ({
  backgroundColor: theme.semantic.background.neutral.primary,
  border: `1px solid ${theme.semantic.line.neutral.secondary}`,
  borderRadius: RADIUS,
  padding: PADDING,
  minWidth: 0,
  '@media (max-width: 767px)': { borderRadius: RADIUS_M, padding: PADDING_M },
});

type Props = ComponentProps<typeof Box> & { as?: 'section' | 'div' | 'li' };

export default function Panel({ sx, as = 'section', ...rest }: Props) {
  return <Box as={as} sx={[panelStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} {...rest} />;
}
