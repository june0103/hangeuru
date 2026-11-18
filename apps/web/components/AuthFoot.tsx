'use client';

import { Box, Typography } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import Link from 'next/link';

// 로그인·가입 화면 맨 아래 링크 (spec 3.3)
export default function AuthFoot({ prefix, link, href }: { prefix: string; link: string; href: string }) {
  return (
    <Typography as="p" variant="body2" align="center" color="semantic.foreground.neutral.secondary" sx={{ marginTop: 20 }}>
      {prefix}
      <Box as={Link} href={href} sx={(theme: Theme) => ({ color: theme.semantic.foreground.brand.primary, fontWeight: 700, textDecoration: 'none', padding: '12px 0' })}>
        {link}
      </Box>
    </Typography>
  );
}
