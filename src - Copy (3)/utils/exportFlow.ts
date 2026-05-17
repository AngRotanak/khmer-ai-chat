import type { Node, Edge } from '@xyflow/react'
import { exportFeatureBlockMessenger } from './exportHelpers';
import type { SharedTemplate, } from "~/modules/nodes/types";
import type { SmartWelcomeConfig, CommentTriggerConfig, QuickMenuConfig, CarouselConfig } from '~/modules/blocks/types/feature-block'
import { getButtonChains } from '~/utils/flowLogic'
import { normalizeToTemplateType, normalizeToMessengerBlockType } from '~/modules/nodes/types'
import { sanitizeNodes, sanitizeEdges } from '~/modules/flow-builder/constants/default-nodes-edges'


// 🔧 Build a Messenger-safe export payload from nodes and edges
export function buildFlowExport(
  nodes: Node[],
  edges: Edge[],
  currentUserId: string,
) {

  // 🧱 Initialize export containers
  const feature_blocks_by_type: Record<string, any> = {};
  const validBlocks = extractValidBlocks(nodes, edges);
  const allNodeIds = new Set(nodes.map(n => n.id));
  const buttonChains = getButtonChains(nodes, edges);

  // 🧩 Precompute all template_ref targets
  const referencedTemplateIds = new Set<string>();
  for (const block of validBlocks) {
    const { paths } = exportFeatureBlockMessenger(block.data ?? {}, nodes);
    for (const p of paths) {
      if (typeof p.template_ref === "string") {
        referencedTemplateIds.add(p.template_ref);
      }
    }
  }

  // 🔁 Loop through each valid block
  for (const block of validBlocks) {
    const data = block.data ?? {};
    const block_id = typeof data.block_id === "string" ? data.block_id : block.id;

    // 🏷️ Resolve block type safely
    let raw_type: string = "unknown";

    if (typeof data.block_type === "string" && data.block_type.trim() !== "") {
      raw_type = data.block_type.trim();
    } else if (typeof block.type === "string" && block.type.trim() !== "") {
      raw_type = block.type.trim();
    }

    if (raw_type === "unknown") {
      console.warn("🟥 Missing block_type:", block_id, data);
    }


    // 🚫 Skip template-only nodes unless they are used as entry blocks
    const isTemplateOnly = ["text-message", "generic-template", "button-template", "quick-replies", "media-template", "voice-template"].includes(raw_type);
    const isReferencedOnly = !edges.some(e => e.source === block.id) &&
      referencedTemplateIds.has(block_id);
    const isEntryBlock = typeof data.entry_trigger === "string" && data.entry_trigger.trim() !== "";

    if (isTemplateOnly && isReferencedOnly && !isEntryBlock) {
      console.log("🧹 Skipping template-only node:", block_id);
      continue;
    }

    // 🧵 Normalize canvas and extract Messenger paths
    data.canvas = normalizeCanvasPathsSafely(data.canvas);
    const { paths } = exportFeatureBlockMessenger(data, nodes);
    const { layout } = parseCanvasSafely(data.canvas ?? {});

    const brokenPaths = paths.filter(p => {
      const ref = p.template_ref;
      return !ref || (!allNodeIds.has(ref) && !nodes.some(n => n.data?.block_id === ref));
    });
    if (brokenPaths.length > 0) {
      console.warn("🚨 Broken canvas paths:", brokenPaths.map(p => p.template_ref ?? "unknown"));
    }

    // 🔗 Order paths using button chains
    const chainsForBlock = buttonChains.filter(c => c.nodeId === block.id);
    let orderedPaths = chainsForBlock.length > 0
      ? chainsForBlock.sort((a, b) => a.order - b.order).map(chain => {
        const path = paths.find(p => p.template_ref === chain.buttonId);
        return path ? { ...path, order: chain.order } : null;
      }).filter(Boolean)
      : paths;

    // 🧠 Detect Messenger delivery type from first template
    const firstTemplateType = (() => {
      for (const path of orderedPaths) {
        const ref = path?.template_ref;
        if (typeof ref !== 'string') continue;
        const node = nodes.find(n => n.id === ref || n.data?.block_id === ref);
        const type = typeof node?.data?.template_type === 'string'
          ? node.data.template_type
          : typeof node?.type === 'string'
            ? normalizeToTemplateType(node.type)
            : undefined;
        if (type) return type;
      }
      return undefined;
    })();

    const messenger_delivery_type = orderedPaths.length === 0
      ? 'text-message'
      : normalizeToMessengerBlockType(firstTemplateType);


    // Collect nodes/edges
    const blockNodes: Node[] = [];
    const blockEdges: Edge[] = [];

    const featureNode = nodes.find(n => n.id === block_id);
    if (featureNode) blockNodes.push(featureNode);

    // Include any referenced template nodes from paths
    for (const p of orderedPaths) {
      if (p?.template_ref) {
        const targetNode = nodes.find(
          n => n.id === p.template_ref || n.data?.block_id === p.template_ref,
        );
        if (targetNode) {
          blockNodes.push(targetNode);
          blockEdges.push({
            id: `${block_id}-${p.template_ref}`,
            source: block_id,
            target: p.template_ref,
          });
        }
      }
    }



    function walkTemplatePayloads(sourceNode: Node, nodes: Node[], blockNodes: Node[], edgeList: Edge[]) {
      const tData: any = sourceNode.data ?? {};

      // Generic-template: cards[].options[].payload
      if (Array.isArray(tData.cards)) {
        for (const card of tData.cards) {
          if (Array.isArray(card.options)) {
            for (const opt of card.options) {
              addPayloadEdge(sourceNode, opt.payload, nodes, blockNodes, edgeList);
            }
          }
        }
      }

      // Button-template: buttons[].payload
      if (Array.isArray(tData.buttons)) {
        for (const btn of tData.buttons) {
          addPayloadEdge(sourceNode, btn.payload, nodes, blockNodes, edgeList);
        }
      }

      // Quick-replies: replies[].payload
      if (Array.isArray(tData.replies)) {
        for (const reply of tData.replies) {
          addPayloadEdge(sourceNode, reply.payload, nodes, blockNodes, edgeList);
        }
      }

      // Media-template: options[].payload
      if (Array.isArray(tData.options)) {
        for (const opt of tData.options) {
          addPayloadEdge(sourceNode, opt.payload, nodes, blockNodes, edgeList);
        }
      }
    }

    function addPayloadEdge(sourceNode: Node, payload: string | undefined, nodes: Node[], blockNodes: Node[], edgeList: Edge[]) {
      if (!payload) return;
      const targetNode = nodes.find(n => n.id === payload || n.data?.block_id === payload);
      if (!targetNode) return;

      if (!blockNodes.some(n => n.id === targetNode.id)) {
        blockNodes.push(targetNode);
      }

      edgeList.push({
        id: `${sourceNode.id}-${payload}`,
        source: sourceNode.id,
        target: targetNode.id,
        sourceHandle: sourceNode.id, // tie to source node
        type: "deletable"
      });
    }


    for (const tNode of blockNodes.filter(n => {
      const nodeType =
        typeof n.data?.template_type === 'string'
          ? normalizeToTemplateType(n.data.template_type)
          : typeof n.type === 'string'
            ? normalizeToTemplateType(n.type)
            : undefined;
      return (
        nodeType &&
        ['generic-template', 'button-template', 'quick-replies', 'media-template'].includes(nodeType)
      );
    })) {
      walkTemplatePayloads(tNode, nodes, blockNodes, blockEdges);
    }

    // ✅ NEW: Walk card options to include payload targets
    if (Array.isArray(data.cards)) {
      for (const card of data.cards) {
        if (Array.isArray(card.options)) {
          for (const opt of card.options) {
            if (opt.payload && typeof opt.payload === 'string') {
              const targetNode = nodes.find(
                n => n.id === opt.payload || n.data?.block_id === opt.payload
              );
              if (targetNode) {
                blockNodes.push(targetNode);
                blockEdges.push({
                  id: `${block_id}-${opt.payload}`,
                  source: block_id,
                  target: opt.payload,
                });
              }
            }
          }
        }
      }
    }


    // Build edge list tied to path IDs
    const edgeList: Edge[] = orderedPaths
      .map((p) => {
        if (!p?.template_ref || !p?.id) return null;

        const targetNode = nodes.find(
          n => n.id === p.template_ref || n.data?.block_id === p.template_ref
        );
        if (!targetNode) return null;

        if (!blockNodes.some(n => n.id === targetNode.id)) {
          blockNodes.push(targetNode);
        }

        return {
          id: `${block_id}-${p.id}`,   // use actual path.id
          source: block_id,
          target: targetNode.id,
          pathId: p.id,
          sourceHandle: p.id,          // tie edge to path handle
          type: "deletable"
        };
      })
      .filter(Boolean) as Edge[];


    // 📦 Handle Carousel separately
    if (raw_type === "carousel") {
      // enforce generic-template only
      const invalidRefs = orderedPaths.filter(p => {
        const ref = p?.template_ref;
        if (!ref) return false;
        const node = nodes.find(n => n.id === ref || n.data?.block_id === ref);
        const type = node?.data?.template_type || node?.type;
        return normalizeToTemplateType(type) !== "generic-template";
      });
      if (invalidRefs.length > 0) {
        console.warn("❌ Carousel block has invalid refs:", invalidRefs.map(p => p.template_ref));
        orderedPaths = orderedPaths.filter(p => {
          const ref = p?.template_ref;
          const node = nodes.find(n => n.id === ref || n.data?.block_id === ref);
          const type = node?.data?.template_type || node?.type;
          return normalizeToTemplateType(type) === "generic-template";
        });
      }

      console.log("✅ Exporting carousel block:", block_id);
      if (!feature_blocks_by_type[raw_type]) {
        feature_blocks_by_type[raw_type] = {};
      }

      // ✅ Merge defaults with existing config
      const rawConfig = (data.config as Partial<CarouselConfig>) || {};
      const cfg: CarouselConfig = {
        tag: rawConfig.tag ?? "default",
        layout: "carousel", // Messenger-safe enforced
        autoplay: rawConfig.autoplay ?? false,
        interval: rawConfig.interval ?? 5000,
        showIndicators: rawConfig.showIndicators ?? true,
      };

      feature_blocks_by_type[raw_type][block_id] = {
        block_id,
        block_name: data.block_name ?? block_id,
        block_type: raw_type,
        is_active: typeof data.is_active === "boolean" ? data.is_active : true,
        messenger_delivery_type: "carousel",
        entry_trigger: data.entry_trigger ?? "message",
        entry_condition: data.entry_condition ?? { match: "includes", value: "" },
        entry_detection_mode: data.entry_detection_mode ?? "keyword",
        expected_intent: data.expected_intent ?? "",
        intent_confidence: data.intent_confidence ?? "0.85",
        canvas: {
          layout,
          nodes: sanitizeNodes(blockNodes),
          edges: sanitizeEdges(edgeList),
          paths: orderedPaths.map(p => ({
            template_ref: p.template_ref,
            send_immediately: p.send_immediately ?? true,
            trigger: p.trigger,
            condition: p.condition,
          })),
        },
        // ✅ Raw editor snapshot for restore
        raw_canvas: stripUndefined({
          nodes,
          edges, // React Flow edges directly
        }),
        config: cfg, // ✅ include CarouselConfig
      };

      continue; // skip generic export logic
    }


    // 📦 Handle Smart-Welcome separately
    if (raw_type === "smart-welcome") {
      let cfg: SmartWelcomeConfig = {
        inactivityHours: 24,
        defaultLang: 'en',
        personalizeName: false,
        campaignTag: 'default'
      };

      if (data.config) {
        const c = data.config as Partial<SmartWelcomeConfig>;
        cfg = {
          inactivityHours: c.inactivityHours ?? 24,
          defaultLang: c.defaultLang ?? 'en',
          personalizeName: c.personalizeName ?? false,
          campaignTag: c.campaignTag ?? 'default'
        };
      }

      if (!feature_blocks_by_type[raw_type]) {
        feature_blocks_by_type[raw_type] = {};
      }

      feature_blocks_by_type[raw_type][block_id] = {
        block_id,
        block_name: data.block_name ?? block_id,
        block_type: raw_type,
        is_active: typeof data.is_active === "boolean" ? data.is_active : true,
        messenger_delivery_type: "text-message",
        entry_trigger: "auto",
        entry_condition: { match: "always", value: "" },
        entry_detection_mode: "auto",
        canvas: {
          layout,
          nodes: sanitizeNodes(blockNodes), // ✅ use collected nodes
          edges: sanitizeEdges(edgeList), // ✅ use edgeList here
          paths: orderedPaths.map(p => ({
            template_ref: p.template_ref,
            send_immediately: p.send_immediately ?? true,
            trigger: p.trigger,
            condition: p.condition
          }))
        },
        // ✅ Raw editor snapshot for restore (same as saveCanvasSnapshot)
        raw_canvas: stripUndefined({
          nodes,
          edges   // use the actual React Flow edges array directly
        }),
        config: cfg,
        // debug
      };
      continue; // skip generic export logic
    }

    // 📦 Handle Quick-Menu separately
    if (raw_type === "quick-menu") {
      let cfg: QuickMenuConfig = {
        defaultLang: 'kh',
        inactivityHours: 24,
        alwaysShow: true,   // start checked in UI
        menu_tag: 'default'
      };

      if (data.config) {
        const c = data.config as Partial<QuickMenuConfig>;
        cfg = {
          defaultLang: c.defaultLang ?? 'kh',
          inactivityHours: c.inactivityHours ?? 24,
          alwaysShow: c.alwaysShow ?? true,
          menu_tag: c.menu_tag ?? 'default'
        };
      }

      if (!feature_blocks_by_type[raw_type]) {
        feature_blocks_by_type[raw_type] = {};
      }

      feature_blocks_by_type[raw_type][block_id] = {
        block_id,
        block_name: data.block_name ?? block_id,
        block_type: raw_type,
        is_active: typeof data.is_active === "boolean" ? data.is_active : true,
        messenger_delivery_type,
        entry_trigger: data.entry_trigger ?? 'message',
        entry_condition: data.entry_condition ?? { match: 'includes', value: '' },
        entry_detection_mode: data.entry_detection_mode ?? 'keyword',
        expected_intent: data.expected_intent ?? '',
        intent_confidence: data.intent_confidence ?? '0.85',
        canvas: {
          layout,
          nodes: sanitizeNodes(blockNodes), // ✅ use collected nodes
          edges: sanitizeEdges(edgeList), // ✅ use edgeList here
          paths: orderedPaths.map(p => ({
            template_ref: p.template_ref,
            send_immediately: p.send_immediately ?? true,
            trigger: p.trigger,
            condition: p.condition
          }))
        },
        // ✅ Raw editor snapshot for restore (same as saveCanvasSnapshot)
        raw_canvas: stripUndefined({
          nodes,
          edges   // use the actual React Flow edges array directly
        }),
        config: cfg,   // ✅ include QuickMenuConfig
        // debug
      };

      continue; // skip generic export logic
    }


    // 📦 Initialize block type group
    if (isTemplateOnly && isReferencedOnly) {
      continue; // ✅ Skip block
    }
    console.log("✅ Exporting block:", block_id, "type:", raw_type);



    // ✅ Final block export
    if (!feature_blocks_by_type[raw_type]) {
      feature_blocks_by_type[raw_type] = {};
    }
    // Final block export
    if (!feature_blocks_by_type[raw_type]) {
      feature_blocks_by_type[raw_type] = {};
    }


    feature_blocks_by_type[raw_type][block_id] = {
      block_id,
      block_name: data.block_name ?? block_id,
      block_type: raw_type,
      is_active: data.is_active ?? true,
      messenger_delivery_type: normalizeToMessengerBlockType(raw_type),
      entry_trigger: data.entry_trigger ?? "message",
      entry_condition: data.entry_condition ?? { match: "includes", value: "" },
      entry_detection_mode: data.entry_detection_mode ?? "keyword",
      expected_intent: data.expected_intent ?? "",
      intent_confidence: data.intent_confidence ?? "0.85",

      // ✅ Messenger-safe export
      canvas: {
        layout,
        nodes: sanitizeNodes(blockNodes),
        edges: sanitizeEdges(edgeList),   // only edgeList, no blockEdges
        paths: orderedPaths.map((p, idx) => ({
          id: p.id ?? `path-${idx}`,
          template_ref: p.template_ref,   // keep actual target reference
          send_immediately: p.send_immediately ?? true,
          trigger: p.trigger,
          condition: p.condition,
          expected_intent: p.expected_intent,
          intent_confidence: p.intent_confidence
        }))
      },

      // ✅ Raw editor snapshot for restore (same as saveCanvasSnapshot)
      raw_canvas: stripUndefined({
        nodes,
        edges   // use the actual React Flow edges array directly
      }),

      config: data.entry_trigger === "comment"
        ? {
          scope: (data.config as CommentTriggerConfig)?.scope ?? "all",
          post_id: (data.config as CommentTriggerConfig)?.post_id ?? undefined
        }
        : undefined,
    };


  }

  // 🧩 Extract shared templates from template_ref nodes
  const { updatedBlocks, shared_templates } = extractTemplates(feature_blocks_by_type, nodes);
  console.log("✅ Final block types:", Object.keys(feature_blocks_by_type));

  // 🚀 Final export payload
  return stripUndefined({
    feature_blocks_by_type: updatedBlocks,
    shared_templates,
    is_draft: true,
    last_saved_at: new Date().toISOString(),
    saved_by: currentUserId
  });
}

function stripUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined);
  } else if (obj && typeof obj === "object") {
    const clean: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = stripUndefined(value);
      }
    }
    return clean;
  }
  return obj;
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


export function validateTemplates(blockId: string, templates: Record<string, any>) {
  for (const [templateId, template] of Object.entries(templates)) {
    if (!template || typeof template !== 'object') {
      console.warn(`❌ Template "${templateId}" in block "${blockId}" is malformed`, template)
      continue
    }
    if (!template.lang || !['kh', 'en'].includes(template.lang)) {
      console.warn(`❌ Template "${templateId}" in block "${blockId}" missing valid lang`, template)
    }
    if (!template.template_type) {
      console.warn(`❌ Template "${templateId}" in block "${blockId}" missing template_type`, template)
    }
    if ((template.template_type === 'generic' || template.template_type === 'carousel') &&
      !Array.isArray(template.cards)) {
      console.warn(`❌ Template "${templateId}" in block "${blockId}" missing cards array`, template)
    }

  }
}



export function extractValidBlocks(nodes: Node[], edges: Edge[]): Node[] {
  const valid: Node[] = [];

  // Build a set of node IDs that appear in edges
  const connectedIds = new Set<string>();
  for (const edge of edges) {
    if (edge?.source) connectedIds.add(edge.source);
    if (edge?.target) connectedIds.add(edge.target);
  }

  for (const node of nodes) {
    const data = node.data ?? {};

    if (!data.block_type || typeof data.block_type !== 'string') {
      console.warn(`🟥 Missing block_type: ${node.id}`);
      continue;
    }

    if (!data.canvas || typeof data.canvas !== 'object') {
      console.warn(`⚠️ canvas is not a valid object: ${node.id}`);
      data.canvas = { layout: 'vertical', paths: [] }; // fallback
    }

    if (node.type === 'text-message' && (!data.message_en || !data.message_kh)) {
      console.warn(`🟥 text-message block missing message_en or message_kh: ${node.id}`);
    }

    // ✅ Only keep nodes that are connected by at least one edge
    if (connectedIds.has(node.id)) {
      valid.push(node);
    } else {
      console.warn(`⚠️ Node ${node.id} is not connected by any edge`);
    }
  }

  return valid;
}


