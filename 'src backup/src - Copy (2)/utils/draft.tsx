import type { Node, Edge } from '@xyflow/react';
import { buildCanvasForBlock } from './buildCanvasForBlock';
import type {
  FeatureBlock,
  Canvas,
} from '~/modules/blocks/types/feature-block'

function injectTextTemplate(id: string, lang: 'en' | 'kh', text: string, data: any) {
  return {
    template_id: `${id}_${lang}`,
    template_type: 'text',
    lang,
    is_active: data.is_active ?? true,
    text,
    tone: data.tone ?? 'neutral',
    emoji_style: data.emoji_style ?? 'minimal',
    delay_seconds: data.delay_seconds ?? 0,
    show_typing: data.show_typing ?? true
  };
}

function injectFallbackTemplates(id: string, templates: Record<string, any>) {
  if (!templates[`${id}_en`]) {
    templates[`${id}_en`] = injectTextTemplate(id, 'en', 'Welcome to KhmerAi.Chat!', {});
    console.warn(`🟨 Injected fallback EN for "${id}"`);
  }
  if (!templates[`${id}_kh`]) {
    templates[`${id}_kh`] = injectTextTemplate(id, 'kh', 'សូមស្វាគមន៍មកកាន់ KhmerAi.Chat!', {});
    console.warn(`🟨 Injected fallback KH for "${id}"`);
  }
}


function validateMessengerTemplates(templates: Record<string, any>, deliveryPaths: any[]) {
  const missing: string[] = [];
  for (const path of deliveryPaths) {
    const tid = path.template_id;
    if (!templates[`${tid}_en`] || !templates[`${tid}_kh`]) {
      missing.push(tid);
    }
  }
  if (missing.length > 0) {
    console.warn(`🟥 Missing Messenger templates for:`, missing);
  }
}


export function exportFeatureBlock(
  block: Node,
  nodes: Node[],
  edges: Edge[],
  visited: Set<string>,
  mergedCarousels: Set<string>,
  mode: 'inline' | 'full' = 'full'
): {
  templates: Record<string, any>,
  canvas: { nodes: Node[], edges: Edge[], layout: string, paths: any[] }
} | null {
  if (!visited || typeof visited.has !== 'function') {
    throw new Error('❌ visited Set is missing or invalid');
  }

  const blockId = block.id;
  const safeBlock = injectMissingNodesFromPaths(block);
  const canvas = getScopedCanvasFromBlock(safeBlock);

  const templates: Record<string, any> = {};
  const deliveryPaths: any[] = [];

  // ✅ Build map: template_id → content node via edge.sourceHandle
  const templateToContentNode: Record<string, Node> = {};
  for (const edge of canvas.edges) {
    const templateId = edge.sourceHandle;
    const targetId = edge.target;
    if (typeof templateId === 'string' && typeof targetId === 'string') {
      const targetNode = canvas.nodes.find(n => n.id === targetId);
      if (targetNode) {
        templateToContentNode[templateId] = targetNode;
      }
    }
  }

  // ✅ Extract delivery paths from all nodes
  for (const node of canvas.nodes) {
    const d = node.data ?? {};
    const { paths: nestedPaths } = parseCanvasSafely(d.canvas);


    for (let i = 0; i < nestedPaths.length; i++) {
      const path = nestedPaths[i];
      if (!path || typeof path !== 'object') continue;

      const rawTemplateId = typeof path.template_id === 'string' ? path.template_id.trim() : '';
      if (!rawTemplateId) continue;

      deliveryPaths.push({
        template_id: rawTemplateId,
        send_immediately: path.send_immediately ?? true,
        blockType: path.blockType ?? 'text-message',
        label: path.label ?? `Path ${i + 1}`,
        trigger: path.trigger ?? 'immediate',
        detection_mode: path.detection_mode ?? 'keyword',
        expected_intent: path.expected_intent ?? '',
        intent_confidence: typeof path.intent_confidence === 'number' ? path.intent_confidence : 0.7,
        condition: path.condition ?? { match: 'includes', value: '' },
        targetBlockId: path.targetBlockId ?? null
      });

      // ✅ Resolve content node via edge
      const contentNode = templateToContentNode[rawTemplateId];
      const contentData = contentNode?.data ?? {};

      if (!visited.has(contentNode?.id)) {
        if (contentNode?.type === 'text-message') {
          if (typeof contentData.message_en === 'string') {
            templates[`${rawTemplateId}_en`] = injectTextTemplate(rawTemplateId, 'en', contentData.message_en.trim(), contentData);
          }
          if (typeof contentData.message_kh === 'string') {
            templates[`${rawTemplateId}_kh`] = injectTextTemplate(rawTemplateId, 'kh', contentData.message_kh.trim(), contentData);
          }
        }
        visited.add(contentNode?.id);
      }

      // ✅ Inject fallback if still missing
      if (!templates[`${rawTemplateId}_en`] || !templates[`${rawTemplateId}_kh`]) {
        injectFallbackTemplates(rawTemplateId, templates);
      }
    }
  }

  // ✅ Fallback if no templates at all
  if (Object.keys(templates).length === 0) {
    templates[`${blockId}_fallback`] = injectTextTemplate(blockId, 'en', '⚠️ No valid content found for this block.', {});
  }

  if (deliveryPaths.length === 0) {
    console.warn(`⚠️ No delivery paths found for block "${blockId}"`);
  }

  validateMessengerTemplates(templates, deliveryPaths);

  return {
    templates,
    canvas: {
      nodes: canvas.nodes,
      edges: canvas.edges,
      layout: canvas.layout,
      paths: deliveryPaths
    }
  };
}


