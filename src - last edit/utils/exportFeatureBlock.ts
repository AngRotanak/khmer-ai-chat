import type { Node, Edge } from '@xyflow/react'
import { exportCarouselBlock } from './exportCarouselBlock'

import type { FeatureBlockNodeData, TextMessageNodeData } from '~/modules/nodes/types'
import type { ExportedBlock, FullFlowExport, ExportedTemplate, ExportedMetadata } from '~/modules/nodes/types'

import { isFeatureBlockNode } from '~/modules/nodes/utils'
import { extractGenericTemplate } from '~/utils/exportHelpers'
import { exportInfoWithCarousel } from '~/utils/exportInfoWithCarousel'
import { resolveLinkedBlock } from '~/utils/exportHelpers'
import { getButtonChains } from '~/utils/flowLogic'
import { buildCanvasForBlock } from './buildCanvasForBlock'



export function exportFeatureBlock(
  block: Node,
  nodes: Node[],
  edges: Edge[],
  visited: Set<string>,
  topLevelBlockIds: Set<string>,
  mergedCarousels: Set<string>,
  exportPayload: Record<string, any>,
  mode: 'inline' | 'full' = 'full'
): FullFlowExport | null {
  // 🧠 Validate visited set
  if (!visited || typeof visited.has !== 'function') {
    throw new Error('❌ visited Set is missing or invalid')
  }

  // 📦 Normalize block metadata
  const data = { ...block.data } as FeatureBlockNodeData
  const name = typeof data.name === 'string' ? data.name.trim() : block.id
  const blockType = typeof data.blockType === 'string' ? data.blockType.trim() : ''
  const isTopLevel = topLevelBlockIds.has(block.id)

  // 🚫 Skip non-top-level blocks in inline mode
  if (mode === 'inline' && !isTopLevel) return null

  // 🚫 Skip merged top-level carousel blocks
  const isMergedTopLevelCarousel =
    blockType === 'carousel' &&
    isTopLevel &&
    mergedCarousels.has(block.id)

  if (isMergedTopLevelCarousel) return null

  const patchedBlock = { ...block, data }

  // 🔍 Check if block has both text and carousel paths
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

  // 🚀 Merge info + carousel block if both paths exist
  if (hasTextMessagePath && hasCarouselPath) {
    const mergedExport = exportInfoWithCarousel(
      patchedBlock,
      nodes,
      edges,
      visited,
      mergedCarousels
    )

    if (!mergedExport?.flow_data) return null

    const canvas = buildCanvasForBlock(block.id, nodes, edges)
    const canvasNodeIds = new Set(canvas.nodes.map(n => n.id))
    const isPathLinked = (id: string) => canvasNodeIds.has(id)

    const linked_blocks = Array.isArray(mergedExport.flow_data.linked_blocks)
      ? mergedExport.flow_data.linked_blocks.filter(isMessengerSafeId)
      : []

    // 🔁 Recursively resolve linked blocks
    for (const linkedId of linked_blocks) {
      const linkedNode = nodes.find(n =>
        n.id === linkedId ||
        (typeof n.data?.name === 'string' && n.data.name.trim() === linkedId)
      )
      if (!linkedNode || visited.has(linkedNode.id)) continue

      resolveLinkedBlock(
        linkedNode,
        nodes,
        edges,
        visited,
        exportPayload,
        new Set(nodes.map(n => n.id)),
        new Set(
          nodes
            .filter(isFeatureBlockNode)
            .map(n => typeof n.data?.name === 'string' ? n.data.name.trim() : '')
            .filter(name => name !== '')
        ),
        topLevelBlockIds,
        mergedCarousels,
        mode,
        isPathLinked
      )
    }

    return {
      canvas: mergedExport.canvas,
      flow_data: {
        ...mergedExport.flow_data,
        linked_blocks
      }
    }
  }

  // 🎠 Export standalone carousel block
  if (blockType === 'carousel') {
    const carouselExport = exportCarouselBlock(
      patchedBlock,
      nodes,
      edges,
      visited,
      exportPayload,
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
    ) return null

    return {
      canvas: carouselExport.canvas,
      flow_data: carouselExport.flow_data
    }
  }

  // 🧱 Build standard export block for other types
  let mainExport: ExportedBlock | null = null

  switch (blockType) {
    case 'info': {
      mainExport = buildStandardExportBlock(patchedBlock, 'info', 'info')
      const kh = Array.isArray(data.kh) ? data.kh : []
      const en = Array.isArray(data.en) ? data.en : []
      mainExport.flow_data.kh = kh
      mainExport.flow_data.en = en
      if (!mainExport.flow_data.metadata.config || Object.keys(mainExport.flow_data.metadata.config).length === 0) {
        mainExport.flow_data.metadata.config = typeof data.config === 'object' ? data.config : {}
      }
      break
    }
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
      return null
  }

  if (!mainExport?.flow_data) return null

  // 🔁 Rebuild kh/en arrays from ordered chains
  const chains = getButtonChains(nodes, edges).filter(c => c.nodeId === block.id)
  const kh: ExportedTemplate[] = []
  const en: ExportedTemplate[] = []
  const linkedBlockIds = new Set<string>()

  for (const chain of chains) {
    const targetNode = nodes.find(n => n.id === chain.targetNodeId)
    if (!targetNode) continue

    // 🗨️ Export text-message block
    if (targetNode.type === 'text-message') {
      const data = targetNode.data as TextMessageNodeData
      const isActive = typeof data.is_active === 'boolean' ? data.is_active : false

      const message_kh = typeof data.message_kh === 'string' ? data.message_kh.trim() : ''
      const message_en = typeof data.message_en === 'string' ? data.message_en.trim() : ''

      if (message_kh) {
        kh.push({
          template_type: 'text',
          is_active: isActive,
          text: message_kh,
          metadata: {
            blockType: 'text-message',
            name: targetNode.id,
            config: {
              channel: data.channel,
              message_kh,
              message_en,
              delay_seconds: data.delay_seconds ?? 0,
              show_typing: data.show_typing ?? false,
              tone: data.tone ?? 'neutral',
              emoji_style: data.emoji_style ?? 'minimal',
              priority: data.priority ?? 'normal',
              trigger_condition: data.trigger_condition ?? ''
            }
          }
        })
      }

      if (message_en) {
        en.push({
          template_type: 'text',
          is_active: isActive,
          text: message_en,
          metadata: {
            blockType: 'text-message',
            name: targetNode.id,
            config: {
              channel: data.channel,
              message_kh,
              message_en,
              delay_seconds: data.delay_seconds ?? 0,
              show_typing: data.show_typing ?? false,
              tone: data.tone ?? 'neutral',
              emoji_style: data.emoji_style ?? 'minimal',
              priority: data.priority ?? 'normal',
              trigger_condition: data.trigger_condition ?? ''
            }
          }
        })
      }
    }

    // 🧩 Export generic-template block
    if (targetNode.type === 'generic-template') {
      const template = extractGenericTemplate(targetNode, nodes)
      if (!template) continue
      if (template.kh?.metadata?.config) kh.push(template.kh)
      if (template.en?.metadata?.config) en.push(template.en)
      for (const id of template.linked_blocks ?? []) {
        if (typeof id === 'string' && id.trim() !== '') linkedBlockIds.add(id)
      }
    }
  }

  // 🔗 Handle connected blocks via paths
  const canvas = buildCanvasForBlock(block.id, nodes, edges)
  const canvasNodeIds = new Set(canvas.nodes.map(n => n.id))
  const isPathLinked = (id: string) => canvasNodeIds.has(id)

  const connectedIds = Array.isArray(data.paths)
    ? data.paths.map(p => typeof p.targetBlockId === 'string' ? p.targetBlockId.trim() : '')
    : []

  for (const id of connectedIds) {
    const node = nodes.find(n => n.id === id)
    if (!node) continue

    if (node.type === 'generic-template') {
      const template = extractGenericTemplate(node, nodes)
      if (!template) continue
      if (template.kh?.metadata?.config) kh.push(template.kh)
      if (template.en?.metadata?.config) en.push(template.en)
      for (const linkedId of template.linked_blocks ?? []) {
        if (typeof linkedId === 'string' && linkedId.trim() !== '') linkedBlockIds.add(linkedId)
      }
      continue
    }

    if (isFeatureBlockNode(node)) {
      // 🧱 Add Messenger-safe feature block ID
      const safeId = typeof node.data?.name === 'string' ? node.data.name.trim() : node.id
      if (isMessengerSafeId(safeId)) {
        linkedBlockIds.add(safeId)
      }
    }
  }

  const isActive = typeof block.data?.is_active === 'boolean' ? block.data.is_active : false

  let metadata: ExportedMetadata

  if (
    mainExport?.flow_data?.metadata &&
    typeof mainExport.flow_data.metadata === 'object' &&
    Array.isArray(mainExport.flow_data.metadata.linked_pages) &&
    typeof mainExport.flow_data.metadata.config === 'object' &&
    mainExport.flow_data.metadata.config !== null
  ) {
    metadata = mainExport.flow_data.metadata
  } else {
    metadata = {
      blockType: blockType || 'unknown',
      flow_name: `${blockType || 'unknown'}_flow`,
      name: name || block.id,
      created_by: 'admin001',
      last_updated: new Date().toISOString(),
      linked_pages: [],
      is_active: isActive,
      config: {}
    }
  }


  const rawLinked = Array.isArray(mainExport.flow_data.linked_blocks)
    ? mainExport.flow_data.linked_blocks
    : []

  const allLinked = Array.from(new Set([
    ...rawLinked,
    ...Array.from(linkedBlockIds)
  ])).filter(id =>
    typeof id === 'string' &&
    id.trim() !== '' &&
    !id.startsWith('_') &&
    !id.includes('#') &&
    !id.includes('/') &&
    !id.includes('[') &&
    !id.includes(']')
  )

  const linked_blocks: string[] = allLinked

  for (const id of linked_blocks) {
    const node = nodes.find(n => n.id === id)
    if (!node) continue

    const isReferenced = nodes.some(n =>
      Array.isArray(n.data?.paths) &&
      n.data.paths.some(p => p.targetBlockId === node.id)
    )

    const isLinkedInline = isPathLinked?.(node.id) ?? false

    if (!isReferenced && !isLinkedInline && isMessengerSafeId(id)) {
      topLevelBlockIds.add(node.id)
      console.log(`🆙 Promoted "${node.id}" to top-level block (from linked_blocks)`)
    }
  }


  return {
    canvas: {
      nodes,
      edges
    },
    flow_data: {
      kh,
      en,
      metadata,
      linked_blocks
    }
  }
}




export function isMessengerSafeId(id: string): boolean {
  return (
    typeof id === 'string' &&
    id.trim() !== '' &&
    !id.startsWith('_') &&
    !id.includes('#') &&
    !id.includes('/') &&
    !id.includes('[') &&
    !id.includes(']')
  )
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

