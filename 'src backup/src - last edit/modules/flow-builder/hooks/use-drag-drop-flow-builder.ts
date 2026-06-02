import type { DragEvent } from 'react'
import type { BuilderNode } from '~/modules/nodes/types'
import type { Edge } from '@xyflow/react'
import { useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'

import { NODE_TYPE_DRAG_DATA_FORMAT } from '~/constants/symbols.ts'
import { useInsertNode } from '~/modules/flow-builder/hooks/use-insert-node'
import { useCanvasStore } from '~/stores/canvas-store'
import { sanitizeNodes, sanitizeEdges } from '~/modules/flow-builder/constants/default-nodes-edges'
import { validateEdges } from '~/utils/validateEdges'

function extractCanvas(block: any, flowId: string) {
  if (!block || typeof block !== 'object') {
    console.warn(`❌ Block for "${flowId}" is not an object:`, block)
    return null
  }

  if (typeof block.canvas === 'object') {
    console.log(`✅ Found canvas in block.canvas for "${flowId}"`)
    return block.canvas
  }

  if (typeof block.product?.canvas === 'object') {
    console.log(`✅ Found canvas in block.product.canvas for "${flowId}"`)
    return block.product.canvas
  }

  const hasLegacy = Array.isArray(block.nodes) || Array.isArray(block.edges)
  if (hasLegacy) {
    console.log(`✅ Found legacy nodes/edges directly in block for "${flowId}"`)
    return {
      nodes: Array.isArray(block.nodes) ? block.nodes : [],
      edges: Array.isArray(block.edges) ? block.edges : [],
    }
  }

  console.warn(`❌ No valid canvas structure found in block for "${flowId}"`, block)
  return null
}

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

      // ✅ Sidebar node drag
      const type = e.dataTransfer.getData(NODE_TYPE_DRAG_DATA_FORMAT)
      if (type) {
        insertNode(type as BuilderNode, screenToFlowPosition({
          x: e.clientX,
          y: e.clientY,
        }))
        return
      }

      // ✅ Flow-import drag
      const json = e.dataTransfer.getData('application/json')
      if (json) {
        try {
          const payload = JSON.parse(json)
          if (payload.type === 'flow-import' && payload.flowId) {
            const flowData = useCanvasStore.getState().flowData
            console.log('📦 Full flowData:', flowData)
            console.log(`🔍 Looking for flowId "${payload.flowId}"`)
            const block = flowData?.[payload.flowId]
            console.log('🧩 Drop block:', block)

            const canvas = extractCanvas(block, payload.flowId)

            if (!canvas || !Array.isArray(canvas.nodes) || !Array.isArray(canvas.edges)) {
              console.warn(`⚠️ Invalid canvas structure for flow "${payload.flowId}"`, canvas)
              return
            }

            const validNodes = sanitizeNodes(canvas.nodes).map(n => ({
              ...n,
              draggable: true,
              selectable: true,
            }))

            const rawEdges = sanitizeEdges(canvas.edges).map(e => ({
              ...e,
              targetHandle: undefined,
            }))

            const validEdges = validateEdges(validNodes, rawEdges)

            const droppedEdges = rawEdges.filter(e =>
              !validEdges.find(v => v.id === e.id)
            )

            if (droppedEdges.length > 0) {
              console.warn('⚠️ Dropped invalid edges:', droppedEdges)
            }

            const edgeLog = validEdges.map(e => {
              const orig = findOriginalEdge(canvas.edges, e.id)
              return {
                id: e.id,
                source: e.source,
                target: e.target,
                originalTargetHandle: orig?.targetHandle ?? '⛔️ missing',
              }
            })

            console.log('🔗 Edges being loaded:', edgeLog)

            useCanvasStore.getState().setNodes(validNodes)
            useCanvasStore.getState().setEdges(validEdges)

            console.log(`✅ Dropped flow "${payload.flowId}" with ${validNodes.length} nodes and ${validEdges.length} edges`)
          }
        } catch (err) {
          console.warn('⚠️ Invalid drag payload:', err)
        }
      }
    },
    [insertNode, screenToFlowPosition]
  )

  return [onDragOver, onDrop]
}

export function findOriginalEdge(edges: Edge[] | undefined | null, id: string): Edge | undefined {
  if (!Array.isArray(edges)) return undefined
  return edges.find(e => typeof e?.id === 'string' && e.id === id)
}