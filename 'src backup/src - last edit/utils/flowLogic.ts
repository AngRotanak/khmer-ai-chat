import type { Edge, Node } from '@xyflow/react'
import {
  isTextMessageNode,
  isGenericTemplateNode,
  isFeatureBlockNode,
} from '~/modules/nodes/utils'
import type { FeatureBlockNodeData, GenericTemplateNodeData, ExportedOption } from '~/modules/nodes/types'

import type {
  FeatureBlock,
  EntryTrigger,
  WaitTrigger,
  MatchType
} from '~/modules/blocks/types/feature-block'


export function traceChain(startNodeId: string, edges: Edge[], nodes: Node[]) {
  const path: string[] = [startNodeId]
  let current = startNodeId

  while (true) {
    const nextEdge = edges.find(e => e.source === current)
    if (!nextEdge) break
    path.push(nextEdge.target)
    current = nextEdge.target
  }

  console.log('🔗 traceChain:', { startNodeId, path })
  return {
    path,
    lastNodeId: current,
    chainType: getChainType(path, nodes),
  }
}

function getChainType(path: string[], nodes: Node[]) {
  if (!path.length) return null
  const firstNode = nodes.find(n => n.id === path[0])
  if (!firstNode) return null

  switch (firstNode.type) {
    case 'generic-template': return 'card'
    case 'text-message': return 'text'
    case 'condition-template': return 'condition'
    case 'language-translate': return 'translate'
    case 'end': return 'end'
    case 'smart-welcome': return 'smart'
    case 'quick-menu': return 'menu'
    case 'custom-intro': return 'intro'
    case 'feature-block': return 'feature'
    default: return null
  }
}

export function validateChain(
  startNodeId: string,
  originalNodes: Node[],
  edges: Edge[]
): {
  valid: boolean
  reason: string | null
  chain: string[]
  updatedNodes: Node[]
} {
  const trace = traceChain(startNodeId, edges, originalNodes)
  const chain = trace.path
  console.log('🧪 validateChain:', { startNodeId, chain })

  let isValid = true
  let reason: string | null = null

  const nodes: Node[] = originalNodes.map(n => ({
    ...n,
    data: { ...n.data },
  }))

  // Step 1: Reset is_active only for nodes in this chain
  // const chainNodeIds = new Set(chain)
  // nodes.forEach(node => {
  //   if ((isTextMessageNode(node) || isGenericTemplateNode(node)) && chainNodeIds.has(node.id)) {
  //     (node.data as any).is_active = false
  //   }
  // })

  // Step 2: Validate chain rules
  for (let i = 0; i < chain.length - 1; i++) {
    const currentNode = nodes.find(n => n.id === chain[i])
    const nextNode = nodes.find(n => n.id === chain[i + 1])
    if (!currentNode || !nextNode) continue

    console.log(`🔍 Checking ${currentNode.id} → ${nextNode.id}`)

    if (isTextMessageNode(currentNode) && isTextMessageNode(nextNode)) {
      isValid = false
      reason = '❌ សារមិនអាចភ្ជាប់ទៅសារ'
      break
    }
  }

  console.log('✅ Chain validation result:', { valid: isValid, reason })
  return {
    valid: isValid,
    reason,
    chain,
    updatedNodes: nodes,
  }
}

// export function getButtonChains(nodes: Node[], edges: Edge[]) {
//   const featureBlock = nodes.find(n => n.type === 'feature-block')
//   if (!featureBlock) {
//     console.warn('❌ No feature-block node found')
//     return []
//   }

//   const data = featureBlock.data as FeatureBlockNodeData
//   const paths = Array.isArray(data.paths) ? data.paths : []

//   console.log('🧪 Feature Block:', featureBlock.id)
//   console.log('🔘 Paths:', paths)

//   return paths.map((path, index) => {
//     const targetId = path.targetBlockId
//     const label = path.label ?? `Path ${index + 1}`

//     if (!targetId) {
//       console.warn(`❌ Path ${path.id} has no targetBlockId`)
//       return {
//         buttonId: path.id,
//         order: index + 1,
//         chainType: null,
//         targetNodeId: null,
//         nodePath: [],
//         valid: false,
//         error: '❌ No targetBlockId',
//         label,
//         nodeId: featureBlock.id,
//       }
//     }

//     const trace = traceChain(targetId, edges, nodes)
//     const validation = validateChain(targetId, nodes, edges)

//     return {
//       buttonId: path.id,
//       order: index + 1,
//       chainType: trace.chainType,
//       targetNodeId: trace.lastNodeId,
//       nodePath: trace.path,
//       valid: validation.valid,
//       error: validation.valid ? null : validation.reason,
//       invalidNodeIds: validation.valid ? [] : trace.path,
//       label,
//       nodeId: featureBlock.id,
//     }
//   })
// }