function getScopedCanvasFromBlock(block: Node): {
  layout: 'horizontal' | 'vertical';
  nodes: Node[];
  edges: Edge[];
  paths: any[];
} {
  const { layout, nodes: rootNodes, edges: rootEdges, paths: rootPaths } = parseCanvasSafely(block?.data?.canvas);

  const allNodes: Node[] = [];
  const allEdges: Edge[] = [...rootEdges];
  const allPaths: any[] = [...rootPaths];

  function traverse(node: Node) {
    if (!node || typeof node !== 'object' || typeof node.id !== 'string') return;

    allNodes.push(node);

    const { nodes, edges, paths } = parseCanvasSafely(node.data?.canvas);

    allEdges.push(...edges);
    allPaths.push(...paths);

    for (const child of nodes) {
      traverse(child);
    }
  }

  for (const node of rootNodes) {
    traverse(node);
  }

  console.log(`🧩 getScopedCanvasFromBlock result for "${block?.id}":`, {
    layout,
    nodeIds: allNodes.map(n => n.id),
    edgeCount: allEdges.length,
    pathCount: allPaths.length
  });

  return {
    layout,
    nodes: allNodes.length > 0 ? allNodes : [block],
    edges: allEdges,
    paths: allPaths
  };
}



function getSafeTemplates(node: unknown): Record<string, any> {
  if (
    node &&
    typeof node === 'object' &&
    !Array.isArray(node) &&
    node.constructor === Object
  ) {
    const data = (node as any).data;

    if (
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      data.constructor === Object &&
      typeof data.templates === 'object' &&
      data.templates !== null &&
      !Array.isArray(data.templates)
    ) {
      return data.templates;
    }

    console.warn(`⚠️ getSafeTemplates: node.data.templates is missing or invalid`, {
      nodeId: (node as any)?.id,
      data
    });
    return {};
  }

  console.warn(`❌ getSafeTemplates: node is not a valid object`, node);
  return {};
}



type SafeCanvas = {
  layout: 'horizontal' | 'vertical';
  nodes: Node[];
  edges: Edge[];
  paths: any[];
};

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

function getScopedCanvasFromBlock_(block: Node): {
  layout: 'horizontal' | 'vertical';
  nodes: Node[];
  edges: Edge[];
  paths: any[];
} {
  const { layout, nodes, edges } = parseCanvasSafely(block?.data?.canvas);

  const paths = Array.isArray(block?.data?.paths)
    ? block.data.paths.filter((p) => typeof p === 'object' && p !== null)
    : [];

  console.log(`🧩 getScopedCanvasFromBlock result for "${block?.id}":`, {
    layout,
    nodeIds: nodes.map((n) => n.id),
    edgeCount: edges.length,
    pathCount: paths.length
  });

  return {
    layout,
    nodes: nodes.length > 0 ? nodes : [block],
    edges,
    paths
  };
}



function createInjectedNode(templateId: string, templates: Record<string, any>, blockType = 'text-message'): Node {
  return {
    id: templateId,
    type: blockType,
    data: {
      block_id: templateId,
      block_type: blockType,
      templates
    },
    position: { x: 0, y: 0 },
    measured: { width: 320, height: 180 },
    selectable: true,
    selected: false,
    draggable: true,
    dragging: false
  };
}



