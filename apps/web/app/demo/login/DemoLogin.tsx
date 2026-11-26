'use client';

import { Typography } from '@montage-ui/core';
import Link from 'next/link';

import PrimaryButton from '@/components/orchard/WaterFill';
import { LOGIN } from '@/lib/copy';

export default function DemoLogin() {
  return (
    <>
      <Typography as="h1" variant="title3" weight="bold" color="semantic.foreground.neutral.primary">{LOGIN.title}</Typography>
      <Typography as="p" variant="body1-reading" color="semantic.foreground.neutral.secondary" sx={{ marginTop: 8, marginBottom: 24 }}>
        {LOGIN.lead}
      </Typography>
      <PrimaryButton as={Link} href="/demo/home" size="large" fullWidth>{LOGIN.submit}</PrimaryButton>
    </>
  );
}
