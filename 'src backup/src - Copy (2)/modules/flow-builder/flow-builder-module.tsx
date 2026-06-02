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
import { useCanvasStore } from '~/stores/canvas-store'
import { applyNodeChanges } from '@xyflow/react'
import { sanitizeNodes, sanitizeEdges } from '~/modules/flow-builder/constants/default-nodes-edges' // or wherever you define them
import { loadCanvasAutosave } from '~/utils/loadCanvasAutosave'
import { updatePathPayloadByNodeId } from '~/helpers/payload-utils'


import type {
  FeatureBlock,
  PathItem,
} from '~/modules/blocks/types/feature-block'

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
    console.log('🧩 onConnect triggered:', params);

    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    const sourceHandle = params.sourceHandle;
    const target = params.target;

    if (!sourceNode || !targetNode) {
      console.warn('⚠️ Missing source or target node — skipping connection');
      return;
    }

    const sourceIsCarousel = sourceNode.type === 'feature-block' &&
      sourceNode.data?.blockType === 'carousel';

    const targetIsGenericTemplate = targetNode.type === 'generic-template';

    if (sourceIsCarousel && !targetIsGenericTemplate) {
      alert('⚠️ Carousel blocks can only connect to generic-template cards');
      return;
    }

    const newEdge: Edge = {
      id: `edge-${params.source}-${params.sourceHandle}-${params.target}`,
      source: params.source,
      sourceHandle: sourceHandle ?? null,
      target: params.target,
      targetHandle: params.targetHandle ?? null,
      type: 'deletable',
    };

    const currentNodes = useCanvasStore.getState().nodes;
    const currentEdges = useCanvasStore.getState().edges;

    const isFeatureBlock = isFeatureBlockNode(targetNode);
    const rawPayload = isFeatureBlock
      ? (targetNode.data as FeatureBlock)?.name
      : targetNode.id;

    const payload = typeof rawPayload === 'string' ? rawPayload.trim() : '';

    const updatedNodes = currentNodes.map(node => {
      // ✅ Update generic-template payload
      if (isGenericTemplateNode(sourceNode) &&
        node.id === sourceNode.id &&
        sourceHandle &&
        Array.isArray(sourceNode.data?.cards)) {

        const cards = sourceNode.data.cards;
        const card = cards[0] ?? { options: [] };
        const options = Array.isArray(card.options) ? card.options as Option[] : [];
        const optionIndex = options.findIndex(opt => opt?.id === sourceHandle);

        if (optionIndex !== -1 && payload && isMessengerSafePayload(payload)) {
          const updatedOptions = [...options];
          updatedOptions[optionIndex] = {
            ...updatedOptions[optionIndex],
            type: 'postback',
            payload,
          };

          return {
            ...node,
            data: {
              ...node.data,
              cards: [{ ...card, options: updatedOptions }],
            },
          };
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
        };
      }

      // ✅ Only update feature-block nodes with canvas
      if (node.type !== 'feature-block') return node;

      const safeCanvas = parseCanvasSafely(node.data?.canvas);
      const updatedCanvasPaths = safeCanvas.paths.map(path => {
        const match =
          path.id === sourceHandle ||
          path.sourceHandle === sourceHandle ||
          path.template_ref === sourceHandle;

        if (!match) return path;

        let autoLinkedPayload: PathItem['payload'] = undefined;
        let payloadStatus = '⛔ No payload linked';



        if (targetNode.type === 'text-message' || targetNode.type === 'generic-template') {
          autoLinkedPayload = {
            node_id: targetNode.id,
            template_type: targetNode.type,
            lang: 'en'
          };
          payloadStatus = `✅ Linked directly to ${targetNode.type} node`;
        } else if (isFeatureBlock) {
          const targetCanvas = parseCanvasSafely(targetNode.data?.canvas);
          const firstPath = targetCanvas.paths?.[0];

          if (firstPath?.template_ref && firstPath?.blockType) {
            const messageNode = currentNodes.find(n =>
              n.type === firstPath.blockType &&
              n.data?.template_ref === firstPath.template_ref
            );

            if (messageNode && typeof messageNode.type === 'string') {
              autoLinkedPayload = {
                node_id: messageNode.id,
                template_type: messageNode.type,
                lang: 'en'
              };
              payloadStatus = `✅ Auto-linked to message node ${messageNode.id}`;
            } else {
              payloadStatus = messageNode
                ? `⚠️ messageNode.type is missing or invalid for node ${messageNode.id}`
                : `⚠️ No message node found for template_ref "${firstPath.template_ref}"`;
            }
          } else {
            payloadStatus = '⚠️ Missing template_ref or blockType in target canvas';
          }
        }

        console.log(`🧩 Path ${path.id} payload status: ${payloadStatus}`);

        return {
          ...path,
          targetBlockId: target,
          payload: autoLinkedPayload ?? path.payload
        };

      });

      return {
        ...node,
        data: {
          ...node.data,
          canvas: {
            ...safeCanvas,
            paths: updatedCanvasPaths
          }
        }
      };
    });

    const validated = validateAllChains(updatedNodes, [...currentEdges, newEdge]);

    useCanvasStore.getState().setNodes(validated);
    useCanvasStore.getState().setEdges([...currentEdges, newEdge]);

    console.groupCollapsed('📊 Payload Link Report — onConnect');
    console.log('🔗 Connection:', {
      sourceNodeId: sourceNode.id,
      sourceHandle,
      targetNodeId: targetNode.id,
      targetType: targetNode.type,
    });

    validated.forEach(node => {
      if (node.type !== 'feature-block') return;

      const safeCanvas = parseCanvasSafely(node.data?.canvas);
      const blockName = node.data?.block_name || node.id;

      console.group(`🧩 FeatureBlock: ${blockName} (${node.id})`);

      safeCanvas.paths.forEach(path => {
        const isLinked = path.targetBlockId === targetNode.id;
        const isMessengerSafe =
          typeof path.payload === 'object' &&
          typeof path.payload.node_id === 'string' &&
          typeof path.payload.template_type === 'string';

        const status = isLinked
          ? isMessengerSafe
            ? '✅ Linked + Messenger-safe'
            : '⚠️ Linked but payload malformed'
          : '⛔ Not linked';

        console.log(`🛣️ Path ${path.id}`, {
          status,
          template_ref: path.template_ref,
          targetBlockId: path.targetBlockId,
          payload: path.payload,
        });
      });

      console.groupEnd();
    });

    console.groupEnd();
  }, [nodes, edges]);


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

      // ✅ Use latest node state from store
      const currentNodes = useCanvasStore.getState().nodes
      const updatedNodes = currentNodes.map(node => {
        if (node.type === 'feature-block') {
          const data = node.data as FeatureBlock
          const paths = Array.isArray(data.canvas?.paths) ? data.canvas.paths : []

          const updatedPaths = paths.map(path => {
            const edgeKey = `${node.id}-${path.id}`
            const edge = edgeMap.get(edgeKey)

            const wasRemoved = removedHandles.includes(path.id)
            const stillConnected = !!edge

            let updatedPayload = path.payload
            let targetBlockId = path.targetBlockId

            const targetNode = edge ? currentNodes.find(n => n.id === edge.target) : null



            const isValidTarget = targetNode && (
              targetNode.type === 'text-message' || targetNode.type === 'generic-template'
            )

            if (wasRemoved && !stillConnected) {
              updatedPayload = undefined
              targetBlockId = null
              console.log(`⚠️ Payload cleared for path ${path.id} — target invalid or removed`)
            }

            if (isValidTarget) {
              const safeType =
                targetNode.type === 'text-message' || targetNode.type === 'generic-template'
                  ? targetNode.type
                  : undefined

              if (safeType) {
                updatedPayload = {
                  node_id: targetNode.id,
                  template_type: safeType,
                  lang: 'en',
                }

                console.log(`✅ Re-linked payload for path ${path.id} → node ${targetNode.id} (${safeType})`)
              } else {
                updatedPayload = undefined
                console.warn(`⚠️ Skipped payload for path ${path.id} — invalid target type: ${targetNode.type}`)
              }
            }


            return {
              ...path,
              targetBlockId: wasRemoved ? null : edge?.target ?? path.targetBlockId,
              payload: updatedPayload,
            }
          })

          return {
            ...node,
            data: { ...data, canvas: { ...data.canvas, paths: updatedPaths } },
            updatedAt: Date.now(), // ✅ force reactivity
          }
        }

        // if (node.type === 'generic-template') {
        //   const cards = Array.isArray(node.data?.cards) ? node.data.cards : []
        //   const card = cards[0] ?? { options: [] }
        //   const options = Array.isArray(card.options) ? card.options as Option[] : []

        //   const updatedOptions = options.map(opt => {
        //     const edgeKey = `${node.id}-${opt.id}`
        //     const edge = edgeMap.get(edgeKey)

        //     const wasRemoved = removedHandles.includes(opt.id)
        //     const stillConnected = !!edge

        //     if (wasRemoved && !stillConnected) {
        //       console.log(`🔄 Reset payload for disconnected option: ${opt.id} in template ${node.id}`)
        //       return { ...opt, payload: '' }
        //     }

        //     if (edge) {
        //       const targetNode = currentNodes.find(n => n.id === edge.target)
        //       if (!targetNode) return opt

        //       const isFeatureBlock = isFeatureBlockNode(targetNode)
        //       const payload = isFeatureBlock
        //         ? (targetNode.data as FeatureBlock)?.name?.trim()
        //         : targetNode.id

        //       if (payload && isMessengerSafePayload(payload)) {
        //         console.log(`✅ Re-linked payload for option ${opt.id} → ${payload}`)
        //         return { ...opt, payload, type: 'postback' }
        //       }
        //     }

        //     return opt
        //   })

        //   return {
        //     ...node,
        //     data: {
        //       ...node.data,
        //       cards: [{ ...card, options: updatedOptions }],
        //       updatedAt: Date.now(), // ✅ force reactivity
        //     },
        //   }
        // }

        return node
      })

      const validated = validateAllChains(updatedNodes, rawEdges)

      // ✅ Commit to store so InfoPanel sees the update
      useCanvasStore.setState({ nodes: validated })

      // 🟢 Force re-render to reflect cleared payload in InfoPanel
      setNodes([...validated])

      console.groupCollapsed('📊 Edge Change Summary')
      console.log('🔗 Removed handles:', removedHandles)
      console.log('🧠 Edge map keys:', [...edgeMap.keys()])
      console.groupEnd()

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


