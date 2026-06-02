import type { Node, Edge } from '@xyflow/react'
import { getButtonChains } from '~/utils/flowLogic'

import type { FeatureBlockNodeData, } from '~/modules/nodes/types'
import type { ExportedBlock , ExportedCard, ExportedMetadata } from '~/modules/nodes/types'
import { resolveLinkedBlock } from '~/utils/exportHelpers'


export function exportCarouselBlock(
  block: Node,
  nodes: Node[],
  edges: Edge[],
  visited: Set<string>,
  exportPayload: Record<string, any>,
  allNodeIds: Set<string>,
  allBlockNames: Set<string>,
  topLevelBlockIds: Set<string>,
  mergedCarousels: Set<string> // ✅ NEW
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

  const khCards: ExportedCard[] = []
  const enCards: ExportedCard[] = []

  for (const c of blockChains) {
    if (!c.valid || !c.cardPreview) continue

    for (const opt of c.cardPreview.options) {
      const payloadId = typeof opt.payload === 'string' ? opt.payload.trim() : ''
      if (!payloadId) continue

      const linkedNode = nodes.find(n =>
        n.id === payloadId ||
        (typeof n.data?.name === 'string' && n.data.name.trim() === payloadId)
      )

      if (!linkedNode) continue

      const linkedName =
        typeof linkedNode.data?.name === 'string'
          ? linkedNode.data.name.trim()
          : linkedNode.id

      linkedBlocks.add(linkedName)
    }

    enCards.push({
      title: c.cardPreview.title,
      subtitle: c.cardPreview.subtitle?.trim()
        ? c.cardPreview.subtitle
        : 'Please choose one of the options below',
      layout: ['hero', 'carousel', 'fade'].includes(String(c.cardPreview.layout))
        ? String(c.cardPreview.layout)
        : 'hero',
      image_url: c.cardPreview.image_url,
      options: c.cardPreview.options.map(opt => {
        if (opt.type === 'text') {
          return {
            type: 'text',
            text: typeof opt.text === 'string' ? opt.text : '',
            label_en: typeof opt.label_en === 'string' ? opt.label_en : undefined,
            label_kh: typeof opt.label_kh === 'string' ? opt.label_kh : undefined,
            payload: ''
          }
        }

        return {
          type: opt.type ?? 'postback',
          payload: typeof opt.payload === 'string' ? opt.payload : '',
          label_en: typeof opt.label_en === 'string' ? opt.label_en : undefined,
          label_kh: typeof opt.label_kh === 'string' ? opt.label_kh : undefined,
          url: opt.type === 'web_url' && typeof opt.url === 'string' ? opt.url : undefined
        }
      })
    })

    khCards.push({
      title: c.cardPreview.title,
      subtitle: c.cardPreview.subtitle?.trim()
        ? c.cardPreview.subtitle
        : 'សូមជ្រើសរើសជម្រើសខាងក្រោម',
      layout: ['hero', 'carousel', 'fade'].includes(String(c.cardPreview.layout))
        ? String(c.cardPreview.layout)
        : 'hero',
      image_url: c.cardPreview.image_url,
      options: c.cardPreview.options.map(opt => {
        if (opt.type === 'text') {
          return {
            type: 'text',
            text: typeof opt.text === 'string' ? opt.text : '',
            label_kh: typeof opt.label_kh === 'string' ? opt.label_kh : undefined,
            label_en: typeof opt.label_en === 'string' ? opt.label_en : undefined,
            payload: ''
          }
        }

        return {
          type: opt.type ?? 'postback',
          payload: typeof opt.payload === 'string' ? opt.payload : '',
          label_kh: typeof opt.label_kh === 'string' ? opt.label_kh : undefined,
          label_en: typeof opt.label_en === 'string' ? opt.label_en : undefined,
          url: opt.type === 'web_url' && typeof opt.url === 'string' ? opt.url : undefined
        }
      })
    })
  }

  const metadata: ExportedMetadata = {
    blockType: 'carousel',
    flow_name: 'carousel_flow',
    name,
    config: data.config ?? {},
    linked_pages: ['708759082319392'],
    created_by: 'admin001',
    last_updated: new Date().toISOString(),
    is_active: isActive
  }

  // ✅ Recursively export linked blocks
  for (const id of linkedBlocks) {
    if (visited.has(id)) continue

    const linkedNode = nodes.find(n =>
      n.id === id || (typeof n.data?.name === 'string' && n.data.name.trim() === id)
    )

    if (!linkedNode) continue

  resolveLinkedBlock(
    linkedNode,
    nodes,
    edges,
    visited,
    exportPayload,
    allNodeIds,
    allBlockNames,
    topLevelBlockIds, // ✅ Fix here
    mergedCarousels
  )

  }

 return {
    canvas: {
      nodes,
      edges
    },
    flow_data: {
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
      linked_blocks: Array.from(linkedBlocks)
    }
  }
}

