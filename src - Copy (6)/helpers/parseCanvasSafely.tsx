import type { Node, Edge } from '@xyflow/react'

type SafeCanvas = {
  layout: 'horizontal' | 'vertical';
  nodes: Node[];
  edges: Edge[];
  paths: any[];
};

export function parseCanvasSafely(canvas: unknown): SafeCanvas {
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

