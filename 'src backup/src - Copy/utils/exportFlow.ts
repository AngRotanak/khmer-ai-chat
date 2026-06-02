import { getButtonChains } from '~/utils/flowLogic'
import type { Node, Edge } from '@xyflow/react'
import {
  isTextMessageNode,
  isGenericTemplateNode,
  isFeatureBlockNode,
} from '~/modules/nodes/utils'

import type { FeatureBlockNodeData } from '~/modules/nodes/types'
import  {resolveLinkedBlock, extractPayloadsFromNode} from './exportHelpers'

// import { exportTextBlockById} from './exportHelpers'
import { exportFeatureBlock } from './exportFeatureBlock'
import { simulateMessengerDelivery } from './simulateMessengerDelivery'

export function buildFlowExport(
  nodes: Node[],
  edges: Edge[],
  mode: 'inline' | 'full' = 'full'
) {
  const visited = new Set<string>()
  const mergedCarousels = new Set<string>()
  const exportPayload: Record<string, any> = {}

  const allNodeIds = new Set(nodes.map(n => n.id))
  const allBlockNames = new Set(
    nodes
      .filter(isFeatureBlockNode)
      .map(n => typeof n.data?.name === 'string' ? n.data.name.trim() : null)
      .filter((name): name is string => Boolean(name))
  )

  const fixedNodes = patchMissingTargetBlockIds(
    ensureHandlesAreValid(nodes, edges),
    edges
  )

  const featureBlocks = fixedNodes.filter(isFeatureBlockNode)

  const referencedBlockIds = new Set<string>()
  for (const n of fixedNodes) {
    if (Array.isArray(n.data?.paths)) {
      for (const p of n.data.paths) {
        if (typeof p.targetBlockId === 'string') {
          referencedBlockIds.add(p.targetBlockId)
        }
      }
    }
  }

  const topLevelBlockIds = new Set<string>()

  const isMessengerSafeId = (id: string): boolean =>
    typeof id === 'string' &&
    id.trim() !== '' &&
    (allNodeIds.has(id) || allBlockNames.has(id))

  for (const block of featureBlocks) {
    const data = block.data as FeatureBlockNodeData
    const name = typeof data.name === 'string' && data.name.trim() !== ''
      ? data.name.trim()
      : block.id

    const isValidKey = name && !/[.#$/[\]]/.test(name)
    const blockType = typeof data.blockType === 'string' ? data.blockType.trim() : ''
    const isTopLevel = !referencedBlockIds.has(block.id)

    if (isTopLevel) topLevelBlockIds.add(block.id)

    console.log(`🔧 Processing feature-block: "${name}" (${block.id})`)
    console.log(`🧠 blockType: ${blockType}, isTopLevel: ${isTopLevel}`)

    if (mode === 'inline' && !isTopLevel) {
      console.log(`🚫 Skipping non-top-level block "${name}" in inline mode`)
      continue
    }

    if (!isValidKey) {
      console.warn(`❌ Skipping block "${name}" due to invalid key`)
      continue
    }

    if (blockType === 'carousel' && mergedCarousels.has(block.id)) {
      console.warn(`❌ Skipping merged carousel block: "${name}"`)
      continue
    }

    const blockExport = exportFeatureBlock(
      block,
      fixedNodes,
      edges,
      visited,
      topLevelBlockIds,
      mergedCarousels,
      mode
    )

    if (!blockExport || !blockExport.flow_data) {
      console.warn(`❌ Export failed or skipped for block "${name}"`)
      continue
    }

    // ✅ Only mark as visited after successful export
    if (isReachable(block)) {
      visited.add(block.id)
    }



    if (!blockExport || !blockExport.flow_data) {
      console.warn(`❌ Export failed or skipped for block "${name}"`)
      continue
    }

    if (!Array.isArray(blockExport.flow_data.linked_blocks)) {
      blockExport.flow_data.linked_blocks = []
    }

    exportPayload[name] = {
      canvas: blockExport.canvas,
      flow_data: blockExport.flow_data
    }

    const linkedIds = Array.from(new Set(
      blockExport.flow_data.linked_blocks.filter(isMessengerSafeId)
    ))

    for (const linkedId of linkedIds) {
      const linkedNode = fixedNodes.find(n =>
        n.id === linkedId ||
        (typeof n.data?.name === 'string' && n.data.name.trim() === linkedId)
      )

      if (!linkedNode) continue

      if (isFeatureBlockNode(linkedNode)) {
        const isReferenced = fixedNodes.some(n =>
          Array.isArray(n.data?.paths) &&
          n.data.paths.some(p => p.targetBlockId === linkedNode.id)
        )
        if (!isReferenced) {
          topLevelBlockIds.add(linkedNode.id)
        }
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
  }

  console.log(`✅ Final export contains ${Object.keys(exportPayload).length} blocks`)
  console.log(`🧾 Exported block keys:`, Object.keys(exportPayload))

  const orphanBlocks = fixedNodes.filter(n => {
    if (!isFeatureBlockNode(n)) return false
    if (visited.has(n.id)) return false

    const hasValidPath = Array.isArray(n.data?.paths) &&
      n.data.paths.some(p =>
        typeof p.targetBlockId === 'string' &&
        isMessengerSafeId(p.targetBlockId)
      )

    const hasValidTrigger = typeof n.data?.trigger === 'string' &&
      isMessengerSafeId(n.data.trigger)

    const hasValidPayload = extractPayloadsFromNode(n).some(p =>
      typeof p === 'string' && isMessengerSafeId(p)
    )

    return !hasValidPath && !hasValidTrigger && !hasValidPayload
  })

  if (orphanBlocks.length > 0) {
    console.warn(`⚠️ Detected ${orphanBlocks.length} unreachable blocks:`)
    for (const orphan of orphanBlocks) {
      const name = typeof orphan.data?.name === 'string' ? orphan.data.name.trim() : orphan.id
      console.warn(`   • "${name}" (${orphan.id})`)
    }

    const fallbackBlockId = 'fallback_menu'
    const fallbackOptions = orphanBlocks.map((block, index) => {
      const name = typeof block.data?.name === 'string' ? block.data.name.trim() : ''
      const payload = name || block.id

      return {
        type: 'postback',
        payload,
        label_en: `Block ${index + 1}`,
        label_kh: `ប្លុក ${index + 1}`
      }
    })

    const fallbackBlock: Node = {
      id: fallbackBlockId,
      type: 'generic-template',
      position: { x: 0, y: 0 },
      width: 300,
      height: 200,
      selected: false,
      dragging: false,
      data: {
        name: fallbackBlockId,
        blockType: 'generic-template',
        trigger: fallbackBlockId,
        config: {},
        cards: [{
          title: 'Unlinked Blocks',
          subtitle: 'Fallback access',
          layout: 'hero',
          image_url: '',
          options: fallbackOptions
        }]
      }
    }

    console.log(`🛠️ Creating fallback block "${fallbackBlockId}" with ${orphanBlocks.length} links`)

    resolveLinkedBlock(
      fallbackBlock,
      [...fixedNodes, fallbackBlock],
      edges,
      visited,
      exportPayload,
      allNodeIds,
      allBlockNames,
      topLevelBlockIds,
      mergedCarousels,
      mode
    )

    topLevelBlockIds.add(fallbackBlockId)
    console.log(`✅ Fallback block "${fallbackBlockId}" exported and promoted to top-level`)
  }


  // ✅ Simulate Messenger delivery preview
  simulateMessengerDelivery(exportPayload)
  return exportPayload
}


function isReachable(node: Node): boolean {
  const hasValidPath = Array.isArray(node.data?.paths) &&
    node.data.paths.some(p =>
      typeof p.targetBlockId === 'string' &&
      p.targetBlockId.trim() !== ''
    )

  const hasValidTrigger = typeof node.data?.trigger === 'string' &&
    node.data.trigger.trim() !== ''

  const hasValidPayload = extractPayloadsFromNode(node).some(p =>
    typeof p === 'string' && p.trim() !== ''
  )

  return hasValidPath || hasValidTrigger || hasValidPayload
}


function patchMissingTargetBlockIds(nodes: Node[], edges: Edge[]): Node[] {
  return nodes.map(node => {
    if (node.type !== 'feature-block') return node

    const paths = Array.isArray(node.data?.paths) ? node.data.paths : []

    const patchedPaths = paths.map(path => {
      if (path.targetBlockId) return path

      const edge = edges.find(e =>
        e.source === node.id &&
        e.sourceHandle === path.id &&
        typeof e.target === 'string'
      )

      if (!path.targetBlockId && edge?.target) {
        console.warn(`🔧 Patched path "${path.id}" in node "${node.id}" → targetBlockId = "${edge.target}"`)
      }

      return {
        ...path,
        targetBlockId: edge?.target ?? null
      }
    })

    return {
      ...node,
      data: {
        ...node.data,
        paths: patchedPaths
      }
    }
  })
}
function ensureHandlesAreValid(nodes: Node[], edges: Edge[]): Node[] {
  return nodes.map(node => {
    if (node.type === 'feature-block') {
      const existingPaths = Array.isArray(node.data?.paths) ? node.data.paths : []
      const edgeHandles = edges
        .filter(e => e.source === node.id && typeof e.sourceHandle === 'string')
        .map(e => e.sourceHandle)

      const missingHandles = edgeHandles.filter(h => !existingPaths.some(p => p.id === h))
      const newPaths = missingHandles.map((id, i) => ({
        id,
        label: `Card ${existingPaths.length + i + 1}`,
        blockType: 'generic-template',
        targetBlockId: null
      }))

      return {
        ...node,
        data: {
          ...node.data,
          paths: [...existingPaths, ...newPaths]
        }
      }
    }

    if (node.type === 'generic-template') {
      const existingOptions = Array.isArray(node.data?.options) ? node.data.options : []
      const edgeTargets = edges
        .filter(e => e.target === node.id && typeof e.targetHandle === 'string')
        .map(e => e.targetHandle)

      const missingOptions = edgeTargets.filter(h => !existingOptions.some(o => o.id === h))
      const newOptions = missingOptions.map((id, i) => ({
        id,
        label: `Option ${existingOptions.length + i + 1}`,
        type: 'postback',
        payload: ''
      }))

      return {
        ...node,
        data: {
          ...node.data,
          options: [...existingOptions, ...newOptions]
        }
      }
    }

    return node
  })
}




export function exportBlock(
  name: string,
  nodes: Node[],
  edges: Edge[],
  // visited = new Set<string>()
): any {
  const block = nodes.find(
    n => isFeatureBlockNode(n) &&
      typeof (n.data as FeatureBlockNodeData)?.name === 'string' &&
      (n.data as FeatureBlockNodeData).name === name
  )
  if (!block) return null

const chains = getButtonChains([block], edges)
const kh: any[] = []
const en: any[] = []
const validNodeIds = new Set<string>()
const linkedBlocks: Set<string> = new Set()

chains.forEach(chain => {
  if (!chain.valid || !chain.nodePath || chain.nodePath.length === 0) return

  chain.nodePath.forEach(nodeId => {
    validNodeIds.add(nodeId)
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    if (isTextMessageNode(node)) {
      const khText = node.data.message_kh?.trim() || node.data.message?.trim() || ''
      const enText = node.data.message_en?.trim() || node.data.message?.trim() || ''

      if (khText) kh.push({ template_type: 'text', is_active: true, text: khText })
      if (enText) en.push({ template_type: 'text', is_active: true, text: enText })
    }

    if (isGenericTemplateNode(node)) {
      const isActive = node.data?.is_active === true
      const cards = Array.isArray(node.data.cards) ? node.data.cards : []

      const khCards = cards.map(card => ({
        title: card.title ?? '',
        subtitle: card.subtitle ?? '',
        image_url: card.image_url ?? '',
        layout: card.layout ?? 'hero',
        options: (card.options ?? []).map(opt => ({
          label_kh: opt.label_kh ?? opt.label ?? '',
          payload: opt.payload ?? '',
          type: opt.type ?? 'postback',
          url: opt.type === 'web_url' ? opt.url ?? '' : undefined,
        })),
      }))

      const enCards = cards.map(card => ({
        title: card.title ?? '',
        subtitle: card.subtitle ?? '',
        image_url: card.image_url ?? '',
        layout: card.layout ?? 'hero',
        options: (card.options ?? []).map(opt => ({
          label_en: opt.label_en ?? opt.label ?? '',
          payload: opt.payload ?? '',
          type: opt.type ?? 'postback',
          url: opt.type === 'web_url' ? opt.url ?? '' : undefined,
        })),
      }))

      kh.push({ template_type: 'generic', is_active: isActive, cards: khCards })
      en.push({ template_type: 'generic', is_active: isActive, cards: enCards })

      cards.forEach(card => {
        (card.options ?? []).forEach(opt => {
          const payload = opt.payload?.trim()
          if (!payload) return

          const isValidNodeId = nodes.some(n =>
            (isTextMessageNode(n) || isGenericTemplateNode(n)) && n.id === payload
          )
          const isFeatureBlockName = nodes.some(n =>
            isFeatureBlockNode(n) &&
            (n.data as FeatureBlockNodeData)?.name?.trim() === payload
          )

          if (isValidNodeId || isFeatureBlockName) {
            linkedBlocks.add(payload)
          }
        })
      })
    }
  })
})


  const blockData = block.data as FeatureBlockNodeData
  const flowKey = 'smart_flow' // ✅ Unified key

  return {
    kh: kh.length > 0 ? kh : [{ template_type: 'text', is_active: false, text: '⚠️ មិនមានមាតិកាភាសាខ្មែរ' }],
    en: en.length > 0 ? en : [{ template_type: 'text', is_active: false, text: '⚠️ No English content available' }],
    metadata: {
      blockType: blockData.blockType,
      name,
      flow_name: flowKey,
      config: blockData.config ?? {},
      linked_pages: ['708759082319392'],
      created_by: 'admin001',
      last_updated: new Date().toISOString(),
      is_active: true
    },

    linked_blocks: Array.from(linkedBlocks),
  }
}

export function validateExportData(nodes: Node[], _edges: Edge[]): { valid: boolean; reason?: string } {
  const nodeIds = new Set(nodes.map(n => n.id))

  for (const node of nodes) {
    if (!node.id || !node.type || !node.data) {
      return { valid: false, reason: `Node ${node.id} is missing required fields.` }
    }

    if (isFeatureBlockNode(node)) {
      const data = node.data as FeatureBlockNodeData
      const allButtons = [...(data.buttons_kh ?? []), ...(data.buttons_en ?? [])]
      const seenIds = new Set<string>()

      for (const btn of allButtons) {
        if (!btn.id || !btn.label) {
          return { valid: false, reason: `Button in node ${node.id} is missing id or label.` }
        }

        if (seenIds.has(btn.id)) {
          return { valid: false, reason: `Duplicate button ID ${btn.id} in node ${node.id}.` }
        }

        seenIds.add(btn.id)

        if (btn.targetBlockId && !nodeIds.has(btn.targetBlockId)) {
          return {
            valid: false,
            reason: `Button ${btn.id} in node ${node.id} links to missing node ${btn.targetBlockId}.`,
          }
        }
      }
    }
  }

  return { valid: true }
}
