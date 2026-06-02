import type { Node, Edge } from '@xyflow/react';


type SafeCanvas = {
  layout: 'horizontal' | 'vertical';
  nodes: Node[];
  edges: Edge[];
  paths: any[];
};


function safeGetTemplate(templates: unknown, key: string): any {
  if (
    templates &&
    typeof templates === 'object' &&
    !Array.isArray(templates) &&
    templates.constructor === Object
  ) {
    const desc = Object.getOwnPropertyDescriptor(templates, key);
    if (desc && typeof desc.value === 'object' && desc.value !== null) {
      return desc.value;
    }
  }
  return null;
}

function parseCanvasSafely(canvas: unknown): SafeCanvas {
  const fallbackLayout: 'horizontal' | 'vertical' = 'vertical';
  const fallbackNodes: Node[] = [];
  const fallbackEdges: Edge[] = [];
  const fallbackPaths: any[] = [];

  if (
    canvas &&
    typeof canvas === 'object' &&
    !Array.isArray(canvas) &&
    canvas.constructor === Object
  ) {
    const layout =
      typeof (canvas as any).layout === 'string' &&
        ((canvas as any).layout === 'horizontal' || (canvas as any).layout === 'vertical')
        ? (canvas as any).layout
        : fallbackLayout;

    const nodes = Array.isArray((canvas as any).nodes)
      ? (canvas as any).nodes.filter(
        (n: any) => typeof n === 'object' && n !== null && typeof n.id === 'string'
      )
      : fallbackNodes;

    const edges = Array.isArray((canvas as any).edges)
      ? (canvas as any).edges.filter(
        (e: any) => typeof e === 'object' && e !== null
      )
      : fallbackEdges;

    const paths = Array.isArray((canvas as any).paths)
      ? (canvas as any).paths.filter(
        (p: any) => typeof p === 'object' && p !== null
      )
      : fallbackPaths;

    return { layout, nodes, edges, paths };
  }

  console.warn(`⚠️ canvas is not a valid object:`, canvas);
  return {
    layout: fallbackLayout,
    nodes: fallbackNodes,
    edges: fallbackEdges,
    paths: fallbackPaths
  };
}



