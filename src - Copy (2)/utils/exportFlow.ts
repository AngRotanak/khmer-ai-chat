import type { Node, Edge } from '@xyflow/react'
import { ref, set } from 'firebase/database'
import { db } from '~/lib/firebase'
import { isFeatureBlockNode } from '~/modules/nodes/utils'
import { exportFeatureBlock } from './exportFeatureBlock'
import { validateNodeExport } from '~/utils/validateNodeExport'
// import { extractTemplates } from "~/utils/extractTemplates";
import { exportFeatureBlockMessenger } from './exportHelpers';
import type { SharedTemplate, } from "~/modules/nodes/types";
import type { MessengerBlockType } from '~/modules/blocks/types/feature-block'
import { getButtonChains } from '~/utils/flowLogic'


function normalizeToMessengerBlockType(templateType?: string): MessengerBlockType {
  switch (templateType) {
    case 'text':
      return 'text-message';
    case 'generic-template':
      return 'generic-template';
    case 'carousel':
      return 'carousel';
    case 'button-template':
      return 'button-template';
    case 'media-template':
      return 'media-template';
    case 'quick-replies':
      return 'quick-replies';
    default:
      return 'text-message'; // fallback
  }
}

function normalizeToTemplateType(type: string): string {
  switch (type.trim()) {
    case "text":
    case "text-message":
      return "text-message";
    case "generic":
    case "generic-template":
      return "generic-template";
    default:
      return "text-message"; // fallback
  }
}


