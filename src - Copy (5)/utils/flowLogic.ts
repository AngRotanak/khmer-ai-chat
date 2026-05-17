import type { Edge, Node } from '@xyflow/react'
import {
  isTextMessageNode,
  isGenericTemplateNode,
} from '~/modules/nodes/utils'
import type { GenericTemplateNodeData, ExportedOption } from '~/modules/nodes/types'
import type { Canvas } from '~/modules/blocks/types/feature-block'

export function traceChain(startNodeId: string, edges: Edge[], nodes: Node[]) {
  const path: string[] = [startNodeId]
  let current = startNodeId

  while (true) {
    const nextEdge = edges.find(e => e.source === current)
    if (!nextEdge) break
    path.push(nextEdge.target)
    current = nextEdge.target
  }

  return {
    path,
    lastNodeId: current,
    chainType: getChainType(path, nodes),
  }
}

function getChainType(path: string[], nodes: Node[]) {
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

  let isValid = true
  let reason: string | null = null

  const nodes: Node[] = originalNodes.map(n => ({
    ...n,
    data: { ...n.data },
  }))

  for (let i = 0; i < chain.length - 1; i++) {
    const currentNode = nodes.find(n => n.id === chain[i])
    const nextNode = nodes.find(n => n.id === chain[i + 1])
    if (!currentNode || !nextNode) continue

    if (isTextMessageNode(currentNode) && isTextMessageNode(nextNode)) {
      isValid = false
      reason = '❌ សារមិនអាចភ្ជាប់ទៅសារ'
      break
    }
  }

  return {
    valid: isValid,
    reason,
    chain,
    updatedNodes: nodes,
  }
}


export function getButtonChains_old(nodes: Node[], edges: Edge[]) {
  const featureBlocks = nodes.filter(n => n.type === 'feature-block');

  return featureBlocks.flatMap(block => {
    const data = block.data ?? {};
    const canvas = getSafeCanvas(data);
    const paths = Array.isArray(canvas.paths) ? canvas.paths : [];

    const isCarousel = data.block_type === 'carousel';

    return paths.map((path, index) => {
      const buttonId = path.template_ref ?? `path_${index + 1}`;
      const label = `Path ${index + 1}`;

      const targetId = edges.find(e =>
        e.source === block.id && e.sourceHandle === buttonId
      )?.target;

      const isConnected = !!targetId;
      const isImmediate = path.send_immediately === true;
      const isValid = isConnected || isImmediate;

      if (!isValid) {
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
        };
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
        };
      }

      const trace = traceChain(targetId, edges, nodes);
      const validation = validateChain(targetId, nodes, edges);

      const targetNode = nodes.find(n => n.id === trace.lastNodeId);
      const isActive = targetNode?.data?.is_active ?? false;

      let cardError: string | null = null;
      let cardPreview: any = null;


      if (isCarousel) {
        if (!targetNode || targetNode.type !== 'generic-template') {
          cardError = '❌ ត្រូវភ្ជាប់ទៅ generic-template node';
        } else {
          const genericData = targetNode.data as GenericTemplateNodeData;
          const cards = Array.isArray(genericData.cards) ? genericData.cards : [];

          // Normalize: use first card if available, otherwise fallback to legacy fields
          const card = cards.length > 0
            ? cards[0]
            : {
              title_en: genericData.title_en ?? '',
              title_kh: genericData.title_kh ?? '',
              subtitle_en: genericData.subtitle_en ?? '',
              subtitle_kh: genericData.subtitle_kh ?? '',
              image_url: genericData.image_url ?? '',
              layout: typeof genericData.layout === 'string' ? genericData.layout : 'hero',
              options: Array.isArray(genericData.options) ? genericData.options : []
            };

          // Validate required fields
          if (!card.title_en || !card.image_url) {
            cardError = '❌ កាតត្រូវមានចំណងជើង និងរូបភាព';
          } else {
            const buttons: ExportedOption[] = (card.options as ExportedOption[])
              .filter(opt =>
                typeof opt === 'object' &&
                opt !== null &&
                (typeof opt.label_en === 'string' || typeof opt.label_kh === 'string')
              )
              .map(opt => ({
                type: opt.type ?? 'postback',
                payload: typeof opt.payload === 'string' ? opt.payload : '',
                label_en: opt.label_en,
                label_kh: opt.label_kh,
                url: opt.type === 'web_url' ? opt.url : undefined
              }));

            cardPreview = {
              title_en: card.title_en,
              title_kh: card.title_kh,
              subtitle_en: card.subtitle_en,
              subtitle_kh: card.subtitle_kh,
              layout: card.layout,
              image_url: card.image_url,
              options: buttons
            };
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
      };
    });
  });
}

