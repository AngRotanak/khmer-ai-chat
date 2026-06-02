import type { Node, Edge } from '@xyflow/react'
import type { Option } from '~/modules/nodes/types'
import type { FullFlowExport, ExportedTemplate, ExportedMetadata, ExportedOption } from '~/modules/nodes/types'


export function exportGenericTemplate(
  node: Node,
  fixedNodes: Node[],
  edges: Edge[],
  visited: Set<string>
): FullFlowExport | null {

  
  console.log(`🧪 Entered exportGenericTemplate for node "${node.id}"`)
  const cards = Array.isArray(node.data?.cards) ? node.data.cards : []

  if (cards.length === 0) {
    console.warn(`❌ No cards found in generic-template node "${node.id}"`)
    return null
  }

  console.log(fixedNodes, visited)
  const isMessengerSafeId = (id: string): boolean =>
    typeof id === 'string' &&
    id.trim() !== '' &&
    !id.startsWith('_') &&
    !id.includes('#') &&
    !id.includes('/') &&
    !id.includes('[') &&
    !id.includes(']')

  const reorderOptions = (options: Option[]): Option[] => {
    const handleOrder = edges
      .filter(e => e.target === node.id && typeof e.targetHandle === 'string' && e.targetHandle !== '')
      .map(e => e.targetHandle as string)


    const optionMap = new Map(options.map(opt => [opt.id, opt]))
    const ordered: Option[] = []



    for (const handle of handleOrder) {
      const match = optionMap.get(handle)
      if (match) ordered.push(match)
    }

    // Append any unmatched options
    for (const opt of options) {
      if (!ordered.includes(opt)) ordered.push(opt)
    }

    return ordered
  }

  const wrap = (cardList: any[]): ExportedTemplate => ({
    template_type: 'generic',
    silent: false,
    is_active: typeof node.data?.is_active === 'boolean' ? node.data.is_active : true,
    cards: Array.isArray(cardList)
      ? cardList
        .filter(card => card && typeof card === 'object')
        .map(card => {
          const options = Array.isArray(card.options) ? reorderOptions(card.options) : []

          return {
            title: card.title ?? '',
            subtitle: card.subtitle ?? '',
            image_url: card.image_url ?? '',
            layout: card.layout ?? 'hero',
            options: options.map((opt): ExportedOption => {
              const label_en = opt.label_en ?? opt.label ?? ''
              const label_kh = opt.label_kh ?? opt.label ?? ''

              if (opt.type === 'text') {
                return {
                  type: 'text',
                  text: label_en || label_kh || '...',
                  label_en,
                  label_kh,
                  payload: '', // optional and must be empty string
                }
              }

              const payload = typeof opt.payload === 'string' ? opt.payload.trim() : ''
              const isValidPayload = isMessengerSafeId(payload)


              if (opt.type === 'web_url') {
                return {
                  type: 'web_url',
                  payload: isValidPayload ? payload : '',
                  label_en,
                  label_kh,
                  url: opt.url ?? '',
                }
              }

              if (opt.type === 'phone_number') {
                return {
                  type: 'phone_number',
                  payload: isValidPayload ? payload : '',
                  label_en,
                  label_kh,
                }
              }

              // fallback to postback
              return {
                type: 'postback',
                payload: isValidPayload ? payload : '',
                label_en,
                label_kh,
              }


            })

          }
        })
      : []
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
      if (isMessengerSafeId(payload)) {
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
