import type { Node, Edge } from '@xyflow/react'
import { getButtonChains } from '~/utils/flowLogic'

import type { FeatureBlockNodeData, } from '~/modules/nodes/types'
import type { ExportedBlock } from '~/modules/nodes/types'
import  { isFeatureBlockNode } from '~/modules/nodes/utils'


export function exportCarouselBlock(
  block: Node,
  nodes: Node[],
  edges: Edge[]
): ExportedBlock | null {
  const data = block.data as FeatureBlockNodeData
  const name = data.name?.trim() || block.id
  const blockType = data.blockType?.trim()
  const isActive = typeof data.is_active === 'boolean' ? data.is_active : true

  if (!blockType) {
    console.warn(`⚠️ Block "${name}" has no blockType`)
    return null
  }


  const chains = getButtonChains(nodes, edges)
  const blockChains = chains.filter(c => c.nodeId === block.id)
  const linkedBlocks = new Set<string>()

  const allNodeIds = new Set(nodes.map(n => n.id))
  const allBlockNames = new Set(
    nodes
      .filter(isFeatureBlockNode)
      .map(n => (n.data as FeatureBlockNodeData)?.name?.trim())
      .filter(Boolean)
  )

  const khCards: any[] = []
  const enCards: any[] = []

  for (const c of blockChains) {
    if (!c.valid || !c.cardPreview) continue

    // Collect linked blocks from payloads
    for (const btn of c.cardPreview.buttons) {
      if (
        typeof btn.payload === 'string' &&
        (allNodeIds.has(btn.payload) || allBlockNames.has(btn.payload))
      ) {
        linkedBlocks.add(btn.payload)
      }
    }

    // English card
    enCards.push({
      title: c.cardPreview.title,
      subtitle: c.cardPreview.subtitle?.trim()
        ? c.cardPreview.subtitle
        : 'Please choose one of the options below',
      layout: ['hero', 'carousel', 'fade'].includes(c.cardPreview.layout)
        ? c.cardPreview.layout
        : 'hero',
      image_url: c.cardPreview.image_url,
      options: c.cardPreview.buttons.map(btn => ({
        label_en: typeof btn.label_en === 'string' ? btn.label_en : btn.label ?? '',
        payload: btn.payload,
        type: btn.type,
        url: btn.type === 'web_url' ? btn.url ?? '' : undefined,
      })),
    })

    // Khmer card
    khCards.push({
      title: c.cardPreview.title,
      subtitle: c.cardPreview.subtitle?.trim()
        ? c.cardPreview.subtitle
        : 'សូមជ្រើសរើសជម្រើសខាងក្រោម',
      layout: ['hero', 'carousel', 'fade'].includes(c.cardPreview.layout)
        ? c.cardPreview.layout
        : 'hero',
      image_url: c.cardPreview.image_url,
      options: Array.isArray(c.cardPreview.buttons)
        ? c.cardPreview.buttons.map(btn => {
            if (!btn.label_kh) {
              console.warn(`⚠️ Missing label_kh for option "${btn.label}" in card "${c.cardPreview?.title}"`)
            }

            return {
             label_kh: btn.label_kh || btn.label_en || btn.label,
              payload: btn.payload ?? '',
              type: btn.type ?? 'postback',
              url: btn.type === 'web_url' ? btn.url ?? '' : undefined,
            }
          })
        : [],
    })
  }

const metadata = {
  blockType: 'carousel',
  flow_name: 'carousel_flow', // ✅ Add this line
  name,
  config: data.config ?? {},
  linked_pages: ['708759082319392'],
  created_by: 'admin001',
  last_updated: new Date().toISOString(),
  is_active: isActive,
}


  return {
    kh: khCards.length > 0
      ? [{
          template_type: 'generic',
          silent: false,
          is_active: isActive,
          cards: khCards,
        }]
      : [{
          template_type: 'text',
          is_active: false,
          text: '⚠️ មិនមានមាតិកាភាសាខ្មែរ',
        }],
    en: enCards.length > 0
      ? [{
          template_type: 'generic',
          silent: false,
          is_active: isActive,
          cards: enCards,
        }]
      : [{
          template_type: 'text',
          is_active: false,
          text: '⚠️ No English content available',
        }],
    metadata,
    linked_blocks: Array.from(linkedBlocks),
  }
}
