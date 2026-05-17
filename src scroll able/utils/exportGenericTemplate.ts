
import type { Node, Edge } from '@xyflow/react'
import type { Option } from '~/modules/nodes/types'

export function exportGenericTemplate(node: Node): any {
  const cards = Array.isArray(node.data?.cards) ? node.data.cards : []

const wrap = (cardList: any[]) => ({
  cards: cardList.map(card => ({
    title: card.title ?? '',
    subtitle: card.subtitle ?? '',
    image_url: card.image_url ?? '',
    layout: card.layout ?? 'hero',
    options: (card.options ?? []).map((opt: Option) => ({
      label_en: opt.label_en ?? opt.label ?? '',
      label_kh: opt.label_kh ?? opt.label ?? '',
      payload: opt.payload ?? '',
      type: opt.type ?? 'postback',
      url: opt.type === 'web_url' ? opt.url ?? '' : undefined,
    })),
  })),
  is_active: node.data?.is_active ?? false,
  silent: false,
  template_type: 'generic',
})


  return {
    en: [wrap(cards)],
    kh: [wrap(cards)],
    metadata: {
      blockType: 'generic-template',
      is_active: node.data?.is_active ?? false,
      last_updated: new Date().toISOString(),
      name: node.id,
    }
  }
}