export function exportFeatureBlock(
  block: Node,
  nodes: Node[],
  edges: Edge[],
  visited: Set<string>,
): {
  templates: Record<string, any>,
  canvas: { nodes: Node[], edges: Edge[], layout: string, paths: any[] }
} | null {
  if (!visited || typeof visited.has !== 'function') {
    throw new Error('❌ visited Set is missing or invalid');
  }

  const blockId = block.id;
  const data = block.data ?? {};
  const blockTemplates = typeof data.templates === 'object' && data.templates !== null ? data.templates : {};

  const canvas = buildCanvasForBlock(blockId, nodes, edges);
  const deliveryPaths: any[] = [];
  const usedTemplateIds = new Set<string>();
  const templates: Record<string, any> = {};

  const validateCards = (cards: any[]) => {
    if (!Array.isArray(cards)) return [];
    return cards.filter(card => {
      if (!card || typeof card !== 'object') return false;
      if (!('title' in card) && !('title_km' in card)) return false;
      if (!Array.isArray(card.options)) return false;
      for (const opt of card.options) {
        if (!opt || typeof opt !== 'object') return false;
        if (!('label' in opt) && !('label_kh' in opt)) return false;
      }
      return true;
    });
  };

  for (const node of canvas.nodes ?? []) {
    const d = node.data ?? {};
    const topPaths = Array.isArray(d.paths) ? d.paths : [];
    const { paths: nestedPaths } = parseCanvasSafely(d.canvas);
    const allPaths = [...topPaths, ...nestedPaths];

    for (let i = 0; i < allPaths.length; i++) {
      const path = allPaths[i];
      if (!path || typeof path !== 'object') continue;

      const rawTemplateId = typeof path.template_id === 'string' ? path.template_id.trim() : '';
      if (!rawTemplateId) continue;

      usedTemplateIds.add(rawTemplateId);

      deliveryPaths.push({
        template_id: rawTemplateId,
        send_immediately: path.send_immediately ?? true,
        blockType: path.blockType ?? 'text-message',
        label: path.label ?? `Path ${i + 1}`,
        trigger: path.trigger ?? 'immediate',
        detection_mode: path.detection_mode ?? 'keyword',
        expected_intent: path.expected_intent ?? '',
        intent_confidence: typeof path.intent_confidence === 'number' ? path.intent_confidence : 0.7,
        condition: path.condition ?? { match: 'includes', value: '' }
      });
    }
  }

  for (const tid of usedTemplateIds) {
    const targetNode =
      canvas.nodes.find(n => {
        const d = n.data ?? {};
        return tid === n.id || tid === d.template_id || tid === d.block_id;
      }) ?? findNodeByTemplateId(tid, canvas.nodes, canvas.edges);


    if (targetNode && !visited.has(targetNode.id)) {
      const d = targetNode.data ?? {};
      const type = targetNode.type;
      const messageKh = typeof d.message_kh === 'string' ? d.message_kh.trim() : '';
      const messageEn = typeof d.message_en === 'string' ? d.message_en.trim() : '';

      if (type === 'text-message') {
        if (messageKh) {
          templates[`${tid}_kh`] = {
            template_id: `${tid}_kh`,
            template_type: 'text',
            lang: 'kh',
            is_active: d.is_active ?? true,
            text: messageKh,
            tone: d.tone ?? 'neutral',
            emoji_style: d.emoji_style ?? 'minimal',
            delay_seconds: d.delay_seconds ?? 0,
            show_typing: d.show_typing ?? true
          };
        }

        if (messageEn) {
          templates[`${tid}_en`] = {
            template_id: `${tid}_en`,
            template_type: 'text',
            lang: 'en',
            is_active: d.is_active ?? true,
            text: messageEn,
            tone: d.tone ?? 'neutral',
            emoji_style: d.emoji_style ?? 'minimal',
            delay_seconds: d.delay_seconds ?? 0,
            show_typing: d.show_typing ?? true
          };
        }
      }

      if (type === 'generic-template' || type === 'carousel') {
        const cards = Array.isArray(d.cards) ? d.cards : [];
        const validCards = validateCards(cards);
        if (validCards.length > 0) {
          const lang = typeof d.lang === 'string' && ['kh', 'en'].includes(d.lang) ? d.lang : 'en';
          templates[tid] = {
            template_id: tid,
            template_type: type === 'carousel' ? 'carousel' : 'generic',
            lang,
            is_active: d.is_active ?? true,
            cards: validCards
          };
        }
      }

      visited.add(targetNode.id);
    }

    const en = safeGetTemplate(blockTemplates, `${tid}_en`);
    const kh = safeGetTemplate(blockTemplates, `${tid}_kh`);
    if (en) templates[`${tid}_en`] = en;
    if (kh) templates[`${tid}_kh`] = kh;

    if (!templates[`${tid}_en`]) {
      templates[`${tid}_en`] = {
        template_id: `${tid}_en`,
        lang: 'en',
        template_type: 'text',
        text: 'Welcome to KhmerAi.Chat!',
        is_active: true,
        show_typing: true,
        tone: 'neutral',
        delay_seconds: 0,
        emoji_style: 'minimal'
      };
      console.warn(`🟨 Injected fallback EN for "${tid}"`);
    }

    if (!templates[`${tid}_kh`]) {
      templates[`${tid}_kh`] = {
        template_id: `${tid}_kh`,
        lang: 'kh',
        template_type: 'text',
        text: 'សូមស្វាគមន៍មកកាន់ KhmerAi.Chat!',
        is_active: true,
        show_typing: true,
        tone: 'neutral',
        delay_seconds: 0,
        emoji_style: 'minimal'
      };
      console.warn(`🟨 Injected fallback KH for "${tid}"`);
    }
  }

  // ✅ Final fallback if no templates at all
  if (Object.keys(templates).length === 0) {
    templates[`${blockId}_fallback`] = {
      template_id: `${blockId}_fallback`,
      template_type: 'text',
      lang: 'en',
      is_active: true,
      text: '⚠️ No valid content found for this block.',
      tone: 'neutral',
      emoji_style: 'minimal',
      delay_seconds: 0,
      show_typing: true
    };
  }

  if (deliveryPaths.length === 0) {
    console.warn(`⚠️ No delivery paths found for block "${blockId}"`);
  }

  const rawCanvas = typeof block.data?.canvas === 'object' ? block.data.canvas : {};
  const { layout } = parseCanvasSafely(rawCanvas);

  console.log(`📦 Total delivery paths: ${deliveryPaths.length}`);
  console.log(`📤 Final Messenger templates for "${blockId}":`, templates);

  return {
    templates,
    canvas: {
      nodes: canvas.nodes,
      edges: canvas.edges,
      layout,
      paths: deliveryPaths
    }
  };
}

export function buildCanvasForBlock(
  blockId: string,
  allNodes: Node[],
  allEdges: Edge[]
): {
  nodes: Node[];
  edges: Edge[];
  layout: 'horizontal' | 'vertical';
} {
  const scopedNodes: Node[] = [];
  const scopedEdges: Edge[] = [];
  const visited = new Set<string>();

  const rootBlock = allNodes.find(n => n.id === blockId);
  if (!rootBlock || typeof rootBlock !== 'object') {
    console.warn(`⚠️ Block "${blockId}" not found`);
    return { nodes: [], edges: [], layout: 'vertical' };
  }

  const { layout } = parseCanvasSafely(rootBlock.data?.canvas);

  function traverse(node: Node) {
    if (!node || typeof node !== 'object' || visited.has(node.id)) return;
    visited.add(node.id);
    scopedNodes.push(node);

    const nodeEdges = allEdges.filter(e => e.source === node.id || e.target === node.id);
    for (const edge of nodeEdges) {
      scopedEdges.push(edge);

      const targetNode = allNodes.find(n => n.id === edge.target);
      if (targetNode) {
        traverse(targetNode);
      }
    }

    const { nodes: nestedNodes } = parseCanvasSafely(node.data?.canvas);
    for (const stub of nestedNodes) {
      const nestedId = stub?.id;
      if (typeof nestedId !== 'string') continue;

      const fullNode = allNodes.find(n => n.id === nestedId);
      if (fullNode) {
        traverse(fullNode);
      } else {
        console.warn(`⚠️ Nested canvas node "${nestedId}" not found in allNodes`);
      }
    }

  }

  traverse(rootBlock);

  return {
    nodes: scopedNodes,
    edges: scopedEdges,
    layout
  };
}


function findNodeByTemplateId(templateId: string, nodes: Node[], edges: Edge[]): Node | null {
  const edge = edges.find(e => e.sourceHandle === templateId);
  if (!edge) return null;
  return nodes.find(n => n.id === edge.target) ?? null;
}
