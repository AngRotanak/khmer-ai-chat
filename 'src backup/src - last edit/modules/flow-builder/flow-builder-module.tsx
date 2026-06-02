import type { Connection, Edge, EdgeChange, EdgeTypes, NodeChange } from '@xyflow/react'
import {
  applyEdgeChanges,
  Background,
  ReactFlow,
} from '@xyflow/react'
import { useCallback, useState, useEffect } from 'react'
import { cn } from '~@/utils/cn'

import AddNodeFloatingMenu from '~/modules/flow-builder/components/add-node-floating-menu/add-node-floating-menu'
import CustomControls from '~/modules/flow-builder/components/controls/custom-controls'
import CustomDeletableEdge from '~/modules/flow-builder/components/edges/custom-deletable-edge'
import { useAddNodeOnEdgeDrop } from '~/modules/flow-builder/hooks/use-add-node-on-edge-drop'
import { useDeleteKeyCode } from '~/modules/flow-builder/hooks/use-delete-key-code'
import { useDragDropFlowBuilder } from '~/modules/flow-builder/hooks/use-drag-drop-flow-builder'
import { useIsValidConnection } from '~/modules/flow-builder/hooks/use-is-valid-connection'
import { useNodeAutoAdjust } from '~/modules/flow-builder/hooks/use-node-auto-adjust'
import { NODE_TYPES } from '~/modules/nodes'
import { useApplicationState } from '~/stores/application-state'

import { validateAllChains } from '~/utils/flowLogic'
import { isGenericTemplateNode, isFeatureBlockNode } from '~/modules/nodes/utils'
import type { FeatureBlockNodeData } from '~/modules/nodes/types'
import { useCanvasStore } from '~/stores/canvas-store'
import { applyNodeChanges } from '@xyflow/react'
import { sanitizeNodes, sanitizeEdges } from '~/modules/flow-builder/constants/default-nodes-edges' // or wherever you define them
import { loadCanvasAutosave } from '~/utils/loadCanvasAutosave'

import { useAuthStore } from '~/stores/auth-store'

import { SnapshotViewer } from '~/components/SnapshotViewer'
// import { sanitizeCanvas } from '~/utils/sanitizeCanvas'
// import { saveCanvasAutosave } from '~/utils/saveCanvasAutosave'
// import { FlowToolbar } from '~/modules/flow-builder/components/toolbar/flow-toolbar'

const edgeTypes: EdgeTypes = {
  deletable: CustomDeletableEdge,
}




