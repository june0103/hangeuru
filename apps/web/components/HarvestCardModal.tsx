'use client';

import {
  ActionArea, ActionAreaButton, Box, FlexBox, IconButton, Modal, ModalContainer, ModalContent, ModalNavigation, Skeleton, Typography, useToast,
} from '@montage-ui/core';
import { IconClose } from '@montage-ui/icon';
import { useEffect, useState } from 'react';

import { drawHarvestCard } from '@/lib/card';
import { CARD } from '@/lib/copy';
import type { CardModel } from '@/lib/view';

// 수확 카드 모달 (spec 3.9)
const IMG_MAX = 360;
const IMG_RADIUS = 16;

function CardBody({ model, onClose }: { model: CardModel; onClose: () => void }) {
  const toast = useToast();
  const [img, setImg] = useState<{ blob: Blob; url: string } | null>(null);

  useEffect(() => {
    let alive = true;
    drawHarvestCard(model).then(r => { if (alive) setImg(r); });
    return () => { alive = false; };
  }, [model]);

  const copy = async () => {
    try {
      if (!img || !navigator.clipboard || typeof ClipboardItem === 'undefined') throw new Error('unsupported');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': img.blob })]);
      toast({ content: CARD.copied, variant: 'positive' });
    } catch {
      toast({ content: CARD.copyFailed, variant: 'normal' });
    }
  };
  const save = () => {
    try {
      if (!img) throw new Error('not ready');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(img.blob);
      a.download = model.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch {
      toast({ content: CARD.saveFailed, variant: 'normal' });
    }
  };

  return (
    <FlexBox flex="1" flexDirection="column" sx={{ minHeight: 0 }}>
      <ModalNavigation trailingContent={<IconButton aria-label={CARD.close} onClick={onClose}><IconClose /></IconButton>}>
        {CARD.title}
      </ModalNavigation>
      <ModalContent>
        <FlexBox flexDirection="column" alignItems="center" gap={12}>
          {img ? (
            // 길게 누르거나 오른쪽 버튼으로 복사·저장할 수 있게 <img>로 보인다
             
            <Box as="img" src={img.url} alt={model.alt} width={IMG_MAX} height={480}
              sx={{ display: 'block', width: '100%', maxWidth: IMG_MAX, height: 'auto', borderRadius: IMG_RADIUS, WebkitTouchCallout: 'default', userSelect: 'auto' }} />
          ) : (
            <Skeleton variant="rectangle" width="100%" height={480} radius={IMG_RADIUS} sx={{ maxWidth: IMG_MAX }} />
          )}
          <Typography as="p" variant="label1-reading" align="center" color="semantic.foreground.neutral.secondary">{CARD.help}</Typography>
        </FlexBox>
      </ModalContent>
      <ActionArea variant="neutral">
        <ActionAreaButton variant="alternative" buttonVariant="solid" buttonColor="assistive" onClick={save} disabled={!img}>{CARD.save}</ActionAreaButton>
        <ActionAreaButton onClick={copy} disabled={!img} autoFocus>{CARD.copy}</ActionAreaButton>
      </ActionArea>
    </FlexBox>
  );
}

export default function HarvestCardModal({ open, onOpenChange, model }: { open: boolean; onOpenChange: (v: boolean) => void; model: CardModel | null }) {
  return (
    <Modal open={open && !!model} onOpenChange={onOpenChange}>
      <ModalContainer variant="bottom" size="large" sm={{ variant: 'popup' }}>
        {open && model && <CardBody model={model} onClose={() => onOpenChange(false)} />}
      </ModalContainer>
    </Modal>
  );
}
