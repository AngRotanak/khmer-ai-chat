import type { Node } from '@xyflow/react'
import { normalizeToTemplateType } from '~/modules/nodes/types'


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
  // ✅ Special case: form-blocks have no Messenger paths
  if (block.block_type === "form-block") {
    console.log("🛑 Skipping path normalization for form-block");
    return { paths: [], usedTemplateRefs: [] };
  }

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
