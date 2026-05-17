import type { Connection, Edge, EdgeChange, EdgeTypes, Node, NodeChange } from '@xyflow/react'
import {
  addEdge,
  applyEdgeChanges,
  Background,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { useCallback } from 'react'
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

// import { validateExportData } from '~/utils/exportFlow'

const edgeTypes: EdgeTypes = {
  deletable: CustomDeletableEdge,
}

export function FlowBuilderModule() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(defaultNodes)
  const [edges, setEdges] = useEdgesState<Edge>(defaultEdges)


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



const onConnect = useCallback((params: Connection) => {
  console.log('🧩 onConnect triggered:', params)
  const sourceHandle = params.sourceHandle

  const sourceNode = nodes.find(n => n.id === params.source)
  const targetNode = nodes.find(n => n.id === params.target)
  const target = params.target

  if (!sourceNode || !targetNode) {
    console.warn('⚠️ Missing source or target node — skipping connection')
    return
  }

  const sourceIsCarousel = sourceNode.type === 'feature-block' &&
    sourceNode.data?.blockType === 'carousel'

  const targetIsGenericTemplate = targetNode.type === 'generic-template'

  if (sourceIsCarousel && !targetIsGenericTemplate) {
    console.warn(`❌ Invalid connection: carousel block cannot link to ${targetNode.type}`)
    alert('⚠️ Carousel blocks can only connect to generic-template cards')
    return
  }

  console.log('✅ Passed connection guard — proceeding to create edge')

  const newEdge: Edge = {
    id: `edge-${params.source}-${params.sourceHandle}-${params.target}`,
    source: params.source,
    sourceHandle: params.sourceHandle ?? null,
    target: params.target,
    targetHandle: params.targetHandle ?? null,
    type: 'deletable',
  }

  console.log('🔗 Creating edge:', newEdge)

  // ✅ Auto-link payload for GenericTemplate → any node
  if (isGenericTemplateNode(sourceNode) && sourceHandle) {
    const cards = Array.isArray(sourceNode.data?.cards) ? sourceNode.data.cards : []
    const card = cards[0] ?? { options: [] }
    const options = Array.isArray(card.options) ? card.options as Option[] : []

    const optionIndex = options.findIndex(opt => opt?.id === sourceHandle)

    // ✅ Feature-blocks use name as payload
    const isFeatureBlock = isFeatureBlockNode(targetNode)
    const payload = isFeatureBlock
      ? (targetNode.data as FeatureBlockNodeData)?.name?.trim()
      : targetNode.id

    if (optionIndex !== -1 && payload) {
      setNodes(prevNodes =>
        prevNodes.map(node => {
          if (node.id === sourceNode.id) {
            const updatedOptions = [...options]

            if (!updatedOptions[optionIndex]?.payload?.trim()) {
              updatedOptions[optionIndex] = {
                ...updatedOptions[optionIndex],
                type: 'postback',
                payload,
              }
              console.log(`✅ Auto-linked payload to ${isFeatureBlock ? 'feature-block name' : 'node ID'}:`, payload)
            } else {
              console.warn(`⚠️ Skipping auto-link — option already has payload: ${updatedOptions[optionIndex].payload}`)
            }

            return {
              ...node,
              data: {
                ...node.data,
                cards: [{ ...card, options: updatedOptions }],
              },
            }
          }

          // ✅ Optional: set trigger for feature-block
          if (isFeatureBlock && node.id === target) {
            return {
              ...node,
              data: {
                ...node.data,
                trigger: payload,
              },
            }
          }

          return node
        })
      )
    } else {
      console.warn(`⚠️ No matching option found for sourceHandle: ${sourceHandle}`)
    }
  }

  // ✅ Add edge and validate chains
  const updatedEdges = addEdge(newEdge, edges)
  setEdges(updatedEdges)

  setNodes(prevNodes => {
    const updatedNodes = prevNodes.map(node => {
      if (node.type === 'feature-block' && node.id === params.source) {
        const data = node.data
        const paths = Array.isArray(data.paths) ? data.paths : []

        const updatedPaths = paths.map(path => {
          if (path.id === params.sourceHandle) {
            return {
              ...path,
              targetBlockId: params.target,
            }
          }
          return path
        })

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
          if (node) {
            autoAdjustNode(node)
          }
        }

        if (change.type === 'add') {
          handleAutoAdjustNodeAfterNodeMeasured(change.item.id)
        }
      })
    },
    [autoAdjustNode, nodes, handleAutoAdjustNodeAfterNodeMeasured, onNodesChange],
  )
    
  // const onEdgesChange = useCallback((changes: EdgeChange[]) => {
  //   setEdges(prevEdges => {
  //     const updatedEdges = applyEdgeChanges(changes, prevEdges)

  //     console.log('🔄 Edge changes:', changes)
  //     console.log('📎 Updated edges:', updatedEdges)


  //     const removedHandles = changes
  //       .filter(change => change.type === 'remove')
  //       .map(change => {
  //         const edge = prevEdges.find(e => e.id === change.id)
  //         return edge?.sourceHandle
  //       })
  //       .filter(Boolean) as string[]

  //     setNodes(prevNodes => {
  //       const updatedNodes = prevNodes.map(node => {
  //         if (node.type === 'feature-block') {
  //           const data = node.data as FeatureBlockNodeData
  //           const paths = Array.isArray(data.paths) ? data.paths : []

  //           const updatedPaths = paths.map(path => {
  //             if (removedHandles.includes(path.id)) {
  //               console.log(`❌ Path ${path.id} was removed — skipping`)
  //               return null
  //             }

  //             const edge = updatedEdges.find(e =>
  //               e.source === node.id &&
  //               typeof e.sourceHandle === 'string' &&
  //               e.sourceHandle === path.id
  //             )

  //             if (edge) {
  //               console.log(`✅ Path ${path.id} matched edge → targetBlockId: ${edge.target}`)
  //             } else {
  //               console.warn(`⚠️ Path ${path.id} has no matching edge — targetBlockId will be null`)
  //             }

  //             return {
  //               ...path,
  //               targetBlockId: edge?.target ?? null,
  //             }
  //           }).filter(Boolean)

  //           return {
  //             ...node,
  //             data: {
  //               ...data,
  //               paths: updatedPaths,
  //             },
  //           }
  //         }

  //         return node
  //       })

  //       const validated = validateAllChains(updatedNodes, updatedEdges)
  //       return validated
  //     })

  //     return updatedEdges
  //   })
  // }, [setNodes])


    //  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    //   setEdges(prevEdges => {
    //     const updatedEdges = applyEdgeChanges(changes, prevEdges)

    //     // ✅ Use latest nodes from state
    //     setNodes(prevNodes => {
    //       const validated = validateAllChains(prevNodes, updatedEdges)
    //       console.log('🔁 Updated nodes after edge change:', validated.map(n => ({
    //         id: n.id,
    //         is_active: n.data?.is_active,
    //       })))
    //       return validated
    //     })

    //     return updatedEdges
    //   })
    // }, [setNodes])



const onEdgesChange = useCallback((changes: EdgeChange[]) => {
  setEdges(prevEdges => {
    const updatedEdges = applyEdgeChanges(changes, prevEdges)

    // ✅ Detect removed edges
    const removedHandles = changes
      .filter(change => change.type === 'remove')
      .map(change => {
        const edge = prevEdges.find(e => e.id === change.id)
        return edge?.sourceHandle
      })
      .filter(Boolean) as string[]

    // ✅ Use latest nodes from state
    setNodes(prevNodes => {
      const updatedNodes = prevNodes.map(node => {
          if (node.type === 'feature-block') {
            const data = node.data as FeatureBlockNodeData
            const paths = Array.isArray(data.paths) ? data.paths : []

            const updatedPaths = paths.map(path => {
              if (removedHandles.includes(path.id)) {
                return {
                  ...path,
                  targetBlockId: null, // ✅ disconnect but keep path
                }
              }

              const edge = updatedEdges.find(e =>
                e.source === node.id &&
                typeof e.sourceHandle === 'string' &&
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
                ...data,
                paths: updatedPaths,
              },
            }
          }

          if (node.type === 'generic-template') {
            type Option = {
              id: string
              label_en?: string
              label_kh?: string
              type?: string
              payload?: string
            }

            const cards = Array.isArray(node.data?.cards) ? node.data.cards : []
            const card = cards[0] ?? { options: [] }
            const options = Array.isArray(card.options) ? card.options as Option[] : []

            const updatedOptions = options.map(opt => {
              if (removedHandles.includes(opt.id)) {
                return {
                  ...opt,
                  payload: '', // ✅ disconnect but keep option
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

        // ✅ Revalidate chains and update is_active
        const validated = validateAllChains(updatedNodes, updatedEdges)

        console.log('🔁 Updated nodes after edge change:', validated.map(n => ({
          id: n.id,
          is_active: n.data?.is_active,
        })))

        return validated
      })

      return updatedEdges
    })
  }, [setNodes])


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

    {nodes.length === 0 && (
      <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-light-100/40 pointer-events-none z-50">
        <p className="text-center text-sm leading-relaxed">
          🧩 No nodes yet.<br />
          Try dragging one from the sidebar.
        </p>
      </div>
    )}

    <div className="absolute top-2 right-4 z-50 text-xs text-light-900/60 dark:text-light-100/60">
      Zoom: {zoomPercent}%
    </div>
  </div>
)

}
