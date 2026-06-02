import type { DragEvent } from 'react';
import type { BuilderNode } from '~/modules/nodes/types';
import { useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react'
import { NODE_TYPE_DRAG_DATA_FORMAT } from '~/constants/symbols.ts';
import { useInsertNode } from '~/modules/flow-builder/hooks/use-insert-node';
import { useCanvasStore } from '~/stores/canvas-store';
import { sanitizeNodes, sanitizeEdges } from '~/modules/flow-builder/constants/default-nodes-edges';
import { validateEdges } from '~/utils/validateEdges';
import type { FeatureBlock, Canvas } from '~/modules/blocks/types/feature-block';


export function useDragDropFlowBuilder() {
  const { screenToFlowPosition } = useReactFlow();
  const insertNode = useInsertNode();

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();

      const type = e.dataTransfer.getData(NODE_TYPE_DRAG_DATA_FORMAT);
      if (type) {
        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        const newNode = insertNode(type as BuilderNode, position);
        

        if (newNode?.type === 'feature-block') {
          const { data } = newNode;
          const { paths } = getSafeCanvas(data);
          const templates = typeof data.templates === 'object' && data.templates !== null ? data.templates : {};

          const missingTemplates = paths
            .map((path) => path?.template_ref)
            .filter((templateId) => isMissingMessengerTemplates(templates, templateId));

          if (missingTemplates.length > 0) {
            console.warn('🟥 Missing Messenger templates for:', missingTemplates);
          }

          console.groupCollapsed(`🆕 Feature Block Created: ${newNode.id}`);
          console.log('📦 Block Name:', data.block_name);
          console.log('📦 Entry Trigger:', data.entry_trigger);

          paths.forEach((path) => {
            const templateId = path?.template_ref;
            const matchesNodeId = templateId === newNode.id;

            console.group(`🔗 Path: ${path.id}`);
            console.log('🧩 Template ID:', templateId);
            console.log('🧩 Target Block ID:', path?.targetBlockId ?? '[null]');
            console.log('🧩 Trigger:', path?.trigger ?? '[default]');
            console.log('🧩 Detection Mode:', path?.detection_mode ?? '[default]');
            console.log('🧩 Expected Intent:', path?.expected_intent ?? '[none]');
            console.log('🧩 Condition:', path?.condition ?? '[none]');

            if (matchesNodeId) {
              console.log('✅ Template ID matches node.id');
            } else {
              console.warn(`🟥 Template ID does NOT match node.id (${newNode.id})`);
            }

            console.groupEnd();
          });

          console.groupEnd();

        }

        return;
      }

      const json = e.dataTransfer.getData('application/json');
      if (json) {
        try {
          const payload = JSON.parse(json);
          if (payload.type === 'flow-import' && payload.flowId) {

            const flowData = useCanvasStore.getState().flowData as Record<string, any> | undefined;
            const block = flowData?.[payload.flowId];

            const canvas = extractCanvas(block, payload.flowId);

            const { nodes, edges } = parseCanvasSafely(canvas);

            if (!canvas || !Array.isArray(nodes) || !Array.isArray(edges)) {
              console.warn(`⚠️ Invalid canvas structure for flow "${payload.flowId}"`, canvas);
              return;
            }

            const validNodes = sanitizeNodes(nodes).map((n) => ({
              ...n,
              draggable: true,
              selectable: true,
            }));

            const rawEdges = sanitizeEdges(edges).map((e) => ({
              ...e,
              targetHandle: undefined,
            }));

            const validEdges = validateEdges(validNodes, rawEdges);
            const droppedEdges = rawEdges.filter((e) => !validEdges.find((v) => v.id === e.id));

            if (droppedEdges.length > 0) {
              console.warn('⚠️ Dropped invalid edges:', droppedEdges);
            }

            console.log(`✅ Dropped flow "${payload.flowId}" with ${validNodes.length} nodes and ${validEdges.length} edges`);
            useCanvasStore.getState().setNodes(validNodes);
            useCanvasStore.getState().setEdges(validEdges);
          }
        } catch (err) {
          console.warn('⚠️ Invalid drag payload:', err);
        }
      }
    },
    [insertNode, screenToFlowPosition]
  );

  return [onDragOver, onDrop];
}


function extractCanvas(block: any, flowId: string) {
  if (!block || typeof block !== 'object') {
    console.warn(`❌ Block for "${flowId}" is not an object:`, block)
    return null
  }

  if (typeof block.canvas === 'object') {
    console.log(`✅ Found canvas in block.canvas for "${flowId}"`)
    return block.canvas
  }

  if (typeof block.product?.canvas === 'object') {
    console.log(`✅ Found canvas in block.product.canvas for "${flowId}"`)
    return block.product.canvas
  }

  const hasLegacy = Array.isArray(block.nodes) || Array.isArray(block.edges)
  if (hasLegacy) {
    console.log(`✅ Found legacy nodes/edges directly in block for "${flowId}"`)
    return {
      nodes: Array.isArray(block.nodes) ? block.nodes : [],
      edges: Array.isArray(block.edges) ? block.edges : [],
    }
  }

  console.warn(`❌ No valid canvas structure found in block for "${flowId}"`, block)
  return null
}



export function findOriginalEdge(edges: Edge[] | undefined | null, id: string): Edge | undefined {
  if (!Array.isArray(edges)) return undefined
  return edges.find(e => typeof e?.id === 'string' && e.id === id)
}
function getSafeCanvas(data: Partial<FeatureBlock>): Canvas {
  const layout = data.canvas?.layout === 'horizontal' ? 'horizontal' : 'vertical'
  const paths = Array.isArray(data.canvas?.paths) ? data.canvas.paths : []
  return { layout, paths }
}

function isMissingMessengerTemplates(templates: Record<string, any> | undefined, baseId: string): boolean {
  if (typeof baseId !== 'string' || baseId.trim() === '') return true
  if (!templates || typeof templates !== 'object') return true
  const hasEn = Object.prototype.hasOwnProperty.call(templates, `${baseId}_en`)
  const hasKh = Object.prototype.hasOwnProperty.call(templates, `${baseId}_kh`)
  return !hasEn || !hasKh
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
