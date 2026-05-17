import type { DragEvent } from 'react'
import type { BuilderNodeType } from '~/modules/nodes/types'

import { useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'

import { NODE_TYPE_DRAG_DATA_FORMAT } from '~/constants/symbols.ts'
import { useInsertNode } from '~/modules/flow-builder/hooks/use-insert-node'

export function useDragDropFlowBuilder() {
  const { screenToFlowPosition } = useReactFlow()
  const insertNode = useInsertNode()

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()

      const rawType = e.dataTransfer.getData(NODE_TYPE_DRAG_DATA_FORMAT)
      const type = rawType?.trim()

      if (!type || typeof type !== 'string') {
        console.warn('⚠️ Invalid node type dropped:', rawType)
        return
      }

      insertNode(type as BuilderNodeType, screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      }))
    },
    [insertNode, screenToFlowPosition],
  )

  return [onDragOver, onDrop]
}
