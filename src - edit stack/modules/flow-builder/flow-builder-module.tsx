import type { Connection, Edge, EdgeChange, EdgeTypes, NodeChange } from '@xyflow/react'
import {
  addEdge,
  applyEdgeChanges,
  Background,
  ReactFlow,
} from '@xyflow/react'
import { useCallback } from 'react'
import { cn } from '~@/utils/cn'

import AddNodeFloatingMenu from '~/modules/flow-builder/components/add-node-floating-menu/add-node-floating-menu'
import CustomControls from '~/modules/flow-builder/components/controls/custom-controls'
import CustomDeletableEdge from '~/modules/flow-builder/components/edges/custom-deletable-edge'
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
import { isGenericTemplateNode, isFeatureBlockNode } from '~/modules/nodes/utils'
import { useCanvasStore } from '~/stores/canvas-store'
import type { Option } from '~/modules/nodes/types'


const edgeTypes: EdgeTypes = {
  deletable: CustomDeletableEdge,
}

export function FlowBuilderModule() {
  const { nodes, setNodes, edges, setEdges } = useCanvasStore()

  const deleteKeyCode = useDeleteKeyCode()
  const onNodesDelete = useOnNodesDelete(nodes)
  const autoAdjustNode = useNodeAutoAdjust()
  const [onDragOver, onDrop] = useDragDropFlowBuilder()
  const isValidConnection = useIsValidConnection(nodes, edges)

  const {
    handleOnEdgeDropConnectEnd,
    floatingMenuWrapperRef,
    handleAddConnectedNode,
  } = useAddNodeOnEdgeDrop(setEdges, setNodes)

  const zoomPercent = Math.round(0.8 * 100)

  const isMessengerSafePayload = (id: string): boolean =>
    typeof id === 'string' &&
    id.trim() !== '' &&
    !id.startsWith('_') &&
    !id.includes('#') &&
    !id.includes('/') &&
    !id.includes('[') &&
    !id.includes(']')

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
    [autoAdjustNode, nodes]
  )

