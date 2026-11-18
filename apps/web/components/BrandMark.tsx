'use client';

import { FlexBox, Typography } from '@montage-ui/core';
import Link from 'next/link';

import { APP_NAME } from '@/lib/copy';

import { FruitIcon } from './TreeFigure';

const GAP = 8;

// 헤더 왼쪽 브랜드. 누르면 홈 (spec 3.2)
export default function BrandMark({ href }: { href: string }) {
  return (
    <FlexBox as={Link} href={href} alignItems="center" gap={GAP} sx={{ textDecoration: 'none', color: 'inherit', flexShrink: 0, minHeight: 44 }}>
      <FruitIcon seed="apple" variant="brand" />
      <Typography variant="headline2" weight="bold" color="semantic.foreground.neutral.primary">{APP_NAME}</Typography>
    </FlexBox>
  );
}
