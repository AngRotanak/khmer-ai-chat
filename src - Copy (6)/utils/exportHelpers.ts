import type { Node } from '@xyflow/react'
// import {
//   isTextMessageNode,
//   isFeatureBlockNode,
// } from '~/modules/nodes/utils'
// import type {
//   ExportedOption,
//   ExportedCard,
//   Option,
//   ExportedMetadata
// } from '~/modules/nodes/types'
// import { exportFeatureBlock, } from './exportFeatureBlock'
// import { exportGenericTemplate } from './exportGenericTemplate'
// import { exportCarouselBlock } from './exportCarouselBlock'
// import type { TextMessageNodeData } from '~/modules/nodes/types'
// import type { FeatureBlock } from '~/modules/blocks/types/feature-block'
import { normalizeToTemplateType } from '~/modules/nodes/types'

// ✅ Export a text-message node by ID
// export function exportTextBlockById(id: string, nodes: Node[]): Record<string, any> | null {
//   const node = nodes.find(n => n.id === id && isTextMessageNode(n))
//   if (!node) return null

//   const khText = typeof node.data.message_kh === 'string'
//     ? node.data.message_kh.trim()
//     : typeof node.data.message === 'string'
//       ? node.data.message.trim()
//       : ''

//   const enText = typeof node.data.message_en === 'string'
//     ? node.data.message_en.trim()
//     : typeof node.data.message === 'string'
//       ? node.data.message.trim()
//       : ''

//   return {
//     canvas: { nodes: [node], edges: [] },
//     flow_data: {
//       kh: [{
//         template_type: 'text',
//         is_active: !!khText,
//         text: khText || '⚠️ មិនមានមាតិកាភាសាខ្មែរ',
//       }],
//       en: [{
//         template_type: 'text',
//         is_active: !!enText,
//         text: enText || '⚠️ No English content available',
//       }],
//       metadata: buildMetadata(node, 'text-message', id),
//       linked_blocks: []
//     }
//   }
// }

// export function extractGenericTemplate(
//   node: Node,
//   allNodes: Node[]
// ): { kh: ExportedTemplate; en: ExportedTemplate; linked_blocks: string[] } | null {
//   // console.log(`🧪 extractGenericTemplate: node "${node.id}"`)


//   const config = {
//     layout: typeof node.data?.layout === 'string' ? node.data.layout : 'hero',
//     channel: typeof node.data?.channel === 'string' ? node.data.channel : 'messenger',
//     delay_seconds: typeof node.data?.delay_seconds === 'number' ? node.data.delay_seconds : 0,
//     emoji_style: typeof node.data?.emoji_style === 'string' ? node.data.emoji_style : 'minimal',
//     tone: typeof node.data?.tone === 'string' ? node.data.tone : 'neutral',
//     priority: typeof node.data?.priority === 'string' ? node.data.priority : 'normal',
//     show_typing: typeof node.data?.show_typing === 'boolean' ? node.data.show_typing : false,
//     trigger_condition: typeof node.data?.trigger_condition === 'string' ? node.data.trigger_condition : '',
//     condition: typeof node.data?.condition === 'string' ? node.data.condition : ''
//   }


//   const cards = node.data?.cards
//   if (!Array.isArray(cards) || cards.length === 0) {
//     console.warn(`❌ No valid cards found in node "${node.id}"`)
//     return null
//   }

//   const linkedBlocks = new Set<string>()

//   const khCards: ExportedCard[] = cards.map(card => {
//     const khOptions: ExportedOption[] = Array.isArray(card.options)
//       ? card.options.map((opt: Option): ExportedOption => {
//         const type = ['postback', 'web_url', 'phone_number'].includes(opt.type)
//           ? (opt.type as 'postback' | 'web_url' | 'phone_number')
//           : 'postback'

//         const option: ExportedOption = {
//           type,
//           payload: opt.payload || ''
//         }

