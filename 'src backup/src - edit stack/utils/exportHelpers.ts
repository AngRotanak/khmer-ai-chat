
import type { Node, Edge } from '@xyflow/react'
import {
  isTextMessageNode,
  isFeatureBlockNode,
} from '~/modules/nodes/utils'
import type { ExportedTemplate, ExportedOption, ExportedCard, FullFlowExport } from '~/modules/nodes/types'
import type { Option , ExportedMetadata} from '~/modules/nodes/types'
import { exportFeatureBlock } from './exportFeatureBlock'
import { exportGenericTemplate } from './exportGenericTemplate'
import { exportCarouselBlock } from './exportCarouselBlock'

// 🔧 Export a text-message node by ID
export function exportTextBlockById(id: string, nodes: Node[]): any {
  const node = nodes.find(n => n.id === id && isTextMessageNode(n))
  if (!node) return null

  const khText =
    typeof node.data.message_kh === 'string'
      ? node.data.message_kh.trim()
      : typeof node.data.message === 'string'
      ? node.data.message.trim()
      : ''

  const enText =
    typeof node.data.message_en === 'string'
      ? node.data.message_en.trim()
      : typeof node.data.message === 'string'
      ? node.data.message.trim()
      : ''

  return {
    kh: [
      {
        template_type: 'text',
        is_active: !!khText,
        text: khText || '⚠️ មិនមានមាតិកាភាសាខ្មែរ',
      },
    ],
    en: [
      {
        template_type: 'text',
        is_active: !!enText,
        text: enText || '⚠️ No English content available',
      },
    ],
    metadata: {
      blockType: 'text',
      name: id,
      config: {},
      linked_pages: ['708759082319392'],
      created_by: 'admin001',
      last_updated: new Date().toISOString(),
      is_active: true,
    },
    linked_blocks: [],
  }
}


export function extractGenericTemplate(
  node: Node,
  allNodes: Node[]
): { kh: ExportedTemplate; en: ExportedTemplate; linked_blocks: string[] } | null {
  console.log(`🧪 extractGenericTemplate: node "${node.id}"`)

  const cards = node.data?.cards
  if (!Array.isArray(cards) || cards.length === 0) {
    console.warn(`❌ No valid cards found in node "${node.id}"`)
    return null
  }

  const linkedBlocks = new Set<string>()

  const khCards: ExportedCard[] = cards.map(card => {
    const khOptions: ExportedOption[] = Array.isArray(card.options)
      ? card.options.map((opt: Option): ExportedOption => {
          const type = ['postback', 'web_url', 'phone_number'].includes(opt.type)
            ? (opt.type as 'postback' | 'web_url' | 'phone_number')
            : 'postback'

          const option: ExportedOption = {
            type,
            payload: opt.payload || ''
          }

          if (typeof opt.label_kh === 'string') {
            option.label_kh = opt.label_kh
          }

          if (type === 'web_url' && typeof opt.url === 'string') {
            option.url = opt.url
          }

          const payloadId = opt.payload?.trim()
          const targetNode = allNodes.find(n => n.id === payloadId)

          if (targetNode?.type === 'text-message') {
            const message = typeof targetNode.data?.message === 'string' ? targetNode.data.message.trim() : ''
            if (message) {
              if (payloadId) linkedBlocks.add(payloadId)
              return {
                type: 'text',
                text: message,
                label_kh: opt.label_kh || '',
                label_en: opt.label_en || ''
              }
            }
          }

          if (payloadId) linkedBlocks.add(payloadId)
          return option
        })
      : []

    return {
      title: typeof card.title_km === 'string' ? card.title_km : '',
      subtitle: typeof card.subtitle_km === 'string' ? card.subtitle_km : '',
      layout: typeof card.layout === 'string' ? card.layout : 'hero',
      image_url: typeof card.image_url === 'string' ? card.image_url : '',
      options: khOptions
    }
  })

  const enCards: ExportedCard[] = cards.map(card => {
    const enOptions: ExportedOption[] = Array.isArray(card.options)
      ? card.options.map((opt: Option): ExportedOption => {
          const type = ['postback', 'web_url', 'phone_number'].includes(opt.type)
            ? (opt.type as 'postback' | 'web_url' | 'phone_number')
            : 'postback'

          const option: ExportedOption = {
            type,
            payload: opt.payload || ''
          }

          if (typeof opt.label_en === 'string') {
            option.label_en = opt.label_en
          }

          if (type === 'web_url' && typeof opt.url === 'string') {
            option.url = opt.url
          }

          const payloadId = opt.payload?.trim()
          const targetNode = allNodes.find(n => n.id === payloadId)

          if (targetNode?.type === 'text-message') {
            const message = typeof targetNode.data?.message === 'string' ? targetNode.data.message.trim() : ''
            if (message) {
              if (payloadId) linkedBlocks.add(payloadId)
              return {
                type: 'text',
                text: message,
                label_kh: opt.label_kh || '',
                label_en: opt.label_en || ''
              }
            }
          }

          if (payloadId) linkedBlocks.add(payloadId)
          return option
        })
      : []

    return {
      title: typeof card.title === 'string' ? card.title : '',
      subtitle: typeof card.subtitle === 'string' ? card.subtitle : '',
      layout: typeof card.layout === 'string' ? card.layout : 'hero',
      image_url: typeof card.image_url === 'string' ? card.image_url : '',
      options: enOptions
    }
  })

  const khTemplate: ExportedTemplate = {
    template_type: 'generic',
    silent: false,
    is_active: true,
    cards: khCards
  }

  const enTemplate: ExportedTemplate = {
    template_type: 'generic',
    silent: false,
    is_active: true,
    cards: enCards
  }

  const isValid = khCards.length > 0 || enCards.length > 0
  if (!isValid) {
    console.warn(`❌ extractGenericTemplate produced empty cards for node "${node.id}"`)
    return null
  }

  // ✅ Include trigger as deep chain root
  let trigger = typeof node.data?.trigger === 'string' ? node.data.trigger.trim() : ''

  if (!trigger) {
    for (const card of cards) {
      for (const opt of card.options ?? []) {
        const payload = typeof opt.payload === 'string' ? opt.payload.trim() : ''
        const isSafe =
          payload !== '' &&
          !payload.startsWith('_') &&
          !payload.includes('#') &&
          !payload.includes('/') &&
          !payload.includes('[') &&
          !payload.includes(']') &&
          allNodes.some(n => n.id === payload || (typeof n.data?.name === 'string' && n.data.name.trim() === payload))

        if (isSafe) {
          trigger = payload
          console.warn(`⚠️ Missing trigger on "${node.id}" — falling back to payload "${payload}"`)
          break
        }
      }
      if (trigger) break
    }
  }

  if (trigger) {
    linkedBlocks.add(trigger)
    console.log(`🔗 Added trigger "${trigger}" to linked_blocks from generic-template "${node.id}"`)
  }

  return {
    kh: khTemplate,
    en: enTemplate,
    linked_blocks: Array.from(linkedBlocks)
  }
}


