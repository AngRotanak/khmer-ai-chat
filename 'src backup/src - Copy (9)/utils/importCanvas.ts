// ~/modules/export/importCanvas.ts

import type { Node, Edge } from '@xyflow/react'

export function importCanvasFromFirebase(flowBlock: any): {
  nodes: Node[]
  edges: Edge[]
} {
  const canvas = flowBlock?.canvas
  if (!canvas || !Array.isArray(canvas.nodes)) {
    console.warn('⚠️ No canvas found in Firebase block')
    return { nodes: [], edges: [] }
  }

  const nodes: Node[] = canvas.nodes.map((n: any) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: {
      label: n.data?.label ?? '',
      payload: n.data?.payload ?? '',
      blockType: flowBlock.flow_data?.metadata?.blockType ?? '',
      config: flowBlock.flow_data?.metadata?.config ?? {},
    },
    selected: false,
    dragging: false,
    measured: n.measured ?? { width: 320, height: 280 }
  }))

  const edges: Edge[] = Array.isArray(canvas.edges)
    ? canvas.edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: e.type ?? 'default'
      }))
    : []

  return { nodes, edges }
}
