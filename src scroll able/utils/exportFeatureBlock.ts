import type { Node, Edge } from '@xyflow/react'
import { exportCarouselBlock } from './exportCarouselBlock'

import type { FeatureBlockNodeData } from '~/modules/nodes/types'
import type { ExportedBlock, FullFlowExport } from '~/modules/nodes/types'

import  { isFeatureBlockNode } from '~/modules/nodes/utils'
import type { Option } from '~/modules/nodes/types'
import { extractGenericTemplate } from '~/utils/exportHelpers'


export function exportFeatureBlock(
  block: Node,
  nodes: Node[],
  edges: Edge[]
): FullFlowExport | null {
  const data = { ...block.data } as FeatureBlockNodeData
  const name = typeof data.name === 'string' ? data.name.trim() : block.id
  const blockType =
  typeof data.blockType === 'string' && data.blockType.trim()
    ? data.blockType.trim()
    : block.type === 'feature-block'
      ? 'info' // fallback default
      : ''


  if (!Array.isArray(data.kh)) data.kh = []
  if (!Array.isArray(data.en)) data.en = []

  const patchedBlock = { ...block, data }

  let mainExport: ExportedBlock | null = null

  if (blockType === 'carousel') {
    mainExport = exportCarouselBlock(block, nodes, edges)
  } else {
  
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
      return null
    }
  }

  if (!mainExport) {
    console.warn(`❌ No feature-block selected for export: ${blockType} (${name})`)
    return null
  }


  const kh: FullFlowExport['flow_data']['kh'] = []
  const en: FullFlowExport['flow_data']['en'] = []
  const linkedBlockIds = new Set<string>()

  const allNodeIds = new Set(nodes.map(n => n.id))
  const allBlockNames = new Set(
    nodes
      .filter(isFeatureBlockNode)
      .map(n => (n.data as FeatureBlockNodeData)?.name?.trim())
      .filter(Boolean)
  )

  const connectedIds = Array.isArray(data.paths)
    ? data.paths
        .map(p => typeof p.targetBlockId === 'string' ? p.targetBlockId.trim() : '')
        .filter(id => id !== '')
    : []

  for (const rawId of connectedIds) {
    const id = typeof rawId === 'string' ? rawId.trim() : ''
    if (!id) continue

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
      const cards = Array.isArray(node.data?.cards) ? node.data.cards : []

      const hasPayload = cards.some(card =>
        Array.isArray(card.options) &&
        card.options.some((opt: Option) => {
          const payload = typeof opt.payload === 'string' ? opt.payload.trim() : ''
          if (payload && (allNodeIds.has(payload) || allBlockNames.has(payload))) {
            linkedBlockIds.add(payload)
            return true
          }
          return false
        })
      )

      const template = extractGenericTemplate(node, nodes)


      if (template) {
        kh.push(template.kh)
        en.push(template.en)
      }

      continue
    }

    if (isFeatureBlockNode(node)) {
      linkedBlockIds.add(id)
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
      metadata: mainExport.metadata,
      linked_blocks: Array.from(linkedBlockIds)
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

  const kh = Array.isArray(block.data?.kh) && block.data.kh.length > 0
    ? block.data.kh
    : [{ template_type: 'text', is_active: false, text: '⚠️ មិនមានមាតិកាភាសាខ្មែរ' }]

  const en = Array.isArray(block.data?.en) && block.data.en.length > 0
    ? block.data.en
    : [{ template_type: 'text', is_active: false, text: '⚠️ No English content available' }]

  return {
    kh,
    en,
    metadata: {
      blockType,
      flow_name: flowName, // ✅ fixed here
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