export function FlowBuilderModule() {
  const nodes = useCanvasStore(s => s.nodes)
  const edges = useCanvasStore(s => s.edges)
  const setNodes = useCanvasStore(s => s.setNodes)
  const setEdges = useCanvasStore(s => s.setEdges)

  const deleteKeyCode = useDeleteKeyCode()

  const autoAdjustNode = useNodeAutoAdjust()
  const [onDragOver, onDrop] = useDragDropFlowBuilder()
  const isValidConnection = useIsValidConnection(nodes, edges)
  // const { getNodes } = useReactFlow()
  const [, setFlowReady] = useState(false)


  const {
    handleOnEdgeDropConnectEnd,
    floatingMenuWrapperRef,
    handleAddConnectedNode,
  } = useAddNodeOnEdgeDrop(setEdges, setNodes)

  // const zoomPercent = Math.round(0.8 * 100)

  type Option = {
    id: string
    label_en?: string
    label_kh?: string
    type?: string
    payload?: string
  }

  function isMessengerSafePayload(id: string): boolean {
    return (
      typeof id === 'string' &&
      id.trim() !== '' &&
      !id.startsWith('_') &&
      !id.includes('#') &&
      !id.includes('/') &&
      !id.includes('[') &&
      !id.includes(']')
    )
  }


  const onConnect = useCallback((params: Connection) => {
    console.log('🧩 onConnect triggered:', params)

    const sourceNode = nodes.find(n => n.id === params.source)
    const targetNode = nodes.find(n => n.id === params.target)
    const sourceHandle = params.sourceHandle
    const target = params.target

    if (!sourceNode || !targetNode) {
      console.warn('⚠️ Missing source or target node — skipping connection')
      return
    }

    const sourceIsCarousel = sourceNode.type === 'feature-block' &&
      sourceNode.data?.blockType === 'carousel'

    const targetIsGenericTemplate = targetNode.type === 'generic-template'

    if (sourceIsCarousel && !targetIsGenericTemplate) {
      alert('⚠️ Carousel blocks can only connect to generic-template cards')
      return
    }

    const newEdge: Edge = {
      id: `edge-${params.source}-${params.sourceHandle}-${params.target}`,
      source: params.source,
      sourceHandle: sourceHandle ?? null,
      target: params.target,
      targetHandle: params.targetHandle ?? null,
      type: 'deletable',
    }

    const currentNodes = useCanvasStore.getState().nodes
    const currentEdges = useCanvasStore.getState().edges

    const isFeatureBlock = isFeatureBlockNode(targetNode)
    const rawPayload = isFeatureBlock
      ? (targetNode.data as FeatureBlockNodeData)?.name
      : targetNode.id

    const payload = typeof rawPayload === 'string' ? rawPayload.trim() : ''

    const updatedNodes = currentNodes.map(node => {
      // ✅ Update generic-template payload
      if (isGenericTemplateNode(sourceNode) &&
        node.id === sourceNode.id &&
        sourceHandle &&
        Array.isArray(sourceNode.data?.cards)) {

        const cards = sourceNode.data.cards
        const card = cards[0] ?? { options: [] }
        const options = Array.isArray(card.options) ? card.options as Option[] : []
        const optionIndex = options.findIndex(opt => opt?.id === sourceHandle)

        if (optionIndex !== -1 && payload && isMessengerSafePayload(payload)) {
          const updatedOptions = [...options]
          updatedOptions[optionIndex] = {
            ...updatedOptions[optionIndex],
            type: 'postback',
            payload,
          }

          return {
            ...node,
            data: {
              ...node.data,
              cards: [{ ...card, options: updatedOptions }],
            },
          }
        }
      }

      // ✅ Update target feature-block with trigger
      if (isFeatureBlock && node.id === target && payload) {
        return {
          ...node,
          data: {
            ...node.data,
            trigger: payload,
            is_deep_target: true,
          },
        }
      }

      // ✅ Update source feature-block with targetBlockId
      if (node.type === 'feature-block' && node.id === params.source) {
        const data = node.data
        const paths = Array.isArray(data.paths) ? data.paths : []

        const updatedPaths = paths.map(path =>
          path.id === sourceHandle
            ? { ...path, targetBlockId: target }
            : path
        )

        return {
          ...node,
          data: {
            ...data,
            paths: updatedPaths,
          },
        }
      }

      return node
    })

    const validated = validateAllChains(updatedNodes, [...currentEdges, newEdge])

    useCanvasStore.getState().setNodes(validated)
    useCanvasStore.getState().setEdges([...currentEdges, newEdge])
  }, [nodes, edges])


  const handleAutoAdjustNodeAfterNodeMeasured = useCallback(
    (id: string) => {
      setTimeout(() => {
        const node = nodes.find(n => n.id === id)
        if (!node) return

        if (node.measured === undefined) {
          handleAutoAdjustNodeAfterNodeMeasured(id)
          return
        }

        autoAdjustNode(node)
      })
    },
    [autoAdjustNode, nodes],
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (changes.length === 0) return // ✅ Prevent overwriting freshly loaded nodes

      const currentNodes = useCanvasStore.getState().nodes
      const currentEdges = useCanvasStore.getState().edges

      const updatedNodes = applyNodeChanges(changes, currentNodes)

      changes.forEach(change => {
        if (change.type === 'dimensions') {
          const node = updatedNodes.find(n => n.id === change.id)
          if (node) autoAdjustNode(node)
        }

        if (change.type === 'add') {
          handleAutoAdjustNodeAfterNodeMeasured(change.item.id)
        }
      })

      const validNodes = sanitizeNodes(updatedNodes).map(n => ({
        ...n,
        draggable: true,
        selectable: true,
      }))
      const validEdges = sanitizeEdges(currentEdges)

      const validated = validateAllChains(validNodes, validEdges)

      useCanvasStore.getState().setNodes(validated)
      useCanvasStore.getState().setEdges(validEdges)
    },
    [autoAdjustNode, handleAutoAdjustNodeAfterNodeMeasured]
  )

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(prevEdges => {
      const updatedEdges = applyEdgeChanges(changes, prevEdges)
      const rawEdges = sanitizeEdges(updatedEdges)

      // ✅ Detect removed handles
      const removedHandles = changes
        .filter(change => change.type === 'remove')
        .map(change => {
          const edge = prevEdges.find(e => e.id === change.id)
          return edge?.sourceHandle
        })
        .filter(Boolean) as string[]

      // ✅ Create edge lookup map
      const edgeMap = new Map<string, Edge>()
      for (const edge of updatedEdges) {
        if (edge.sourceHandle) {
          edgeMap.set(`${edge.source}-${edge.sourceHandle}`, edge)
        }
      }

      // ✅ Use latest node state from React Flow
      setNodes(prevNodes => {
        const updatedNodes = prevNodes.map(node => {
          if (node.type === 'feature-block') {
            const data = node.data as FeatureBlockNodeData
            const paths = Array.isArray(data.paths) ? data.paths : []

            const updatedPaths = paths.map(path => {
              const edgeKey = `${node.id}-${path.id}`
              const edge = edgeMap.get(edgeKey)

              return {
                ...path,
                targetBlockId: removedHandles.includes(path.id)
                  ? null
                  : edge?.target ?? path.targetBlockId,
              }
            })

            return {
              ...node,
              data: { ...data, paths: updatedPaths },
            }
          }

          if (node.type === 'generic-template') {
            const cards = Array.isArray(node.data?.cards) ? node.data.cards : []
            const card = cards[0] ?? { options: [] }
            const options = Array.isArray(card.options) ? card.options as Option[] : []

            const updatedOptions = options.map(opt => {
              const edgeKey = `${node.id}-${opt.id}`
              const edge = edgeMap.get(edgeKey)

              const wasRemoved = removedHandles.includes(opt.id)
              const stillConnected = !!edge

              if (wasRemoved && !stillConnected) {
                return { ...opt, payload: '' }
              }

              if (edge) {
                const targetNode = prevNodes.find(n => n.id === edge.target)
                if (!targetNode) return opt

                const isFeatureBlock = isFeatureBlockNode(targetNode)
                const payload = isFeatureBlock
                  ? (targetNode.data as FeatureBlockNodeData)?.name?.trim()
                  : targetNode.id

                if (payload && isMessengerSafePayload(payload)) {
                  return { ...opt, payload, type: 'postback' }
                }
              }

              return opt
            })

            return {
              ...node,
              data: {
                ...node.data,
                cards: [{ ...card, options: updatedOptions }],
              },
            }
          }

          return node
        })

        const validated = validateAllChains(updatedNodes, rawEdges)
        return validated
      })

      return rawEdges
    })
  }, [setNodes, setEdges])

  const [isMobileView, isBuilderBlurred] = useApplicationState(s => [
    s.view.mobile,
    s.builder.blurred,
  ])

  const [, setHasRestored] = useState(false)
  // const [hasRestored, setHasRestored] = useState(false)
  const user = useAuthStore(s => s.user)
  const userId = user?.id

  // ✅ Restore autosave on load
  useEffect(() => {
    if (!userId) return
    const restore = async () => {
      const result = await loadCanvasAutosave(userId)
      if (result) {
        setNodes(result.nodes)
        setEdges(result.edges)
      }
      setHasRestored(true)
    }
    restore()
  }, [userId])

  //  ✅ Autosave on canvas change
  // useEffect(() => {
  //   if (!userId || !hasRestored) return

  //   const timeout = setTimeout(() => {
  //     const payload = sanitizeCanvas({ nodes, edges })
  //     saveCanvasAutosave({ userId, ...payload })
  //   }, 5000)

  //   return () => clearTimeout(timeout)
  // }, [userId, hasRestored, nodes, edges])


  return (
    <div className="relative size-full bg-dark-400 dark:bg-dark-900 text-light-100 dark:text-light-100">
      <ReactFlow
        proOptions={{ hideAttribution: true }}
        nodeTypes={NODE_TYPES}
        edgeTypes={edgeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}  // ✅ This line fixes the red error
        onConnect={onConnect}
        onConnectEnd={handleOnEdgeDropConnectEnd}
        connectOnClick={true} // ✅ Enables tap-to-connect on mobile
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStop={(_, node) => autoAdjustNode(node)}

        onEdgesDelete={(edgesToDelete) => {
          const toDeleteIds = new Set(edgesToDelete.map(e => e.id))
          useCanvasStore.getState().setEdges(prev =>
            prev.filter(e => !toDeleteIds.has(e.id))
          )
        }}

        nodesDraggable={true}
        elementsSelectable={true}
        isValidConnection={isValidConnection}
        multiSelectionKeyCode={null}
        deleteKeyCode={deleteKeyCode}
        snapGrid={[16, 16]}
        snapToGrid
        minZoom={0.1}
        maxZoom={3}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        panOnScroll={false}
        panOnDrag
        onInit={(instance) => {
          setFlowReady(true) // ✅ show SnapshotViewer, enable export
          instance.setViewport({ x: 0, y: 0, zoom: 1 }) // ✅ reset zoom and position
        }}

      >
        <Background
          color={isMobileView ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'}
          gap={32}
        />

      </ReactFlow>
      <CustomControls />
      <div
        className={cn(
          'pointer-events-none absolute inset-0 backdrop-blur-5 transition-all',
          isBuilderBlurred
            ? 'opacity-100 bg-dark-500/30 dark:bg-dark-800/40 backdrop-saturate-80 pointer-events-auto'
            : 'opacity-0 bg-dark-800/0 dark:bg-dark-900/0 backdrop-saturate-100 pointer-events-none',
        )}
      >
        <div ref={floatingMenuWrapperRef} className="relative size-full">
          <AddNodeFloatingMenu onNodeAdd={handleAddConnectedNode} />
        </div>
      </div>

      {/* <FlowToolbar /> */}



      <SnapshotViewer />

    </div>
  )
}


