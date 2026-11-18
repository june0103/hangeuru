'use client';

import { Box, FlexBox, RadioGroup, RadioGroupItem, Typography, framedStyle } from '@montage-ui/core';
import { useId } from 'react';

import { planLabel, planOptionDesc } from '@/lib/copy';
import { PLANS } from '@/lib/rules';
import type { PlanKey } from '@/lib/types';

// 출근 플랜: 세로로 쌓은 선택 상자 3개 (spec 3.4)
const GAP = 8;
const PAD_Y = 14;
const PLAN_ORDER = Object.keys(PLANS) as PlanKey[];

type Props = {
  value: PlanKey | '';
  onChange: (v: PlanKey) => void;
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
  firstRef?: React.Ref<HTMLButtonElement>;
};

export default function PlanPicker({ value, onChange, labelledBy, describedBy, invalid, firstRef }: Props) {
  const base = useId();
  return (
    <RadioGroup value={value} onValueChange={v => onChange(v as PlanKey)} aria-labelledby={labelledBy} aria-describedby={describedBy}>
      <FlexBox flexDirection="column" gap={GAP}>
        {PLAN_ORDER.map((k, i) => {
          const id = `${base}-${k}`;
          return (
            <Box
              key={k}
              as="label"
              htmlFor={id}
              sx={[
                framedStyle({ size: 'large', selected: value === k, status: invalid ? 'negative' : 'normal' }),
                { width: '100%', alignItems: 'center', gap: 12, paddingTop: PAD_Y, paddingBottom: PAD_Y, cursor: 'pointer' },
              ]}
            >
              <FlexBox flexDirection="column" flex="1" sx={{ minWidth: 0 }}>
                <Typography id={`${id}-t`} variant="body1" weight="bold" color="semantic.foreground.neutral.primary">{planLabel(k)}</Typography>
                <Typography id={`${id}-d`} variant="label1" color="semantic.foreground.neutral.tertiary">{planOptionDesc(k)}</Typography>
              </FlexBox>
              <RadioGroupItem id={id} value={k} size="small" ref={i === 0 ? firstRef : undefined} aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`} />
            </Box>
          );
        })}
      </FlexBox>
    </RadioGroup>
  );
}
