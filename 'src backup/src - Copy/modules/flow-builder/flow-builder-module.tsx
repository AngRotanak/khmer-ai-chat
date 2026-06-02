import type { Connection, Edge, EdgeChange, EdgeTypes, Node, NodeChange } from '@xyflow/react'
import {
  addEdge,
  applyEdgeChanges,
  Background,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '~@/utils/cn'

import AddNodeFloatingMenu from '~/modules/flow-builder/components/add-node-floating-menu/add-node-floating-menu'
import CustomControls from '~/modules/flow-builder/components/controls/custom-controls'
import CustomDeletableEdge from '~/modules/flow-builder/components/edges/custom-deletable-edge'
import { defaultEdges, defaultNodes } from '~/modules/flow-builder/constants/default-nodes-edges'

import { useAddNodeOnEdgeDrop } from '~/modules/flow-builder/hooks/use-add-node-on-edge-drop'
import { useDeleteKeyCode } from '~/modules/flow-builder/hooks/use-delete-key-code'
import { useDragDropFlowBuilder } from '~/modules/flow-builder/hooks/use-drag-drop-flow-builder'
import { useIsValidConnection } from '~/modules/flow-builder/hooks/use-is-valid-connection'
import { useNodeAutoAdjust } from '~/modules/flow-builder/hooks/use-node-auto-adjust'
import { useOnNodesDelete } from '~/modules/flow-builder/hooks/use-on-nodes-delete'
import { NODE_TYPES } from '~/modules/nodes'
import { useApplicationState } from '~/stores/application-state'
import { FlowToolbar } from '~/modules/flow-builder/components/toolbar/flow-toolbar'
import { validateAllChains } from '~/utils/flowLogic'
import {isGenericTemplateNode, isFeatureBlockNode  } from '~/modules/nodes/utils'
import type {FeatureBlockNodeData} from '~/modules/nodes/types'
import { useCanvasStore } from '~/stores/canvas-store'
import { useReactFlow } from '@xyflow/react' // ✅ correct

// import { validateExportData } from '~/utils/exportFlow'


const edgeTypes: EdgeTypes = {
  deletable: CustomDeletableEdge,
}


 function sanitizeNodes(raw: Node[]): Node[] {
  const cloned = JSON.parse(JSON.stringify(raw))
  return Array.isArray(cloned)
    ? cloned.filter(n =>
        n &&
        typeof n.id === 'string' &&
        typeof n.position?.x === 'number' &&
        typeof n.position?.y === 'number' &&
        typeof n.data === 'object'
      )
    : []
}

function sanitizeEdges(raw: Edge[]): Edge[] {
  const cloned = JSON.parse(JSON.stringify(raw))
  return Array.isArray(cloned)
    ? cloned.filter(e =>
        e &&
        typeof e.id === 'string' &&
        typeof e.source === 'string' &&
        typeof e.target === 'string'
      )
    : []
}


export function FlowBuilderModule() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(defaultNodes)
  const [edges, setEdges] = useEdgesState<Edge>(defaultEdges)

  const { getNodes, getEdges } = useReactFlow()

  const [flowReady, setFlowReady] = useState(false)


  const deleteKeyCode = useDeleteKeyCode()
  const onNodesDelete = useOnNodesDelete(nodes)
  const autoAdjustNode = useNodeAutoAdjust()
  const [onDragOver, onDrop] = useDragDropFlowBuilder()
  const isValidConnection = useIsValidConnection(nodes, edges)
  // const { getNodes } = useReactFlow()



  const {
    handleOnEdgeDropConnectEnd,
    floatingMenuWrapperRef,
    handleAddConnectedNode,
  } = useAddNodeOnEdgeDrop(setEdges, setNodes)

  const zoomPercent = Math.round(0.8 * 100)

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

  // ✅ Auto-link payload for generic-template → any node
  if (isGenericTemplateNode(sourceNode) && sourceHandle) {
    const cards = Array.isArray(sourceNode.data?.cards) ? sourceNode.data.cards : []
    const card = cards[0] ?? { options: [] }
    const options = Array.isArray(card.options) ? card.options as Option[] : []

    const optionIndex = options.findIndex(opt => opt?.id === sourceHandle)
    const isFeatureBlock = isFeatureBlockNode(targetNode)
    const rawPayload = isFeatureBlock
      ? (targetNode.data as FeatureBlockNodeData)?.name
      : targetNode.id

    const payload = typeof rawPayload === 'string' ? rawPayload.trim() : ''

    // ❗ Reject connection if feature-block has no name
    if (isFeatureBlock && !payload) {
      alert('⚠️ Cannot connect: target feature-block is missing a name. Please set a name before connecting.')
      console.warn(`❌ Connection rejected — target feature-block "${targetNode.id}" has no name`)
      return // ⛔ Exit early — no edge, no node update
    }

    if (optionIndex !== -1 && payload && isMessengerSafePayload(payload)) {
      setNodes(prevNodes =>
        prevNodes.map(node => {
          if (node.id === sourceNode.id) {
            const updatedOptions = [...options]
            updatedOptions[optionIndex] = {
              ...updatedOptions[optionIndex],
              type: 'postback',
              payload,
            }
            console.log(`🔁 Overwrote payload with auto-link:`, payload)

            return {
              ...node,
              data: {
                ...node.data,
                cards: [{ ...card, options: updatedOptions }],
              },
            }
          }

          if (isFeatureBlock && node.id === target) {
            return {
              ...node,
              data: {
                ...node.data,
                trigger: payload,
                is_deep_target: true,
              },
            }
          }

          return node
        })
      )
    } else {
      console.warn(`⚠️ No matching option or invalid payload for sourceHandle: ${sourceHandle}`)
    }
  }

  const updatedEdges = addEdge(newEdge, edges)
  setEdges(updatedEdges)

  setNodes(prevNodes => {
    const updatedNodes = prevNodes.map(node => {
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

    return validateAllChains(updatedNodes, updatedEdges)
  })
}, [nodes, edges, setEdges, setNodes])

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
    onNodesChange(changes)

    changes.forEach(change => {
      if (change.type === 'dimensions') {
        const node = nodes.find(n => n.id === change.id)
        if (node) autoAdjustNode(node)
      }

      if (change.type === 'add') {
        handleAutoAdjustNodeAfterNodeMeasured(change.item.id)
      }
    })

    const validNodes = sanitizeNodes(getNodes())
    useCanvasStore.getState().setNodes(validNodes)
  },
  [onNodesChange, nodes, autoAdjustNode, handleAutoAdjustNodeAfterNodeMeasured, getNodes]
)