export function getButtonChains(nodes: Node[], edges: Edge[]) {
  const featureBlocks = nodes.filter(n => n.type === 'feature-block');

  return featureBlocks.flatMap(block => {
    const data = block.data ?? {};
    const canvas = getSafeCanvas(data);
    const paths = Array.isArray(canvas.paths) ? canvas.paths : [];

    const isCarousel = data.block_type === 'carousel';

    return paths.map((path, index) => {
      const buttonId = path.template_ref ?? `path_${index + 1}`;
      const label = `Path ${index + 1}`;

      // ✅ Normalize payload safely
      let normalizedPayload = '';
      if (typeof path.payload === 'string') {
        normalizedPayload = path.payload;
      } else if (path.payload && typeof path.payload === 'object') {
        const obj = path.payload as any;
        normalizedPayload =
          (typeof obj.payload_str === 'string' && obj.payload_str) ||
          (typeof obj.template_type === 'string' && typeof obj.node_id === 'string'
            ? `${obj.template_type}.${obj.node_id}`
            : '') ||
          (typeof obj.node_id === 'string' && obj.node_id) ||
          '';
      }

      const targetId = edges.find(e =>
        e.source === block.id && e.sourceHandle === buttonId
      )?.target;

      const isConnected = !!targetId;
      const isImmediate = path.send_immediately === true;
      const isValid = isConnected || isImmediate;

      if (!isValid) {
        return {
          buttonId,
          order: index + 1,
          chainType: null,
          targetNodeId: null,
          nodePath: [],
          valid: false,
          error: '❌ មិនមានការភ្ជាប់ទៅ block ផ្សេងទេ',
          label,
          nodeId: block.id,
          payload: normalizedPayload,
        };
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
          is_active: true,
          payload: normalizedPayload,
        };
      }

      const trace = traceChain(targetId, edges, nodes);
      const validation = validateChain(targetId, nodes, edges);

      const targetNode = nodes.find(n => n.id === trace.lastNodeId);
      const isActive = targetNode?.data?.is_active ?? false;

      let cardError: string | null = null;
      let cardPreview: any = null;

      if (isCarousel) {
        if (!targetNode || targetNode.type !== 'generic-template') {
          cardError = '❌ ត្រូវភ្ជាប់ទៅ generic-template node';
        } else {
          const genericData = targetNode.data as GenericTemplateNodeData;
          const cards = Array.isArray(genericData.cards) ? genericData.cards : [];

          const card = cards.length > 0
            ? cards[0]
            : {
              title_en: genericData.title_en ?? '',
              title_kh: genericData.title_kh ?? '',
              subtitle_en: genericData.subtitle_en ?? '',
              subtitle_kh: genericData.subtitle_kh ?? '',
              image_url: genericData.image_url ?? '',
              layout: typeof genericData.layout === 'string' ? genericData.layout : 'hero',
              options: Array.isArray(genericData.options) ? genericData.options : []
            };

          if (!card.title_en || !card.image_url) {
            cardError = '❌ កាតត្រូវមានចំណងជើង និងរូបភាព';
          } else {
            const buttons: ExportedOption[] = (card.options as ExportedOption[])
              .filter(opt =>
                typeof opt === 'object' &&
                opt !== null &&
                (typeof opt.label_en === 'string' || typeof opt.label_kh === 'string')
              )
              .map(opt => {
                let normalizedOptPayload = '';
                if (typeof opt.payload === 'string') {
                  normalizedOptPayload = opt.payload;
                } else if (opt.payload && typeof opt.payload === 'object') {
                  const obj = opt.payload as any;
                  normalizedOptPayload =
                    (typeof obj.payload_str === 'string' && obj.payload_str) ||
                    (typeof obj.node_id === 'string' && obj.node_id) ||
                    '';
                }

                return {
                  type: opt.type ?? 'postback',
                  payload: normalizedOptPayload,
                  label_en: opt.label_en,
                  label_kh: opt.label_kh,
                  url: opt.type === 'web_url' ? opt.url : undefined,
                };
              });

            cardPreview = {
              title_en: card.title_en,
              title_kh: card.title_kh,
              subtitle_en: card.subtitle_en,
              subtitle_kh: card.subtitle_kh,
              layout: card.layout,
              image_url: card.image_url,
              options: buttons,
            };
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
        is_active: isActive,
        payload: normalizedPayload, // ✅ always normalized
      };
    });
  });
}




function isKhmerMissing(node: Node): boolean {
  if (isTextMessageNode(node)) {
    return !node.data.message_kh?.trim()
  }

  if (isGenericTemplateNode(node)) {
    return (node.data.cards ?? []).some(card =>
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
      is_active: node.data?.is_active ?? false,
    },
  }))

  const chains = getButtonChains(updatedNodes, edges)

  chains.forEach(chain => {
    if (!chain.targetNodeId) return

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
  return nodes
    .filter(n => n.type === 'feature-block')
    .flatMap(node => {
      const paths = Array.isArray(node.data?.paths) ? node.data.paths : []
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
  return [...paths].sort((a, b) => a.order - b.order)
}

export function filterDisconnectedPaths(paths: PathExport[]): PathExport[] {
  return paths.filter(p => !p.targetBlockId)
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


export function getSafeCanvas(data: any): Canvas {
  const layout = data?.canvas?.layout === 'horizontal' ? 'horizontal' : 'vertical'
  const paths = Array.isArray(data?.canvas?.paths) ? data.canvas.paths : []
  return { layout, paths }
}

export function getChainStatus(node: Node): 'valid' | 'disconnected' | 'unknown' {
  if (node.type !== 'feature-block') return 'unknown'

  const paths = Array.isArray(node.data?.paths) ? node.data.paths : []
  if (paths.length === 0) return 'unknown'
  if (paths.some(p => !!p.targetBlockId)) return 'valid' // ✅ at least one connected
  return 'disconnected'
}