//         if (typeof opt.label_kh === 'string') {
//           option.label_kh = opt.label_kh
//         }

//         if (type === 'web_url' && typeof opt.url === 'string') {
//           option.url = opt.url
//         }

//         const payloadId = opt.payload?.trim()
//         const targetNode = allNodes.find(n => n.id === payloadId)

//         if (targetNode?.type === 'text-message') {
//           const message = typeof targetNode.data?.message === 'string' ? targetNode.data.message.trim() : ''
//           if (message) {
//             if (payloadId) linkedBlocks.add(payloadId)
//             return {
//               type: 'text',
//               text: message,
//               label_kh: opt.label_kh || '',
//               label_en: opt.label_en || ''
//             }
//           }
//         }

//         if (payloadId) linkedBlocks.add(payloadId)
//         return option
//       })
//       : []

//     return {
//       title: typeof card.title_km === 'string' ? card.title_km : '',
//       subtitle: typeof card.subtitle_km === 'string' ? card.subtitle_km : '',
//       layout: typeof card.layout === 'string' ? card.layout : 'hero',
//       image_url: typeof card.image_url === 'string' ? card.image_url : '',
//       options: khOptions
//     }
//   })

//   const enCards: ExportedCard[] = cards.map(card => {
//     const enOptions: ExportedOption[] = Array.isArray(card.options)
//       ? card.options.map((opt: Option): ExportedOption => {
//         const type = ['postback', 'web_url', 'phone_number'].includes(opt.type)
//           ? (opt.type as 'postback' | 'web_url' | 'phone_number')
//           : 'postback'

//         const option: ExportedOption = {
//           type,
//           payload: opt.payload || ''
//         }

//         if (typeof opt.label_en === 'string') {
//           option.label_en = opt.label_en
//         }

//         if (type === 'web_url' && typeof opt.url === 'string') {
//           option.url = opt.url
//         }

//         const payloadId = opt.payload?.trim()
//         const targetNode = allNodes.find(n => n.id === payloadId)

//         if (targetNode?.type === 'text-message') {
//           const message = typeof targetNode.data?.message === 'string' ? targetNode.data.message.trim() : ''
//           if (message) {
//             if (payloadId) linkedBlocks.add(payloadId)
//             return {
//               type: 'text',
//               text: message,
//               label_kh: opt.label_kh || '',
//               label_en: opt.label_en || ''
//             }
//           }
//         }

//         if (payloadId) linkedBlocks.add(payloadId)
//         return option
//       })
//       : []

//     return {
//       title: typeof card.title === 'string' ? card.title : '',
//       subtitle: typeof card.subtitle === 'string' ? card.subtitle : '',
//       layout: typeof card.layout === 'string' ? card.layout : 'hero',
//       image_url: typeof card.image_url === 'string' ? card.image_url : '',
//       options: enOptions
//     }
//   })

//   const isActive = typeof node.data?.is_active === 'boolean' ? node.data.is_active : false


//   const khTemplate: ExportedTemplate = {
//     template_type: 'generic',
//     silent: false,
//     is_active: isActive,
//     cards: khCards,
//     metadata: {
//       blockType: 'generic-template',
//       name: node.id,
//       config
//     }
//   }

//   const enTemplate: ExportedTemplate = {
//     template_type: 'generic',
//     silent: false,
//     is_active: isActive,
//     cards: enCards,
//     metadata: {
//       blockType: 'generic-template',
//       name: node.id,
//       config
//     }
//   }


//   const isValid = khCards.length > 0 || enCards.length > 0
//   if (!isValid) {
//     console.warn(`❌ extractGenericTemplate produced empty cards for node "${node.id}"`)
//     return null
//   }

//   // ✅ Include trigger as deep chain root
//   let trigger = typeof node.data?.trigger === 'string' ? node.data.trigger.trim() : ''

