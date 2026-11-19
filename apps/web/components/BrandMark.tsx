'use client';

import { LogoWanted } from '@montage-ui/brand';
import { FlexBox, Typography } from '@montage-ui/core';
import Link from 'next/link';

import { APP_NAME, BRAND } from '@/lib/copy';

// 헤더 왼쪽 브랜드: 원티드 로고(몽타주 LogoWanted) + 서비스 이름. 누르면 홈 (spec 3.2, 4.6)
// 로고는 몽타주 GNB와 같은 기본 크기(112 × 32)를 웹·모바일 모두에 쓴다
const GAP = 12;
const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;

export default function BrandMark({ href }: { href: string }) {
  return (
    <FlexBox as={Link} href={href} alignItems="center" gap={GAP} sx={{ position: 'relative', textDecoration: 'none', color: 'inherit', flexShrink: 0, minHeight: 44 }}>
      <LogoWanted role="img" aria-label={BRAND.wanted} sx={{ flexShrink: 0 }} />
      {/* 모바일은 로고와 설정·로그아웃만으로 폭이 차서 이름을 화면에서만 숨긴다 */}
      <Typography variant="headline2" weight="bold" color="semantic.foreground.neutral.primary" sx={{ '@media (max-width: 767px)': srOnly }}>{APP_NAME}</Typography>
    </FlexBox>
  );
}
