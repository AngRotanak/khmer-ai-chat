import type { FinalConnectionState, Edge } from '@xyflow/react'
import type { BuilderNodeType } from '~/modules/nodes/types'
import { useReactFlow } from '@xyflow/react'
import { nanoid } from 'nanoid'
import { useCallback, useEffect, useRef } from 'react'

import { useInsertNode } from '~/modules/flow-builder/hooks/use-insert-node'
import { useAddNodeOnEdgeDropState } from '~/stores/add-node-on-edge-drop-state'
import { useApplicationState } from '~/stores/application-state'
import { validateChain } from '~/utils/flowLogic'
import { createNodeWithDefaultData } from '~/modules/nodes/utils'
import { BuilderNode } from '~/modules/nodes/types'
import type { Node } from '@xyflow/react'
import { useCanvasStore } from '~/stores/canvas-store'
import { parseCanvasSafely } from '~/helpers/parseCanvasSafely'


export function useAddNodeOnEdgeDrop(
  setEdges: (edges: Edge[]) => void,
  setNodes: (nodes: Node[]) => void
) {
  const [setBuilderBlur] = useApplicationState(s => [s.actions.builder.setBlur])
  const {
    showMenu,
    dropPosition,
    incomingNodeMetadetails,
    setAnchorPosition,
    setDropPosition,
    setShowMenu,
    setIncomingNodeMetadetails,
  } = useAddNodeOnEdgeDropState(s => ({
    showMenu: s.showMenu,
    dropPosition: s.dropPosition,
    incomingNodeMetadetails: s.incomingNodeMetadetails,
    setAnchorPosition: s.actions.setAnchorPosition,
    setDropPosition: s.actions.setDropPosition,
    setShowMenu: s.actions.setShowMenu,
    setIncomingNodeMetadetails: s.actions.setIncomingNodeMetadetails,
  }))
  const canvasStore = useCanvasStore.getState()

  const { getNodes, getEdges } = useReactFlow()
  const insertNode = useInsertNode()
  const floatingMenuWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showMenu) {
      setBuilderBlur(false)
    }
  }, [showMenu, setBuilderBlur])



  const handleAddConnectedNode_old = useCallback(
    (type: BuilderNodeType) => {
      if (!incomingNodeMetadetails?.fromHandle || !incomingNodeMetadetails?.fromNode) return

      const handleId = incomingNodeMetadetails.fromHandle.id
      const fromNode = incomingNodeMetadetails.fromNode

      // // ❗ Reject if connecting to a feature-block with no name
      // if (type === BuilderNode.FEATURE_BLOCK) {
      //   const name = typeof fromNode.data?.name === 'string' ? fromNode.data.name.trim() : ''

      //   if (!name) {
      //     alert(`⚠️ Cannot connect: feature-block is missing a name. Please set a name before connecting. to ${name}`)
      //     setShowMenu(false)
      //     setIncomingNodeMetadetails(null)
      //     return
      //   }
      // }


      // 🚫 Prevent invalid carousel connections
      const isCarouselBlock = fromNode.type === BuilderNode.FEATURE_BLOCK &&
        fromNode.data?.blockType === 'carousel'

      const isTargetGenericTemplate = type === BuilderNode.GENERIC_TEMPLATE

      if (isCarouselBlock && !isTargetGenericTemplate) {
        console.warn(`❌ Invalid connection: carousel block cannot link to ${type}`)
        alert('⚠️ Carousel blocks can only connect to generic-template cards')
        setShowMenu(false)
        setIncomingNodeMetadetails(null)
        return
      }


      // ✅ Create the real node first
      const newNode = insertNode(type, dropPosition)
      const realNodeId = newNode.id
      const payload = realNodeId

      const simulatedEdge: Edge = {
        id: nanoid(),
        type: 'deletable',
        source: fromNode.id,
        sourceHandle: handleId,
        target: realNodeId,
      }

      const simulatedNode = createNodeWithDefaultData(type, {
        position: dropPosition,
        selected: false,
      })

      simulatedNode.id = realNodeId

      const futureNodes = [...getNodes(), simulatedNode]
      const futureEdges = [...getEdges(), simulatedEdge]

      const result = validateChain(simulatedEdge.source, futureNodes, futureEdges)

      if (!result.valid) {
        alert(`⚠️ ${result.reason} សូមពិនិត្យការភ្ជាប់`)
        setShowMenu(false)
        setIncomingNodeMetadetails(null)
        return
      }

      // ✅ Inject payload into matching option
      if (fromNode.type === BuilderNode.GENERIC_TEMPLATE) {
        const cards = Array.isArray(fromNode.data?.cards) ? fromNode.data.cards : []

        type Option = {
          id: string
          label_en?: string
          label_kh?: string
          type?: string
          payload?: string
        }

        const updatedCards = cards.map(card => {
          const options = Array.isArray(card.options) ? card.options as Option[] : []

          const updatedOptions = options.map(opt => {
            if (opt.id === handleId && !opt.payload?.trim()) {
              return {
                ...opt,
                type: 'postback',
                payload,
              }
            }
            return opt
          })

          return {
            ...card,
            options: updatedOptions,
          }
        })

        const updatedNodes = getNodes().map(node => {
          if (node.id !== fromNode.id) return node

          return {
            ...node,
            data: {
              ...node.data,
              cards: updatedCards,
            },
          }
        })

        canvasStore.setNodes(updatedNodes)

      }

      // ✅ Inject payload into matching button-template option
      if (fromNode.type === BuilderNode.BUTTON_TEMPLATE) {
        const options = Array.isArray(fromNode.data?.options) ? fromNode.data.options : []

        const updatedOptions = options.map(opt => {
          if (opt.id === handleId && !opt.payload?.trim()) {
            return {
              ...opt,
              type: 'postback',
              payload, // auto-link to new node id
            }
          }
          return opt
        })

        const updatedNodes = getNodes().map(node => {
          if (node.id !== fromNode.id) return node
          return {
            ...node,
            data: {
              ...node.data,
              options: updatedOptions,
            },
          }
        })

        canvasStore.setNodes(updatedNodes)
      }

      // ✅ Inject payload into matching quick-replies reply
      if (fromNode.type === BuilderNode.QUICK_REPLIES) {
        const replies = Array.isArray(fromNode.data?.replies) ? fromNode.data.replies : []

        const updatedReplies = replies.map(reply => {
          if (reply.id === handleId && !reply.payload?.trim()) {
            return {
              ...reply,
              type: 'text',
              payload, // auto-link to new node id
            }
          }
          return reply
        })

        const updatedNodes = getNodes().map(node => {
          if (node.id !== fromNode.id) return node
          return {
            ...node,
            data: {
              ...node.data,
              replies: updatedReplies,
            },
          }
        })

        canvasStore.setNodes(updatedNodes)
      }

      // ✅ Inject payload into matching media-template option
      if (fromNode.type === BuilderNode.MEDIA_TEMPLATE) {
        const options = Array.isArray(fromNode.data?.options) ? fromNode.data.options : []

        const updatedOptions = options.map(opt => {
          if (opt.id === handleId && !opt.payload?.trim()) {
            return {
              ...opt,
              type: 'postback',
              payload, // auto-link to new node id
            }
          }
          return opt
        })

        const updatedNodes = getNodes().map(node => {
          if (node.id !== fromNode.id) return node
          return {
            ...node,
            data: {
              ...node.data,
              options: updatedOptions,
            },
          }
        })

        canvasStore.setNodes(updatedNodes)
      }



      // ✅ Connect FeatureBlock path to new node (including carousel)
      if (fromNode.type === BuilderNode.FEATURE_BLOCK) {
        const safeCanvas = parseCanvasSafely(fromNode.data?.canvas)
        const updatedPaths = safeCanvas.paths.map(path => {
          if (path.id === handleId) {
            let safeType: string | null = null
            if (
              type === BuilderNode.TEXT_MESSAGE ||
              type === BuilderNode.GENERIC_TEMPLATE ||
              type === BuilderNode.BUTTON_TEMPLATE ||
              type === BuilderNode.MEDIA_TEMPLATE ||
              type === BuilderNode.QUICK_REPLIES
            ) {
              safeType = type
            } else if (type === BuilderNode.FEATURE_BLOCK && newNode.data?.blockType === 'carousel') {
              safeType = 'carousel'
            }

            const payloadObj = safeType
              ? { node_id: realNodeId, template_type: safeType, lang: 'en' }
              : undefined

            return { ...path, targetBlockId: realNodeId, payload: payloadObj }
          }
          return path
        })

        const updatedNodes = getNodes().map(node =>
          node.id === fromNode.id
            ? {
              ...node,
              data: {
                ...node.data,
                canvas: { ...safeCanvas, paths: updatedPaths },
              },
              updatedAt: Date.now(),
            }
            : node
        )
        canvasStore.setNodes(updatedNodes)
      }

      // ✅ Always set trigger on new node
      simulatedNode.data = {
        ...simulatedNode.data,
        trigger: payload,
      }

      setEdges([...getEdges(), {
        ...simulatedEdge,
        target: realNodeId,
      }])

      setShowMenu(false)
      setIncomingNodeMetadetails(null)
    },
    [
      insertNode,
      setEdges,
      setShowMenu,
      setIncomingNodeMetadetails,
      incomingNodeMetadetails,
      dropPosition,
      getNodes,
      getEdges,
      setNodes,
    ]
  )

  const handleAddConnectedNode = useCallback(
    (type: BuilderNodeType) => {
      if (!incomingNodeMetadetails?.fromHandle || !incomingNodeMetadetails?.fromNode) return;

      const handleId = incomingNodeMetadetails.fromHandle.id;
      const fromNode = incomingNodeMetadetails.fromNode;

      // 🚫 Prevent invalid carousel connections
      const isCarouselBlock = fromNode.type === BuilderNode.FEATURE_BLOCK &&
        fromNode.data?.blockType === 'carousel';

      const isTargetGenericTemplate = type === BuilderNode.GENERIC_TEMPLATE;

      if (isCarouselBlock && !isTargetGenericTemplate) {
        alert('⚠️ Carousel blocks can only connect to generic-template cards');
        setShowMenu(false);
        setIncomingNodeMetadetails(null);
        return;
      }

      // ✅ Create the real node first
      const newNode = insertNode(type, dropPosition);
      const realNodeId = newNode.id;

      // 🔧 Force blockType override if this is a feature-block intended as carousel
      if (type === BuilderNode.FEATURE_BLOCK) {
        newNode.data = {
          ...newNode.data,
          blockType: 'carousel',
          block_type: 'carousel', // ✅ also update snake-case
        };

        const updatedNodes = getNodes().map(node =>
          node.id === newNode.id
            ? {
              ...node,
              data: {
                ...node.data,
                blockType: 'carousel',
                block_type: 'carousel', // ✅ keep in sync
              },
            }
            : node
        );
        canvasStore.setNodes(updatedNodes);
      }


      const payload = realNodeId;

      const simulatedEdge: Edge = {
        id: nanoid(),
        type: 'deletable',
        source: fromNode.id,
        sourceHandle: handleId,
        target: realNodeId,
      };

      const simulatedNode = createNodeWithDefaultData(type, {
        position: dropPosition,
        selected: false,
      });
      simulatedNode.id = realNodeId;

      // ✅ Override blockType for simulated node too
      if (type === BuilderNode.FEATURE_BLOCK) {
        simulatedNode.data = {
          ...simulatedNode.data,
          blockType: 'carousel',
          block_type: 'carousel', // ✅ sync both keys
        };
      }


      const futureNodes = [...getNodes(), simulatedNode];
      const futureEdges = [...getEdges(), simulatedEdge];

      const result = validateChain(simulatedEdge.source, futureNodes, futureEdges);
      if (!result.valid) {
        alert(`⚠️ ${result.reason} សូមពិនិត្យការភ្ជាប់`);
        setShowMenu(false);
        setIncomingNodeMetadetails(null);
        return;
      }

      // ✅ Inject payload into matching option
      if (fromNode.type === BuilderNode.GENERIC_TEMPLATE) {
        const cards = Array.isArray(fromNode.data?.cards) ? fromNode.data.cards : [];

        type Option = {
          id: string;
          label_en?: string;
          label_kh?: string;
          type?: string;
          payload?: string;
        };

        const updatedCards = cards.map(card => {
          const options = Array.isArray(card.options) ? card.options as Option[] : [];
          const updatedOptions = options.map(opt =>
            opt.id === handleId && !opt.payload?.trim()
              ? { ...opt, type: 'postback', payload }
              : opt
          );
          return { ...card, options: updatedOptions };
        });

        const updatedNodes = getNodes().map(node =>
          node.id === fromNode.id
            ? { ...node, data: { ...node.data, cards: updatedCards } }
            : node
        );
        canvasStore.setNodes(updatedNodes);
      }

      if (fromNode.type === BuilderNode.BUTTON_TEMPLATE) {
        const options = Array.isArray(fromNode.data?.options) ? fromNode.data.options : [];
        const updatedOptions = options.map(opt =>
          opt.id === handleId && !opt.payload?.trim()
            ? { ...opt, type: 'postback', payload }
            : opt
        );
        const updatedNodes = getNodes().map(node =>
          node.id === fromNode.id
            ? { ...node, data: { ...node.data, options: updatedOptions } }
            : node
        );
        canvasStore.setNodes(updatedNodes);
      }

      if (fromNode.type === BuilderNode.QUICK_REPLIES) {
        const replies = Array.isArray(fromNode.data?.replies) ? fromNode.data.replies : [];
        const updatedReplies = replies.map(reply =>
          reply.id === handleId && !reply.payload?.trim()
            ? { ...reply, type: 'text', payload }
            : reply
        );
        const updatedNodes = getNodes().map(node =>
          node.id === fromNode.id
            ? { ...node, data: { ...node.data, replies: updatedReplies } }
            : node
        );
        canvasStore.setNodes(updatedNodes);
      }

      if (fromNode.type === BuilderNode.MEDIA_TEMPLATE) {
        const options = Array.isArray(fromNode.data?.options) ? fromNode.data.options : [];
        const updatedOptions = options.map(opt =>
          opt.id === handleId && !opt.payload?.trim()
            ? { ...opt, type: 'postback', payload }
            : opt
        );
        const updatedNodes = getNodes().map(node =>
          node.id === fromNode.id
            ? { ...node, data: { ...node.data, options: updatedOptions } }
            : node
        );
        canvasStore.setNodes(updatedNodes);
      }

      // ✅ Connect FeatureBlock path to new node (including carousel)
      if (fromNode.type === BuilderNode.FEATURE_BLOCK) {
        const safeCanvas = parseCanvasSafely(fromNode.data?.canvas);
        const updatedPaths = safeCanvas.paths.map(path => {
          if (path.id === handleId) {
            let safeType: string | null = null;

            switch (type) {
              case BuilderNode.TEXT_MESSAGE:
                safeType = 'text-message';
                break;
              case BuilderNode.GENERIC_TEMPLATE:
                safeType = 'generic-template';
                break;
              case BuilderNode.BUTTON_TEMPLATE:
                safeType = 'button-template';
                break;
              case BuilderNode.MEDIA_TEMPLATE:
                safeType = 'media-template';
                break;
              case BuilderNode.QUICK_REPLIES:
                safeType = 'quick-replies';
                break;
               case BuilderNode.VOICE_TEMPLATE:
                safeType = 'voice-template';
                break;
              case BuilderNode.FEATURE_BLOCK:
                safeType = (newNode.data?.blockType as string) || 'info';
                break;
              default:
                safeType = null;
            }

            const payloadObj = safeType
              ? { node_id: realNodeId, template_type: safeType, lang: 'en' }
              : undefined;

            return { ...path, targetBlockId: realNodeId, payload: payloadObj };
          }
          return path;
        });

        const updatedNodes = getNodes().map(node =>
          node.id === fromNode.id
            ? {
              ...node,
              data: {
                ...node.data,
                canvas: { ...safeCanvas, paths: updatedPaths },
              },
              updatedAt: Date.now(),
            }
            : node
        );
        canvasStore.setNodes(updatedNodes);
      }

      // ✅ Always set trigger on new node
      simulatedNode.data = { ...simulatedNode.data, trigger: payload };

      setEdges([...getEdges(), { ...simulatedEdge, target: realNodeId }]);
      setShowMenu(false);
      setIncomingNodeMetadetails(null);
    },
    [
      insertNode,
      setEdges,
      setShowMenu,
      setIncomingNodeMetadetails,
      incomingNodeMetadetails,
      dropPosition,
      getNodes,
      getEdges,
      setNodes,
    ]
  );

  const onConnectEnd = useCallback(
    (e: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
      if (!connectionState.isValid && floatingMenuWrapperRef.current) {
        const { clientX, clientY } = 'changedTouches' in e ? e.changedTouches[0] : e

        const _anchorPositionPadding = 20
        const _floatingMenuWrapperRect = floatingMenuWrapperRef.current.getBoundingClientRect()
        const _addNodeFloatingMenuAnchorPosition = {
          x: (clientX > _floatingMenuWrapperRect.width + _anchorPositionPadding ? _floatingMenuWrapperRect.width - _anchorPositionPadding : clientX < _anchorPositionPadding ? _anchorPositionPadding : clientX) - _floatingMenuWrapperRect.x,
          y: clientY > _floatingMenuWrapperRect.height + _anchorPositionPadding ? _floatingMenuWrapperRect.height - _anchorPositionPadding : clientY < _anchorPositionPadding ? _anchorPositionPadding : clientY - _floatingMenuWrapperRect.y,
        }

        setAnchorPosition(_addNodeFloatingMenuAnchorPosition)
        setBuilderBlur(true)
        setShowMenu(true)
        setIncomingNodeMetadetails(connectionState)
        setDropPosition({ x: clientX, y: clientY })
      }
    },
    [
      setAnchorPosition,
      setBuilderBlur,
      setShowMenu,
      setIncomingNodeMetadetails,
      floatingMenuWrapperRef,
      setDropPosition,
    ]
  )

  return {
    handleOnEdgeDropConnectEnd: onConnectEnd,
    floatingMenuWrapperRef,
    handleAddConnectedNode,
  }
}