//   if (!trigger) {
//     for (const card of cards) {
//       for (const opt of card.options ?? []) {
//         const payload = typeof opt.payload === 'string' ? opt.payload.trim() : ''
//         const isSafe =
//           payload !== '' &&
//           !payload.startsWith('_') &&
//           !payload.includes('#') &&
//           !payload.includes('/') &&
//           !payload.includes('[') &&
//           !payload.includes(']') &&
//           allNodes.some(n => n.id === payload || (typeof n.data?.name === 'string' && n.data.name.trim() === payload))

//         if (isSafe) {
//           trigger = payload
//           console.warn(`⚠️ Missing trigger on "${node.id}" — falling back to payload "${payload}"`)
//           break
//         }
//       }
//       if (trigger) break
//     }
//   }

//   if (trigger) {
//     linkedBlocks.add(trigger)
//     console.log(`🔗 Added trigger "${trigger}" to linked_blocks from generic-template "${node.id}"`)
//   }

//   return {
//     kh: khTemplate,
//     en: enTemplate,
//     linked_blocks: Array.from(linkedBlocks)
//   }
// }


// export function extractCarouselCardsFromPayload(payloadId: string, nodes: Node[]): {
//   khCards: ExportedCard[],
//   enCards: ExportedCard[],
//   linkedBlocks: string[]
// } {
//   const carouselNode = nodes.find(n => n.id === payloadId)
//   if (!carouselNode || carouselNode.type !== 'feature-block') return { khCards: [], enCards: [], linkedBlocks: [] }

//   const blockType = typeof carouselNode.data?.blockType === 'string' ? carouselNode.data.blockType.trim() : ''
//   if (blockType !== 'carousel') return { khCards: [], enCards: [], linkedBlocks: [] }

//   const cardPaths = Array.isArray(carouselNode.data?.paths) ? carouselNode.data.paths : []
//   const khCards: ExportedCard[] = []
//   const enCards: ExportedCard[] = []
//   const linkedBlocks: string[] = []

//   for (const cardPath of cardPaths) {
//     const cardNode = nodes.find(n => n.id === cardPath.targetBlockId)
//     if (!cardNode || cardNode.type !== 'generic-template') continue

//     const template = extractGenericTemplate(cardNode, nodes)
//     if (!template || !Array.isArray(template.kh.cards) || !Array.isArray(template.en.cards)) continue

//     khCards.push(...template.kh.cards)
//     enCards.push(...template.en.cards)
//     linkedBlocks.push(...template.linked_blocks ?? [])
//   }

//   return { khCards, enCards, linkedBlocks }
// }


// ✅ Export payload links from a node
// export function exportPayloadLinksFromNode(
//   node: Node,
//   fixedNodes: Node[],
//   edges: Edge[],
//   visited: Set<string>,
//   exportPayload: Record<string, any>,
//   allNodeIds: Set<string>,
//   allBlockNames: Set<string>,
//   topLevelBlockIds: Set<string>
// ) {
//   const rootOptions = Array.isArray(node.data?.options) ? node.data.options : []
//   for (const opt of rootOptions) {
//     const payload = typeof opt.payload === 'string' ? opt.payload.trim() : ''
//     if (!payload || visited.has(payload)) continue

//     const isValid = allNodeIds.has(payload) || allBlockNames.has(payload)
//     if (!isValid) continue

//     const payloadNode = fixedNodes.find(n =>
//       n.id === payload ||
//       (typeof n.data?.name === 'string' && n.data.name.trim() === payload)
//     )
//     if (!payloadNode) continue

//     const payloadExport = isFeatureBlockNode(payloadNode)
//       ? exportFeatureBlock(payloadNode, fixedNodes, edges, visited, topLevelBlockIds, new Set(), exportPayload, 'full')
//       : payloadNode.type === 'generic_template'
//         ? exportGenericTemplate(payloadNode, fixedNodes, edges, visited)
//         : null

