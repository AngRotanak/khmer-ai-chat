import { getConnectedEdges, useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'
import { useCanvasStore } from '~/stores/canvas-store'

export function useDeleteNode() {
  const { getNode, getEdges, deleteElements } = useReactFlow()
  const setNodes = useCanvasStore(s => s.setNodes)
  const setEdges = useCanvasStore(s => s.setEdges)

  return useCallback(
    (id: string) => {
      const node = getNode(id)
      if (!node) return

      const edges = getEdges()
      const connectedEdges = getConnectedEdges([node], edges)

      deleteElements({ nodes: [node], edges: connectedEdges }).then(() => {
        // ✅ Sync to canvas store after deletion
        const remainingNodes = useCanvasStore.getState().nodes.filter(n => n.id !== id)
        const remainingEdges = useCanvasStore.getState().edges.filter(
          e => !connectedEdges.some(ce => ce.id === e.id)
        )

        setNodes(remainingNodes)
        setEdges(remainingEdges)
      })
    },
    [getNode, getEdges, deleteElements, setNodes, setEdges]
  )
}
