'use client';

import { Box, Button, FlexBox, Typography, containerStyle } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';

import { PLACEHOLDER_BUTTON } from '@/lib/copy';

// 1단계 빈 화면. 몽타주 Button이 라이트·다크에서 제대로 보이는지 확인용이다. 3단계에서 지운다
export default function ScreenPlaceholder({ title, showButton = false }: { title: string; showButton?: boolean }) {
  return (
    <Box
      as="main"
      sx={(theme: Theme) => ({
        minHeight: '100dvh',
        backgroundColor: theme.semantic.background.neutral.secondary,
        paddingTop: 24,
      })}
    >
      <Box sx={containerStyle()}>
        <FlexBox
          flexDirection="column"
          gap={20}
          sx={(theme: Theme) => ({
            backgroundColor: theme.semantic.background.neutral.primary,
            border: `1px solid ${theme.semantic.line.neutral.secondary}`,
            borderRadius: 20,
            padding: 24,
          })}
        >
          <Typography as="h1" variant="title3" weight="bold" color="semantic.foreground.neutral.primary">
            {title}
          </Typography>
          {showButton && (
            <Button variant="solid" color="primary" size="large" fullWidth>
              {PLACEHOLDER_BUTTON}
            </Button>
          )}
        </FlexBox>
      </Box>
    </Box>
  );
}