export function normalizeCanvasPathsSafely(canvas: any): any {
  // If canvas is missing or not an object, just return it unchanged
  if (!canvas || typeof canvas !== "object" || Array.isArray(canvas)) {
    return canvas;
  }

  // Ensure paths is always an array
  const paths: any[] = Array.isArray(canvas.paths) ? canvas.paths : [];

  // If paths is empty, just assign and return
  if (paths.length === 0) {
    canvas.paths = [];
    return canvas;
  }

  canvas.paths = paths.map((p: any) => {
    if (!p || typeof p !== "object" || Array.isArray(p)) return p;

    // Normalize template reference
    const ref =
      typeof p.template_id === "string" && p.template_id.trim() !== ""
        ? p.template_id.trim()
        : p.payload &&
          typeof p.payload === "object" &&
          typeof p.payload.node_id === "string"
          ? p.payload.node_id
          : null;

    if (ref) {
      p.template_ref = ref;
    }
    delete p.template_id;

    // Ensure payload is always an object
    if (!p.payload || typeof p.payload !== "object") {
      p.payload = {
        node_id: ref ?? "unknown",
        template_type: "unknown",
        lang: "en",
      };
    }

    return p;
  });

  return canvas;
}


// export function stripUndefined(obj: any): any {
//   const seen = new WeakSet();