// oringinal


export function getButtonChains(nodes: Node[], edges: Edge[]) {
  console.log('📦 Starting getButtonChains...')
  console.log('🔢 Total nodes received:', nodes.length)
  console.log('🔗 Total edges received:', edges.length)

  const featureBlocks = nodes.filter(n => n.type === 'feature-block')
  console.log('🧱 Found feature-block nodes:', featureBlocks.length)

  const chains = featureBlocks.flatMap(block => {
    console.log(`\n🔍 Processing feature-block: ${block.id}`)

    const data = block.data as FeatureBlock
    const paths = Array.isArray(data.canvas?.paths) ? data.canvas.paths : []
    const isCarousel = data.block_type === 'carousel'

    console.log(`   ➤ Total paths: ${paths.length}`)
    console.log(`   ➤ Is carousel: ${isCarousel}`)

    return paths.map((path, index) => {
      const buttonId = path.template_id
      const label = `Path ${index + 1}`

      const targetId = edges.find(e => e.source === block.id && e.sourceHandle === buttonId)?.target
      console.log(`🔗 Path ${index + 1} → targetId: ${targetId}`)

      const isConnected = !!targetId
      const isImmediate = path.send_immediately === true
      const isValid = isConnected || isImmediate

      if (!isValid) {
        console.warn(`❌ Path ${buttonId} has no targetBlockId and is not immediate`)
        return {
          buttonId,
          order: index + 1,
          chainType: null,
          targetNodeId: null,
          nodePath: [],
          valid: false,
          error: '❌ មិនមានការភ្ជាប់ទៅ block ផ្សេងទេ',
          label,
          nodeId: block.id
        }
      }

      if (!isConnected) {
        return {
          buttonId,
          order: index + 1,
          chainType: null,
          targetNodeId: null,
          nodePath: [],
          valid: true,
          error: null,
          label,
          nodeId: block.id,
          is_active: true
        }
      }

      const trace = traceChain(targetId, edges, nodes)
      const validation = validateChain(targetId, nodes, edges)

      const targetNode = nodes.find(n => n.id === trace.lastNodeId)
      const targetType = targetNode?.type ?? 'unknown'
      const isActive = targetNode?.data?.is_active ?? false

      console.log(`🔍 Path ${index + 1} → targetNode type: ${targetType}`)
      console.log(`📤 Chain to ${trace.lastNodeId} → is_active:`, isActive)

      let cardError: string | null = null
      let cardPreview: any = null

      if (isCarousel) {
        if (!targetNode || targetNode.type !== 'generic-template') {
          cardError = '❌ ត្រូវភ្ជាប់ទៅ generic-template node'
        } else {
          const genericData = targetNode.data as GenericTemplateNodeData
          const cards = Array.isArray(genericData.cards) ? genericData.cards : []

          const card = cards.length > 0
            ? cards[0]
            : {
                title: genericData.title ?? '',
                subtitle: genericData.subtitle ?? '',
                image_url: genericData.image_url ?? '',
                layout: typeof genericData.layout === 'string' ? genericData.layout : 'hero',
                options: Array.isArray(genericData.options) ? genericData.options : []
              }

          if (!card.title || !card.image_url) {
            cardError = '❌ កាតត្រូវមានចំណងជើង និងរូបភាព'
          } else {
            const buttons: ExportedOption[] = (card.options as ExportedOption[])
              .filter(opt =>
                typeof opt === 'object' &&
                opt !== null &&
                (typeof opt.label_en === 'string' || typeof opt.label_kh === 'string')
              )
              .map(opt => {
                const label_en = typeof opt.label_en === 'string' ? opt.label_en : undefined
                const label_kh = typeof opt.label_kh === 'string' ? opt.label_kh : undefined

                if (opt.type === 'text') {
                  return {
                    type: 'text',
                    text: 'text' in opt && typeof opt.text === 'string' ? opt.text : '',
                    label_en,
                    label_kh,
                    payload: ''
                  }
                }

                return {
                  type: opt.type ?? 'postback',
                  payload: typeof opt.payload === 'string' ? opt.payload : '',
                  label_en,
                  label_kh,
                  url: opt.type === 'web_url' && typeof opt.url === 'string' ? opt.url : undefined
                }
              })

            cardPreview = {
              title: card.title ?? '',
              title_km: card.title_km ?? '',
              subtitle: typeof card.subtitle === 'string' ? card.subtitle : '',
              subtitle_km: typeof card.subtitle_km === 'string' ? card.subtitle_km : '',
              layout: ['hero', 'carousel', 'fade'].includes(String(card.layout)) ? card.layout : 'hero',
              image_url: card.image_url,
              options: buttons
            }
          }
        }
      }

      return {
        buttonId,
        order: index + 1,
        chainType: trace.chainType,
        targetNodeId: trace.lastNodeId,
        nodePath: trace.path,
        valid: validation.valid && !cardError,
        error: validation.valid ? cardError : validation.reason,
        invalidNodeIds: validation.valid ? [] : trace.path,
        label,
        nodeId: block.id,
        cardPreview,
        is_active: isActive
      }
    })
  })

  console.log('\n✅ Final exported chains:', chains.length)
  console.table(chains)

  chains.forEach((chain, i) => {
    const targetType = nodes.find(n => n.id === chain.targetNodeId)?.type ?? 'unknown'
    console.log(`🧩 Chain ${i + 1}: buttonId=${chain.buttonId}, label="${chain.label}", targetType=${targetType}, is_active=${chain.is_active}`)
  })

  return chains
}