// 🔧 Build a Messenger-safe export payload from nodes and edges
export function buildFlowExportDraft(nodes: Node[], edges: Edge[], currentUserId: string) {
  // 🧱 Initialize export containers
  const feature_blocks_by_type: Record<string, any> = {};
  const validBlocks = extractValidBlocks(nodes, edges);
  const allNodeIds = new Set(nodes.map(n => n.id));
  const buttonChains = getButtonChains(nodes, edges);

  // 🔁 Loop through each valid block
  for (const block of validBlocks) {
    const data = block.data ?? {};
    const block_id = typeof data.block_id === "string" ? data.block_id : block.id;

    // 🏷️ Resolve block type
    const raw_type = typeof data.block_type === "string" && data.block_type.trim() !== ""
      ? data.block_type.trim()
      : typeof block.type === "string" && block.type.trim() !== ""
        ? block.type.trim()
        : "unknown";

    if (raw_type === "unknown") {
      console.warn("🟥 Missing block_type:", block_id, data);
    }

    // 🚫 Skip template-only nodes unless they are used as entry blocks
    const isTemplateOnly = ["text-message", "generic-template"].includes(raw_type);
    const isReferencedOnly = !edges.some(e => e.source === block.id);

    if (isTemplateOnly && isReferencedOnly) {
      continue; // ✅ Don't export this as a feature block — it will be extracted into shared_templates
    }

    // 🧵 Normalize canvas and extract Messenger paths
    data.canvas = normalizeCanvasPathsSafely(data.canvas);
    const { paths } = exportFeatureBlockMessenger(data, nodes);
    const rawCanvas = typeof data.canvas === "object" ? data.canvas : {};
    const { layout } = parseCanvasSafely(rawCanvas);

    // ✅ Validate template_refs
    const validPaths = paths.filter(p => {
      const ref = p.template_ref;
      return typeof ref === "string" && (allNodeIds.has(ref) || nodes.some(n => n.data?.block_id === ref));
    });

    const brokenPaths = paths.filter(p => {
      const ref = p.template_ref;
      return !ref || (!allNodeIds.has(ref) && !nodes.some(n => n.data?.block_id === ref));
    });

    if (brokenPaths.length > 0) {
      console.warn("🚨 Broken canvas paths:", brokenPaths.map(p => p.template_ref ?? "unknown"));
    }

    // 🔗 Order paths using button chains
    const chainsForBlock = buttonChains.filter(c => c.nodeId === block.id);
    const orderedPaths = chainsForBlock.length > 0
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

    // 🧪 Extract Messenger preview (text-message or generic-template)
    let msgEn: string | undefined;
    let msgKh: string | undefined;

    if (messenger_delivery_type === 'text-message' || messenger_delivery_type === 'generic-template') {
      const firstPath = orderedPaths.find(p => typeof p.template_ref === 'string');
      const ref = firstPath?.template_ref;
      const node = nodes.find(n => n.id === ref || n.data?.block_id === ref);

      if (node?.data?.template_type === "generic-template") {
        const cards_en = Array.isArray(node.data.cards_en) ? node.data.cards_en : [];
        const cards_kh = Array.isArray(node.data.cards_kh) ? node.data.cards_kh : [];

        console.log("🧪 Template cards before extract:", {
          ref,
          cards_en,
          cards_kh
        });

        if (cards_en.length === 0 || cards_kh.length === 0) {
          console.warn("🟥 Missing cards in generic-template node:", {
            ref,
            node_id: node.id,
            cards_en: node.data.cards_en,
            cards_kh: node.data.cards_kh
          });
        }
      }


      if (!node || !node.data) {
        console.warn("❌ Missing node or data for preview ref:", ref);
      }
      const safeData = typeof node?.data === 'object' && node.data !== null ? node.data : {};
      msgEn = typeof safeData.message_en === 'string' ? safeData.message_en : '';
      msgKh = typeof safeData.message_kh === 'string' ? safeData.message_kh : '';

      if (!msgEn || !msgKh) {
        console.warn("🟥 Missing message_en or message_kh for block:", block_id, {
          template_ref: ref,
          node_id: node?.id,
          message_en: msgEn,
          message_kh: msgKh
        });
      }
    }

    // 📦 Initialize block type group
    if (!feature_blocks_by_type[raw_type]) {
      feature_blocks_by_type[raw_type] = {};
    }

    // 🧹 Clean unused fields
    const {
      en, kh, name, templates: _, paths: __, createdAt,
      ...cleanedData
    } = data;

    // 🧾 Build debug info
    const debugChains = chainsForBlock.map(chain => ({
      buttonId: chain.buttonId,
      order: chain.order,
      valid: chain.valid,
      error: chain.error,
      targetNodeId: chain.targetNodeId,
      is_active: chain.is_active,
      cardPreview: chain.cardPreview
    }));

    const debug: any = {
      original_block_id: block.id,
      template_node_map: Object.fromEntries(
        orderedPaths.map(p => [p.template_ref ?? "unknown", p.template_ref ?? "unknown"])
      ),
      delivery_path_count: orderedPaths.length,
      raw_canvas_paths: paths,
      layout_used: layout,
      messenger_delivery_type,
      path_status_summary: debugChains
    };

    if (messenger_delivery_type === 'text-message' || messenger_delivery_type === 'generic-template') {
      debug.message_preview = {
        message_en: msgEn ?? null,
        message_kh: msgKh ?? null
      };
    }

    // ✅ Final block export
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
      canvas: {
        layout,
        paths: orderedPaths.map(p => {
          const path: any = {
            template_ref: p.template_ref,
            send_immediately: p.send_immediately ?? true,
            trigger: p.trigger,
            condition: p.condition
          };
          if (p.next) path.next = p.next;
          return path;
        })
      },
      debug
    };
  }

  for (const node of nodes) {
    const data = node.data;
    const rawType = typeof data?.template_type === "string"
      ? data.template_type
      : typeof node?.type === "string"
        ? node.type
        : "";

    const template_type = normalizeToTemplateType(rawType);

    if (template_type === "generic-template") {
      const cards = Array.isArray(data.cards) ? data.cards : [];
      const cards_en = Array.isArray(data.cards_en) ? data.cards_en : [];
      const cards_kh = Array.isArray(data.cards_kh) ? data.cards_kh : [];

      console.log("🧪 Full generic-template node before extract:", {
        node_id: node.id,
        block_id: data.block_id,
        rawType,
        template_type,
        cards,
        cards_en,
        cards_kh
      });
    }
  }

  // 🧩 Extract shared templates from template_ref nodes
  const { updatedBlocks, shared_templates } = extractTemplates(feature_blocks_by_type, nodes);

  // 🚀 Final export payload
  return stripUndefined({
    feature_blocks_by_type: updatedBlocks,
    shared_templates,
    is_draft: true,
    last_saved_at: new Date().toISOString(),
    saved_by: currentUserId
  });
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



function stripRedundantFields(block: any) {
  if (block.data?.paths) delete block.data.paths;
  if (block.data?.canvas?.paths) delete block.data.canvas.paths;
  if (block.data?.canvas) delete block.data.canvas;
  return block;
}


