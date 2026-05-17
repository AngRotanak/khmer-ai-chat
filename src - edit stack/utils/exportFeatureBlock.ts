import type { Node, Edge } from '@xyflow/react'
import  { exportCarouselBlock } from './exportCarouselBlock'

import type { FeatureBlockNodeData, GenericTemplateNodeData } from '~/modules/nodes/types'
import type { ExportedBlock, FullFlowExport, ExportedTemplate } from '~/modules/nodes/types'

import  { isFeatureBlockNode } from '~/modules/nodes/utils'
import { extractGenericTemplate } from '~/utils/exportHelpers'
import { exportInfoWithCarousel } from '~/utils/exportInfoWithCarousel'


export function exportFeatureBlock(
  block: Node,
  nodes: Node[],
  edges: Edge[],
  visited: Set<string>,
  topLevelBlockIds: Set<string>,
  mergedCarousels: Set<string>,
  mode: 'inline' | 'full' = 'full' // ✅ Add this
): FullFlowExport | null {  

  if (!visited || typeof visited.has !== 'function') {
    throw new Error('❌ visited Set is missing or invalid')
  }

  const data = { ...block.data } as FeatureBlockNodeData
  const name = typeof data.name === 'string' ? data.name.trim() : block.id
  const blockType = typeof data.blockType === 'string' ? data.blockType.trim() : ''
  const isTopLevel = topLevelBlockIds.has(block.id)

  if (mode === 'inline' && !isTopLevel) {
    console.log(`🚫 Skipping non-top-level block "${block.id}" in inline mode`)
    return null
  }

  console.log(`🧠 blockType resolved:`, blockType)
  console.log(`🔍 Evaluating export logic for "${name}"`)

  // ✅ Skip only top-level carousels that were merged inline
  const isMergedTopLevelCarousel =
    blockType === 'carousel' &&
    isTopLevel &&
    mergedCarousels.has(block.id)

  if (isMergedTopLevelCarousel) {
    console.warn(`🚫 Skipping merged top-level carousel block: "${name}"`)
    return null
  }

  if (!Array.isArray(data.kh)) data.kh = []
  if (!Array.isArray(data.en)) data.en = []

  const patchedBlock = { ...block, data }

  const hasTextMessagePath = Array.isArray(data.paths) &&
    data.paths.some(p => nodes.find(n => n.id === p.targetBlockId)?.type === 'text-message')

  const hasCarouselPath = Array.isArray(data.paths) &&
    data.paths.some(p => {
      const target = nodes.find(n => n.id === p.targetBlockId)
      return target?.type === 'carousel' ||
        (target?.type === 'feature-block' &&
         typeof target.data?.blockType === 'string' &&
         target.data.blockType.trim() === 'carousel')
    })

  console.log(`   ➤ hasTextMessagePath:`, hasTextMessagePath)
  console.log(`   ➤ hasCarouselPath:`, hasCarouselPath)

  // ✅ Inline merge: info block with both text and carousel paths
  if (hasTextMessagePath && hasCarouselPath) {
    console.log(`🚀 Triggering exportInfoWithCarousel for "${name}"`)
    const mergedExport = exportInfoWithCarousel(
      patchedBlock,
      nodes,
      edges,
      visited,
      mergedCarousels // ✅ Track inline merge
    )

    if (!mergedExport || !mergedExport.flow_data) {
      console.warn(`❌ exportInfoWithCarousel failed for "${name}"`)
      return null
    }

    const linked_blocks = Array.isArray(mergedExport.flow_data.linked_blocks)
      ? mergedExport.flow_data.linked_blocks.filter(id =>
          typeof id === 'string' &&
          id.trim() !== '' &&
          !id.startsWith('_') &&
          !id.includes('#') &&
          !id.includes('/') &&
          !id.includes('[') &&
          !id.includes(']')
        )
      : []

    console.log(`🔗 Final Messenger-safe linked_blocks for "${name}":`, linked_blocks)

    return {
      canvas: mergedExport.canvas,
      flow_data: {
        ...mergedExport.flow_data,
        linked_blocks
      }
    }
  }

  // ✅ Fallback: carousel block not merged inline
  if (blockType === 'carousel') {
    const carouselExport = exportCarouselBlock(
      patchedBlock,
      nodes,
      edges,
      visited,
      {}, // ⚠️ Consider passing actual exportPayload if needed
      new Set(nodes.map(n => n.id)),
      new Set(
        nodes
          .filter(isFeatureBlockNode)
          .map(n => typeof n.data?.name === 'string' ? n.data.name.trim() : '')
          .filter(name => name !== '')
      ),
      topLevelBlockIds,
      mergedCarousels
    )

    if (
      !carouselExport?.flow_data?.kh ||
      !carouselExport?.flow_data?.en ||
      !carouselExport?.flow_data?.metadata ||
      !carouselExport?.flow_data?.linked_blocks
    ) {
      console.warn(`❌ Invalid carousel export structure for block "${name}"`)
      return null
    }

    return {
      canvas: carouselExport.canvas,
      flow_data: carouselExport.flow_data
    }
  }

  // ✅ Standard block types
  let mainExport: ExportedBlock | null = null

  switch (blockType) {
    case 'info':
      mainExport = buildStandardExportBlock(patchedBlock, 'info', 'info')
      break
    case 'product':
      mainExport = buildStandardExportBlock(patchedBlock, 'product', 'product_flow')
      break
    case 'intent':
      mainExport = buildStandardExportBlock(patchedBlock, 'intent', 'intent_flow')
      break
    case 'smart-welcome':
      mainExport = buildStandardExportBlock(patchedBlock, 'welcome', 'welcome_flow')
      break
    case 'quick-menu':
      mainExport = buildStandardExportBlock(patchedBlock, 'menu', 'menu_flow')
      break
    case 'custom-intro':
      mainExport = buildStandardExportBlock(patchedBlock, 'custom-intro', 'intro_flow')
      break
    case 'start':
      mainExport = buildStandardExportBlock(patchedBlock, 'start', 'start_flow')
      break
    default:
      console.warn(`❌ Unsupported blockType: "${blockType}"`)
      return null
  }

  if (!mainExport || !mainExport.flow_data) {
    console.warn(`❌ No export data for block "${name}"`)
    return null
  }

  const kh = Array.isArray(mainExport.flow_data.kh) ? mainExport.flow_data.kh : []
  const en = Array.isArray(mainExport.flow_data.en) ? mainExport.flow_data.en : []
  const linkedBlockIds = new Set<string>()

  const connectedIds = Array.isArray(data.paths)
    ? data.paths.map(p => typeof p.targetBlockId === 'string' ? p.targetBlockId.trim() : '')
    : []

  for (const id of connectedIds) {
    const node = nodes.find(n => n.id === id)
    if (!node) continue

    if (node.type === 'text-message') {
      const message = typeof node.data?.message === 'string' ? node.data.message.trim() : ''
      if (message) {
        kh.push({ template_type: 'text', is_active: true, text: message })
        en.push({ template_type: 'text', is_active: true, text: message })
      }
      continue
    }

    if (node.type === 'generic-template') {
      const cardData = node.data as GenericTemplateNodeData
      const cards = Array.isArray(cardData.cards) ? cardData.cards : []

      for (const card of cards) {
        for (const opt of card.options ?? []) {
          const payloadId = typeof opt.payload === 'string' ? opt.payload.trim() : ''
          if (!payloadId) continue

          const linkedNode = nodes.find(n =>
            n.id === payloadId ||
            (typeof n.data?.name === 'string' && n.data.name.trim() === payloadId)
          )

          if (!linkedNode) {
            console.warn(`⚠️ Skipping option with unresolved payload: "${payloadId}"`)
            continue
          }

          const linkedName = typeof linkedNode.data?.name === 'string'
            ? linkedNode.data.name.trim()
            : linkedNode.id

          const isMessengerSafe =
            linkedName !== '' &&
            !linkedName.startsWith('_') &&
            !linkedName.includes('#') &&
            !linkedName.includes('/') &&
            !linkedName.includes('[') &&
            !linkedName.includes(']')

          if (isMessengerSafe) {
            linkedBlockIds.add(linkedName)
          } else {
            console.warn(`⚠️ Skipping unsafe linked block name: "${linkedName}"`)
          }
        }
      }

      const template = extractGenericTemplate(node, nodes)
      if (template) {
        kh.push(template.kh)
        en.push(template.en)
      }

      continue
    }

    if (isFeatureBlockNode(node)) {
      const safeId = typeof node.data?.name === 'string' ? node.data.name.trim() : node.id
      const isMessengerSafe =
        safeId !== '' &&
        !safeId.startsWith('_') &&
        !safeId.includes('#') &&
        !safeId.includes('/') &&
        !safeId.includes('[') &&
        !safeId.includes(']')

      if (isMessengerSafe) {
        linkedBlockIds.add(safeId)
      } else {
        console.warn(`⚠️ Skipping unsafe feature-block ID: "${safeId}"`)
      }
    }
  }

  const linked_blocks = Array.from(linkedBlockIds)

  console.log(`🔗 Final Messenger-safe linked_blocks for "${name}":`, linked_blocks)

if (kh.length === 0 || !kh[0]?.text?.trim()) {
  kh.push({
    template_type: 'text',
    is_active: true,
    text: '⚠️ មិនមានមាតិកាភាសាខ្មែរ'
  })
}

if (en.length === 0 || !en[0]?.text?.trim()) {
  en.push({
    template_type: 'text',
    is_active: true,
    text: '⚠️ No English content available'
  })
}

return {
  canvas: {
    nodes,
    edges
  },
  flow_data: {
    kh,
    en,
    metadata: mainExport.flow_data.metadata,
    linked_blocks
  }
}


}

  
export function buildStandardExportBlock(
  block: Node,
  blockType: string,
  flowName: string
): ExportedBlock {
  const rawName = typeof block.data?.name === 'string' ? block.data.name.trim() : ''
  const name = rawName || block.id
  const isActive = typeof block.data?.is_active === 'boolean' ? block.data.is_active : true

  // ✅ Do NOT include root-level kh/en content — only chained nodes will populate these
  const kh: ExportedTemplate[] = []
  const en: ExportedTemplate[] = []

  return {
    canvas: {
      nodes: [],
      edges: []
    },
    flow_data: {
      kh,
      en,
      metadata: {
        blockType,
        flow_name: flowName,
        name,
        created_by: 'admin001',
        last_updated: new Date().toISOString(),
        linked_pages: ['708759082319392'],
        is_active: isActive,
        config: block.data?.config ?? {}
      },
      linked_blocks: []
    }
  }
}
