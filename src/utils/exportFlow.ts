import type { Node, Edge } from '@xyflow/react'
import { exportFeatureBlockMessenger } from './exportHelpers';
import type { SharedTemplate, } from "~/modules/nodes/types";
import type { SmartWelcomeConfig, QuickMenuConfig, CarouselConfig, CommentTriggerConfig, FormBlockConfig } from '~/modules/blocks/types/feature-block'
import { getButtonChains } from '~/utils/flowLogic'
import { normalizeToTemplateType, normalizeToMessengerBlockType, } from '~/modules/nodes/types'

function formatTemplateRef(node: Node | undefined): string | undefined {
  if (!node) return undefined;

  // Prefer block_type for feature blocks
  let type: string | undefined;
  if (typeof node.data?.block_type === "string" && node.data.block_type.trim() !== "") {
    type = normalizeToTemplateType(node.data.block_type);
  } else if (typeof node.data?.template_type === "string") {
    type = normalizeToTemplateType(node.data.template_type);
  } else if (typeof node.type === "string") {
    type = normalizeToTemplateType(node.type);
  }

  if (!type) return undefined;
  const id = node.data?.block_id ?? node.id;
  return `${type}.${id}`;
}


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
    const isTemplateOnly = ["text-message", "generic-template", "button-template", "quick-replies", "media-template", "voice-template", "chat-with-agent"].includes(raw_type);

    const isReferencedOnly = !edges.some(e => e.source === block.id) &&
      referencedTemplateIds.has(block_id);
    // const isEntryBlock = typeof data.entry_trigger === "string" && data.entry_trigger.trim() !== "";

    // if (isTemplateOnly && isReferencedOnly && !isEntryBlock) {
    //   console.log("🧹 Skipping template-only node:", block_id);
    //   continue;
    // }

    if (isTemplateOnly) {
      console.log("🧹 Skipping template-only node:", block_id);
      continue;
    }


    // 🧵 Normalize canvas and extract Messenger paths
    data.canvas = normalizeCanvasPathsSafely(data.canvas);
    const { paths } = exportFeatureBlockMessenger(data, nodes);

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

    // Normalize canvas once
    const normalizedCanvas = normalizeCanvasPathsSafely(data.canvas ?? {});

    // Ensure paths is always an array
    const safePaths: any[] = Array.isArray(normalizedCanvas.paths)
      ? normalizedCanvas.paths
      : [];

    // After normalization, rewrite template_ref values safely
    normalizedCanvas.paths = safePaths.map(p => {
      if (!p || typeof p.template_ref !== "string") {
        return p; // guard against bad path objects
      }

      let refId = p.template_ref;

      // If template_ref is already in type.id format, split it
      if (refId.includes(".")) {
        const [, id] = refId.split(".");
        refId = id;
      }



      // Try to find the node by id or block_id
      const targetNode = nodes.find(
        n => n.id === refId || n.data?.block_id === refId
      );

      return {
        ...p,
        template_ref: targetNode ? formatTemplateRef(targetNode) : p.template_ref,
      };
    });

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

        // ✅ NEW
        entry_priority: data.entry_priority ?? "normal",

        canvas: normalizedCanvas,
        // ✅ Raw editor snapshot for restore
        raw_canvas: stripUndefined({
          nodes: nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              template_ref: formatTemplateRef(n),
            },
          })),
          edges,
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

        // ✅ NEW
        entry_priority: data.entry_priority ?? "normal",
        canvas: normalizedCanvas,
        // ✅ Raw editor snapshot for restore
        raw_canvas: stripUndefined({
          nodes: nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              template_ref: formatTemplateRef(n),
            },
          })),
          edges,
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
        alwaysShow: true,
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
        entry_condition: data.entry_condition ?? { match: 'includes', value: [] },
        entry_detection_mode: data.entry_detection_mode ?? 'keyword',
        expected_intent: data.expected_intent ?? '',
        intent_confidence: data.intent_confidence ?? '0.85',
        // ✅ NEW
        entry_priority: data.entry_priority ?? "normal",
        canvas: normalizedCanvas,
        // ✅ Raw editor snapshot for restore
        raw_canvas: stripUndefined({
          nodes: nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              template_ref: formatTemplateRef(n),
            },
          })),
          edges,
        }),
        config: cfg
      };

      continue;
    }

    // 📦 Handle Conversation Agent separately
    if (raw_type === "conversation-agent") {
      if (!feature_blocks_by_type[raw_type]) {
        feature_blocks_by_type[raw_type] = {};
      }

      feature_blocks_by_type[raw_type][block_id] = {
        block_id,
        block_name: data.topic ?? block_id,
        block_type: raw_type,
        is_active: typeof data.is_active === "boolean" ? data.is_active : true,
        messenger_delivery_type: "text-message",

        // Intent config
        expected_intent: data.expected_intent ?? "",
        confidence_threshold: data.confidence_threshold ?? 0.7,
        escape_keywords: Array.isArray(data.escape_keywords) ? data.escape_keywords : [],
        context_lock: data.context_lock ?? false,
        lock_on_entry: data.lock_on_entry ?? false,
        release_on_complete: data.release_on_complete ?? false,

        // Bilingual messages
        welcome_message_en: data.welcome_message_en ?? "",
        welcome_message_kh: data.welcome_message_kh ?? "",
        fallback_message_en: data.fallback_message_en ?? "",
        fallback_message_kh: data.fallback_message_kh ?? "",
        end_message_en: data.end_message_en ?? "",          // ✅ NEW
        end_message_kh: data.end_message_kh ?? "",          // ✅ NEW

        // Payload references
        flow_payload: data.flow_payload ?? "",
        fallback_payload: data.fallback_payload ?? "",      // ✅ NEW
        end_conversation_payload: data.end_conversation_payload ?? "", // ✅ NEW

        // Trigger keywords
        trigger_keywords: Array.isArray(data.trigger_keywords)
          ? data.trigger_keywords.map((kw: any) => ({
            keyword: kw.keyword ?? "",
            regex_pattern: kw.regex_pattern ?? "",
            match: kw.match ?? "includes"
          }))
          : [],

        // Sub-intents
        sub_intents: Array.isArray(data.sub_intents)
          ? data.sub_intents.map((si: any) => ({
            expected_intent: si.expected_intent ?? "",
            confidence_threshold: si.confidence_threshold ?? 0.7,
            flow_payload: si.flow_payload ?? "",
            release_on_complete: si.release_on_complete ?? false,
            escape_keywords: Array.isArray(si.escape_keywords) ? si.escape_keywords : [],
            reply_message_en: si.reply_message_en ?? "",
            reply_message_kh: si.reply_message_kh ?? "",
            trigger_keyword_conditions: Array.isArray(si.trigger_keyword_conditions)
              ? si.trigger_keyword_conditions.map((kw: any) => ({
                keyword: kw.keyword ?? "",
                regex_pattern: kw.regex_pattern ?? "",
                match: kw.match ?? "includes"
              }))
              : []
          }))
          : [],

        // ✅ NEW
        entry_priority: data.entry_priority ?? "normal",

        // Canvas snapshot
        canvas: normalizedCanvas,

        // ✅ Raw editor snapshot for restore
        raw_canvas: stripUndefined({
          nodes: nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              template_ref: formatTemplateRef(n),
            },
          })),
          edges,
        }),
      };

      continue;
    }

    // 📦 Handle Form-Block separately
    if (raw_type === "form-block") {
      console.log("📦 Exporting form-block:", block_id, "with config:", data.config);
      const rawConfig = (data.config as Partial<FormBlockConfig>) || {};
      const cfg: FormBlockConfig = {
        fields: Array.isArray(rawConfig.fields) ? rawConfig.fields : [],
        confirmation_message_en: rawConfig.confirmation_message_en ?? "",
        confirmation_message_kh: rawConfig.confirmation_message_kh ?? "",

        finish_message_en: rawConfig.finish_message_en ?? "",
        finish_message_kh: rawConfig.finish_message_kh ?? "",
        flow_payload: rawConfig.flow_payload ?? ""
      };

      if (!feature_blocks_by_type[raw_type]) {
        feature_blocks_by_type[raw_type] = {};
      }

      feature_blocks_by_type[raw_type][block_id] = {
        block_id,
        block_name: data.block_name ?? block_id,
        block_type: raw_type,
        is_active: typeof data.is_active === "boolean" ? data.is_active : true,
        messenger_delivery_type: "text-message",
        canvas: normalizeCanvasPathsSafely(data.canvas ?? {}, raw_type),
        raw_canvas: stripUndefined({ nodes, edges }),
        config: cfg,
      };

      continue; // ✅ skip generic export logic
    }



    // 📦 Initialize block type group
    if (isTemplateOnly && isReferencedOnly) {
      continue; // ✅ Skip block
    }
    console.log("✅ Exporting block:", block_id, "type:", raw_type);

    if (!feature_blocks_by_type[raw_type]) {
      feature_blocks_by_type[raw_type] = {};
    }


    feature_blocks_by_type[raw_type][block_id] = {
      block_id,
      block_name: data.block_name ?? block_id,
      block_type: raw_type,
      is_active: data.is_active ?? true,
      messenger_delivery_type: normalizeToMessengerBlockType(raw_type),

      // 🎯 Trigger type (message, comment, etc.)
      entry_trigger: data.entry_trigger ?? "message",

      entry_condition: data.entry_condition ?? { match: "includes", value: "" },
      entry_detection_mode: data.entry_detection_mode ?? "keyword",
      expected_intent: data.expected_intent ?? "",
      intent_confidence: data.intent_confidence ?? "0.85",

      // ✅ NEW: Priority flag
      entry_priority: data.entry_priority ?? "normal",

      // 📝 Scope for comment triggers
      // If trigger is "comment", use config as CommentTriggerConfig
      scope:
        data.entry_trigger === "comment"
          ? (data.config as CommentTriggerConfig) ?? { scope: "all" }
          : [],

      canvas: normalizedCanvas,

      raw_canvas: stripUndefined({
        nodes: nodes.map(n => ({
          ...n,
          data: {
            ...n.data,
            template_ref: formatTemplateRef(n),
          },
        })),
        edges,
      }),
    }


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
    console.log("🔍 Checking node:", node.id, "type:", node.type, "block_type:", data.block_type);

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

    // ✅ Keep nodes that are connected OR are special block types
    const blockTypeValue = data.block_type ?? node.type;

    const isSpecialBlock = [
      "conversation-agent",
      "quick-menu",
      "smart-welcome",
      "carousel",
      "form-block"
    ].includes(blockTypeValue);

    console.log("🔎 Node", node.id,
      "node.type:", node.type,
      "data.block_type:", data.block_type,
      "blockTypeValue:", blockTypeValue,
      "isSpecialBlock:", isSpecialBlock);

    if (connectedIds.has(node.id)) {
      console.log(`✅ Node ${node.id} kept because it is connected`);
      valid.push(node);
    } else if (isSpecialBlock) {
      console.log(`✅ Node ${node.id} kept because it is a special block (${data.block_type})`);
      valid.push(node);
    } else {
      console.warn(`⚠️ Node ${node.id} dropped (not connected and not special)`);
    }
  }

  console.log("📊 extractValidBlocks → final valid nodes:", valid.map(n => `${n.id}:${n.data?.block_type}`));
  return valid;
}


