'use client';

import { FlexBox, Typography } from '@montage-ui/core';
import Image from 'next/image';
import Link from 'next/link';

import { APP_NAME } from '@/lib/copy';

// 헤더 왼쪽 브랜드: 유리 큐브 마크 + 서비스 이름. 누르면 홈 (spec 3.2, 4.6)
const GAP = 8;
const MARK = 32;

export default function BrandMark({ href }: { href: string }) {
  return (
    <FlexBox as={Link} href={href} alignItems="center" gap={GAP} sx={{ textDecoration: 'none', color: 'inherit', flexShrink: 0, minHeight: 44 }}>
      <Image src="/brand/mark.svg" alt="" width={MARK} height={MARK} unoptimized priority />
      <Typography variant="headline2" weight="bold" color="semantic.foreground.neutral.primary">{APP_NAME}</Typography>
    </FlexBox>
  );
}