//     if (!payloadExport || typeof payloadExport !== 'object' || !payloadExport.flow_data) continue

//     if (!Array.isArray(payloadExport.flow_data.linked_blocks)) {
//       payloadExport.flow_data.linked_blocks = []
//     }

//     const payloadName = typeof payloadNode.data?.name === 'string'
//       ? payloadNode.data.name.trim()
//       : payloadNode.id

//     exportPayload[payloadName] = {
//       canvas: payloadExport.canvas,
//       flow_data: payloadExport.flow_data
//     }

//     visited.add(payloadName)

//     exportPayloadLinksFromNode(
//       payloadNode,
//       fixedNodes,
//       edges,
//       visited,
//       exportPayload,
//       allNodeIds,
//       allBlockNames,
//       topLevelBlockIds
//     )
//   }
// }

// export function resolveLinkedBlock(
//   node: Node,
//   fixedNodes: Node[],
//   edges: Edge[],
//   visited: Set<string>,
//   exportPayload: Record<string, any>,
//   allNodeIds: Set<string>,
//   allBlockNames: Set<string>,
//   topLevelBlockIds: Set<string>,
//   mergedCarousels: Set<string>,
//   mode: 'inline' | 'full' = 'full',
//   isPathLinked?: (id: string) => boolean
// ): void {
//   const isTopLevel = topLevelBlockIds.has(node.id)

//   if (mode === 'inline' && !isTopLevel) {
//     console.log(`🚫 Skipping non-top-level linked block "${node.id}" in inline mode`)
//     return
//   }

//   const name = typeof node.data?.name === 'string' && node.data.name.trim() !== ''
//     ? node.data.name.trim()
//     : node.id

//   const exportKey = name
//   if (exportPayload.hasOwnProperty(exportKey)) {
//     console.log(`🔁 Already exported: "${exportKey}"`)
//     return
//   }

//   const isLinkedInline = isPathLinked?.(node.id) ?? false

//   if (isLinkedInline) {
//     console.log(`🚫 Skipping export of inline-linked block "${node.id}"`)
//     return
//   }


//   if (node.type === 'text-message') {
//     const isReferenced = fixedNodes.some(n =>
//       Array.isArray(n.data?.paths) &&
//       n.data.paths.some(p => p.targetBlockId === node.id)
//     )

//     if (!isReferenced && !isLinkedInline) {
//       topLevelBlockIds.add(node.id)
//       console.log(`🆙 Promoted "${node.id}" to top-level block (text-message)`)
//     }
//   }

//   visited.add(node.id)
//   const isActive = typeof node.data?.is_active === 'boolean' ? node.data.is_active : false

//   if (node.type === 'text-message') {
//     const data = node.data as TextMessageNodeData
//     const isActive = typeof data.is_active === 'boolean' ? data.is_active : false

//     const message_kh = typeof data.message_kh === 'string' ? data.message_kh.trim() : ''
//     const message_en = typeof data.message_en === 'string' ? data.message_en.trim() : ''

//     if (!message_kh && !message_en) {
//       console.warn(`🚫 Skipping empty text-message block: "${node.id}"`)
//       return
//     }

//     exportPayload[node.id] = {
//       canvas: { nodes: [node], edges: [] },
//       flow_data: {
//         kh: [{ template_type: 'text', is_active: isActive, text: message_kh }],
//         en: [{ template_type: 'text', is_active: isActive, text: message_en }],
//         metadata: {
//           blockType: 'text-message',
//           flow_name: 'text_message_flow',
//           name: node.id,
//           created_by: 'admin001',
//           last_updated: new Date().toISOString(),
//           is_active: isActive,
//           linked_pages: [],
//           config: {
//             channel: data.channel,
//             message_kh,
//             message_en,
//             delay_seconds: data.delay_seconds ?? 0,
//             show_typing: data.show_typing ?? false,
//             tone: data.tone ?? 'neutral',
//             emoji_style: data.emoji_style ?? 'minimal',
//             priority: data.priority ?? 'normal',
//             trigger_condition: data.trigger_condition ?? ''
//           }
//         },
//         linked_blocks: []
//       }
//     }

