
import type { Node, Edge } from '@xyflow/react'

import type { FeatureBlockNodeData } from '~/modules/nodes/types'
import type { ExportedMetadata, FullFlowExport, ExportedTemplate , ExportedCard } from '~/modules/nodes/types'

import  { extractGenericTemplate , extractCarouselCardsFromPayload} from '~/utils/exportHelpers'

export function exportInfoWithCarousel(
  block: Node,
  nodes: Node[],
  edges: Edge[],
  visited: Set<string>,
  mergedCarousels: Set<string>
): FullFlowExport | null {
  const data = block.data as FeatureBlockNodeData
  const name = typeof data.name === 'string' ? data.name.trim() : block.id
  const isActive = typeof data.is_active === 'boolean' ? data.is_active : true
  console.log(`🚀 Entered exportInfoWithCarousel for "${name}"`)

  const kh: ExportedTemplate[] = []
  const en: ExportedTemplate[] = []
  const linkedBlocks = new Set<string>()
  const khCards: ExportedCard[] = []
  const enCards: ExportedCard[] = []
  const mergedKhCardKeys = new Set<string>()
  const mergedEnCardKeys = new Set<string>()

  const isMessengerSafeId = (id: string): boolean =>
    id !== '' &&
    !id.startsWith('_') &&
    !id.includes('#') &&
    !id.includes('/') &&
    !id.includes('[') &&
    !id.includes(']')

  // ✅ Extract text-message content
  const textPaths = Array.isArray(data.paths)
    ? data.paths.filter(p => nodes.find(n => n.id === p.targetBlockId)?.type === 'text-message')
    : []

  console.log(`📝 Found ${textPaths.length} text-message paths`)
  for (const path of textPaths) {
    const target = nodes.find(n => n.id === path.targetBlockId)
    if (!target) continue

    const message = typeof target.data?.message === 'string' ? target.data.message.trim() : ''
    if (message) {
      console.log(`💬 Extracted text-message: "${message}" from node "${target.id}"`)
      kh.push({ template_type: 'text', is_active: true, text: message })
      en.push({ template_type: 'text', is_active: true, text: message })
    }
  }

  // ✅ Extract carousel cards
  const carouselPaths = Array.isArray(data.paths)
    ? data.paths.filter(p => {
        const target = nodes.find(n => n.id === p.targetBlockId)
        return target?.type === 'feature-block' &&
          typeof target.data?.blockType === 'string' &&
          target.data.blockType.trim() === 'carousel'
      })
    : []

  console.log(`🎠 Found ${carouselPaths.length} carousel paths`)
  for (const path of carouselPaths) {
    const carouselNode = nodes.find(n => n.id === path.targetBlockId)
    if (!carouselNode) continue

    visited.add(carouselNode.id)
    mergedCarousels.add(carouselNode.id) // ✅ Track inline merge

    const cardPaths = Array.isArray(carouselNode.data?.paths) ? carouselNode.data.paths : []
    console.log(`📦 Carousel "${carouselNode.id}" has ${cardPaths.length} card paths`)

    for (const cardPath of cardPaths) {
      const cardNode = nodes.find(n => n.id === cardPath.targetBlockId)
      if (!cardNode || cardNode.type !== 'generic-template') continue

      const template = extractGenericTemplate(cardNode, nodes)
      if (!template || !Array.isArray(template.kh.cards) || !Array.isArray(template.en.cards)) continue

      console.log(`✅ Extracted ${template.kh.cards.length} KH cards and ${template.en.cards.length} EN cards from "${cardNode.id}"`)

      for (const card of template.kh.cards) {
        const key = `${card.title ?? ''}|${card.subtitle ?? ''}|${card.image_url ?? ''}`
        if (!mergedKhCardKeys.has(key)) {
          khCards.push(card)
          mergedKhCardKeys.add(key)
        }
      }

      for (const card of template.en.cards) {
        const key = `${card.title ?? ''}|${card.subtitle ?? ''}|${card.image_url ?? ''}`
        if (!mergedEnCardKeys.has(key)) {
          enCards.push(card)
          mergedEnCardKeys.add(key)
        }
      }

      // ✅ Scan for nested carousel payloads
      for (const card of template.kh.cards) {
        for (const opt of card.options ?? []) {
          const payload = typeof opt.payload === 'string' ? opt.payload.trim() : ''
          if (!payload) continue

          const target = nodes.find(n => n.id === payload)
          if (!target || target.type !== 'feature-block') continue

          const blockType = typeof target.data?.blockType === 'string' ? target.data.blockType.trim() : ''
          if (blockType === 'carousel') {
            const nested = extractCarouselCardsFromPayload(payload, nodes)

            for (const card of nested.khCards) {
              const key = `${card.title ?? ''}|${card.subtitle ?? ''}|${card.image_url ?? ''}`
              if (!mergedKhCardKeys.has(key)) {
                khCards.push(card)
                mergedKhCardKeys.add(key)
              }
            }

            for (const card of nested.enCards) {
              const key = `${card.title ?? ''}|${card.subtitle ?? ''}|${card.image_url ?? ''}`
              if (!mergedEnCardKeys.has(key)) {
                enCards.push(card)
                mergedEnCardKeys.add(key)
              }
            }

            for (const id of nested.linkedBlocks) {
              if (isMessengerSafeId(id)) {
                linkedBlocks.add(id.trim())
                console.log(`🔗 Propagated linked block "${id}" from nested carousel "${payload}"`)
              }
            }
          }
        }
      }

      const trigger = typeof cardNode.data?.trigger === 'string' ? cardNode.data.trigger.trim() : ''
      if (trigger && isMessengerSafeId(trigger)) {
        linkedBlocks.add(trigger)
        console.log(`🔗 Linked deep chain trigger from card "${cardNode.id}" → "${trigger}"`)
      }

      for (const id of template.linked_blocks ?? []) {
        if (isMessengerSafeId(id)) {
          linkedBlocks.add(id.trim())
          console.log(`🔗 Propagated linked block "${id}" from card "${cardNode.id}"`)
        }
      }

      for (const card of template.kh.cards) {
        for (const opt of card.options ?? []) {
          const payload = typeof opt.payload === 'string' ? opt.payload.trim() : ''
          if (!payload) continue

          const target = nodes.find(n => n.id === payload)
          if (!target || target.type !== 'text-message') continue

          if (isMessengerSafeId(payload)) {
            linkedBlocks.add(payload)
            console.log(`🔗 Linked fallback text-message payload "${payload}" from card "${cardNode.id}"`)
          }
        }
      }
    }
  }

  if (khCards.length > 0) {
    kh.push({
      template_type: 'generic',
      silent: false,
      is_active: isActive,
      cards: khCards
    })
  }

  if (enCards.length > 0) {
    en.push({
      template_type: 'generic',
      silent: false,
      is_active: isActive,
      cards: enCards
    })
  }

  if (kh.length === 0 && khCards.length === 0) {
    console.warn(`⚠️ No KH templates found for "${name}" — inserting fallback`)
    kh.push({
      template_type: 'text',
      is_active: false,
      text: '⚠️ មិនមានមាតិកាភាសាខ្មែរ'
    })
  }

  if (en.length === 0 && enCards.length === 0) {
    console.warn(`⚠️ No EN templates found for "${name}" — inserting fallback`)
    en.push({
      template_type: 'text',
      is_active: false,
      text: '⚠️ No English content available'
    })
  }

  const metadata: ExportedMetadata = {
    blockType: 'info',
    flow_name: 'info_carousel',
    name,
    created_by: 'admin001',
    last_updated: new Date().toISOString(),
    is_active: isActive,
    linked_pages: ['708759082319392'],
    config: data.config ?? {}
  }

  const result: FullFlowExport = {
    canvas: {
      nodes,
      edges
    },
    flow_data: {
      kh,
      en,
      metadata,
      linked_blocks: Array.from(linkedBlocks)
    }
  }

  console.log(`✅ Final export for "${name}" contains:`)
  console.log(`   ➤ KH templates: ${kh.length}`)
  console.log(`   ➤ EN templates: ${en.length}`)
  console.log(`   ➤ linked_blocks:`, result.flow_data.linked_blocks)

  return result
}
