'use client';

import {
  Button, FlexBox, FormControl, FormControlField, FormControlLabel, FormControlMessage, FormControlNegativeMessage, TextField, Typography,
} from '@montage-ui/core';
import { useActionState, useId, useState } from 'react';

import { signUp } from '@/app/actions';
import { FIELD, SIGNUP } from '@/lib/copy';
import type { ActionResult, PlanKey, SeedKey } from '@/lib/types';

import AuthFoot from './AuthFoot';
import PasswordField from './PasswordField';
import PlanPicker from './PlanPicker';
import SeedPicker from './SeedPicker';
import { useActionResult } from './useActionResult';
import { useFirstErrorFocus } from './useFirstErrorFocus';

// spec 3.4 가입
const LEAD_BOTTOM = 24;
const FIELD_GAP = 16;
const ORDER = ['name', 'email', 'password', 'passwordConfirm', 'seed', 'plan'] as const;

export default function SignupForm({ closed }: { closed: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(signUp, null);
  const [v, setV] = useState({ name: '', email: '', password: '', passwordConfirm: '' });
  const [seed, setSeed] = useState<SeedKey | ''>('');
  const [plan, setPlan] = useState<PlanKey | ''>('');
  const ids = { seed: useId(), plan: useId(), seedMsg: useId(), planMsg: useId() };
  const errors = state && !state.ok ? state.errors : undefined;
  const bind = useFirstErrorFocus(errors, ORDER);
  useActionResult(state);

  const head = (lead: string) => (
    <>
      <Typography as="h1" variant="title3" weight="bold" color="semantic.foreground.neutral.primary">{SIGNUP.title}</Typography>
      <Typography as="p" variant="body1-reading" color="semantic.foreground.neutral.secondary" sx={{ marginTop: 8, marginBottom: LEAD_BOTTOM }}>{lead}</Typography>
    </>
  );
  const foot = <AuthFoot prefix={SIGNUP.footPrefix} link={SIGNUP.footLink} href="/login" />;
  if (closed) return <>{head(SIGNUP.closed)}{foot}</>;

  const text = (name: 'name' | 'email', props: { type?: string; autoComplete: string; placeholder: string; maxLength?: number; inputMode?: 'email' }) => (
    <FormControl>
      <FormControlLabel>{FIELD[name].label}</FormControlLabel>
      <FormControlField>
        <TextField ref={bind(name)} name={name} width="100%" {...props} value={v[name]} onChange={e => setV({ ...v, [name]: e.target.value })}
          status={errors?.[name] ? 'negative' : 'normal'} />
      </FormControlField>
      {errors?.[name] && <FormControlNegativeMessage>{errors[name]}</FormControlNegativeMessage>}
    </FormControl>
  );

  return (
    <>
      {head(SIGNUP.lead)}
      <FlexBox as="form" action={action} noValidate flexDirection="column" gap={FIELD_GAP}>
        {text('name', { autoComplete: 'name', placeholder: FIELD.name.placeholder, maxLength: 20 })}
        {text('email', { type: 'email', autoComplete: 'username', inputMode: 'email', placeholder: FIELD.email.placeholder })}
        {(['password', 'passwordConfirm'] as const).map(k => (
          <FormControl key={k}>
            <FormControlLabel>{FIELD[k].label}</FormControlLabel>
            <FormControlField>
              <PasswordField
                inputRef={bind(k)}
                name={k}
                value={v[k]}
                onChange={val => setV({ ...v, [k]: val })}
                placeholder={k === 'password' ? FIELD.password.signupPlaceholder : FIELD.passwordConfirm.placeholder}
                autoComplete="new-password"
                invalid={!!errors?.[k]}
              />
            </FormControlField>
            {errors?.[k] && <FormControlNegativeMessage>{errors[k]}</FormControlNegativeMessage>}
          </FormControl>
        ))}

        <FormControl>
          <Typography id={ids.seed} variant="label1" weight="medium" color="semantic.foreground.neutral.secondary">{FIELD.seed.label}</Typography>
          <SeedPicker value={seed} onChange={setSeed} labelledBy={ids.seed} describedBy={ids.seedMsg} invalid={!!errors?.seed} firstRef={bind('seed')} />
          <input type="hidden" name="seed" value={seed} />
          {errors?.seed
            ? <FormControlNegativeMessage id={ids.seedMsg}>{errors.seed}</FormControlNegativeMessage>
            : <FormControlMessage id={ids.seedMsg}>{FIELD.seed.help}</FormControlMessage>}
        </FormControl>

        <FormControl>
          <Typography id={ids.plan} variant="label1" weight="medium" color="semantic.foreground.neutral.secondary">{FIELD.plan.label}</Typography>
          <PlanPicker value={plan} onChange={setPlan} labelledBy={ids.plan} describedBy={ids.planMsg} invalid={!!errors?.plan} firstRef={bind('plan')} />
          <input type="hidden" name="plan" value={plan} />
          {errors?.plan
            ? <FormControlNegativeMessage id={ids.planMsg}>{errors.plan}</FormControlNegativeMessage>
            : <FormControlMessage id={ids.planMsg}>{FIELD.plan.help}</FormControlMessage>}
        </FormControl>

        <Button type="submit" variant="solid" color="primary" size="large" fullWidth loading={pending}>{SIGNUP.submit}</Button>
      </FlexBox>
      {foot}
    </>
  );
}
