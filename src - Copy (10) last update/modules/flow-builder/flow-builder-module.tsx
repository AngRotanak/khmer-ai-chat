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
import { isGenericTemplateNode, isFeatureBlockNode, isButtonTemplateNode, isQuickRepliesNode, isMediaTemplateNode } from '~/modules/nodes/utils'
import { useCanvasStore } from '~/stores/canvas-store'
import { applyNodeChanges } from '@xyflow/react'
import { sanitizeNodes, sanitizeEdges } from '~/modules/flow-builder/constants/default-nodes-edges' // or wherever you define them
import { loadCanvasAutosave } from '~/utils/loadCanvasAutosave'
import { normalizeToTemplateType } from '~/modules/nodes/types'

import type {
  FeatureBlock,
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
    let targetNode = nodes.find(n => n.id === params.target); // mutable
    const sourceHandle = params.sourceHandle;
    const target = params.target;

    if (!sourceNode || !targetNode) {
      console.warn('⚠️ Missing source or target node — skipping connection');
      return;
    }

    // 🔧 Upgrade target feature-block immediately if it's still "info"
    if (targetNode.type === 'feature-block' &&
      (!targetNode.data?.block_type || targetNode.data?.block_type === 'info')) {
      console.log(`🔧 Upgrading target block ${targetNode.id} from info → carousel`);
      targetNode = {
        ...targetNode,
        data: {
          ...targetNode.data,
          block_type: 'carousel',
        },
      };
    }

    const sourceType = normalizeToTemplateType(
      sourceNode.data?.blockType || sourceNode.data?.block_type || sourceNode.type
    );

    const targetType = normalizeToTemplateType(
      targetNode.data?.blockType || targetNode.data?.block_type || targetNode.type
    );

    const sourceIsCarousel = sourceType === 'carousel';
    const targetIsGenericTemplate = targetType === 'generic-template';

    if (sourceIsCarousel && !targetIsGenericTemplate) {
      console.warn(
        `⚠️ Invalid connection: Carousel ${sourceNode.id} → ${targetNode.id} (${targetType})`
      );
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


    // ✅ Unified string payload format with guard + logs
    let payloadStr: string;
    if (targetNode.id.startsWith(targetType + ".")) {
      payloadStr = targetNode.id;
      console.log("🔧 PayloadStr already prefixed:", payloadStr);
    } else {
      payloadStr = `${targetType}.${targetNode.id}`;
      console.log("🔧 PayloadStr constructed:", payloadStr);
    }

    console.log("🔧 PayloadStr details:", {
      sourceNodeId: sourceNode.id,
      sourceType,
      targetNodeId: targetNode.id,
      targetType,
      finalPayloadStr: payloadStr,
    });


    const updatedNodes = currentNodes.map(node => {
      // 🔧 Force upgrade target feature-block from info → carousel
      if (node.id === targetNode.id && node.type === 'feature-block') {
        return {
          ...node,
          data: {
            ...node.data,
            block_type: 'carousel',
            trigger: payloadStr,
            is_deep_target: true,
          },
        };
      }

      // ✅ Handle generic-template source
      if (isGenericTemplateNode(sourceNode) &&
        node.id === sourceNode.id &&
        sourceHandle &&
        Array.isArray(sourceNode.data?.cards)) {

        const cards = sourceNode.data.cards;
        const card = cards[0] ?? { options: [] };
        const options = Array.isArray(card.options) ? card.options as Option[] : [];
        const optionIndex = options.findIndex(opt => opt?.id === sourceHandle);

        if (optionIndex !== -1) {
          const updatedOptions = [...options];
          updatedOptions[optionIndex] = {
            ...updatedOptions[optionIndex],
            type: 'postback',
            payload: payloadStr,
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

      // ✅ Update quickreplies-template payload
      if (isQuickRepliesNode(sourceNode) &&
        node.id === sourceNode.id &&
        sourceHandle &&
        Array.isArray(sourceNode.data?.replies)) {

        const replies = sourceNode.data.replies as Option[];
        const replyIndex = replies.findIndex(r => r?.id === sourceHandle);

        if (replyIndex !== -1) {
          const updatedReplies = [...replies];
          updatedReplies[replyIndex] = {
            ...updatedReplies[replyIndex],
            type: 'text',
            payload: payloadStr,
          };

          return {
            ...node,
            data: {
              ...node.data,
              replies: updatedReplies,
            },
          };
        }
      }

      // ✅ Update button-template payload
      if (isButtonTemplateNode(sourceNode) &&
        node.id === sourceNode.id &&
        sourceHandle &&
        Array.isArray(sourceNode.data?.options)) {

        const options = sourceNode.data.options as Option[];
        const optionIndex = options.findIndex(opt => opt?.id === sourceHandle);

        if (optionIndex !== -1) {
          const updatedOptions = [...options];
          updatedOptions[optionIndex] = {
            ...updatedOptions[optionIndex],
            type: 'postback',
            payload: payloadStr,
          };

          return {
            ...node,
            data: {
              ...node.data,
              options: updatedOptions,
            },
          };
        }
      }

      // ✅ Update media-template payload
      if (isMediaTemplateNode(sourceNode) &&
        node.id === sourceNode.id &&
        sourceHandle &&
        Array.isArray(sourceNode.data?.options)) {

        const options = sourceNode.data.options as Option[];
        const optionIndex = options.findIndex(opt => opt?.id === sourceHandle);

        if (optionIndex !== -1) {
          const updatedOptions = [...options];
          updatedOptions[optionIndex] = {
            ...updatedOptions[optionIndex],
            type: 'postback',
            payload: payloadStr,
          };

          return {
            ...node,
            data: {
              ...node.data,
              options: updatedOptions,
            },
          };
        }
      }

      // ✅ Update target feature-block with trigger
      if (isFeatureBlock && node.id === target) {
        return {
          ...node,
          data: {
            ...node.data,
            trigger: payloadStr,
            is_deep_target: true,
          },
        };
      }

      // ✅ Only update feature-block nodes with canvas
      if (node.type !== 'feature-block') return node;

      const safeCanvas = parseCanvasSafely(node.data?.canvas);

      const updatedCanvasPaths = safeCanvas.paths.map(path => {
        if (path.id !== sourceHandle) return path;

        console.log(`🧩 Updating path ${path.id}`, {
          oldPayload: path.payload,
          newPayload: payloadStr,
          targetBlockId: targetNode.id,
          template_ref: targetNode.id,
        });

        return {
          ...path,
          targetBlockId: targetNode.id,
          payload: payloadStr,
          template_ref: `${targetType}.${targetNode.id}`, // ✅ corrected
        };
      });



      // 🔧 Also update block.data.paths for consistency
      const updatedBlockPaths = Array.isArray(node.data?.paths)
        ? node.data.paths.map(path =>
          path.id === sourceHandle
            ? {
              ...path,
              targetBlockId: targetNode.id,
              payload: payloadStr,
              template_ref: `${targetType}.${targetNode.id}`, // ✅ corrected
            }
            : path
        )
        : [];



      return {
        ...node,
        data: {
          ...node.data,
          canvas: {
            ...safeCanvas,
            paths: updatedCanvasPaths,
          },
          paths: updatedBlockPaths,
        },
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
        const isMessengerSafe = typeof path.payload === 'string' && path.payload.includes('.');

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
        // ---------------- FEATURE BLOCK ----------------
        if (node.type === 'feature-block') {
          const data = node.data as FeatureBlock;

          // if (node.type === 'feature-block' && (!node.data.block_type || node.data.block_type === 'info')) {
          //   node.data.block_type = 'carousel';   // or another valid type
          // }


          const paths = Array.isArray(data.canvas?.paths) ? data.canvas.paths : [];

          const updatedPaths = paths.map(path => {
            const edgeKey = `${node.id}-${path.id}`;
            const edge = edgeMap.get(edgeKey);

            const wasRemoved = removedHandles.includes(path.id);
            const targetNode = edge ? currentNodes.find(n => n.id === edge.target) : null;

            let updatedPayload = path.payload;
            let targetBlockId = path.targetBlockId;

            if (wasRemoved && !edge) {
              updatedPayload = '';
              targetBlockId = null;
              console.log(`⚠️ Payload cleared for path ${path.id} — target invalid or removed`);
            }

            if (!targetNode) {
              updatedPayload = '';
              targetBlockId = null;
              console.log(`⚠️ Target node deleted for path ${path.id}, clearing payload`);
            }

            if (targetNode) {
              const safeType = normalizeToTemplateType(targetNode.type);
              if (safeType && safeType !== 'unknown') {
                updatedPayload = `${safeType}.${targetNode.id}`;
                targetBlockId = targetNode.id;
                console.log(`✅ Re-linked payload for path ${path.id} → ${updatedPayload}`);
              } else {
                updatedPayload = '';
                targetBlockId = null;
                console.warn(`⚠️ Invalid template type for node ${targetNode.id}: ${targetNode.type}`);
              }
            }

            return { ...path, targetBlockId, payload: updatedPayload };
          });


          return {
            ...node,
            data: {
              ...data,
              canvas: { ...data.canvas, paths: updatedPaths },
              paths: updatedPaths, // ✅ keep data.paths in sync
            },
            updatedAt: Date.now(),
          };
        }


        // ---------------- GENERIC TEMPLATE ----------------
        if (node.type === 'generic-template') {
          const cards = Array.isArray(node.data?.cards) ? node.data.cards : []
          const card = cards[0] ?? { options: [] }
          const options = Array.isArray(card.options) ? card.options as Option[] : []

          const updatedOptions = options.map(opt => {
            const edgeKey = `${node.id}-${opt.id}`
            const edge = edgeMap.get(edgeKey)

            // ✅ If edge is gone → clear payload
            if (!edge) {
              console.log(`🔄 Reset payload for option ${opt.id} in generic-template ${node.id} (edge missing)`)
              return { ...opt, payload: '', type: 'postback' }; // ✅ reset both
            }

            // ✅ If edge exists but target node deleted → clear payload
            const targetNode = currentNodes.find(n => n.id === edge.target)
            if (!targetNode) {
              console.log(`⚠️ Target node deleted for option ${opt.id}, clearing payload`)
              return { ...opt, payload: '', type: 'postback' }; // ✅ reset both
            }

            // ✅ Otherwise re-link
            const safeType = normalizeToTemplateType(targetNode.type);
            if (!safeType || safeType === 'unknown') {
              console.warn(`⚠️ Invalid template type for node ${targetNode.id}: ${targetNode.type}`);
              return { ...opt, payload: '', type: 'postback' };

            }
            const payload = `${safeType}.${targetNode.id}`;


            if (payload && isMessengerSafePayload(payload)) {
              console.log(`✅ Re-linked payload for option ${opt.id} → ${payload}`);
              return { ...opt, payload, type: 'postback' };
            }


            return opt
          })

          return {
            ...node,
            data: {
              ...node.data,
              cards: [{ ...card, options: updatedOptions }],
              updatedAt: Date.now(),
            },
          }
        }

        // ---------------- BUTTON TEMPLATE ----------------
        if (isButtonTemplateNode(node)) {
          const options = Array.isArray(node.data?.options) ? node.data.options as Option[] : []

          const updatedOptions = options.map(opt => {
            const edgeKey = `${node.id}-${opt.id}`
            const edge = edgeMap.get(edgeKey)

            if (!edge) {
              console.log(`🔄 Reset payload for disconnected button option: ${opt.id} in template ${node.id}`)
              return { ...opt, payload: '', type: 'postback' }; // ✅ reset both
            }

            const targetNode = currentNodes.find(n => n.id === edge.target)
            if (!targetNode) {
              console.log(`⚠️ Target node deleted for button option ${opt.id}, clearing payload`)
              return { ...opt, payload: '', type: 'postback' }; // ✅ reset both
            }

            const safeType = normalizeToTemplateType(targetNode.type);
            if (!safeType || safeType === 'unknown') {
              console.warn(`⚠️ Invalid template type for node ${targetNode.id}: ${targetNode.type}`);
              return { ...opt, payload: '', type: 'postback' };

            }
            const payload = `${safeType}.${targetNode.id}`;


            if (payload && isMessengerSafePayload(payload)) {
              console.log(`✅ Re-linked payload for button option ${opt.id} → ${payload}`);
              return { ...opt, payload, type: 'postback' };
            }

            return opt
          })

          return {
            ...node,
            data: {
              ...node.data,
              options: updatedOptions,
              updatedAt: Date.now(),
            },
          }
        }
        // ---------------- MEDIA TEMPLATE ----------------
        if (node.type === 'media-template') {
          const options = Array.isArray(node.data?.options) ? node.data.options as Option[] : []

          const updatedOptions = options.map(opt => {
            const edgeKey = `${node.id}-${opt.id}`
            const edge = edgeMap.get(edgeKey)

            if (!edge) {
              console.log(`🔄 Reset payload for disconnected media option: ${opt.id} in template ${node.id}`)
              return { ...opt, payload: '', type: 'postback' };

            }

            const targetNode = currentNodes.find(n => n.id === edge.target)
            if (!targetNode) {
              console.log(`⚠️ Target node deleted for media option ${opt.id}, clearing payload`)
              return { ...opt, payload: '', type: 'postback' };

            }

            const safeType = normalizeToTemplateType(targetNode.type);
            if (!safeType || safeType === 'unknown') {
              console.warn(`⚠️ Invalid template type for node ${targetNode.id}: ${targetNode.type}`);
              return { ...opt, payload: '', type: 'postback' };

            }
            const payload = `${safeType}.${targetNode.id}`;


            if (payload && isMessengerSafePayload(payload)) {
              console.log(`✅ Re-linked payload for media option ${opt.id} → ${payload}`);
              return { ...opt, payload, type: 'postback' };
            }

            return opt
          })

          return {
            ...node,
            data: {
              ...node.data,
              options: updatedOptions,
              updatedAt: Date.now(),
            },
          }
        }

        // ---------------- QUICK REPLIES ----------------
        if (isQuickRepliesNode(node)) {
          const replies = Array.isArray(node.data?.replies) ? node.data.replies as Option[] : []

          const updatedReplies = replies.map(reply => {
            const edgeKey = `${node.id}-${reply.id}`
            const edge = edgeMap.get(edgeKey)

            if (!edge) {
              console.log(`🔄 Reset payload for disconnected quick reply: ${reply.id} in template ${node.id}`)
              return { ...reply, payload: '', type: 'text' }; // ✅ reset both
            }

            const targetNode = currentNodes.find(n => n.id === edge.target)
            if (!targetNode) {
              console.log(`⚠️ Target node deleted for quick reply ${reply.id}, clearing payload`)
              return { ...reply, payload: '', type: 'text' }; // ✅ reset both
            }

            const safeType = normalizeToTemplateType(targetNode.type);
            if (!safeType || safeType === 'unknown') {
              console.warn(`⚠️ Invalid template type for node ${targetNode.id}: ${targetNode.type}`);
              return { ...reply, payload: '', type: 'text' };
            }
            const payload = `${safeType}.${targetNode.id}`;

            if (payload && isMessengerSafePayload(payload)) {
              console.log(`✅ Re-linked payload for quick reply ${reply.id} → ${payload} (${safeType})`);
              return { ...reply, payload, type: 'text' };
            }

            return reply;

          })

          return {
            ...node,
            data: {
              ...node.data,
              replies: updatedReplies,
              updatedAt: Date.now(),
            },
          }
        }

        return node
      })

      const validated = validateAllChains(updatedNodes, rawEdges)

      useCanvasStore.setState({ nodes: validated })
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
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onConnectEnd={handleOnEdgeDropConnectEnd}
        connectOnClick={true}
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
          setFlowReady(true)

          // Let React Flow calculate the correct viewport
          instance.fitView({ duration: 0, padding: 0.2 })

          console.log('📐 Viewport after fitView:', instance.getViewport())
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