const handleNodesChange = useCallback((changes: NodeChange[]) => {
  const updatedNodes = [...nodes]

  changes.forEach(change => {
    if (!('id' in change) || typeof change.id !== 'string') return

    const index = updatedNodes.findIndex(n => n.id === change.id)
    if (index === -1) return

    if (change.type === 'dimensions') {
      autoAdjustNode(updatedNodes[index])
    }

    if (change.type === 'position' && change.position) {
      updatedNodes[index] = {
        ...updatedNodes[index],
        position: change.position,
      }
    }

    // You can add more types here if needed
  })

  setNodes(validateAllChains(updatedNodes, edges))
}, [nodes, edges, setNodes, autoAdjustNode])



  const onConnect = useCallback((params: Connection) => {
    const sourceNode = nodes.find(n => n.id === params.source)
    const targetNode = nodes.find(n => n.id === params.target)
    const sourceHandle = params.sourceHandle
    const target = params.target

    if (!sourceNode || !targetNode) return

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

    if (isGenericTemplateNode(sourceNode) && sourceHandle) {
      const cards = Array.isArray(sourceNode.data?.cards) ? sourceNode.data.cards : []
      const card = cards[0] ?? { options: [] }
      const options = Array.isArray(card.options) ? card.options : []

      const optionIndex = options.findIndex(opt => opt?.id === sourceHandle)
      const isFeatureBlock = isFeatureBlockNode(targetNode)
      const rawPayload = isFeatureBlock
        ? targetNode.data?.name
        : targetNode.id

      const payload = typeof rawPayload === 'string' ? rawPayload.trim() : ''

      if (isFeatureBlock && !payload) {
        alert('⚠️ Cannot connect: target feature-block is missing a name.')
        return
      }

      if (optionIndex !== -1 && payload && isMessengerSafePayload(payload)) {
        const updatedNodes = nodes.map(node => {
          // ✅ Update source generic-template node
          if (node.id === sourceNode.id) {
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

          // ✅ Update target feature-block node
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

        setNodes(validateAllChains(updatedNodes, edges))
      }

    }

    const updatedEdges = addEdge(newEdge, edges)
    setEdges(updatedEdges)

    const updatedNodes = nodes.map(node => {
      if (node.type === 'feature-block' && node.id === params.source) {
        const paths = Array.isArray(node.data?.paths) ? node.data.paths : []

        const updatedPaths = paths.map(path =>
          path.id === sourceHandle
            ? { ...path, targetBlockId: target }
            : path
        )

        return {
          ...node,
          data: {
            ...node.data,
            paths: updatedPaths,
          },
        }
      }

      return node
    })

    setNodes(validateAllChains(updatedNodes, updatedEdges))


  }, [nodes, edges, setNodes, setEdges])


const onEdgesChange = useCallback((changes: EdgeChange[]) => {
  const updatedEdges = applyEdgeChanges(changes, edges)

  const removedHandles = changes
    .filter(change => change.type === 'remove')
    .map(change => {
      const edge = edges.find(e => e.id === change.id)
      return edge?.sourceHandle
    })
    .filter(Boolean) as string[]

  const updatedNodes = nodes.map(node => {
    // ✅ Update feature-block paths
    if (node.type === 'feature-block') {
      const paths = Array.isArray(node.data?.paths) ? node.data.paths : []

      const updatedPaths = paths.map(path => {
        if (!path || typeof path.id !== 'string') return path

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
        data: {
          ...node.data,
          paths: updatedPaths,
        },
      }
    }

    // ✅ Update generic-template option payloads
    if (node.type === 'generic-template') {
      const cards = Array.isArray(node.data?.cards) ? node.data.cards : []
      const card = cards[0] ?? { options: [] }
      const options = Array.isArray(card.options) ? card.options as Option[] : []

      const updatedOptions: Option[] = options.map(opt => {
        if (!opt || typeof opt.id !== 'string') return opt

        const wasRemoved = removedHandles.includes(opt.id)
        const stillLinked = updatedEdges.some(e =>
          e.source === node.id &&
          e.sourceHandle === opt.id
        )

        if (wasRemoved && !stillLinked) {
          return { ...opt, payload: '' }
        }

        const edge = updatedEdges.find(e =>
          e.source === node.id &&
          e.sourceHandle === opt.id
        )

        if (edge) {
          const targetNode = nodes.find(n => n.id === edge.target)
          if (!targetNode) return opt

          const isFeatureBlock = isFeatureBlockNode(targetNode)
          const rawPayload = isFeatureBlock
            ? targetNode.data?.name
            : targetNode.id

          const payload = typeof rawPayload === 'string' ? rawPayload.trim() : ''

          const isMessengerSafePayload = (id: string): boolean =>
            typeof id === 'string' &&
            id.trim() !== '' &&
            !id.startsWith('_') &&
            !id.includes('#') &&
            !id.includes('/') &&
            !id.includes('[') &&
            !id.includes(']')

          if (payload && isMessengerSafePayload(payload)) {
            return {
              ...opt,
              payload,
              type: 'postback',
            }
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

  setEdges(updatedEdges)
  setNodes(validateAllChains(updatedNodes, updatedEdges))
}, [nodes, edges, setNodes, setEdges])


  const [isMobileView, isBuilderBlurred] = useApplicationState(s => [
    s.view.mobile,
    s.builder.blurred,
  ])


// useEffect(() => {
//   const rawPaths = extractFeatureBlockPaths(nodes)
//   const sortedPaths = sortPathsByOrder(rawPaths)
//   const disconnected = filterDisconnectedPaths(sortedPaths)

//   console.log('📦 Final sorted paths for export:', sortedPaths)
//   console.log('🚫 Disconnected paths:', disconnected)
//   console.log('📦 Final sorted paths for export:', JSON.stringify(sortedPaths, null, 2))

// }, [nodes])

// useEffect(() => {
//   const payload = buildExportPayload(nodes)
//   console.log('📦 Final export payload:', payload)
// }, [nodes])



  // const handleExport = async () => {
  // const exportData = buildFlowExport(nodes, edges)
  // // const validation = validateExportData(nodes, edges)

  //   // if (!validation.valid) {
  //   //   alert(`❌ Cannot export: ${validation.reason}`)
  //   //   return
  //   // }

  //   try {
  //     await syncFlowToFirebase(exportData)
  //     alert('✅ Flow synced to Firebase successfully!')
  //   } catch (err) {
  //     console.error('❌ Firebase sync failed:', err)
  //     alert('❌ Failed to sync flow to Firebase')
  //   }
  // }


  
  // return (
  //   <div className="relative size-full">
  //     <ReactFlow
  //       proOptions={{ hideAttribution: true }}
  //       nodeTypes={NODE_TYPES}
  //       edgeTypes={edgeTypes}
  //       nodes={nodes}
  //       edges={edges}
  //       onNodesChange={handleNodesChange}
  //       onEdgesChange={onEdgesChange}  // ✅ This line fixes the red error
  //       onConnect={onConnect}
  //       onConnectEnd={handleOnEdgeDropConnectEnd}
  //       connectOnClick={true} // ✅ Enables tap-to-connect on mobile
  //       onDrop={onDrop}
  //       onDragOver={onDragOver}
  //       onNodeDragStop={(_, node) => autoAdjustNode(node)}
  //       onNodesDelete={onNodesDelete}
  //       isValidConnection={isValidConnection}
  //       multiSelectionKeyCode={null}
  //       deleteKeyCode={deleteKeyCode}
  //       snapGrid={[16, 16]}
  //       snapToGrid
  //       minZoom={0.1}
  //       maxZoom={3}
  //       zoomOnScroll
  //       zoomOnPinch
  //       zoomOnDoubleClick={false}
  //       panOnScroll={false}
  //       panOnDrag
  //       onInit={({ setViewport }) => setViewport({ x: 0, y: 0, zoom: 1 })}
  //     >
  //       <Background
  //         color={isMobileView ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'}
  //         gap={32}
  //       />
  //       <CustomControls />
  //      </ReactFlow>

  //     <div
  //       className={cn(
  //         'pointer-events-none absolute inset-0 backdrop-blur-5 transition-all',
  //         isBuilderBlurred && 'op-100 bg-dark-500/30 backdrop-saturate-80 pointer-events-auto',
  //         !isBuilderBlurred && 'op-0 bg-dark-800/0 backdrop-saturate-100 pointer-events-none',
  //       )}
  //     >
  //       <div ref={floatingMenuWrapperRef} className="relative size-full">
  //         <AddNodeFloatingMenu onNodeAdd={handleAddConnectedNode} />
  //       </div>
  //     </div>

  //     <FlowToolbar />

  //     {/* <button
  //       onClick={async () => {
  //         const flowData = await loadFlowFromFirebase()
  //         const { nodes: importedNodes, edges: importedEdges } = convertFirebaseToCanvas(flowData)
  //         setNodes(importedNodes)
  //         setEdges(importedEdges)
  //         alert('✅ Flow imported from Firebase!')
  //       }}
  //       className="btn btn-secondary ml-2"
  //     >
  //       Import Flow
  //     </button> */}


  //     <div className="absolute bottom-4 right-4 z-[9999]">

  //     <button onClick={handleExport} className="btn btn-primary">
  //       Export Charts
  //     </button>
       

  //       <button
  //         onClick={() => {
  //           const exportData = buildFlowExport(nodes, edges)
  //           console.log('📦 Export Preview:', exportData)
  //         }}
  //         className="btn btn-secondary ml-2"
  //       >
  //         Preview Export
  //       </button>



  //       {/* <button
  //         onClick={() => {
  //           const exportData = {
  //             flowId: 'welcome-flow',
  //             timestamp: new Date().toISOString(),
  //             chains: getButtonChains(nodes, edges),
  //           }

  //           const blob = new Blob([JSON.stringify(exportData, null, 2)], {
  //             type: 'application/json',
  //           })

  //           const url = URL.createObjectURL(blob)
  //           const a = document.createElement('a')
  //           a.href = url
  //           a.download = 'chains.json'
  //           a.click()
  //           URL.revokeObjectURL(url)
  //         }}
  //         className="bg-indigo-600 text-white px-3 py-1 rounded shadow-lg hover:bg-indigo-700 transition"
  //       >
  //         📤 Export Chains
  //       </button> */}

  //     </div>

  //     {nodes.length === 0 && (
  //       <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none z-50">
  //         <p className="text-center text-sm leading-relaxed">
  //           🧩 No nodes yet.<br />
  //           Try dragging one from the sidebar.
  //         </p>
  //       </div>

  //     )}

  //     <div className="absolute top-2 right-4 z-50 text-xs text-light-900/60">
  //       Zoom: {zoomPercent}%
  //     </div>
  //   </div>
  // )


// useEffect(() => {
//   const fallbackExists = nodes.some(n => n.id === 'fallback-block')
//   const unreachable = nodes.filter(n =>
//     n.type === 'feature-block' &&
//     !n.data?.is_active &&
//     n.id !== 'fallback-block'
//   )

//   console.log('🚫 Unreachable blocks:', unreachable.map(n => n.id))
//   console.log('🛟 Fallback exists:', fallbackExists)

//   if (unreachable.length > 0 && !fallbackExists) {
//     const fallbackNode: Node = {
//       id: 'fallback-block',
//       type: 'feature-block',
//       position: { x: 100, y: 100 },
//       data: {
//         name: 'fallback',
//         blockType: 'text',
//         text: {
//           en: 'Sorry, something went wrong.',
//           kh: 'សូមអភ័យទោស មានបញ្ហាមួយកើតឡើង។',
//         },
//         is_active: true,
//       },
//     }

//     setNodes(prev => {
//       const alreadyExists = prev.some(n => n.id === 'fallback-block')
//       return alreadyExists ? prev : [...prev, fallbackNode]
//     })

//     console.log('✅ Injected fallback block')
//   }
// }, [nodes, edges])


  return (
  <div className="relative size-full bg-dark-400 dark:bg-dark-900 text-light-100 dark:text-light-100">
    <ReactFlow
        proOptions={{ hideAttribution: true }}
        nodeTypes={NODE_TYPES}
        edgeTypes={edgeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}  // ✅ This line fixes the red error
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
        onInit={({ setViewport }) => setViewport({ x: 0, y: 0, zoom: 1 })}
      
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
