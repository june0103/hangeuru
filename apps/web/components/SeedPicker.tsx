'use client';

import { Box, RadioGroup, RadioGroupItem, Typography, framedStyle } from '@montage-ui/core';
import { useId } from 'react';

import { seedLabel } from '@/lib/copy';
import { SEEDS } from '@/lib/rules';
import type { SeedKey } from '@/lib/types';

import { FruitIcon } from './TreeFigure';

// 씨앗 선택: 4열 격자 (spec 3.4)
const GAP = 8;
const SEED_ORDER = Object.keys(SEEDS) as SeedKey[];

type Props = {
  value: SeedKey | '';
  onChange: (v: SeedKey) => void;
  disabled?: boolean;
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
  /** 첫 오류 항목에 포커스를 줄 때 쓴다 */
  firstRef?: React.Ref<HTMLButtonElement>;
};

export default function SeedPicker({ value, onChange, disabled, labelledBy, describedBy, invalid, firstRef }: Props) {
  const base = useId();
  return (
    <RadioGroup
      value={value}
      onValueChange={v => onChange(v as SeedKey)}
      disabled={disabled}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: GAP }}
    >
      {SEED_ORDER.map((k, i) => {
        const id = `${base}-${k}`;
        const selected = value === k;
        return (
          <Box
            key={k}
            as="label"
            htmlFor={id}
            sx={[
              framedStyle({ size: 'large', selected, disabled: disabled && !selected, status: invalid ? 'negative' : 'normal' }),
              {
                width: '100%', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '12px 4px 10px', cursor: disabled ? 'default' : 'pointer', minHeight: 44,
                '& > button[role="radio"]': { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, margin: 0 },
                '&:has(button[role="radio"]:focus-visible)': { outline: '2px solid', outlineOffset: 2 },
              },
            ]}
          >
            {/* 선택은 상자 테두리로만 보인다. 라디오 버튼은 보이지 않게 두고 키보드와 스크린리더에 쓴다 */}
            <RadioGroupItem
              id={id}
              value={k}
              ref={i === 0 ? firstRef : undefined}
              aria-label={seedLabel(k)}
            />
            <FruitIcon seed={k} selected={() => value === k} />
            <Typography variant="label1" weight="bold" color="semantic.foreground.neutral.primary">{seedLabel(k)}</Typography>
          </Box>
        );
      })}
    </RadioGroup>
  );
}