//     console.log(`📦 Exported deep-linked text-message block: "${node.id}"`)
//     return
//   }


//   let blockExport: FullFlowExport | null = null

//   if (isFeatureBlockNode(node)) {
//     blockExport = exportFeatureBlock(node, fixedNodes, edges, visited, topLevelBlockIds, mergedCarousels, exportPayload, mode)
//   } else if (node.type === 'generic-template') {
//     const template = extractGenericTemplate(node, fixedNodes)
//     if (template) {
//       blockExport = {
//         canvas: { nodes: [node], edges: [] },
//         flow_data: {
//           kh: [template.kh],
//           en: [template.en],
//           linked_blocks: Array.isArray(template.linked_blocks) ? template.linked_blocks : [],
//           metadata: {
//             blockType: 'generic-template',
//             flow_name: 'generic',
//             name,
//             created_by: 'admin001',
//             last_updated: new Date().toISOString(),
//             is_active: isActive,
//             linked_pages: ['708759082319392'],
//             config: typeof node.data?.config === 'object' && node.data.config !== null ? node.data.config : {}
//           }
//         }
//       }
//     }
//   } else if (node.type === 'carousel') {
//     blockExport = exportCarouselBlock(
//       node,
//       fixedNodes,
//       edges,
//       visited,
//       exportPayload,
//       allNodeIds,
//       allBlockNames,
//       topLevelBlockIds,
//       mergedCarousels
//     )
//   }

//   if (!blockExport || typeof blockExport !== 'object' || !blockExport.flow_data) {
//     console.warn(`❌ Failed to export block "${name}"`)
//     return
//   }

//   if (!Array.isArray(blockExport.flow_data.linked_blocks)) {
//     blockExport.flow_data.linked_blocks = []
//   }

//   exportPayload[exportKey] = {
//     canvas: blockExport.canvas ?? { nodes: [], edges: [] },
//     flow_data: blockExport.flow_data
//   }

//   console.log(`📦 Exported linked block: "${name}"`)

//   const allLinked = new Set(blockExport.flow_data.linked_blocks)

//   for (const linkedId of allLinked) {
//     if (!linkedId) continue

//     const linkedNode = fixedNodes.find(n =>
//       n.id === linkedId ||
//       (typeof n.data?.name === 'string' && n.data.name.trim() === linkedId)
//     )

//     if (!linkedNode) continue

//     const isReferenced = fixedNodes.some(n =>
//       Array.isArray(n.data?.paths) &&
//       n.data.paths.some(p => p.targetBlockId === linkedNode.id)
//     )

//     const isLinkedInline = isPathLinked?.(linkedNode.id) ?? false

//     if (!isReferenced && !isLinkedInline && (isFeatureBlockNode(linkedNode) || linkedNode.type === 'text-message')) {
//       topLevelBlockIds.add(linkedNode.id)
//       console.log(`🆙 Promoted "${linkedId}" to top-level block (from linked_blocks)`)
//     }

//     if (visited.has(linkedId)) {
//       console.log(`🔁 Already visited linked block: "${linkedId}"`)
//       continue
//     }

//     resolveLinkedBlock(linkedNode, fixedNodes, edges, visited, exportPayload, allNodeIds, allBlockNames, topLevelBlockIds, mergedCarousels, mode, isPathLinked)
//   }

//   const cardPayloads = extractPayloadsFromNode(node)

//   for (const payloadId of cardPayloads) {
//     if (!payloadId) continue

//     const payloadNode = fixedNodes.find(n =>
//       n.id === payloadId ||
//       (typeof n.data?.name === 'string' && n.data.name.trim() === payloadId)
//     )

//     if (!payloadNode) continue

