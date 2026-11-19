'use client';

import { ActionArea, ActionAreaButton, FlexBox, IconButton, Modal, ModalContainer, ModalContent, ModalNavigation, useToast } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import { IconClose } from '@montage-ui/icon';
import { useEffect, useRef } from 'react';

import { CARD } from '@/lib/copy';
import { saveCard } from '@/lib/orchard/extras';
import type { CardModel } from '@/lib/view';

import { useOrchard, useOrchardView } from './orchard/OrchardProvider';

// 수확 카드 모달 (spec 3.9, 4.7). 카드는 화면 요소로 그리고, 저장하기를 누르면 그 모습 그대로 그림(PNG)으로 내려받는다.
// 꽃 색이 번진 바탕 위에 유리 칸, 과일은 3D, 출근 기록은 초록 막대 하나. 모양은 app/orchard.css 의 .orchard-card

function CardBody({ model, onClose }: { model: CardModel; onClose: () => void }) {
  const toast = useToast();
  const api = useOrchard();
  const card = useRef<HTMLDivElement>(null);
  const fruit = useRef<HTMLSpanElement>(null);
  useOrchardView(fruit, (o, el) => o.fruit(el, model.seed), [model.seed]);

  // 창 자체도 패널처럼 유리로, 카드에 맞춘 작은 크기로 한다
  useEffect(() => {
    const dlg = card.current?.closest('[role="dialog"]');
    dlg?.setAttribute('data-orchard-modal', 'glass');
    return () => dlg?.removeAttribute('data-orchard-modal');
  }, []);

  const save = () => {
    try {
      if (!card.current) throw new Error('not ready');
      saveCard(card.current, model.fileName, !!api?.isDark());
      toast({ content: CARD.saved, variant: 'positive' });
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
        <FlexBox flexDirection="column" alignItems="center">
          <div className="orchard-card" ref={card} role="img" aria-label={model.alt}>
            <div className="oc-head"><span>{CARD.brand}</span><span>{CARD.tag}</span></div>
            <div className="oc-fruit"><span ref={fruit} /></div>
            <p className="oc-title">{model.heading}</p>
            <p className="oc-sub">{model.sub}</p>
            <dl className="oc-cells">
              {model.cells.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
            <div className="oc-rec">
              <div className="oc-rec-head"><span>{model.record.label}</span><b>{model.record.percentText}</b></div>
              <FlexBox className="oc-bar">
                <FlexBox as="i" style={{ width: `${model.record.ratio * 100}%` }} sx={(theme: Theme) => ({ backgroundColor: theme.semantic.foreground.positive.primary })} />
              </FlexBox>
            </div>
            <p className="oc-foot">{CARD.foot}</p>
          </div>
        </FlexBox>
      </ModalContent>
      <ActionArea variant="neutral">
        <ActionAreaButton variant="alternative" buttonVariant="solid" buttonColor="assistive" onClick={onClose}>{CARD.close}</ActionAreaButton>
        <ActionAreaButton onClick={save} autoFocus>{CARD.save}</ActionAreaButton>
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
