import { getConnectedEdges, useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'
import { useCanvasStore } from '~/stores/canvas-store'
import type {
  FeatureBlock
} from '~/modules/blocks/types/feature-block'


// export function useDeleteNode() {
//   const { getNode, getEdges, deleteElements } = useReactFlow()
//   const setNodes = useCanvasStore(s => s.setNodes)
//   const setEdges = useCanvasStore(s => s.setEdges)

//   return useCallback(
//     (id: string) => {
//       const node = getNode(id)
//       if (!node) return

//       const edges = getEdges()
//       const connectedEdges = getConnectedEdges([node], edges)

//       deleteElements({ nodes: [node], edges: connectedEdges }).then(() => {
//         // ✅ Sync to canvas store after deletion
//         const remainingNodes = useCanvasStore.getState().nodes.filter(n => n.id !== id)
//         const remainingEdges = useCanvasStore.getState().edges.filter(
//           e => !connectedEdges.some(ce => ce.id === e.id)
//         )

//         setNodes(remainingNodes)
//         setEdges(remainingEdges)
//       })
//     },
//     [getNode, getEdges, deleteElements, setNodes, setEdges]
//   )
// }


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
        const currentNodes = useCanvasStore.getState().nodes
        const remainingEdges = useCanvasStore.getState().edges.filter(
          e => !connectedEdges.some(ce => ce.id === e.id)
        )

        const updatedNodes = currentNodes
          .filter(n => n.id !== id)
          .map(n => {
            if (n.type === 'feature-block') {
              const data = n.data as FeatureBlock
              const paths = Array.isArray(data.canvas?.paths) ? data.canvas.paths : []

              const cleanedPaths = paths.map(p => {
                const isLinked = typeof p.payload === 'object' && p.payload?.node_id === id
                return isLinked
                  ? { ...p, payload: undefined, targetBlockId: null }
                  : p
              })

              return {
                ...n,
                data: { ...data, canvas: { ...data.canvas, paths: cleanedPaths } },
                updatedAt: Date.now(),
              }
            }

            return n
          })

        setNodes(updatedNodes)
        setEdges(remainingEdges)
      })
    },
    [getNode, getEdges, deleteElements, setNodes, setEdges]
  )
}
