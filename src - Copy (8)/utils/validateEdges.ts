import type { Node, Edge } from '@xyflow/react'

export const validateEdges = (nodes: Node[], edges: Edge[]): Edge[] => {
  const nodeIds = new Set(nodes.map(n => n.id))
  return edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
}
