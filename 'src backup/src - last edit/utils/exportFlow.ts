
import type { Node, Edge } from '@xyflow/react'
import { isFeatureBlockNode } from '~/modules/nodes/utils'

import type { FeatureBlockNodeData } from '~/modules/nodes/types'
import { resolveLinkedBlock, extractPayloadsFromNode } from './exportHelpers'

// import { exportTextBlockById} from './exportHelpers'
import { exportFeatureBlock } from './exportFeatureBlock'
import { validateNodeExport } from '~/utils/validateNodeExport'

export function buildFlowExport(nodes: Node[], edges: Edge[], mode: 'inline' | 'full' = 'full') {
  // ✅ Track visited blocks to avoid re-exporting
  const visited = new Set<string>()

  // ✅ Track carousel blocks that were merged inline
  const mergedCarousels = new Set<string>()

  // ✅ Final export payload to be returned
  const exportPayload: Record<string, any> = {}

  // ✅ All node IDs and valid block names for Messenger-safe checks
  const allNodeIds = new Set(nodes.map(n => n.id))
  const allBlockNames = new Set(
    nodes
      .filter(isFeatureBlockNode)
      .map(n => typeof n.data?.name === 'string' ? n.data.name.trim() : null)
      .filter((name): name is string => Boolean(name))
  )

  // ✅ Patch missing handles and targetBlockIds
  const fixedNodes = patchMissingTargetBlockIds(
    ensureHandlesAreValid(nodes, edges),
    edges
  )

  // ✅ Extract only feature-blocks for main export loop
  const featureBlocks = fixedNodes.filter(isFeatureBlockNode)

  // ✅ Track blocks referenced via paths (used to detect top-level blocks)
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

  // 🚫 Prevent top-level export
  const isPathLinked = (id: string): boolean => referencedBlockIds.has(id)


  // ✅ Track blocks that should be exported as top-level
  const topLevelBlockIds = new Set<string>()


  // ✅ Helper to validate Messenger-safe block IDs
  const isMessengerSafeId = (id: string): boolean =>
    typeof id === 'string' &&
    id.trim() !== '' &&
    (allNodeIds.has(id) || allBlockNames.has(id)) &&
    !id.startsWith('_') &&
    !id.includes('#') &&
    !id.includes('/') &&
    !id.includes('[') &&
    !id.includes(']')

  // ✅ Main export loop: process each feature-block
  for (const block of featureBlocks) {
    const data = block.data as FeatureBlockNodeData
    const name = typeof data.name === 'string' && data.name.trim() !== ''
      ? data.name.trim()
      : block.id

    // ✅ Run export validation
    const validation = validateNodeExport({
      id: block.id,
      name: data.name,
      type: String(block.type), // ✅ force string type
      config: data.config
    })

    if (validation.errors.length > 0) {
      console.warn(`❌ Block "${name}" has export errors:`, validation.errors)
    }

    if (validation.warnings.length > 0) {
      console.warn(`⚠️ Block "${name}" has export warnings:`, validation.warnings)
    }


    const isValidKey = name && !/[.#$/[\]]/.test(name)
    const blockType = typeof data.blockType === 'string' ? data.blockType.trim() : ''
    const isTopLevel = !referencedBlockIds.has(block.id)

    if (isTopLevel) topLevelBlockIds.add(block.id)

    console.log(`🔧 Processing feature-block: "${name}" (${block.id})`)
    console.log(`🧠 blockType: ${blockType}, isTopLevel: ${isTopLevel}`)

    // ✅ Skip non-top-level blocks in inline mode
    if (mode === 'inline' && !isTopLevel) {
      console.log(`🚫 Skipping non-top-level block "${name}" in inline mode`)
      continue
    }

    // ✅ Skip blocks with invalid export keys
    if (!isValidKey) {
      console.warn(`❌ Skipping block "${name}" due to invalid key`)
      continue
    }

    // ✅ Skip carousel blocks that were already merged
    if (blockType === 'carousel' && mergedCarousels.has(block.id)) {
      console.warn(`❌ Skipping merged carousel block: "${name}"`)
      continue
    }

    // ✅ Promote unreferenced blocks to top-level
    if (isFeatureBlockNode(block)) {
      const isReferenced = fixedNodes.some(n =>
        Array.isArray(n.data?.paths) &&
        n.data.paths.some(p => p.targetBlockId === block.id)
      )
      if (!isReferenced) {
        topLevelBlockIds.add(block.id)
      }
    }

    // ✅ Export the block
    const blockExport = exportFeatureBlock(
      block,
      fixedNodes,
      edges,
      visited,
      topLevelBlockIds,
      mergedCarousels,
      exportPayload,
      mode
    )

    if (isReachable(block)) {
      visited.add(block.id)
    }

    // ✅ Mark block as visited if reachable
    if (isReachable(block)) {
      visited.add(block.id)
    }

    // ✅ Skip if export failed
    if (
      !blockExport ||
      typeof blockExport !== 'object' ||
      !blockExport.flow_data ||
      typeof blockExport.flow_data !== 'object'
    ) {
      console.warn(`❌ Skipping block "${name}" — exportFeatureBlock returned invalid structure`)
      continue
    }

    // ✅ Extract and promote linked_blocks
    let combinedLinkedIds: string[] = []

    if (blockExport?.flow_data && typeof blockExport.flow_data === 'object') {
      const existingLinkedIds = Array.isArray(blockExport.flow_data.linked_blocks)
        ? blockExport.flow_data.linked_blocks.filter(isMessengerSafeId)
        : []

      combinedLinkedIds = Array.from(new Set([...existingLinkedIds]))

      // ✅ Promote linked blocks to top-level
      for (const linkedId of combinedLinkedIds) {
        if (isMessengerSafeId(linkedId)) {
          topLevelBlockIds.add(linkedId)
          console.log(`🆙 Promoted "${linkedId}" to top-level block (from linked_blocks)`)
        }
      }

      blockExport.flow_data.linked_blocks = combinedLinkedIds
    }

    const isActive = typeof block.data?.is_active === 'boolean' ? block.data.is_active : false


    // ✅ Save this block to exportPayload
    exportPayload[name] = {
      canvas: blockExport.canvas,
      flow_data: {
        ...blockExport.flow_data,
        metadata: {
          ...(blockExport.flow_data.metadata ?? {}),
          validation_issues: {
            errors: validation.errors,
            warnings: validation.warnings
          }
        }
      }
    }

    console.log(`📤 Exported "${name}" → is_active:`, isActive)

    console.log('🔗 combinedLinkedIds:', combinedLinkedIds)
    console.log('🧾 Final topLevelBlockIds:', Array.from(topLevelBlockIds))
    console.log('🧾 Final export keys:', Object.keys(exportPayload))

    // ✅ Export each linked block
    for (const linkedId of combinedLinkedIds) {
      const linkedNode = fixedNodes.find(n =>
        n.id === linkedId ||
        (typeof n.data?.name === 'string' && n.data.name.trim() === linkedId)
      )

      if (!linkedNode) continue

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
        mode,
        isPathLinked
      )
    }
  }

  console.log(`✅ Final export contains ${Object.keys(exportPayload).length} blocks`)
  console.log(`🧾 Exported block keys:`, Object.keys(exportPayload))

  // ✅ Ensure all path-referenced blocks are exported
  for (const node of fixedNodes) {
    if (!Array.isArray(node.data?.paths)) continue

    for (const path of node.data.paths) {
      const targetId = path?.targetBlockId
      if (!isMessengerSafeId(targetId)) continue
      if (visited.has(targetId)) continue

      const targetNode = fixedNodes.find(n =>
        n.id === targetId ||
        (typeof n.data?.name === 'string' && n.data.name.trim() === targetId)
      )

      if (!targetNode) continue

      console.log(`📦 Exporting path-referenced block: "${targetId}"`)
      resolveLinkedBlock(
        targetNode,
        fixedNodes,
        edges,
        visited,
        exportPayload,
        allNodeIds,
        allBlockNames,
        topLevelBlockIds,
        mergedCarousels,
        mode,
        isPathLinked
      )
    }
  }

  // ✅ Export blocks referenced via paths (not payloads)
  for (const node of fixedNodes) {
    if (!Array.isArray(node.data?.paths)) continue

    for (const path of node.data.paths) {
      const targetId = path?.targetBlockId
      if (!isMessengerSafeId(targetId)) continue
      if (visited.has(targetId)) continue

      const targetNode = fixedNodes.find(n =>
        n.id === targetId ||
        (typeof n.data?.name === 'string' && n.data.name.trim() === targetId)
      )

      if (!targetNode) continue

      console.log(`📦 Exporting path-referenced block: "${targetId}"`)
      resolveLinkedBlock(
        targetNode,
        fixedNodes,
        edges,
        visited,
        exportPayload,
        allNodeIds,
        allBlockNames,
        topLevelBlockIds,
        mergedCarousels,
        mode,
        isPathLinked
      )
    }
  }

  // ✅ Fallback block for unreachable feature-blocks
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
      mode,
      isPathLinked
    )

    topLevelBlockIds.add(fallbackBlockId)
    console.log(`✅ Fallback block "${fallbackBlockId}" exported and promoted to top-level`)
  }

  // ✅ Return final export payload
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