export function extractCarouselCardsFromPayload(payloadId: string, nodes: Node[]): {
  khCards: ExportedCard[],
  enCards: ExportedCard[],
  linkedBlocks: string[]
} {
  const carouselNode = nodes.find(n => n.id === payloadId)
  if (!carouselNode || carouselNode.type !== 'feature-block') return { khCards: [], enCards: [], linkedBlocks: [] }

  const blockType = typeof carouselNode.data?.blockType === 'string' ? carouselNode.data.blockType.trim() : ''
  if (blockType !== 'carousel') return { khCards: [], enCards: [], linkedBlocks: [] }

  const cardPaths = Array.isArray(carouselNode.data?.paths) ? carouselNode.data.paths : []
  const khCards: ExportedCard[] = []
  const enCards: ExportedCard[] = []
  const linkedBlocks: string[] = []

  for (const cardPath of cardPaths) {
    const cardNode = nodes.find(n => n.id === cardPath.targetBlockId)
    if (!cardNode || cardNode.type !== 'generic-template') continue

    const template = extractGenericTemplate(cardNode, nodes)
    if (!template || !Array.isArray(template.kh.cards) || !Array.isArray(template.en.cards)) continue

    khCards.push(...template.kh.cards)
    enCards.push(...template.en.cards)
    linkedBlocks.push(...template.linked_blocks ?? [])
  }

  return { khCards, enCards, linkedBlocks }
}


