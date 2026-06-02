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