//   function clean(value: any): any {
//     if (seen.has(value)) return value;
//     if (Array.isArray(value)) {
//       return value
//         .map(clean)
//         .filter(v => v !== undefined);
//     }
//     if (value && typeof value === 'object' && value.constructor === Object) {
//       seen.add(value);
//       const result: any = {};
//       for (const [key, val] of Object.entries(value)) {
//         const cleaned = clean(val);
//         if (cleaned !== undefined) result[key] = cleaned;
//       }
//       return result;
//     }
//     return value;
//   }

//   return clean(obj);
// }


// 🧩 Extract shared_templates from template_ref nodes in canvas paths
function safeIntroText(data: any): { en: string; kh: string } {
  let en = '', kh = '';
  const intro = data?.intro_text;
  if (
    intro &&
    typeof intro === 'object' &&
    !Array.isArray(intro) &&
    'en' in intro &&
    'kh' in intro
  ) {
    en = typeof intro.en === 'string' ? intro.en : '';
    kh = typeof intro.kh === 'string' ? intro.kh : '';
  }
  return { en, kh };
}


export function extractTemplates(
  feature_blocks_by_type: Record<string, any>,
  nodes: Node[]
) {
  const sharedTemplates: Record<string, SharedTemplate> = {};
  const updatedBlocks: Record<string, any> = {};

  function collectPayloadRefs(items: any[], context: string): string[] {
    const refs: string[] = [];
    for (const item of items) {
      const payloadRef = item?.payload;
      if (typeof payloadRef === "string" && !sharedTemplates[payloadRef]) {
        refs.push(payloadRef);
      }
    }
    if (refs.length > 0) {
      console.log(`🧩 Deep-linked payloads queued (${context}):`, refs);
    }
    return refs;
  }

  for (const [blockType, blocks] of Object.entries(feature_blocks_by_type)) {
    // 🚫 Skip template node types from feature_blocks_by_type
    if (["text-message", "generic-template", "button-template", "quick-replies", "media-template", "voice-template"].includes(blockType)) {
      continue;
    }

    updatedBlocks[blockType] = {};

    for (const [blockId, block] of Object.entries(blocks)) {
      updatedBlocks[blockType][blockId] = block;

      const rawCanvas =
        block && typeof block === "object" && !Array.isArray(block) && "canvas" in block
          ? block.canvas ?? {}
          : {};

      const { paths } = parseCanvasSafely(rawCanvas);
      let safePaths = Array.isArray(paths) ? [...paths] : [];
      const processed = new Set<string>();

      while (safePaths.length > 0) {
        const currentPath = safePaths.shift();
        const ref = currentPath?.template_ref;

        if (typeof ref !== "string" || processed.has(ref)) continue;
        processed.add(ref);

        const node = nodes.find(n => n.id === ref || n.data?.block_id === ref);
        if (!node || typeof node.data !== "object" || node.data === null) {
          console.warn("❌ Missing node or data for ref:", ref);
          continue;
        }

        const nodeBlockType: string =
          typeof node.data?.block_type === "string"
            ? node.data.block_type
            : typeof node.type === "string"
              ? node.type
              : "";


        // 🚫 Skip feature-blocks (carousel, info, etc.)
        if (["carousel", "info", "feature-block"].includes(nodeBlockType)) {
          console.log("⏭️ Skipping feature-block in sharedTemplates:", ref, nodeBlockType);
          continue;
        }

        const rawType =
          typeof node.data.template_type === "string"
            ? node.data.template_type
            : typeof node.type === "string"
              ? node.type
              : "";

        const template_type = normalizeToTemplateType(rawType);
        console.log("🧪 Normalized template_type:", { ref, rawType, template_type });

        // 🚫 Skip anything not a valid template type
        if (!["text-message", "generic-template", "button-template", "quick-replies", "media-template", "voice-template"].includes(template_type)) {
          console.log("⏭️ Skipping non-template node in sharedTemplates:", ref, template_type);
          continue;
        }

        const is_active = typeof node.data.is_active === "boolean" ? node.data.is_active : true;
        let locales: Record<string, any> = {};

        // ---------------- handle each template type ----------------
        if (template_type === "generic-template") {
          const rawLocales = Object(node.data.locales);
          const enCards = Array.isArray(rawLocales?.en?.cards)
            ? rawLocales.en.cards
            : Array.isArray(node.data.cards_en)
              ? node.data.cards_en
              : Array.isArray(node.data.cards)
                ? node.data.cards
                : [];
          const khCards = Array.isArray(rawLocales?.kh?.cards)
            ? rawLocales.kh.cards
            : Array.isArray(node.data.cards_kh)
              ? node.data.cards_kh
              : Array.isArray(node.data.cards)
                ? node.data.cards
                : [];

          for (const card of [...enCards, ...khCards]) {
            const options = Array.isArray(card?.options) ? card.options : [];
            const refs = collectPayloadRefs(options, "generic-template");
            for (const r of refs) safePaths.push({ template_ref: r });
          }

          locales = {
            en: { lang: "en", cards: enCards },
            kh: { lang: "kh", cards: khCards }
          };

        } else if (template_type === "button-template") {
          let { en: message_en, kh: message_kh } = safeIntroText(node.data);
          const options = Array.isArray(node.data.options) ? node.data.options : [];
          const refs = collectPayloadRefs(options, "button-template");
          for (const r of refs) safePaths.push({ template_ref: r });

          locales = {
            en: { lang: "en", text: message_en, options },
            kh: { lang: "kh", text: message_kh, options }
          };

        } else if (template_type === "quick-replies") {
          let { en: message_en, kh: message_kh } = safeIntroText(node.data);
          const replies = Array.isArray(node.data.replies) ? node.data.replies : [];
          const refs = collectPayloadRefs(replies, "quick-replies");
          for (const r of refs) safePaths.push({ template_ref: r });

          locales = {
            en: { lang: "en", text: message_en, replies },
            kh: { lang: "kh", text: message_kh, replies }
          };


        } else if (template_type === "media-template") {
          // Use the same helper
          let { en: message_en, kh: message_kh } = safeIntroText(node.data);

          const media_type = typeof node.data.media_type === "string" ? node.data.media_type : "image";
          const media_url = typeof node.data.media_url === "string" ? node.data.media_url : "";
          const options = Array.isArray(node.data.options) ? node.data.options : [];

          const refs = collectPayloadRefs(options, "media-template");
          for (const r of refs) safePaths.push({ template_ref: r });

          locales = {
            en: { lang: "en", text: message_en, media_type, media_url, options },
            kh: { lang: "kh", text: message_kh, media_type, media_url, options }
          };
        }

        else if (template_type === "voice-template") {
          const media_url =
            typeof node.data.media_url === "string" ? node.data.media_url : "";
          const delay_seconds =
            typeof node.data.delay_seconds === "number" ? node.data.delay_seconds : 0;
          const tone =
            typeof node.data.tone === "string" ? node.data.tone : "neutral";
          const priority =
            typeof node.data.priority === "string" ? node.data.priority : "normal";
          const show_typing =
            typeof node.data.show_typing === "boolean" ? node.data.show_typing : true;

          const locales = {
            en: { lang: "en", media_url },
            kh: { lang: "kh", media_url }
          };

          sharedTemplates[ref] = {
            template_id: ref,
            template_type,
            is_active,
            config: {
              delay_seconds,
              tone,
              priority,
              show_typing
            },
            locales
          };

          console.log("✅ Added voice-template sharedTemplate:", sharedTemplates[ref]);
          continue; // important: skip the generic assignment



        } else {
          let message_en = typeof node.data.message_en === "string" ? node.data.message_en : "";
          let message_kh = typeof node.data.message_kh === "string" ? node.data.message_kh : "";
          locales = {
            en: { lang: "en", text: message_en },
            kh: { lang: "kh", text: message_kh }
          };
        }

        sharedTemplates[ref] = {
          template_id: ref,
          template_type,
          is_active,
          config: {
            delay_seconds: typeof node.data.delay_seconds === "number" ? node.data.delay_seconds : 0,
            emoji_style: typeof node.data.emoji_style === "string" ? node.data.emoji_style : "minimal",
            tone: typeof node.data.tone === "string" ? node.data.tone : "neutral",
            show_typing: typeof node.data.show_typing === "boolean" ? node.data.show_typing : true
          },
          locales
        };

        console.log("✅ Added sharedTemplate:", sharedTemplates[ref]);
      }
    }
  }

  return { updatedBlocks, shared_templates: sharedTemplates };
}


