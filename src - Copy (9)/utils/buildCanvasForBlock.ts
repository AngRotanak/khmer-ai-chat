
import type { Node, Edge } from '@xyflow/react'


export function buildCanvasForBlock(
  blockId: string,
  nodes: Node[],
  edges: Edge[]
): {
  nodes: Node[]
  edges: Edge[]
} {
  const visited = new Set<string>()
  const queue = [blockId]
  const collectedNodes: Node[] = []
  const collectedEdges: Edge[] = []

  while (queue.length > 0) {
    const currentId = queue.shift()
    if (!currentId || visited.has(currentId)) continue
    visited.add(currentId)

    const node = nodes.find(n => n.id === currentId)
    if (!node) continue

    collectedNodes.push(node)

    // ✅ Collect outgoing edges
    const outgoingEdges = edges.filter(e => e.source === currentId)
    collectedEdges.push(...outgoingEdges)

    // ✅ Traverse edge targets
    outgoingEdges.forEach(edge => {
      if (!visited.has(edge.target)) {
        queue.push(edge.target)
      }
    })

    // ✅ Traverse generic-template payloads
    if (node.type === 'generic-template') {
      const cards = Array.isArray(node.data?.cards) ? node.data.cards : []

      for (const card of cards) {
        const options = Array.isArray(card.options) ? card.options : []
        for (const opt of options) {
          const payload = typeof opt.payload === 'string' ? opt.payload.trim() : ''
          if (payload && !visited.has(payload)) {
            const targetNode = nodes.find(n => n.id === payload)
            if (targetNode) {
              queue.push(payload)
            }
          }
        }
      }
    }

    // ✅ Traverse feature-block paths
    if (node.type === 'feature-block') {
      const paths = Array.isArray(node.data?.paths) ? node.data.paths : []
      for (const path of paths) {
        const targetId = typeof path?.targetBlockId === 'string' ? path.targetBlockId.trim() : ''
        if (targetId && !visited.has(targetId)) {
          const targetNode = nodes.find(n => n.id === targetId)
          if (targetNode) {
            queue.push(targetId)
          }
        }
      }
    }
  }

  return {
    nodes: collectedNodes,
    edges: collectedEdges
  }
}
