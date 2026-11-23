'use client';

import { Box, FlexBox, IconButton, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Typography } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import { IconChevronLeft, IconChevronRight } from '@montage-ui/icon';
import { useState } from 'react';

import { CALENDAR, clockDuration } from '@/lib/copy';
import type { AttendanceTime } from '@/lib/rules';
import type { MonthView, RecordRow } from '@/lib/view';

import Panel from './Panel';
import { useAttendanceTimer } from './useAttendanceTimer';

// spec 3.6 캘린더
const GRID_TOP = 20;
const GAP = 8;
const GAP_M = 4;
const CELL_H = 88;
const CELL_H_M = 56;
const MARK = 14;
const TABLE_TOP = 24;
const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;

const tableStyle = {
  marginTop: TABLE_TOP,
  width: '100%',
  '& table': { tableLayout: 'fixed' },
  '& col:first-of-type': { width: '24%' },
  '& col:nth-of-type(2), & col:nth-of-type(3)': { width: '17%' },
  '& :is(th, td)': { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
  '@media (max-width: 767px)': {
    '& col:nth-of-type(2), & col:nth-of-type(3)': { width: '14%' },
    '& :is(th, td)': { padding: '10px 4px', fontSize: 12, lineHeight: '18px' },
    '& :is(th, td):first-of-type': { paddingLeft: 8 },
    '& :is(th, td):last-of-type': { paddingRight: 8 },
    '& :is(th, td):is(:first-of-type, :nth-of-type(n + 4))': {
      whiteSpace: 'normal', wordBreak: 'keep-all', overflowWrap: 'normal',
    },
  },
} as const;

function AttendanceRecordsTable({ rows, today, attendance }: { rows: RecordRow[]; today: string; attendance: AttendanceTime }) {
  const { totalMs, isRunning } = useAttendanceTimer(attendance);
  if (!rows.length) {
    return (
      <Typography as="p" variant="body2" align="center" color="semantic.foreground.neutral.tertiary" sx={{ padding: '32px 20px' }}>
        {CALENDAR.empty}
      </Typography>
    );
  }

  return (
    <Table sx={tableStyle}>
      <colgroup>
        <col />
        <col />
        <col />
        <col />
        <col />
      </colgroup>
      <TableHead>
        <TableRow>
          {Object.values(CALENDAR.columns).map(label => <TableHeadCell key={label} scope="col">{label}</TableHeadCell>)}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(row => (
          <TableRow key={row.date}>
            <TableCell>{row.dateText}</TableCell>
            <TableCell>{row.inText}</TableCell>
            <TableCell>{row.outText}</TableCell>
            <TableCell>{row.stayText}</TableCell>
            <TableCell>
              {row.date === today && isRunning
                ? <span role="timer" aria-label={CALENDAR.columns.cumulative} style={{ whiteSpace: 'nowrap' }}>{clockDuration(totalMs)}</span>
                : row.cumulativeText}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type Props = { months: MonthView[]; initial: number; today: string; attendance: AttendanceTime };

export default function CalendarView({ months, initial, today, attendance }: Props) {
  const [i, setI] = useState(initial);
  const m = months[i];
  return (
    <Panel aria-labelledby="h-cal">
      <FlexBox alignItems="center" justifyContent="space-between" gap={12} flexWrap="wrap">
        <Typography as="h1" id="h-cal" variant="heading2" weight="bold" color="semantic.foreground.neutral.primary">{CALENDAR.title}</Typography>
        <FlexBox alignItems="center" gap={4}>
          <IconButton aria-label={CALENDAR.prev} disabled={i <= 0} onClick={() => setI(i - 1)}><IconChevronLeft /></IconButton>
          <Typography variant="headline2" weight="bold" align="center" aria-live="polite" color="semantic.foreground.neutral.primary"
            sx={{ minWidth: '7.5em', fontVariantNumeric: 'tabular-nums' }}>{m.title}</Typography>
          <IconButton aria-label={CALENDAR.next} disabled={i >= months.length - 1} onClick={() => setI(i + 1)}><IconChevronRight /></IconButton>
        </FlexBox>
      </FlexBox>

      <Box
        sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: GAP, marginTop: GRID_TOP, '@media (max-width: 767px)': { gap: GAP_M } }}
      >
        {m.weekdays.map(w => (
          <Typography key={w} variant="label2" weight="medium" align="center" color="semantic.foreground.neutral.tertiary" sx={{ padding: '4px 0' }}>{w}</Typography>
        ))}
        {m.cells.map(c => c.blank ? <div key={c.key} aria-hidden /> : (
          <Box
            key={c.key}
            sx={(theme: Theme) => ({
              position: 'relative', minHeight: CELL_H, minWidth: 0, borderRadius: 12, padding: 10,
              display: 'flex', flexDirection: 'column', gap: 4,
              boxShadow: c.off ? 'none' : `inset 0 0 0 1px ${theme.semantic.line.neutral.secondary}`,
              ...(c.off && { backgroundColor: theme.semantic.surface.neutral.tertiary }),
              ...(c.today && { boxShadow: `inset 0 0 0 2px ${theme.semantic.line.brand.strong}` }),
              '@media (max-width: 767px)': { minHeight: CELL_H_M, padding: '6px 4px', alignItems: 'center', borderRadius: 10 },
            })}
          >
            <Typography variant="label1" weight="medium" sx={{ fontVariantNumeric: 'tabular-nums' }}
              color={c.off ? 'semantic.foreground.neutral.quaternary' : 'semantic.foreground.neutral.primary'}>{c.day}</Typography>
            {c.note && (
              <Typography variant="caption1" color="semantic.foreground.neutral.tertiary" sx={{ '@media (max-width: 767px)': srOnly }}>{c.note}</Typography>
            )}
            {c.attended && (
              <>
                <Box role="img" aria-label={CALENDAR.attended}
                  sx={(theme: Theme) => ({ width: MARK, height: MARK, flexShrink: 0, borderRadius: '50%', backgroundColor: theme.semantic.foreground.positive.primary })} />
                {c.time && (
                  <Typography variant="caption1" color="semantic.foreground.neutral.secondary"
                    sx={{ fontVariantNumeric: 'tabular-nums', '@media (max-width: 767px)': srOnly }}>{c.time}</Typography>
                )}
              </>
            )}
          </Box>
        ))}
      </Box>

      <AttendanceRecordsTable rows={m.rows} today={today} attendance={attendance} />
    </Panel>
  );
}
