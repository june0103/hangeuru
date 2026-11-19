'use client';

import { Button, FlexBox, FormControl, FormControlField, FormControlLabel, FormControlNegativeMessage, TextField, Typography } from '@montage-ui/core';
import { useActionState, useState } from 'react';

import { signIn } from '@/app/actions';
import { FIELD, LOGIN } from '@/lib/copy';
import type { ActionResult } from '@/lib/types';

import AuthFoot from './AuthFoot';
import PasswordField from './PasswordField';
import { useActionResult } from './useActionResult';
import { useFirstErrorFocus } from './useFirstErrorFocus';

// spec 3.3 로그인
const LEAD_BOTTOM = 24;
const FIELD_GAP = 16;
const ORDER = ['email', 'password'] as const;

export default function LoginForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(signIn, null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const errors = state && !state.ok ? state.errors : undefined;
  const bind = useFirstErrorFocus(errors, ORDER);
  useActionResult(state);

  return (
    <>
      <Typography as="h1" variant="title3" weight="bold" color="semantic.foreground.neutral.primary">{LOGIN.title}</Typography>
      <Typography as="p" variant="body1-reading" color="semantic.foreground.neutral.secondary" sx={{ marginTop: 8, marginBottom: LEAD_BOTTOM }}>
        {LOGIN.lead}
      </Typography>
      <FlexBox as="form" action={action} noValidate flexDirection="column" gap={FIELD_GAP}>
        <FormControl>
          <FormControlLabel>{FIELD.email.label}</FormControlLabel>
          <FormControlField>
            <TextField ref={bind('email')} name="email" type="email" autoComplete="username" inputMode="email" placeholder={FIELD.email.placeholder}
              width="100%" value={email} onChange={e => setEmail(e.target.value)} status={errors?.email ? 'negative' : 'normal'} />
          </FormControlField>
          {errors?.email && <FormControlNegativeMessage>{errors.email}</FormControlNegativeMessage>}
        </FormControl>
        <FormControl>
          <FormControlLabel>{FIELD.password.label}</FormControlLabel>
          <FormControlField>
            <PasswordField inputRef={bind('password')} name="password" autoComplete="current-password" placeholder={FIELD.password.loginPlaceholder}
              value={password} onChange={setPassword} invalid={!!errors?.password} />
          </FormControlField>
          {errors?.password && <FormControlNegativeMessage>{errors.password}</FormControlNegativeMessage>}
        </FormControl>
        <Button type="submit" variant="solid" color="primary" size="large" fullWidth loading={pending}>{LOGIN.submit}</Button>
      </FlexBox>
      <AuthFoot prefix={LOGIN.footPrefix} link={LOGIN.footLink} href="/signup" />
    </>
  );
}
