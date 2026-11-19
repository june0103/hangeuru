'use client';

import {
  ActionArea, ActionAreaButton, FlexBox, FormControl, FormControlField, FormControlLabel, FormControlMessage,
  FormControlNegativeMessage, IconButton, Modal, ModalContainer, ModalContent, ModalNavigation, TextField, Typography,
} from '@montage-ui/core';
import { IconClose } from '@montage-ui/icon';
import { useActionState, useEffect, useId, useRef, useState } from 'react';

import { updateProfile } from '@/app/actions';
import { FIELD, SETTINGS } from '@/lib/copy';
import type { ActionResult, Member, PlanKey, SeedKey } from '@/lib/types';

import PlanPicker from './PlanPicker';
import SeedPicker from './SeedPicker';
import { useActionResult } from './useActionResult';
import { useFirstErrorFocus } from './useFirstErrorFocus';

const FIELD_GAP = 24;
const ORDER = ['name'] as const;

type Me = Pick<Member, 'name' | 'seed' | 'plan'> & { harvested: boolean };
type SignOut = { onSignOut: () => void; signingOut: boolean };

function SettingsForm({ me, onDone, onSignOut, signingOut }: { me: Me; onDone: () => void } & SignOut) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updateProfile, null);
  const [seed, setSeed] = useState<SeedKey>(me.seed);
  const [plan, setPlan] = useState<PlanKey>(me.plan);
  const ids = { seed: useId(), plan: useId(), seedHelp: useId(), planHelp: useId() };
  const errors = state && !state.ok ? state.errors : undefined;
  const bind = useFirstErrorFocus(errors, ORDER);

  useActionResult(state, onDone);

  // 창 자체를 패널과 같은 유리로 한다(수확 카드 창과 같은 톤, app/orchard.css)
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const dlg = form.current?.closest('[role="dialog"]');
    dlg?.setAttribute('data-orchard-modal', 'glass');
    return () => dlg?.removeAttribute('data-orchard-modal');
  }, []);

  return (
    <FlexBox as="form" ref={form} action={action} noValidate flex="1" flexDirection="column" sx={{ minHeight: 0 }}>
      <ModalNavigation
        trailingContent={
          <IconButton aria-label={SETTINGS.close} onClick={onDone}><IconClose /></IconButton>
        }
      >
        {SETTINGS.title}
      </ModalNavigation>
      <ModalContent>
        <FlexBox flexDirection="column" gap={FIELD_GAP}>
          <FormControl>
            <FormControlLabel>{FIELD.name.label}</FormControlLabel>
            <FormControlField>
              <TextField
                ref={bind('name')}
                name="name"
                defaultValue={me.name}
                autoFocus
                maxLength={20}
                autoComplete="name"
                placeholder={FIELD.name.placeholder}
                width="100%"
                status={errors?.name ? 'negative' : 'normal'}
              />
            </FormControlField>
            {errors?.name && <FormControlNegativeMessage>{errors.name}</FormControlNegativeMessage>}
          </FormControl>

          <FormControl>
            <Typography id={ids.seed} variant="label1" weight="medium" color="semantic.foreground.neutral.secondary">{FIELD.seed.label}</Typography>
            <SeedPicker value={seed} onChange={setSeed} disabled={me.harvested} labelledBy={ids.seed} describedBy={ids.seedHelp} />
            <input type="hidden" name="seed" value={seed} />
            <FormControlMessage id={ids.seedHelp}>{me.harvested ? SETTINGS.seedLocked : SETTINGS.seedHelp}</FormControlMessage>
          </FormControl>

          <FormControl>
            <Typography id={ids.plan} variant="label1" weight="medium" color="semantic.foreground.neutral.secondary">{FIELD.plan.label}</Typography>
            <PlanPicker value={plan} onChange={setPlan} labelledBy={ids.plan} describedBy={ids.planHelp} />
            <input type="hidden" name="plan" value={plan} />
            <FormControlMessage id={ids.planHelp}>{SETTINGS.planHelp}</FormControlMessage>
          </FormControl>

          {/* 로그아웃은 헤더가 아니라 여기 맨 아래에 둔다 (spec 3.8) */}
          <div className="orchard-signout">
            <button type="button" onClick={onSignOut} disabled={signingOut}>{SETTINGS.signOut}</button>
          </div>
        </FlexBox>
      </ModalContent>
      <ActionArea variant="neutral">
        <ActionAreaButton variant="alternative" buttonVariant="solid" buttonColor="assistive" onClick={onDone}>{SETTINGS.cancel}</ActionAreaButton>
        <ActionAreaButton type="submit" loading={pending}>{SETTINGS.save}</ActionAreaButton>
      </ActionArea>
    </FlexBox>
  );
}

export default function SettingsModal({ open, onOpenChange, me, onSignOut, signingOut }: { open: boolean; onOpenChange: (v: boolean) => void; me: Me } & SignOut) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContainer variant="bottom" size="large" sm={{ variant: 'popup' }}>
        {open && <SettingsForm me={me} onDone={() => onOpenChange(false)} onSignOut={onSignOut} signingOut={signingOut} />}
      </ModalContainer>
    </Modal>
  );
}
