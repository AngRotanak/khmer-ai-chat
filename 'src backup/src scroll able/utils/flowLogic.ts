import type { Edge, Node } from '@xyflow/react'
import {
  isTextMessageNode,
  isGenericTemplateNode,
  isEndNode,
  isFeatureBlockNode,
} from '~/modules/nodes/utils'
import type { FeatureBlockNodeData , GenericTemplateNodeData } from '~/modules/nodes/types'



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

  // Step 1: Reset all template nodes
  nodes.forEach(node => {
    if (isTextMessageNode(node) || isGenericTemplateNode(node)) {
      (node.data as any).is_active = false
    }
  })

  // Step 2: Validate chain
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

    if (isTextMessageNode(currentNode) && !isEndNode(nextNode)) {
      isValid = false
      reason = '❌ សារត្រូវតែបញ្ចប់ជាមួយ end-node'
      break
    }
  }

  // Step 3: Activate valid chain
  const lastNode = nodes.find(n => n.id === chain.at(-1))
  const endsWithEndNode = lastNode && isEndNode(lastNode)

  if (isValid && endsWithEndNode) {
    chain.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId)
      if (!node) return

      const isLegacyGeneric =
        node.type === 'generic-template' &&
        (!Array.isArray((node.data as any).cards) || (node.data as any).cards.length === 0)

      if (isLegacyGeneric || isTextMessageNode(node)) {
        (node.data as any).is_active = true
        console.log('🟢 Activated:', node.id)
      }
    })
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

type CardPreviewSource = {
  title: string
  subtitle: string
  image_url: string
  layout: string
  options: {
    label: string
    label_kh?: string
    label_en?: string
    payload?: string
    type?: string
    url?: string
  }[]
}


export function getButtonChains(nodes: Node[], edges: Edge[]) {
  console.log('📦 Starting getButtonChains...')
  console.log('🔢 Total nodes received:', nodes.length)
  console.log('🔗 Total edges received:', edges.length)

  const featureBlocks = nodes.filter(isFeatureBlockNode)
  console.log('🧱 Found feature-block nodes:', featureBlocks.length)

  const chains = featureBlocks.flatMap(block => {
    console.log(`\n🔍 Processing feature-block: ${block.id}`)

    const data = block.data as FeatureBlockNodeData
    const paths = Array.isArray(data.paths) ? data.paths : []
    const isCarousel = data.blockType === 'carousel'

    console.log(`   ➤ Total paths: ${paths.length}`)
    console.log(`   ➤ Is carousel: ${isCarousel}`)

    return paths.map((path, index) => {
      const label = path.label ?? `Path ${index + 1}`
      const targetId = path.targetBlockId

      if (!targetId) {
        console.warn(`❌ Path ${path.id} has no targetBlockId`)
        return {
          buttonId: path.id,
          order: index + 1,
          chainType: null,
          targetNodeId: null,
          nodePath: [],
          valid: false,
          error: '❌ មិនមានការភ្ជាប់ទៅ block ផ្សេងទេ',
          label,
          nodeId: block.id,
        }
      }

      const trace = traceChain(targetId, edges, nodes)
      const validation = validateChain(targetId, nodes, edges)

      let cardError = null
      let cardPreview = null

      if (isCarousel) {
        const targetNode = nodes.find(n => n.id === targetId)

        if (!targetNode || targetNode.type !== 'generic-template') {
          cardError = '❌ ត្រូវភ្ជាប់ទៅ generic-template node'
        } else {
          const genericData = targetNode.data as GenericTemplateNodeData
          const cards = Array.isArray(genericData.cards) ? genericData.cards : []

          const card: CardPreviewSource = cards.length > 0
            ? {
                title: cards[0].title,
                subtitle: cards[0].subtitle ?? '',
                image_url: cards[0].image_url,
                layout: typeof cards[0].layout === 'string' ? cards[0].layout : 'hero',
                options: Array.isArray(cards[0].options) ? cards[0].options : [],
              }
            : {
                title: genericData.title ?? '',
                subtitle: genericData.subtitle ?? '',
                image_url: genericData.image_url ?? '',
                layout: typeof genericData.layout === 'string' ? genericData.layout : 'hero',
                options: Array.isArray(genericData.options) ? genericData.options : [],
              }


          if (!card.title || !card.image_url) {
            cardError = '❌ កាតត្រូវមានចំណងជើង និងរូបភាព'
          } else {
            cardPreview = {
              title: card.title,
              subtitle: typeof card.subtitle === 'string' ? card.subtitle : '',
              layout: ['hero', 'carousel', 'fade'].includes(card.layout) ? card.layout : 'hero',
              image_url: card.image_url,
              buttons: Array.isArray(card.options)
                ? card.options
                    .filter(opt => typeof opt === 'object' && opt !== null && typeof opt.label === 'string')
                    .map(opt => {
                      if (!opt.label_kh) {
                        console.warn(`⚠️ Missing label_kh for option "${opt.label}" in card "${card.title}"`)
                      }

                      return {
                        label: opt.label,
                        label_kh: typeof opt.label_kh === 'string' ? opt.label_kh : opt.label,
                        label_en: typeof opt.label_en === 'string' ? opt.label_en : opt.label,
                        type: typeof opt.type === 'string' ? opt.type : 'postback',
                        payload: typeof opt.payload === 'string' ? opt.payload : undefined,
                        url: typeof opt.url === 'string' ? opt.url : undefined,
                      }
                    })
                : [],
            }
          }
        }
      }

      return {
        buttonId: path.id,
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
      }
    })
  })

  console.log('\n✅ Final exported chains:', chains.length)
  console.table(chains)

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
      is_active: false,
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
