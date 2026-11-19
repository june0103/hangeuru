'use client';

import { IconButton, TextField, TextFieldContent } from '@montage-ui/core';
import { IconEye, IconEyeSlash } from '@montage-ui/icon';
import { type Ref, useState } from 'react';

import { PASSWORD_TOGGLE } from '@/lib/copy';

// 비밀번호 칸. 기본은 글자를 가리고, 눈 아이콘 버튼으로 보이기·숨기기를 바꾼다 (spec 3.3)
type Props = {
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: 'current-password' | 'new-password';
  invalid?: boolean;
  inputRef?: Ref<HTMLInputElement>;
};

export default function PasswordField({ name, value, onChange, placeholder, autoComplete, invalid, inputRef }: Props) {
  const [shown, setShown] = useState(false);
  return (
    <TextField
      ref={inputRef}
      name={name}
      type={shown ? 'text' : 'password'}
      autoComplete={autoComplete}
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      placeholder={placeholder}
      width="100%"
      value={value}
      onChange={e => onChange(e.target.value)}
      status={invalid ? 'negative' : 'normal'}
      trailingContent={
        <TextFieldContent variant="icon-button">
          <IconButton
            size="medium"
            aria-label={shown ? PASSWORD_TOGGLE.hide : PASSWORD_TOGGLE.show}
            aria-pressed={shown}
            onClick={() => setShown(v => !v)}
            color="semantic.foreground.neutral.tertiary"
          >
            {shown ? <IconEyeSlash /> : <IconEye />}
          </IconButton>
        </TextFieldContent>
      }
    />
  );
}