export async function buildFlowExport(
  nodes: Node[],
  edges: Edge[],
  mode: 'inline' | 'full' = 'full',
  writePreview = false,
  currentUserId: string
) {
  const visited = new Set<string>();
  const exportPayload: Record<string, any> = {
    feature_blocks_by_type: {}
  };

  const featureBlocks = nodes.filter(isFeatureBlockNode);

  for (const block of featureBlocks) {
    const data = block.data ?? {};
    const blockId = block.id;
    const blockName = typeof data.name === 'string' ? data.name.trim() : blockId;
    const blockType = typeof data.block_type === 'string' ? data.block_type.trim() : 'unknown';

    const config = typeof data.config === 'object' && data.config !== null ? data.config : {};
    const validation = validateNodeExport({
      id: blockId,
      name: blockName,
      type: String(block.type),
      config
    });

    const blockExport = exportFeatureBlock(
      block,
      nodes,
      edges,
      visited,
      new Set(),
      mode
    );

    if (!blockExport?.templates || !blockExport?.canvas) {
      const missingParts = [];
      if (!blockExport?.templates) missingParts.push('templates');
      if (!blockExport?.canvas) missingParts.push('canvas');

      console.warn(`❌ Skipping block "${blockName}" — missing ${missingParts.join(' & ')} from exportFeatureBlock`, {
        blockId,
        blockType,
        exportMode: mode,
        blockData: data
      });
      continue;
    }

    for (const path of blockExport.canvas.paths ?? []) {
      const baseId = path.template_id;
      if (!blockExport.templates?.[`${baseId}_en`] || !blockExport.templates?.[`${baseId}_kh`]) {
        console.warn(`🟥 Missing Messenger templates for path "${baseId}" in block "${blockId}"`);
      }
    }

    if (!exportPayload.feature_blocks_by_type[blockType]) {
      exportPayload.feature_blocks_by_type[blockType] = {};
    }

    const blockData = {
      block_id: blockId,
      block_name: blockName,
      block_type: blockType,
      is_active: data.is_active ?? false,
      tags: Array.isArray(data.tags) ? data.tags : [],
      linked_pages: Array.isArray(data.linked_pages) ? data.linked_pages : [],
      created_by: typeof data.created_by === 'string' ? data.created_by : '',
      last_updated: new Date().toISOString(),
      version: 1,
      entry_trigger: typeof data.entry_trigger === 'string' ? data.entry_trigger : 'message',
      entry_condition: data.entry_condition ?? null,
      templates: blockExport.templates,
      canvas: {
        ...blockExport.canvas,
        paths: blockExport.canvas.paths.map(path => ({
          ...path,
          targetBlockId: path.targetBlockId ?? null
        }))
      },
      validation_issues: {
        errors: validation.errors,
        warnings: validation.warnings
      }
    };

    exportPayload.feature_blocks_by_type[blockType][blockId] = stripRedundantFields(blockData);

    if (writePreview) {
      try {
        const dbRef = ref(db, `messenger_flows/${blockId}`);
        await set(dbRef, blockData);
        console.log(`✅ Firebase export: ${blockId}`);
      } catch (err) {
        console.error(`❌ Firebase export failed for ${blockId}:`, err);
      }
    }
  }

  exportPayload.last_saved_at = new Date().toISOString();
  exportPayload.saved_by = currentUserId;

  console.log(`✅ Final export contains ${Object.keys(exportPayload.feature_blocks_by_type).length} block types`);
  return exportPayload;
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

  for (const node of nodes) {
    const data = node.data ?? {};

    if (!data.block_type || typeof data.block_type !== 'string') {
      console.warn(`🟥 Missing block_type: ${node.id}`);
      continue;
    }

    if (!data.canvas || typeof data.canvas !== 'object') {
      console.warn(`⚠️ canvas is not a valid object: ${node.id}`);
      data.canvas = { layout: 'vertical', paths: [] }; // ✅ fallback
    }
    if (node.type === 'text-message' && (!data.message_en || !data.message_kh)) {
      console.warn(`🟥 text-message block missing message_en or message_kh: ${node.id}`);
    }


    valid.push(node);
  }

  return valid;
}