function getTemplate(templates: unknown, key: string): any {
  if (
    templates &&
    typeof templates === 'object' &&
    !Array.isArray(templates) &&
    templates.constructor === Object &&
    Object.prototype.hasOwnProperty.call(templates, key)
  ) {
    const value = (templates as Record<string, any>)[key];
    return typeof value === 'object' && value !== null ? value : null;
  }
  return null;
}

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
function toPlainObject(obj: unknown): Record<string, any> {
  if (
    obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    obj.constructor === Object
  ) {
    return obj as Record<string, any>;
  }

  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (err) {
    console.warn("❌ Failed to convert templates to plain object", err);
    return {};
  }
}

function clonePlainTemplates(raw: unknown): Record<string, any> {
  try {
    const json = JSON.stringify(raw);
    const plain = JSON.parse(json);
    return typeof plain === 'object' && plain !== null ? plain : {};
  } catch (err) {
    console.warn("❌ Failed to clone templates", err);
    return {};
  }
}

function extractSafeTemplates(raw: unknown, templateId: string): Record<string, any> {
  const safe: Record<string, any> = {};
  const key_en = `${templateId}_en`;
  const key_kh = `${templateId}_kh`;

  try {
    const json = JSON.stringify(raw);
    const plain = JSON.parse(json);

    if (
      plain &&
      typeof plain === 'object' &&
      !Array.isArray(plain) &&
      plain.constructor === Object
    ) {
      if (
        plain[key_en] &&
        typeof plain[key_en] === 'object' &&
        !Array.isArray(plain[key_en])
      ) {
        safe[key_en] = plain[key_en];
      }

      if (
        plain[key_kh] &&
        typeof plain[key_kh] === 'object' &&
        !Array.isArray(plain[key_kh])
      ) {
        safe[key_kh] = plain[key_kh];
      }
    }
  } catch (err) {
    console.warn(`❌ Failed to extract templates for "${templateId}"`, err);
  }

  return safe;
}


function clonePlainCanvas(raw: unknown): Record<string, any> {
  try {
    const json = JSON.stringify(raw);
    const plain = JSON.parse(json);
    return typeof plain === 'object' && plain !== null ? plain : {};
  } catch (err) {
    console.warn("❌ Failed to clone canvas", err);
    return {};
  }
}


function injectMissingNodesFromPaths(block: Node): Node {
 

  const rawCanvas = block?.data?.canvas;
const canvas = clonePlainCanvas(rawCanvas);

const paths = Array.isArray(canvas.paths) ? canvas.paths : [];



  const rawTemplates = block?.data?.templates;
  let templates: Record<string, any> = {};

  try {
    const json = JSON.stringify(rawTemplates);
    const plain = JSON.parse(json);
    if (plain && typeof plain === 'object' && !Array.isArray(plain)) {
      templates = plain;
    }
  } catch (err) {
    console.warn("❌ Failed to clone templates", err);
  }

  const existingNodeIds = Array.isArray(canvas?.nodes)
    ? canvas.nodes
        .filter(n => n && typeof n === 'object' && typeof n.id === 'string')
        .map(n => n.id)
    : [];

  const injectedNodes: Node[] = [];

  for (const path of paths) {
    const templateId = path?.template_id;
    if (typeof templateId !== 'string' || existingNodeIds.includes(templateId)) continue;

    const key_en = `${templateId}_en`;
    const key_kh = `${templateId}_kh`;

    let template_en: any = null;
    let template_kh: any = null;

    try {
      const val_en = templates[key_en];
      if (val_en && typeof val_en === 'object' && !Array.isArray(val_en)) {
        template_en = val_en;
      }
    } catch (err) {
      console.warn(`💥 Crash accessing "${key_en}"`, err);
    }

    try {
      const val_kh = templates[key_kh];
      if (val_kh && typeof val_kh === 'object' && !Array.isArray(val_kh)) {
        template_kh = val_kh;
      }
    } catch (err) {
      console.warn(`💥 Crash accessing "${key_kh}"`, err);
    }

    const safeTemplates: Record<string, any> = {};
    if (template_en) safeTemplates[key_en] = template_en;
    if (template_kh) safeTemplates[key_kh] = template_kh;

    if (Object.keys(safeTemplates).length > 0) {
      injectedNodes.push({
        id: templateId,
        type: path.blockType || 'text-message',
        data: {
          block_id: templateId,
          block_type: path.blockType || 'text-message',
          templates: safeTemplates
        },
        position: { x: 0, y: 0 },
        measured: { width: 320, height: 180 },
        selectable: true,
        selected: false,
        draggable: true,
        dragging: false
      });
    }
  }

  const finalNodes = [
    ...(Array.isArray(canvas?.nodes) ? canvas.nodes : []),
    ...injectedNodes
  ];

  return {
    ...block,
    data: {
      ...block.data,
      canvas: {
        ...canvas,
        nodes: finalNodes
      }
    }
  };
}