function isKhmerMissing(node: Node): boolean {
  if (isTextMessageNode(node)) {
    const khText = node.data.message_kh?.trim()
    return !khText
  }

  if (isGenericTemplateNode(node)) {
    const cards = node.data.cards ?? []
    return cards.some(card =>
      card.options?.some(opt => !opt.label_kh?.trim())
    )
  }

  return false
}

export function validateAllChains(nodes: Node[], edges: Edge[]): Node[] {
  let updatedNodes: Node[] = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      is_active: node.data?.is_active ?? false, // ✅ preserve toggle state
    },
  }))

  const chains = getButtonChains(updatedNodes, edges)
  console.log('🔗 All Chains:', chains)

  chains.forEach(chain => {
    if (!chain.targetNodeId) {
      console.warn(`⚠️ Skipping chain with no target: ${chain.buttonId}`)
      return
    }

    const result = validateChain(chain.targetNodeId, updatedNodes, edges)

    updatedNodes = updatedNodes.map(node => {
      const updated = result.updatedNodes.find(n => n.id === node.id)
      const missingKh = isKhmerMissing(node)

      return {
        ...node,
        data: {
          ...node.data,
          is_active: updated?.data?.is_active ?? node.data.is_active,
          kh_missing: missingKh,
        },
      }
    })
  })

  return updatedNodes
}

export type PathExport = {
  nodeId: string
  buttonId: string
  label: string
  order: number
  targetBlockId: string | null
  chainType: string
}


export function extractFeatureBlockPaths(nodes: Node[]): PathExport[] {
  console.log('📦 Extracting paths from feature-block nodes...')
  return nodes
    .filter(n => n.type === 'feature-block')
    .flatMap(node => {
      const paths = Array.isArray(node.data?.paths) ? node.data.paths : []
      console.log(`🔍 Found ${paths.length} paths in node ${node.id}`)
      return paths.map((path, index) => ({
        nodeId: node.id,
        buttonId: path.id,
        label: path.label ?? `Option ${index + 1}`,
        order: index + 1,
        targetBlockId: path.targetBlockId ?? null,
        chainType: path.chainType ?? 'card',
      }))
    })
}

export function sortPathsByOrder(paths: PathExport[]): PathExport[] {
  console.log('🔢 Sorting paths by order...')
  const sorted = [...paths].sort((a, b) => a.order - b.order)
  console.log('✅ Sorted paths:', sorted)
  return sorted
}

export function filterDisconnectedPaths(paths: PathExport[]): PathExport[] {
  console.log('🚫 Filtering disconnected paths...')
  const disconnected = paths.filter(p => !p.targetBlockId)
  console.log(`❌ Found ${disconnected.length} disconnected path(s):`, disconnected)
  return disconnected
}

export type ExportPayload = {
  chains: PathExport[]
  disconnected: PathExport[]
  timestamp: number
}


export function buildExportPayload(nodes: Node[]): ExportPayload {
  console.log('📦 Building export payload...')

  const rawPaths = extractFeatureBlockPaths(nodes)
  const sortedPaths = sortPathsByOrder(rawPaths)
  const disconnected = filterDisconnectedPaths(sortedPaths)

  const payload: ExportPayload = {
    chains: sortedPaths,
    disconnected,
    timestamp: Date.now(),
  }

  console.log('✅ Export payload ready:', payload)
  return payload
}

export function getChainStatus(node: Node): 'valid' | 'disconnected' | 'unknown' {
  if (node.type !== 'feature-block') return 'unknown'

  const paths = Array.isArray(node.data?.paths) ? node.data.paths : []
  if (paths.length === 0) return 'unknown'
  if (paths.some(p => !!p.targetBlockId)) return 'valid' // ✅ at least one connected
  return 'disconnected'
}