export function normalizeCanvasPathsSafely(canvas: any): any {
  if (!canvas || typeof canvas !== "object") return canvas;

  const paths = Array.isArray(canvas.paths) ? canvas.paths : [];

  canvas.paths = paths.map((p) => {
    if (!p || typeof p !== "object") return p;

    const ref =
      typeof p.template_id === "string" && p.template_id.trim() !== ""
        ? p.template_id.trim()
        : p.payload && typeof p.payload === "object" && typeof p.payload.node_id === "string"
          ? p.payload.node_id
          : null;

    if (ref) p.template_ref = ref;
    delete p.template_id;

    if (!p.payload || typeof p.payload !== "object") {
      p.payload = {
        node_id: ref ?? "unknown",
        template_type: "unknown",
        lang: "en"
      };
    }

    return p;
  });

  return canvas;
}

export function stripUndefined(obj: any): any {
  const seen = new WeakSet();

  function clean(value: any): any {
    if (seen.has(value)) return value;
    if (Array.isArray(value)) {
      return value
        .map(clean)
        .filter(v => v !== undefined);
    }
    if (value && typeof value === 'object' && value.constructor === Object) {
      seen.add(value);
      const result: any = {};
      for (const [key, val] of Object.entries(value)) {
        const cleaned = clean(val);
        if (cleaned !== undefined) result[key] = cleaned;
      }
      return result;
    }
    return value;
  }

  return clean(obj);
}




// // 🧩 Extract shared_templates from template_ref nodes in canvas paths
// export function extractTemplates(
//   feature_blocks_by_type: Record<string, any>,
//   nodes: Node[]
// ) {
//   const sharedTemplates: Record<string, SharedTemplate> = {};
//   const updatedBlocks: Record<string, any> = {};

//   for (const [blockType, blocks] of Object.entries(feature_blocks_by_type)) {
//     if (blockType === "text-message") continue;
//     updatedBlocks[blockType] = {};

//     for (const [blockId, block] of Object.entries(blocks)) {
//       updatedBlocks[blockType][blockId] = block;

//       const rawCanvas =
//         block && typeof block === "object" && !Array.isArray(block) && "canvas" in block
//           ? block.canvas ?? {}
//           : {};

//       const { paths } = parseCanvasSafely(rawCanvas);
//       const safePaths = Array.isArray(paths) ? paths : [];

//       for (const path of safePaths) {
//         let current = path;

//         while (current && typeof current === "object") {
//           const ref = current.template_ref;

//           if (typeof ref === "string" && !sharedTemplates[ref]) {
//             const node = nodes.find(n => n.id === ref || n.data?.block_id === ref);
//             if (!node || typeof node.data !== "object" || node.data === null) {
//               console.warn("❌ Missing node or data for ref:", ref);
//               break;
//             }

//             const data = node.data;

//             const template_type =
//               typeof data.template_type === "string"
//                 ? data.template_type
//                 : typeof node.type === "string"
//                   ? normalizeToTemplateType(node.type)
//                   : "text";

//             // ✅ Crash-proof fallback for locales
//             let message_en = "";
//             let message_kh = "";

//             if (typeof data.message_en === "string") {
//               message_en = data.message_en;
//             }
//             if (typeof data.message_kh === "string") {
//               message_kh = data.message_kh;
//             }

//             if (!message_en || !message_kh) {
//               const locales = Object(data.locales);
//               const en = Object(locales.en);
//               const kh = Object(locales.kh);

//               if (!message_en && typeof en.text === "string") {
//                 message_en = en.text;
//               }
//               if (!message_kh && typeof kh.text === "string") {
//                 message_kh = kh.text;
//               }
//             }

//             const is_active = typeof data.is_active === "boolean" ? data.is_active : true;

//             sharedTemplates[ref] = {
//               template_id: ref,
//               template_type,
//               is_active,
//               config: {
//                 delay_seconds: 0,
//                 emoji_style: "minimal",
//                 tone: "neutral",
//                 show_typing: true
//               },
//               locales: {
//                 en: { lang: "en", text: message_en },
//                 kh: { lang: "kh", text: message_kh }
//               }
//             };

//             console.log("✅ Added sharedTemplate:", sharedTemplates[ref]);
//           }

//           current = current.next;
//         }
//       }
//     }
//   }