//     const isReferenced = fixedNodes.some(n =>
//       Array.isArray(n.data?.paths) &&
//       n.data.paths.some(p => p.targetBlockId === payloadNode.id)
//     )

//     const isLinkedInline = isPathLinked?.(payloadNode.id) ?? false

//     if (!isReferenced && !isLinkedInline && (isFeatureBlockNode(payloadNode) || payloadNode.type === 'text-message')) {
//       topLevelBlockIds.add(payloadNode.id)
//       console.log(`🆙 Promoted "${payloadId}" to top-level block (from card payload)`)
//     }

//     if (visited.has(payloadId)) {
//       console.log(`🔁 Already visited card payload: "${payloadId}"`)
//       continue
//     }

//     resolveLinkedBlock(payloadNode, fixedNodes, edges, visited, exportPayload, allNodeIds, allBlockNames, topLevelBlockIds, mergedCarousels, mode, isPathLinked)
//   }
// }


// ✅ Extract payloads from node options and cards

// export function extractPayloadsFromNode(node: Node): string[] {
//   const payloads = new Set<string>()

//   if (!node?.data || typeof node.data !== 'object') return []

//   const rootOptions = Array.isArray(node.data.options) ? node.data.options : []
//   for (const opt of rootOptions) {
//     const payload = typeof opt?.payload === 'string' ? opt.payload.trim() : ''
//     if (payload) payloads.add(payload)
//   }

//   const cards = Array.isArray(node.data.cards) ? node.data.cards : []
//   for (const card of cards) {
//     const options = Array.isArray(card?.options) ? card.options : []
//     for (const opt of options) {
//       const payload = typeof opt?.payload === 'string' ? opt.payload.trim() : ''
//       if (payload) payloads.add(payload)
//     }
//   }

//   return Array.from(payloads)
// }


// export function buildMetadata(
//   node: Node,
//   blockType: string,
//   fallbackName: string
// ): ExportedMetadata {
//   const name = typeof node.data?.name === 'string' && node.data.name.trim()
//     ? node.data.name.trim()
//     : fallbackName || node.id

//   const isActive = typeof node.data?.is_active === 'boolean'
//     ? node.data.is_active
//     : true

//   const linkedPages = Array.isArray(node.data?.linked_pages) &&
//     node.data.linked_pages.every(p => typeof p === 'string')
//     ? node.data.linked_pages
//     : ['708759082319392']

//   const config = typeof node.data?.config === 'object' && node.data.config !== null
//     ? node.data.config
//     : {}

//   return {
//     blockType: String(blockType || 'unknown'),
//     flow_name: String(blockType || 'unknown'),
//     name: String(name),
//     created_by: 'admin001',
//     last_updated: new Date().toISOString(),
//     is_active: isActive,
//     linked_pages: linkedPages,
//     config
//   }
// }



// export function buildMessengerExport(block: any): {
//   templates: Record<string, any>;
//   paths: any[];
// } {
//   const rawPaths = Array.isArray(block.canvas?.paths) ? block.canvas.paths : [];
//   const deliveryPaths: any[] = [];
//   const usedTemplateIds = new Set<string>();
//   const templates: Record<string, any> = {};

//   for (let i = 0; i < rawPaths.length; i++) {
//     const path = rawPaths[i];
//     if (!path || typeof path !== 'object') continue;

//     const tid = typeof path.template_id === 'string' ? path.template_id.trim() : '';
//     if (!tid) continue;

//     usedTemplateIds.add(tid);

//     deliveryPaths.push({
//       template_id: tid,
//       send_immediately: path.send_immediately ?? true,
//       blockType: path.blockType ?? 'text-message',
//       label: path.label ?? `Path ${i + 1}`,
//       trigger: path.trigger ?? 'immediate',
//       detection_mode: path.detection_mode ?? 'keyword',
//       expected_intent: path.expected_intent ?? '',
//       intent_confidence: typeof path.intent_confidence === 'number' ? path.intent_confidence : 0.7,
//       condition: path.condition ?? { match: 'includes', value: '' }
//     });
//   }