const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
  const updatedEdges = applyEdgeChanges(changes, edges)
  setEdges(updatedEdges)

  const rawNodes = getNodes()
  const rawEdges = getEdges()

  const removedHandles = changes
    .filter(change => change.type === 'remove')
    .map(change => {
      const edge = edges.find(e => e.id === change.id)
      return edge?.sourceHandle
    })
    .filter(Boolean) as string[]

  const updatedNodes = rawNodes.map(node => {
    if (node.type === 'feature-block') {
      const data = node.data as FeatureBlockNodeData
      const paths = Array.isArray(data.paths) ? data.paths : []

      const updatedPaths = paths.map(path => {
        if (removedHandles.includes(path.id)) {
          return { ...path, targetBlockId: null }
        }

        const edge = updatedEdges.find(e =>
          e.source === node.id &&
          e.sourceHandle === path.id
        )

        return {
          ...path,
          targetBlockId: edge?.target ?? path.targetBlockId,
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
        const wasRemoved = removedHandles.includes(opt.id)
        const hadEdge = updatedEdges.some(e =>
          e.source === node.id &&
          e.sourceHandle === opt.id
        )

        if (wasRemoved && !hadEdge) {
          return { ...opt, payload: '' }
        }

        const edge = updatedEdges.find(e =>
          e.source === node.id &&
          e.sourceHandle === opt.id
        )

        if (edge) {
          const targetNode = rawNodes.find(n => n.id === edge.target)
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

  const validated = validateAllChains(updatedNodes, updatedEdges)

  useCanvasStore.getState().setNodes(validated)
  useCanvasStore.getState().setEdges(updatedEdges)
}, [edges, getNodes, getEdges])

  const [isMobileView, isBuilderBlurred] = useApplicationState(s => [
    s.view.mobile,
    s.builder.blurred,
  ])



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
        onNodesDelete={onNodesDelete}
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
        onInit={() => setFlowReady(true)}
        // onInit={({ setViewport }) => setViewport({ x: 0, y: 0, zoom: 1 })}
      
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

    <FlowToolbar />

    {/* <div className="absolute bottom-4 right-4 z-[9999] flex gap-x-2">
      <button onClick={handleExport} className="bg-teal-700 dark:bg-teal-600 text-white px-3 py-1 rounded shadow hover:bg-teal-800 dark:hover:bg-teal-500 transition">
        Export Charts
      </button>
      <button
        onClick={() => {
          const exportData = buildFlowExport(nodes, edges)
          console.log('📦 Export Preview:', exportData)
        }}
        className="bg-dark-300 dark:bg-dark-700 text-light-100 dark:text-light-100 px-3 py-1 rounded shadow hover:bg-dark-400 dark:hover:bg-dark-600 transition"
      >
        Preview Export
      </button>
      
    </div> */}

    {/* {nodes.length === 0 && (
      <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-light-100/40 pointer-events-none z-10">
        <p className="text-center text-sm leading-relaxed">
          🧩 No nodes yet.<br />
          Try dragging one from the sidebar.
        </p>
      </div>
    )} */}
    <div className="absolute top-2 right-4 z-50 text-xs text-light-900/60 dark:text-light-100/60">
      Zoom: {zoomPercent}%
    </div>

{/* <button
  onClick={() => {
    const preview = nodes
      .filter(n => n.type === 'feature-block' && n.data?.is_active)
      .map(n => ({
        id: n.id,
        name: n.data?.name,
        trigger: n.data?.trigger,
      }))

    console.log('🔮 Messenger Preview Chain:', preview)
    alert('🔮 Preview chain logged to console')
  }}
  className="absolute bottom-4 left-4 z-50 bg-teal-600 text-white px-3 py-1 rounded shadow hover:bg-teal-700 transition"
>
  Preview Messenger Chain
</button> */}


  </div>
  )
}
