import type { XYPosition } from '@xyflow/react'
import type { BuilderNodeType } from '~/modules/nodes/types'
import { useCallback } from 'react'

import { createNodeWithDefaultData } from '~/modules/nodes/utils'
import { trackFlowBuilderAddNode } from '~/utils/ga4'
import { useCanvasStore } from '~/stores/canvas-store'
import { useReactFlow } from '@xyflow/react'

export function useInsertNode() {
  const { screenToFlowPosition } = useReactFlow()

  return useCallback(
    (type: BuilderNodeType, pos?: XYPosition) => {
      const _pos = pos || screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })

      const newNode = createNodeWithDefaultData(type, {
        position: _pos,
        selected: true,
      })

      if (!newNode) {
        console.warn(`⚠️ Unknown node type: ${type}`)
        return
      }

      const { nodes, setNodes } = useCanvasStore.getState()
      setNodes([...nodes, newNode]) // ✅ Fresh reference

      trackFlowBuilderAddNode(type)
      return newNode
    },
    [screenToFlowPosition],
  )
}