//   for (const tid of usedTemplateIds) {
//     const en = block.templates?.[`${tid}_en`] ?? block.templates?.[tid];
//     const kh = block.templates?.[`${tid}_kh`];

//     if (en) templates[`${tid}_en`] = en;
//     if (kh) templates[`${tid}_kh`] = kh;

//     if (!templates[`${tid}_en`]) {
//       templates[`${tid}_en`] = {
//         template_id: `${tid}_en`,
//         template_type: 'text',
//         lang: 'en',
//         is_active: true,
//         text: 'Welcome to KhmerAi.Chat!',
//         tone: 'neutral',
//         emoji_style: 'minimal',
//         delay_seconds: 0,
//         show_typing: true
//       };
//     }

//     if (!templates[`${tid}_kh`]) {
//       templates[`${tid}_kh`] = {
//         template_id: `${tid}_kh`,
//         template_type: 'text',
//         lang: 'kh',
//         is_active: true,
//         text: 'សូមស្វាគមន៍មកកាន់ KhmerAi.Chat!',
//         tone: 'neutral',
//         emoji_style: 'minimal',
//         delay_seconds: 0,
//         show_typing: true
//       };
//     }
//   }

//   return { templates, paths: deliveryPaths };
// }

function normalizePayload(payload: any): string {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'object') {
    return (
      (typeof payload.payload_str === 'string' && payload.payload_str) ||
      (typeof payload.template_type === 'string' && typeof payload.node_id === 'string'
        ? `${payload.template_type}.${payload.node_id}`
        : '') ||
      (typeof payload.node_id === 'string' && payload.node_id) ||
      ''
    );
  }
  return '';
}


export function exportFeatureBlockMessenger(
  block: any,
  nodes: Node[]
): { paths: any[]; usedTemplateRefs: string[] } {
  const rawPaths = Array.isArray(block.canvas?.paths) ? block.canvas.paths : [];
  const deliveryPaths: any[] = [];
  const usedTemplateRefs: string[] = [];

  for (let i = 0; i < rawPaths.length; i++) {
    const path = rawPaths[i];
    if (!path || typeof path !== "object") continue;

    const normalizedPayload = normalizePayload(path.payload);

    let ref: string = "";
    if (normalizedPayload) {
      ref = normalizedPayload;
    } else if (path.template_ref && path.template_ref !== "unknown") {
      const refNode = nodes.find(n => n.id === path.template_ref);
      if (refNode && refNode.type === "feature-block" && path.targetBlockId) {
        console.log("🔄 Overriding feature-block ref with targetBlockId:", path.targetBlockId);
        ref = path.targetBlockId;
      } else {
        ref = path.template_ref;
      }
    } else if (path.template_id && path.template_id !== "unknown") {
      ref = path.template_id;
    } else if (path.targetBlockId) {
      ref = path.targetBlockId;
    }

    if (!ref) {
      console.warn("⚠️ Skipping invalid template_ref:", ref, path);
      continue;
    }

    const targetNode = nodes.find(
      n => n.id === ref || n.data?.block_id === ref || `${n.type}.${n.id}` === ref
    );
    console.log("exportFeatureBlockMessenger → path:", path, "Resolved ref:", ref, "Found node:", targetNode);

    usedTemplateRefs.push(ref);

    deliveryPaths.push({
      id: path.id ?? `path-${i}`,
      template_ref: ref,
      payload: normalizedPayload,
      send_immediately: path.send_immediately ?? true,
      blockType: normalizeToTemplateType(path.blockType),
      label: path.label ?? `Path ${i + 1}`,
      trigger: path.trigger ?? "immediate",
      detection_mode: path.detection_mode ?? "keyword",
      expected_intent: path.expected_intent ?? "",
      intent_confidence: typeof path.intent_confidence === "number" ? path.intent_confidence : 0.7,
      condition: path.condition ?? { match: "includes", value: "" }
    });
  }

  return { paths: deliveryPaths, usedTemplateRefs };
}


