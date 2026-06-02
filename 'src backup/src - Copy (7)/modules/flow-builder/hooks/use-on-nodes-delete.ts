import type { Node } from '@xyflow/react'
import { useCallback } from 'react'
import { useCanvasStore } from '~/stores/canvas-store'
import { useApplicationState } from '~/stores/application-state'
import { trackFlowBuilderDeleteNode } from '~/utils/ga4'

export function useOnNodesDelete() {
  const { nodePropertiesSelectedNode, nodePropertiesSetSelectedNode } = useApplicationState(s => ({
    nodePropertiesSelectedNode: s.sidebar.panels.nodeProperties.selectedNode,
    nodePropertiesSetSelectedNode: s.actions.sidebar.panels.nodeProperties.setSelectedNode,
  }))

  return useCallback((_: Node[]) => {
    trackFlowBuilderDeleteNode()

    const currentNodes = useCanvasStore.getState().nodes

    if (
      nodePropertiesSelectedNode &&
      !currentNodes.find(node => node.id === nodePropertiesSelectedNode.id)
    ) {
      nodePropertiesSetSelectedNode(null)
    }
  }, [nodePropertiesSelectedNode, nodePropertiesSetSelectedNode])
}

// export function useOnNodesDelete() {
//   const { nodePropertiesSelectedNode, nodePropertiesSetSelectedNode } = useApplicationState(s => ({
//     nodePropertiesSelectedNode: s.sidebar.panels.nodeProperties.selectedNode,
//     nodePropertiesSetSelectedNode: s.actions.sidebar.panels.nodeProperties.setSelectedNode,
//   }))

//   return useCallback((deletedNodes: Node[]) => {
//     trackFlowBuilderDeleteNode()

//     const deletedIds = deletedNodes.map(n => n.id)
//     const currentNodes = useCanvasStore.getState().nodes

//     // ✅ Clear selected node if it was deleted
//     if (
//       nodePropertiesSelectedNode &&
//       deletedIds.includes(nodePropertiesSelectedNode.id)
//     ) {
//       nodePropertiesSetSelectedNode(null)
//     }

//     // ✅ Clean up payloads in feature-blocks
//     const updatedNodes = currentNodes.map(node => {
//       if (node.type === 'feature-block') {
//         const data = node.data as FeatureBlock
//         const paths = Array.isArray(data.canvas?.paths) ? data.canvas.paths : []

//         const cleanedPaths = paths.map(path => {
//           const isLinked = typeof path.payload === 'object' && deletedIds.includes(path.payload?.node_id)
//           return isLinked
//             ? { ...path, payload: undefined, targetBlockId: null }
//             : path
//         })

//         return {
//           ...node,
//           data: { ...data, canvas: { ...data.canvas, paths: cleanedPaths } },
//           updatedAt: Date.now(),
//         }
//       }

//       return node
//     })

//     useCanvasStore.getState().setNodes(updatedNodes)
//   }, [nodePropertiesSelectedNode, nodePropertiesSetSelectedNode])
// }