export function normalizeCanvasPathsSafely(canvas: any, blockType?: string): any {
  // ✅ Special case: form-blocks don’t use Messenger paths
  if (blockType === "form-block") {
    return {
      layout: canvas?.layout ?? "vertical",
      paths: [] // keep empty, don’t rewrite into text-message paths
    };
  }

  if (!canvas || typeof canvas !== "object" || Array.isArray(canvas)) {
    return canvas;
  }

  const paths: any[] = Array.isArray(canvas.paths) ? canvas.paths : [];
  if (paths.length === 0) {
    canvas.paths = [];
    return canvas;
  }

  function normalizePayload(payload: any): string {
    if (!payload) {
      console.log("normalizePayload → input:", payload, "output:", '');
      return '';
    }
    if (typeof payload === 'string') {
      const out = (payload === 'unknown' || payload === 'unknown.unknown') ? '' : payload;
      console.log("normalizePayload → input (string):", payload, "output:", out);
      return out;
    }
    if (typeof payload === 'object') {
      const nodeId = typeof payload.node_id === 'string' ? payload.node_id : '';
      const type = typeof payload.template_type === 'string' ? payload.template_type : '';
      let out = '';
      if (nodeId && nodeId !== 'unknown' && type && type !== 'unknown') {
        out = nodeId.startsWith(type + ".") ? nodeId : `${type}.${nodeId}`;
      } else if (nodeId && nodeId !== 'unknown') {
        out = nodeId;
      }
      console.log("normalizePayload → input (object):", payload, "output:", out);
      return out;
    }
    console.log("normalizePayload → input (other):", payload, "output:", '');
    return '';
  }

  canvas.paths = paths.map((p: any, idx: number) => {
    if (!p || typeof p !== "object" || Array.isArray(p)) return p;

    console.log(`Path[${idx}] BEFORE:`, JSON.stringify(p));

    const normalizedPayload =
      typeof p?.payload === "string" && p.payload.includes(".")
        ? p.payload
        : normalizePayload(p.payload);

    const ref = (p.template_id && p.template_id !== "unknown")
      ? p.template_id.trim()
      : (p.template_ref && p.template_ref !== "unknown")
        ? p.template_ref
        : normalizedPayload;

    if (ref) {
      p.template_ref = ref;
    }

    p.payload = normalizedPayload;
    delete p.template_id;

    console.log(`Path[${idx}] AFTER:`, JSON.stringify(p));
    return p;
  });

  console.log("normalizeCanvasPathsSafely → finished normalization, path count:", canvas.paths.length);
  return canvas;
}



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
  console.log("extractTemplates → starting with blocks:", feature_blocks_by_type);

  const sharedTemplates: Record<string, SharedTemplate> = {};
  const updatedBlocks: Record<string, any> = {};

  function normalizePayload(payload: any): string {
    if (!payload) return '';
    if (typeof payload === 'string') {
      return (payload === 'unknown' || payload === 'unknown.unknown') ? '' : payload;
    }
    if (typeof payload === 'object') {
      const nodeId = typeof payload.node_id === 'string' ? payload.node_id : '';
      const type = typeof payload.template_type === 'string' ? payload.template_type : '';
      if (!nodeId || nodeId === 'unknown' || type === 'unknown') return '';
      return `${type}.${nodeId}`;
    }
    return '';
  }

  function collectPayloadRefs(items: any[], context: string): string[] {
    const refs: string[] = [];
    for (const item of items) {
      const normalized = normalizePayload(item?.payload);
      const ref = item?.template_ref || normalized;
      if (ref && ref !== "unknown") {
        const [, refId] = ref.includes('.') ? ref.split('.', 2) : [null, ref];
        if (refId && !sharedTemplates[refId]) {
          refs.push(ref);
        }
      }
    }
    if (refs.length > 0) {
      console.log(`🧩 Deep-linked payloads queued (${context}):`, refs);
    }
    return refs;
  }

  for (const [blockType, blocks] of Object.entries(feature_blocks_by_type)) {
    if (!blockType || blockType === "unknown") continue;

    updatedBlocks[blockType] = {};

    for (const [blockId, block] of Object.entries(blocks)) {
      if (!block || typeof block !== "object") continue;

      const existingCanvas = (block as any).canvas ?? {};


      // Normalize canvas once
      const normalizedCanvas = normalizeCanvasPathsSafely(existingCanvas);

      // ✅ Ensure paths is always an array
      const normalizedPaths: any[] = Array.isArray(normalizedCanvas?.paths)
        ? normalizedCanvas.paths
        : [];

      // ✅ Rewrite template_ref values to type.id safely
      normalizedCanvas.paths = normalizedPaths.map(p => {
        if (!p || typeof p.template_ref !== "string") return p;

        let refId = p.template_ref;

        // If template_ref is already in type.id format, split it
        if (refId.includes(".")) {
          const [, id] = refId.split(".");
          refId = id;
        }

        // Try to find the node by id or block_id
        const targetNode = nodes.find(
          n => n.id === refId || n.data?.block_id === refId
        );

        return {
          ...p,
          template_ref: targetNode
            ? `${normalizeToTemplateType(
              targetNode.data?.block_type ||
              targetNode.data?.template_type ||
              targetNode.type
            )}.${targetNode.data?.block_id ?? targetNode.id}`
            : p.template_ref,
        };
      });


      (block as any).canvas = {
        ...existingCanvas,
        ...normalizedCanvas,
      };

      updatedBlocks[blockType][blockId] = block;

      const rawCanvas = (block as any).canvas ?? {};
      const { paths } = parseCanvasSafely(rawCanvas);
      let safePaths = Array.isArray(paths) ? [...paths] : [];
      const processed = new Set<string>();

      while (safePaths.length > 0) {
        const currentPath = safePaths.shift();
        let ref = currentPath?.template_ref || normalizePayload(currentPath?.payload);

        if (!ref || processed.has(ref)) continue;
        processed.add(ref);

        // ✅ Split type/id
        const [, refId] = ref.includes('.') ? ref.split('.', 2) : [null, ref];

        const node = nodes.find(
          n => n.id === refId || n.data?.block_id === refId
        );

        // ✅ SharedTemplates always keyed by bare ID
        const key = refId;

        if (!node || typeof node.data !== "object") {
          console.warn("❌ Missing node or data for ref:", ref);
          sharedTemplates[key] = {
            template_id: key,
            template_type: "unknown",
            is_active: false,
            channel: "messenger",   // ✅ default
            config: { delay_seconds: 0, emoji_style: "minimal", tone: "neutral", show_typing: false },
            locales: { en: { lang: "en", text: "" }, kh: { lang: "kh", text: "" } }
          };
          continue;
        }

        const rawType =
          typeof node.data.template_type === "string"
            ? node.data.template_type
            : typeof node.type === "string"
              ? node.type
              : "";

        const template_type = normalizeToTemplateType(rawType);

        if (!["text-message", "generic-template", "button-template", "quick-replies", "media-template", "voice-template", "chat-with-agent"].includes(template_type)) {
          console.log("⏭️ Skipping non-template node in sharedTemplates:", ref, template_type);
          continue;
        }

        const is_active = typeof node.data.is_active === "boolean" ? node.data.is_active : true;
        const channel: 'messenger' | 'comment' = (node.data as any).channel ?? 'messenger';


        let locales: Record<string, any> = {};

        if (template_type === "generic-template") {
          const rawLocales = Object(node.data.locales);
          const enCards = rawLocales?.en?.cards ?? node.data.cards_en ?? node.data.cards ?? [];
          const khCards = rawLocales?.kh?.cards ?? node.data.cards_kh ?? node.data.cards ?? [];

          for (const card of [...enCards, ...khCards]) {
            const options = Array.isArray(card?.options) ? card.options : [];
            const refs = collectPayloadRefs(options, "generic-template");
            for (const r of refs) safePaths.push({ template_ref: r });
          }

          locales = { en: { lang: "en", cards: enCards }, kh: { lang: "kh", cards: khCards } };

        } else if (template_type === "button-template") {
          let { en: message_en, kh: message_kh } = safeIntroText(node.data);
          const options = Array.isArray(node.data.options) ? node.data.options : [];
          const refs = collectPayloadRefs(options, "button-template");
          for (const r of refs) safePaths.push({ template_ref: r });

          locales = { en: { lang: "en", text: message_en, options }, kh: { lang: "kh", text: message_kh, options } };

        } else if (template_type === "quick-replies") {
          let { en: message_en, kh: message_kh } = safeIntroText(node.data);
          const replies = Array.isArray(node.data.replies) ? node.data.replies : [];
          const refs = collectPayloadRefs(replies, "quick-replies");
          for (const r of refs) safePaths.push({ template_ref: r });

          locales = { en: { lang: "en", text: message_en, replies }, kh: { lang: "kh", text: message_kh, replies } };

        } else if (template_type === "media-template") {
          let { en: message_en, kh: message_kh } = safeIntroText(node.data);
          const media_type = node.data.media_type ?? "image";
          const media_url = node.data.media_url ?? "";
          const options = Array.isArray(node.data.options) ? node.data.options : [];

          const refs = collectPayloadRefs(options, "media-template");
          for (const r of refs) safePaths.push({ template_ref: r });

          locales = { en: { lang: "en", text: message_en, media_type, media_url, options }, kh: { lang: "kh", text: message_kh, media_type, media_url, options } };

        } else if (template_type === "voice-template") {
          const media_url = typeof node.data.media_url === "string" ? node.data.media_url : "";
          const delay_seconds = typeof node.data.delay_seconds === "number" ? node.data.delay_seconds : 0;
          const tone = typeof node.data.tone === "string" ? node.data.tone : "neutral";
          const priority = typeof node.data.priority === "string" ? node.data.priority : "normal";
          const show_typing = typeof node.data.show_typing === "boolean" ? node.data.show_typing : true;

          sharedTemplates[key] = {
            template_id: key,
            template_type,
            is_active,
            channel,
            config: { delay_seconds, tone, priority, show_typing },
            locales: {
              en: { lang: "en", media_url },
              kh: { lang: "kh", media_url }
            }
          };

          continue;
        } else if (template_type === "chat-with-agent") {
          const welcome_message_en = node.data.welcome_message_en ?? "";
          const welcome_message_kh = node.data.welcome_message_kh ?? "";
          const waiting_message_en = node.data.waiting_message_en ?? "";
          const waiting_message_kh = node.data.waiting_message_kh ?? "";
          const routing = typeof node.data.routing === "string" ? node.data.routing : "default";
          const priority = typeof node.data.priority === "string" ? node.data.priority : "normal";

          locales = {
            en: { lang: "en", text: welcome_message_en, waiting_text: waiting_message_en },
            kh: { lang: "kh", text: welcome_message_kh, waiting_text: waiting_message_kh }
          };

          sharedTemplates[key] = {
            template_id: key,
            template_type,
            is_active,
            channel,
            config: {
              routing,
              priority,
              delay_seconds: 0,
              tone: "neutral",
              show_typing: false,
            },
            locales,
          };

          continue;
        } else {
          let message_en = node.data.message_en ?? "";
          let message_kh = node.data.message_kh ?? "";
          locales = { en: { lang: "en", text: message_en }, kh: { lang: "kh", text: message_kh } };

        }
        sharedTemplates[key] = {
          template_id: key,
          template_type,
          is_active,
          channel,
          config: {
            delay_seconds: typeof node.data.delay_seconds === "number" ? node.data.delay_seconds : 0,
            emoji_style: typeof node.data.emoji_style === "string" ? node.data.emoji_style : "minimal",
            tone: typeof node.data.tone === "string" ? node.data.tone : "neutral",
            show_typing: typeof node.data.show_typing === "boolean" ? node.data.show_typing : true
          },
          locales
        };



      }
    }
  }

  return { updatedBlocks, shared_templates: sharedTemplates };
}