export function exportPayloadLinksFromNode(
  node: Node,
  fixedNodes: Node[],
  edges: Edge[],
  visited: Set<string>,
  exportPayload: Record<string, any>,
  allNodeIds: Set<string>,
  allBlockNames: Set<string>,
  topLevelBlockIds: Set<string> // ✅ Add this
) {
  console.log(`🧪 Entered exportGenericTemplate for node "${node.id}"`)
  console.log(`📋 Node data:`, node.data)

  


const rootOptions = Array.isArray(node.data?.options) ? node.data.options : []
for (const opt of rootOptions) {
  const payload = typeof opt.payload === 'string' ? opt.payload.trim() : ''
  console.log(`🔍 Scanning root-level payload: "${payload}" from node "${node.id}"`)

  if (!payload) {
    console.log(`⚠️ Skipped empty root payload`)
    continue
  }

  if (visited.has(payload)) {
    console.log(`⚠️ Already visited root payload "${payload}"`)
    continue
  }

  const isValid = allNodeIds.has(payload) || allBlockNames.has(payload)
  console.log(`🔎 Root payload "${payload}" is ${isValid ? 'valid' : 'invalid'} (exists in canvas)`)

  if (!isValid) continue

  const payloadNode = fixedNodes.find(n =>
    n.id === payload ||
    (typeof n.data?.name === 'string' && n.data.name.trim() === payload)
  )

  if (!payloadNode) {
    console.warn(`❌ Root payload node "${payload}" not found in fixedNodes`)
    continue
  }

  console.log(`✅ Found root payload-linked node: "${payloadNode.id}" (${payloadNode.type})`)

  const payloadExport = isFeatureBlockNode(payloadNode)
    ? exportFeatureBlock(payloadNode, fixedNodes, edges, visited, topLevelBlockIds, new Set(), 'full')

    : payloadNode.type === 'generic-template'
      ? exportGenericTemplate(payloadNode)
      : null

  if (!payloadExport || !payloadExport.flow_data) {
    console.warn(`❌ Export failed for root payload node "${payloadNode.id}"`)
    continue
  }

  if (!Array.isArray(payloadExport.flow_data.linked_blocks)) {
    payloadExport.flow_data.linked_blocks = []
  }

  const payloadName =
    typeof payloadNode.data?.name === 'string'
      ? payloadNode.data.name.trim()
      : payloadNode.id

  exportPayload[payloadName] = {
    canvas: payloadExport.canvas,
    flow_data: payloadExport.flow_data
  }

  visited.add(payloadName)
  console.log(`📦 Exported root payload block: "${payloadName}"`)
  console.log(`🧠 Visited set now includes:`, Array.from(visited))

  // ✅ Recurse into this block
  exportPayloadLinksFromNode(
    payloadNode,
    fixedNodes,
    edges,
    visited,
    exportPayload,
    allNodeIds,
    allBlockNames,
    topLevelBlockIds // ✅ Add here too
  )

}

}


