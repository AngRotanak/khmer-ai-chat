
import type { Node } from '@xyflow/react'
import type { Option } from '~/modules/nodes/types'
import type {FullFlowExport, ExportedTemplate, ExportedMetadata} from '~/modules/nodes/types'

export function exportGenericTemplate(node: Node): FullFlowExport | null {
  console.log(`🧪 Entered exportGenericTemplate for node "${node.id}"`)
  const cards = Array.isArray(node.data?.cards) ? node.data.cards : []

  if (cards.length === 0) {
    console.warn(`❌ No cards found in generic-template node "${node.id}"`)
    return null
  }

const wrap = (cardList: any[]): ExportedTemplate => ({
  template_type: 'generic',
  silent: false, // ✅ required by ExportedTemplate
  is_active: typeof node.data?.is_active === 'boolean' ? node.data.is_active : true, // ✅ safe default
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
  }))
})

  const khTemplate = wrap(cards)
  const enTemplate = wrap(cards)

const metadata: ExportedMetadata = {
  blockType: 'generic-template',
  is_active: Boolean(node.data?.is_active),
  last_updated: new Date().toISOString(),
  name: typeof node.data?.name === 'string' ? node.data.name.trim() : node.id,
  created_by: 'admin001',
  flow_name: 'generic',
  linked_pages: [],
  config:
    node.data?.config && typeof node.data.config === 'object' && !Array.isArray(node.data.config)
      ? node.data.config
      : {}
}

  const linkedBlockIds = new Set<string>()
  for (const card of cards) {
    for (const opt of card.options ?? []) {
      const payload = typeof opt.payload === 'string' ? opt.payload.trim() : ''
      if (
        payload &&
        !payload.startsWith('_') &&
        !payload.includes('#') &&
        !payload.includes('/') &&
        !payload.includes('[') &&
        !payload.includes(']')
      ) {
        linkedBlockIds.add(payload)
      }

    }
  }

  return {
    canvas: {
      nodes: [node],
      edges: []
    },
    flow_data: {
      kh: [khTemplate],
      en: [enTemplate],
      metadata,
      linked_blocks: Array.from(linkedBlockIds)
    }
  }
}
