'use client';

import { FlexBox, IconButton, Modal, ModalContainer, useToast } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import { IconDownload } from '@montage-ui/icon';
import { useEffect, useRef } from 'react';

import { CARD } from '@/lib/copy';
import { saveCard } from '@/lib/orchard/extras';
import type { CardModel } from '@/lib/view';

import { useOrchard, useOrchardView } from './orchard/OrchardProvider';

// 수확 카드 (spec 3.9, 4.7). 창의 제목 줄과 버튼 없이, 뒤 화면을 딤 처리하고 카드만 가운데에 띄운다.
// 카드 오른쪽 위의 저장 아이콘을 누르면 카드 모습 그대로 그림(PNG)으로 내려받는다(아이콘은 그림에 들어가지 않는다).
// 바깥(딤)을 누르거나 Esc 를 누르면 닫힌다. 모양은 app/orchard.css 의 .orchard-card, [data-orchard-modal="card"]

function CardBody({ model }: { model: CardModel }) {
  const toast = useToast();
  const api = useOrchard();
  const card = useRef<HTMLDivElement>(null);
  const fruit = useRef<HTMLSpanElement>(null);
  useOrchardView(fruit, (o, el) => o.fruit(el, model.seed), [model.seed]);

  // 창의 바탕과 테두리를 지우고 카드만 남긴다
  useEffect(() => {
    const dlg = card.current?.closest('[role="dialog"]');
    dlg?.setAttribute('data-orchard-modal', 'card');
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
    <div className="orchard-card" ref={card}>
      <div className="oc-head">
        <span>{CARD.brand}</span>
        {/* 헤더의 프로필 아이콘과 같은 톤(neutral secondary). 저장 그림에는 들어가지 않는다 */}
        <IconButton size={32} aria-label={CARD.save} color="semantic.foreground.neutral.secondary" onClick={save} className="oc-save" autoFocus>
          <IconDownload />
        </IconButton>
      </div>
      <div role="img" aria-label={model.alt}>
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
    </div>
  );
}

export default function HarvestCardModal({ open, onOpenChange, model }: { open: boolean; onOpenChange: (v: boolean) => void; model: CardModel | null }) {
  return (
    <Modal open={open && !!model} onOpenChange={onOpenChange}>
      <ModalContainer variant="popup" size="medium" aria-label={CARD.title}>
        {open && model && <CardBody model={model} />}
      </ModalContainer>
    </Modal>
  );
}