export function resolveLinkedBlock(
  node: Node,
  fixedNodes: Node[],
  edges: Edge[],
  visited: Set<string>,
  exportPayload: Record<string, any>,
  allNodeIds: Set<string>,
  allBlockNames: Set<string>,
  topLevelBlockIds: Set<string>,
  mergedCarousels: Set<string>,
  mode: 'inline' | 'full' = 'full'
): void {
  const isTopLevel = topLevelBlockIds.has(node.id)

  if (mode === 'inline' && !isTopLevel) {
    console.log(`🚫 Skipping non-top-level linked block "${node.id}" in inline mode`)
    return
  }

  const name = typeof node.data?.name === 'string' && node.data.name.trim() !== ''
    ? node.data.name.trim()
    : node.id

  const exportKey = name
  const alreadyExported = exportPayload.hasOwnProperty(exportKey)
  if (alreadyExported) {
    console.log(`🔁 Already exported: "${exportKey}"`)
    return
  }

  visited.add(node.id)

  // ✅ Handle text-message blocks
  if (node.type === 'text-message') {
    const message = typeof node.data?.message === 'string' ? node.data.message.trim() : ''
    if (!message) {
      console.warn(`🚫 Skipping empty text-message block: "${node.id}"`)
      return
    }

    exportPayload[node.id] = {
      canvas: {
        nodes: [node],
        edges: []
      },
      flow_data: {
        kh: [{ template_type: 'text', is_active: true, text: message }],
        en: [{ template_type: 'text', is_active: true, text: message }],
        metadata: {
          blockType: 'text-message',
          flow_name: 'text_message_flow',
          name: node.id,
          created_by: 'admin001',
          last_updated: new Date().toISOString(),
          is_active: true,
          linked_pages: [],
          config: {}
        },
        linked_blocks: []
      }
    }

    console.log(`📦 Exported deep-linked text-message block: "${node.id}"`)
    return
  }

  let blockExport: FullFlowExport | null = null

  if (isFeatureBlockNode(node)) {
    blockExport = exportFeatureBlock(
      node,
      fixedNodes,
      edges,
      visited,
      topLevelBlockIds,
      mergedCarousels,
      mode
    )
  } else if (node.type === 'generic-template') {
    const template = extractGenericTemplate(node, fixedNodes)
    if (template) {
      blockExport = {
        canvas: { nodes: [node], edges: [] },
        flow_data: {
          kh: [template.kh],
          en: [template.en],
          linked_blocks: Array.isArray(template.linked_blocks)
            ? template.linked_blocks
            : [],
          metadata: {
            blockType: 'generic-template',
            flow_name: 'generic',
            name,
            created_by: 'admin001',
            last_updated: new Date().toISOString(),
            is_active: true,
            linked_pages: ['708759082319392'],
            config: typeof node.data?.config === 'object' && node.data.config !== null
              ? node.data.config
              : {}
          }
        }
      }
    }
  } else if (node.type === 'carousel') {
    blockExport = exportCarouselBlock(
      node,
      fixedNodes,
      edges,
      visited,
      exportPayload,
      allNodeIds,
      allBlockNames,
      topLevelBlockIds,
      mergedCarousels
    )
  }

  if (!blockExport || !blockExport.flow_data) {
    console.warn(`❌ Failed to export block "${name}"`)
    return
  }

  if (!Array.isArray(blockExport.flow_data.linked_blocks)) {
    blockExport.flow_data.linked_blocks = []
  }

  exportPayload[exportKey] = {
    canvas: blockExport.canvas,
    flow_data: blockExport.flow_data
  }

  console.log(`📦 Exported linked block: "${name}"`)

  // ✅ Recursively resolve linked_blocks
  const allLinked = new Set(blockExport.flow_data.linked_blocks)

  for (const linkedId of allLinked) {
    if (!linkedId) continue

    const linkedNode = fixedNodes.find(n =>
      n.id === linkedId ||
      (typeof n.data?.name === 'string' && n.data.name.trim() === linkedId)
    )

    if (!linkedNode) continue

    // ✅ Promote before visited check
    if (isFeatureBlockNode(linkedNode)) {
      const isReferenced = fixedNodes.some(n =>
        Array.isArray(n.data?.paths) &&
        n.data.paths.some(p => p.targetBlockId === linkedNode.id)
      )
      if (!isReferenced) {
        topLevelBlockIds.add(linkedNode.id)
        console.log(`🆙 Promoted "${linkedId}" to top-level block (from linked_blocks)`)
      }
    }

    if (visited.has(linkedId)) {
      console.log(`🔁 Already visited linked block: "${linkedId}"`)
      continue
    }

    resolveLinkedBlock(
      linkedNode,
      fixedNodes,
      edges,
      visited,
      exportPayload,
      allNodeIds,
      allBlockNames,
      topLevelBlockIds,
      mergedCarousels,
      mode
    )
  }

  // ✅ Recursively resolve card payloads
  const cardPayloads = extractPayloadsFromNode(node)

  for (const payloadId of cardPayloads) {
    if (!payloadId) continue

    const payloadNode = fixedNodes.find(n =>
      n.id === payloadId ||
      (typeof n.data?.name === 'string' && n.data.name.trim() === payloadId)
    )

    if (!payloadNode) continue

    // ✅ Promote before visited check
    if (isFeatureBlockNode(payloadNode)) {
      const isReferenced = fixedNodes.some(n =>
        Array.isArray(n.data?.paths) &&
        n.data.paths.some(p => p.targetBlockId === payloadNode.id)
      )
      if (!isReferenced) {
        topLevelBlockIds.add(payloadNode.id)
        console.log(`🆙 Promoted "${payloadId}" to top-level block (from card payload)`)
      }
    }

    if (visited.has(payloadId)) {
      console.log(`🔁 Already visited card payload: "${payloadId}"`)
      continue
    }

    resolveLinkedBlock(
      payloadNode,
      fixedNodes,
      edges,
      visited,
      exportPayload,
      allNodeIds,
      allBlockNames,
      topLevelBlockIds,
      mergedCarousels,
      mode
    )
  }
}

export function extractPayloadsFromNode(node: Node): string[] {
  const payloads = new Set<string>()

  if (!node?.data) return []

  const rootOptions = Array.isArray(node.data.options) ? node.data.options : []
  for (const opt of rootOptions) {
    const payload = typeof opt.payload === 'string' ? opt.payload.trim() : ''
    if (payload) payloads.add(payload)
  }

  const cards = Array.isArray(node.data.cards) ? node.data.cards : []
  for (const card of cards) {
    const options = Array.isArray(card.options) ? card.options : []
    for (const opt of options) {
      const payload = typeof opt.payload === 'string' ? opt.payload.trim() : ''
      if (payload) payloads.add(payload)
    }
  }

  return Array.from(payloads)
}



export function buildMetadata(
  node: Node,
  blockType: string,
  fallbackName: string
): ExportedMetadata {
  const name =
    typeof node.data?.name === 'string' && node.data.name.trim()
      ? node.data.name.trim()
      : fallbackName || node.id

  const isActive =
    typeof node.data?.is_active === 'boolean'
      ? node.data.is_active
      : true

  const linkedPages =
    Array.isArray(node.data?.linked_pages) &&
    node.data.linked_pages.every(p => typeof p === 'string')
      ? node.data.linked_pages
      : ['708759082319392']

  const config =
    typeof node.data?.config === 'object' && node.data.config !== null
      ? node.data.config
      : {}

  return {
    blockType: String(blockType || 'unknown'),
    flow_name: String(blockType || 'unknown'),
    name: String(name),
    created_by: 'admin001',
    last_updated: new Date().toISOString(),
    is_active: isActive,
    linked_pages: linkedPages,
    config
  }
}


