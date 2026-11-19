'use client';

import { Box, FlexBox, Typography, containerStyle } from '@montage-ui/core';
import Link from 'next/link';

import PrimaryButton from './orchard/WaterFill';
import { panelStyle } from './Panel';

// 오류와 없는 주소 화면 (spec 9.4)
export default function MessageScreen({ title, desc, action }: { title: string; desc?: string; action: { label: string; onClick?: () => void; href?: string } }) {
  return (
    <Box as="main" sx={[containerStyle(), { paddingTop: 24, paddingBottom: 96 }]}>
      <FlexBox flexDirection="column" alignItems="center" gap={12} sx={[panelStyle, { maxWidth: 420, margin: '0 auto', textAlign: 'center' }]}>
        <Typography as="h1" variant="heading2" weight="bold" color="semantic.foreground.neutral.primary">{title}</Typography>
        {desc && <Typography as="p" variant="body2" color="semantic.foreground.neutral.secondary">{desc}</Typography>}
        {action.href
          ? <PrimaryButton as={Link} href={action.href} size="large" fullWidth sx={{ marginTop: 8 }}>{action.label}</PrimaryButton>
          : <PrimaryButton size="large" fullWidth onClick={action.onClick} sx={{ marginTop: 8 }}>{action.label}</PrimaryButton>}
      </FlexBox>
    </Box>
  );
}
