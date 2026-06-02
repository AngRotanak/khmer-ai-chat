import { getButtonChains } from '~/utils/flowLogic'
import type { Node, Edge } from '@xyflow/react'
import {
  isTextMessageNode,
  isGenericTemplateNode,
  isFeatureBlockNode,
} from '~/modules/nodes/utils'

import type { FeatureBlockNodeData } from '~/modules/nodes/types'
import { buildCanvasForBlock } from './buildCanvasForBlock'
import { exportGenericTemplate } from './exportGenericTemplate'

// import { exportTextBlockById} from './exportHelpers'
import { exportFeatureBlock } from './exportFeatureBlock'


export function buildFlowExport(nodes: Node[], edges: Edge[]) {
  const visited = new Set<string>()
  const exportPayload: Record<string, any> = {}

  const allNodeIds = new Set(nodes.map(n => n.id))
  const allBlockNames = new Set(
    nodes
      .filter(isFeatureBlockNode)
      .map(n => (n.data as FeatureBlockNodeData)?.name?.trim())
      .filter(Boolean)
  )

  const fixedNodes = patchMissingTargetBlockIds(
    ensureHandlesAreValid(nodes, edges),
    edges
  )

  const featureBlocks = fixedNodes.filter(isFeatureBlockNode)

  for (const block of featureBlocks) {
    const data = block.data as FeatureBlockNodeData
    const name = typeof data.name === 'string' ? data.name.trim() : ''
    const isValidKey = name && !/[.#$/[\]]/.test(name)

    if (!isValidKey || visited.has(name)) {
      console.warn(`❌ Skipping invalid block name: "${name}"`)
      continue
    }

    visited.add(name)

    const blockExport = exportFeatureBlock(block, fixedNodes, edges)
    if (!blockExport) continue

    exportPayload[name] = {
      canvas: buildCanvasForBlock(block.id, fixedNodes, edges),
      flow_data: blockExport
    }

    // ✅ Normalize linked_blocks to string[]
      const linkedIds: string[] = Array.isArray(blockExport.flow_data?.linked_blocks)
        ? blockExport.flow_data.linked_blocks.filter(id =>
            typeof id === 'string' &&
            id.trim() !== '' &&
            (allNodeIds.has(id) || allBlockNames.has(id))
          )
        : []

    // ✅ Log unresolved IDs
    const unresolved = linkedIds.filter(id =>
      !allNodeIds.has(id) && !allBlockNames.has(id)
    )
    if (unresolved.length > 0) {
      console.warn(`⚠️ Skipping ${unresolved.length} unresolved linkedIds:`, unresolved)
    }

    // ✅ Traverse valid linked blocks
    for (const linkedId of linkedIds) {
      if (visited.has(linkedId)) continue

      const linkedNode = fixedNodes.find(n =>
        n.id === linkedId ||
        (typeof n.data?.name === 'string' && n.data.name.trim() === linkedId)
      )

      if (!linkedNode) {
        console.warn(`⚠️ Linked node "${linkedId}" not found`)
        continue
      }

      let linkedExport: any = null

      if (isFeatureBlockNode(linkedNode)) {
        linkedExport = exportFeatureBlock(linkedNode, fixedNodes, edges)
      } else if (linkedNode.type === 'generic-template') {
        linkedExport = exportGenericTemplate(linkedNode)
      }

      exportPayload[linkedId] = {
        canvas: buildCanvasForBlock(linkedNode.id, fixedNodes, edges),
        flow_data: linkedExport
      }

      visited.add(linkedId)
    }
  }

  return exportPayload
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