export function exportFeatureBlockMessenger_old(
  block: any,
  nodes: Node[]
): {
  paths: any[];
  usedTemplateRefs: string[];
} {
  // 🔹 Extract raw canvas paths
  const rawPaths = Array.isArray(block.canvas?.paths) ? block.canvas.paths : [];

  // 🔹 Initialize export containers
  const deliveryPaths: any[] = [];
  const usedTemplateRefs: string[] = [];

  // 🔍 Build lookup set of all node IDs
  const allNodeIds = new Set(nodes.map(n => n.id));

  // 🔄 Process each path in the canvas
  for (let i = 0; i < rawPaths.length; i++) {
    const path = rawPaths[i];
    if (!path || typeof path !== "object") continue;

    // 🔍 Resolve template_ref from legacy template_id or payload fallback
    const fallbackRef =
      typeof path.payload?.node_id === "string" ? path.payload.node_id : null;

    const ref =
      typeof path.template_id === "string" && path.template_id.trim() !== ""
        ? path.template_id.trim()
        : fallbackRef;

    // ✅ Validate that ref matches a real node or block
    const isValidRef = allNodeIds.has(ref) || nodes.some(n => n.data?.block_id === ref);

    if (!ref || !isValidRef) {
      console.warn(`⚠️ Skipping invalid or unmatched template_ref:`, ref, path);
      continue;
    }

    // 🧹 Remove legacy payload injection — Messenger-safe export uses template_ref only
    // path.payload = { node_id: ref, template_type: ..., lang: ... } ❌ removed

    // 📦 Track used template_ref for shared_templates extraction
    usedTemplateRefs.push(ref);

    const rawType = typeof path.blockType === 'string' ? path.blockType : '';
    const blockType = normalizeToTemplateType(rawType);


    // 📝 Build Messenger-safe delivery path
    deliveryPaths.push({
      template_ref: ref,
      send_immediately: path.send_immediately ?? true,
      blockType,
      label: path.label ?? `Path ${i + 1}`,
      trigger: path.trigger ?? "immediate",
      detection_mode: path.detection_mode ?? "keyword",
      expected_intent: path.expected_intent ?? "",
      intent_confidence: typeof path.intent_confidence === "number" ? path.intent_confidence : 0.7,
      condition: path.condition ?? { match: "includes", value: "" }
    });

  }

  // ✅ Return Messenger-safe paths and used template_refs
  return {
    paths: deliveryPaths,
    usedTemplateRefs
  };
}


// export function extractValidBlocks(nodes: Node[], edges: Edge[]): Node[] {
//   return nodes.filter(n => {
//     const d = n.data;
//     return (
//       typeof d?.block_id === 'string' &&
//       typeof d?.block_type === 'string' &&
//       typeof d?.canvas === 'object'
//     );
//   });
// }

// export function findTemplateById(
//   arr: unknown,
//   targetId: string
// ): Record<string, any> | null {
//   if (!Array.isArray(arr)) return null;

//   for (const item of arr) {
//     if (
//       typeof item === 'object' &&
//       item !== null &&
//       typeof item.template_id === 'string' &&
//       (item.template_id === targetId || item.template_id === targetId.replace(/_(en|kh)$/, ''))
//     ) {
//       return item;
//     }
//   }

//   return null;
// }



// export function buildPayload(nodeId: string, blockType: string): FeatureBlock['canvas']['paths'][number]['payload'] {
//   const trimmed = nodeId.trim()
//   return trimmed === ''
//     ? undefined
//     : {
//       node_id: trimmed,
//       template_type: blockType ?? 'text-message',
//       lang: 'en',
//     }
// }