type SafeCanvas = {
  layout: 'horizontal' | 'vertical';
  nodes: Node[];
  edges: Edge[];
  paths: any[];
};

function parseCanvasSafely(canvas: unknown): SafeCanvas {
  const fallbackLayout: 'horizontal' | 'vertical' = 'vertical';
  const fallbackNodes: Node[] = [];
  const fallbackEdges: Edge[] = [];
  const fallbackPaths: any[] = [];

  if (
    canvas &&
    typeof canvas === 'object' &&
    !Array.isArray(canvas) &&
    canvas.constructor === Object
  ) {
    const layout =
      typeof (canvas as any).layout === 'string' &&
        ((canvas as any).layout === 'horizontal' || (canvas as any).layout === 'vertical')
        ? (canvas as any).layout
        : fallbackLayout;

    const nodes = Array.isArray((canvas as any).nodes)
      ? (canvas as any).nodes.filter(
        (n: any) => typeof n === 'object' && n !== null && typeof n.id === 'string'
      )
      : fallbackNodes;

    const edges = Array.isArray((canvas as any).edges)
      ? (canvas as any).edges.filter(
        (e: any) => typeof e === 'object' && e !== null
      )
      : fallbackEdges;

    const paths = Array.isArray((canvas as any).paths)
      ? (canvas as any).paths.filter(
        (p: any) => typeof p === 'object' && p !== null
      )
      : fallbackPaths;

    return { layout, nodes, edges, paths };
  }

  console.warn(`⚠️ canvas is not a valid object:`, canvas);
  return {
    layout: fallbackLayout,
    nodes: fallbackNodes,
    edges: fallbackEdges,
    paths: fallbackPaths
  };
}