//   return { updatedBlocks, shared_templates: sharedTemplates };
// }



// 🧩 Extract shared_templates from template_ref nodes in canvas paths
export function extractTemplates(
  feature_blocks_by_type: Record<string, any>,
  nodes: Node[]
) {
  const sharedTemplates: Record<string, SharedTemplate> = {};
  const updatedBlocks: Record<string, any> = {};

  for (const [blockType, blocks] of Object.entries(feature_blocks_by_type)) {
    if (blockType === "text-message") continue;
    updatedBlocks[blockType] = {};

    for (const [blockId, block] of Object.entries(blocks)) {
      updatedBlocks[blockType][blockId] = block;

      const rawCanvas =
        block && typeof block === "object" && !Array.isArray(block) && "canvas" in block
          ? block.canvas ?? {}
          : {};

      const { paths } = parseCanvasSafely(rawCanvas);
      const safePaths = Array.isArray(paths) ? paths : [];

      for (const path of safePaths) {
        let current = path;

        while (current && typeof current === "object") {
          const ref = current.template_ref;

          if (typeof ref === "string" && !sharedTemplates[ref]) {
            const node = nodes.find(n => n.id === ref || n.data?.block_id === ref);
            if (!node || typeof node.data !== "object" || node.data === null) {
              console.warn("❌ Missing node or data for ref:", ref);
              break;
            }

            const data = node.data;

            const rawType =
              typeof data.template_type === "string"
                ? data.template_type
                : typeof node.type === "string"
                  ? node.type
                  : "";

            const template_type = normalizeToTemplateType(rawType);
            console.log("🧪 Normalized template_type:", { ref, rawType, template_type });

            const is_active = typeof data.is_active === "boolean" ? data.is_active : true;

            let locales: Record<string, any> = {};

            if (template_type === "generic-template") {

              const rawLocales = Object(data.locales);

              const enCards =
                Array.isArray(rawLocales?.en?.cards)
                  ? rawLocales.en.cards
                  : Array.isArray(data.cards_en)
                    ? data.cards_en
                    : Array.isArray(data.cards)
                      ? data.cards
                      : [];

              const khCards =
                Array.isArray(rawLocales?.kh?.cards)
                  ? rawLocales.kh.cards
                  : Array.isArray(data.cards_kh)
                    ? data.cards_kh
                    : Array.isArray(data.cards)
                      ? data.cards
                      : [];


              console.log("🧪 Extracting cards for generic-template:", {
                ref,
                cards: data.cards,
                cards_en: enCards,
                cards_kh: khCards
              });




              locales = {
                en: { lang: "en", cards: enCards },
                kh: { lang: "kh", cards: khCards }
              };
            } else {
              let message_en = "";
              let message_kh = "";

              if (typeof data.message_en === "string") {
                message_en = data.message_en;
              }
              if (typeof data.message_kh === "string") {
                message_kh = data.message_kh;
              }

              if (!message_en || !message_kh) {
                const rawLocales = Object(data.locales);
                const en = Object(rawLocales.en);
                const kh = Object(rawLocales.kh);

                if (!message_en && typeof en.text === "string") {
                  message_en = en.text;
                }
                if (!message_kh && typeof kh.text === "string") {
                  message_kh = kh.text;
                }
              }

              locales = {
                en: { lang: "en", text: message_en },
                kh: { lang: "kh", text: message_kh }
              };
            }

            console.log("🧪 Hydrating config from node data:", {
              ref,
              delay_seconds: data.delay_seconds,
              emoji_style: data.emoji_style,
              tone: data.tone,
              show_typing: data.show_typing
            });


            sharedTemplates[ref] = {
              template_id: ref,
              template_type,
              is_active,
              config: {
                delay_seconds: typeof data.delay_seconds === "number" ? data.delay_seconds : 0,
                emoji_style: typeof data.emoji_style === "string" ? data.emoji_style : "minimal",
                tone: typeof data.tone === "string" ? data.tone : "neutral",
                show_typing: typeof data.show_typing === "boolean" ? data.show_typing : true
              },
              locales
            };

            console.log("✅ Added sharedTemplate:", sharedTemplates[ref]);
          }

          current = current.next;
        }
      }
    }
  }

  return { updatedBlocks, shared_templates: sharedTemplates };
}
