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

  const handleAddConnectedNode_old = useCallback(
    (type: BuilderNodeType) => {
      if (!incomingNodeMetadetails?.fromNode || !incomingNodeMetadetails?.fromHandle) {
        console.warn('Missing metadata — fallback injection skipped');
        return;
      }

      const handleId: string = String(incomingNodeMetadetails.fromHandle.id);

      const fromNode = incomingNodeMetadetails.fromNode;

      // 🚫 Prevent invalid carousel connections
      const isCarouselBlock =
        fromNode.type === BuilderNode.FEATURE_BLOCK &&
        fromNode.data?.block_type === 'carousel';
      const isTargetGenericTemplate = type === BuilderNode.GENERIC_TEMPLATE;

      if (isCarouselBlock && !isTargetGenericTemplate) {
        alert('⚠️ Carousel blocks can only connect to generic-template cards');
        setShowMenu(false);
        setIncomingNodeMetadetails(null);
        return;
      }

      // ✅ Create the new node
      const newNode = insertNode(type, dropPosition);
      const realNodeId = newNode.id;

      // 🔧 Force blockType override if feature-block intended as carousel
      if (type === BuilderNode.FEATURE_BLOCK) {
        newNode.data = {
          ...newNode.data,
          block_type: 'carousel',
        };
        canvasStore.setNodes(getNodes().map(node =>
          node.id === newNode.id
            ? { ...node, data: { ...node.data, block_type: 'carousel' } }
            : node
        ));
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

      if (type === BuilderNode.FEATURE_BLOCK) {
        simulatedNode.data = {
          ...simulatedNode.data,
          blockType: 'carousel',
          block_type: 'carousel',
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
      console.log('Injecting payload into:', fromNode.type, handleId);

      const updateNodeData = (updater: (data: any) => any) => {
        canvasStore.setNodes(getNodes().map(node =>
          node.id === fromNode.id ? { ...node, data: updater(node.data) } : node
        ));
      };


      if (fromNode.type === BuilderNode.GENERIC_TEMPLATE) {
        updateNodeData(data => {
          const cards = Array.isArray(data.cards) ? data.cards : [];

          type Option = {
            id: string;
            label_en?: string;
            label_kh?: string;
            type?: string;
            payload?: string;
          };

          type Card = {
            id: string;
            title?: string;
            options?: Option[];
          };

          return {
            ...data,
            cards: (cards as Card[]).map(card => {
              const options = Array.isArray(card.options) ? (card.options as Option[]) : [];

              // Find existing option
              const existingOption = options.find(opt => opt.id === handleId);

              if (existingOption) {
                // Update payload if missing
                if (!existingOption.payload || !existingOption.payload.toString().trim()) {
                  existingOption.type = 'postback';
                  existingOption.payload = payload;
                }
              } else {
                // ✅ Create new option if none exists
                options.push({
                  id: String(handleId),
                  type: 'postback',
                  payload,
                });
              }

              return { ...card, options };
            }),
          };
        });
      }


      if (fromNode.type === BuilderNode.BUTTON_TEMPLATE) {
        updateNodeData(data => {
          type Option = {
            id: string;
            label_en?: string;
            label_kh?: string;
            type?: string;
            payload?: string;
          };

          const options: Option[] = Array.isArray(data.options) ? (data.options as Option[]) : [];

          const existingOption = options.find(opt => opt.id === handleId);
          if (existingOption) {
            if (!existingOption.payload || !existingOption.payload.toString().trim()) {
              existingOption.type = 'postback';
              existingOption.payload = payload;
            }
          } else {
            options.push({
              id: String(handleId),
              type: 'postback',
              payload,
            });
          }

          return { ...data, options };
        });
      }


      if (fromNode.type === BuilderNode.MEDIA_TEMPLATE) {
        updateNodeData(data => {
          type Option = {
            id: string;
            label_en?: string;
            label_kh?: string;
            type?: string;
            payload?: string;
          };

          const options: Option[] = Array.isArray(data.options) ? (data.options as Option[]) : [];

          const existingOption = options.find(opt => opt.id === handleId);
          if (existingOption) {
            if (!existingOption.payload || !existingOption.payload.toString().trim()) {
              existingOption.type = 'postback';
              existingOption.payload = payload;
            }
          } else {
            options.push({
              id: String(handleId),
              type: 'postback',
              payload,
            });
          }

          return { ...data, options };
        });
      }



      if (fromNode.type === BuilderNode.QUICK_REPLIES) {
        updateNodeData(data => {
          type Reply = {
            id: string;
            label_en?: string;
            label_kh?: string;
            type?: string;
            payload?: string;
          };

          const replies: Reply[] = Array.isArray(data.replies) ? (data.replies as Reply[]) : [];

          const existingReply = replies.find(reply => reply.id === handleId);
          if (existingReply) {
            if (!existingReply.payload || !existingReply.payload.toString().trim()) {
              existingReply.type = 'text';
              existingReply.payload = payload;
            }
          } else {
            replies.push({
              id: String(handleId),
              type: 'text',
              payload,
            });
          }

          return { ...data, replies };
        });
      }


      if (fromNode.type === BuilderNode.FEATURE_BLOCK) {
        const safeCanvas = parseCanvasSafely(fromNode.data?.canvas);
        if (!Array.isArray(safeCanvas.paths)) safeCanvas.paths = [];

        const existingPath = safeCanvas.paths.find(p => p.id === handleId);
        let safeType: string | null = null;
        switch (type) {
          case BuilderNode.TEXT_MESSAGE: safeType = 'text-message'; break;
          case BuilderNode.GENERIC_TEMPLATE: safeType = 'generic-template'; break;
          case BuilderNode.BUTTON_TEMPLATE: safeType = 'button-template'; break;
          case BuilderNode.MEDIA_TEMPLATE: safeType = 'media-template'; break;
          case BuilderNode.QUICK_REPLIES: safeType = 'quick-replies'; break;
          case BuilderNode.VOICE_TEMPLATE: safeType = 'voice-template'; break;
          case BuilderNode.FEATURE_BLOCK: safeType = (newNode.data?.block_type as string) || 'info'; break;
          case BuilderNode.CONVERSATION_AGENT: safeType = 'conversation-agent'; break; // ✅ Added
        }

        const payloadObj = safeType
          ? { node_id: realNodeId, template_type: safeType, lang: 'en' }
          : undefined;

        if (existingPath) {
          existingPath.targetBlockId = realNodeId;
          existingPath.payload = payloadObj;
        } else {
          safeCanvas.paths.push({
            id: handleId,
            template_ref: '',
            label: '',
            blockType: safeType as any,
            targetBlockId: realNodeId,
            send_immediately: true,
            payload: payloadObj,
          });
        }

        updateNodeData(data => ({
          ...data,
          canvas: { ...safeCanvas },
        }));
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


  const handleAddConnectedNode = useCallback(
    (type: BuilderNodeType) => {
      if (!incomingNodeMetadetails?.fromNode || !incomingNodeMetadetails?.fromHandle) {
        console.warn('Missing metadata — fallback injection skipped');
        return;
      }

      const handleId: string = String(incomingNodeMetadetails.fromHandle.id);
      const fromNode = incomingNodeMetadetails.fromNode;

      // 🚫 Prevent invalid carousel connections
      const isCarouselBlock =
        fromNode.type === BuilderNode.FEATURE_BLOCK &&
        fromNode.data?.block_type === 'carousel';
      const isTargetGenericTemplate = type === BuilderNode.GENERIC_TEMPLATE;

      if (isCarouselBlock && !isTargetGenericTemplate) {
        alert('⚠️ Carousel blocks can only connect to generic-template cards');
        setShowMenu(false);
        setIncomingNodeMetadetails(null);
        return;
      }

      // ✅ Create the new node
      const newNode = insertNode(type, dropPosition);
      const realNodeId = newNode.id;

      // 🔧 Force blockType override if feature-block intended as carousel
      if (type === BuilderNode.FEATURE_BLOCK) {
        newNode.data = { ...newNode.data, block_type: 'carousel' };
        canvasStore.setNodes(getNodes().map(node =>
          node.id === newNode.id
            ? { ...node, data: { ...node.data, block_type: 'carousel' } }
            : node
        ));
      }

      // ✅ Unified string payload format
      let safeType: string;
      switch (type) {
        case BuilderNode.TEXT_MESSAGE: safeType = 'text-message'; break;
        case BuilderNode.GENERIC_TEMPLATE: safeType = 'generic-template'; break;
        case BuilderNode.BUTTON_TEMPLATE: safeType = 'button-template'; break;
        case BuilderNode.MEDIA_TEMPLATE: safeType = 'media-template'; break;
        case BuilderNode.QUICK_REPLIES: safeType = 'quick-replies'; break;
        case BuilderNode.VOICE_TEMPLATE: safeType = 'voice-template'; break;
        case BuilderNode.FEATURE_BLOCK: safeType = (newNode.data?.block_type as string) || 'info'; break;
        case BuilderNode.CONVERSATION_AGENT: safeType = 'conversation-agent'; break;
        default: safeType = 'unknown';
      }

      const payloadStr = `${safeType}.${realNodeId}`;

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

      if (type === BuilderNode.FEATURE_BLOCK) {
        simulatedNode.data = {
          ...simulatedNode.data,
          blockType: 'carousel',
          block_type: 'carousel',
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

      // ✅ Inject payload into matching option/reply depending on node type
      const updateNodeData = (updater: (data: any) => any) => {
        canvasStore.setNodes(getNodes().map(node =>
          node.id === fromNode.id ? { ...node, data: updater(node.data) } : node
        ));
      };

      if (fromNode.type === BuilderNode.GENERIC_TEMPLATE) {
        updateNodeData(data => {
          const cards = Array.isArray(data.cards) ? data.cards : [];
          return {
            ...data,
            cards: cards.map((card: any) => {
              const options = Array.isArray(card.options) ? [...card.options] : [];
              const existingOption = options.find(opt => opt.id === handleId);
              if (existingOption) {
                if (!existingOption.payload || !existingOption.payload.toString().trim()) {
                  existingOption.type = 'postback';
                  existingOption.payload = payloadStr;
                }
              } else {
                options.push({ id: String(handleId), type: 'postback', payload: payloadStr });
              }
              return { ...card, options };
            }),
          };
        });
      }

      if (fromNode.type === BuilderNode.BUTTON_TEMPLATE) {
        updateNodeData(data => {
          const options = Array.isArray(data.options) ? [...data.options] : [];
          const existingOption = options.find(opt => opt.id === handleId);
          if (existingOption) {
            if (!existingOption.payload || !existingOption.payload.toString().trim()) {
              existingOption.type = 'postback';
              existingOption.payload = payloadStr;
            }
          } else {
            options.push({ id: String(handleId), type: 'postback', payload: payloadStr });
          }
          return { ...data, options };
        });
      }

      if (fromNode.type === BuilderNode.MEDIA_TEMPLATE) {
        updateNodeData(data => {
          const options = Array.isArray(data.options) ? [...data.options] : [];
          const existingOption = options.find(opt => opt.id === handleId);
          if (existingOption) {
            if (!existingOption.payload || !existingOption.payload.toString().trim()) {
              existingOption.type = 'postback';
              existingOption.payload = payloadStr;
            }
          } else {
            options.push({ id: String(handleId), type: 'postback', payload: payloadStr });
          }
          return { ...data, options };
        });
      }

      if (fromNode.type === BuilderNode.QUICK_REPLIES) {
        updateNodeData(data => {
          const replies = Array.isArray(data.replies) ? [...data.replies] : [];
          const existingReply = replies.find(reply => reply.id === handleId);
          if (existingReply) {
            if (!existingReply.payload || !existingReply.payload.toString().trim()) {
              existingReply.type = 'text';
              existingReply.payload = payloadStr;
            }
          } else {
            replies.push({ id: String(handleId), type: 'text', payload: payloadStr });
          }
          return { ...data, replies };
        });
      }

      if (fromNode.type === BuilderNode.FEATURE_BLOCK) {
        const safeCanvas = parseCanvasSafely(fromNode.data?.canvas);
        if (!Array.isArray(safeCanvas.paths)) safeCanvas.paths = [];

        let safeType: string | null = null;
        switch (type) {
          case BuilderNode.TEXT_MESSAGE: safeType = 'text-message'; break;
          case BuilderNode.GENERIC_TEMPLATE: safeType = 'generic-template'; break;
          case BuilderNode.BUTTON_TEMPLATE: safeType = 'button-template'; break;
          case BuilderNode.MEDIA_TEMPLATE: safeType = 'media-template'; break;
          case BuilderNode.QUICK_REPLIES: safeType = 'quick-replies'; break;
          case BuilderNode.VOICE_TEMPLATE: safeType = 'voice-template'; break;
          case BuilderNode.FEATURE_BLOCK: safeType = (newNode.data?.block_type as string) || 'info'; break;
          case BuilderNode.CONVERSATION_AGENT: safeType = 'conversation-agent'; break;
        }

        const payloadStr = `${safeType}.${realNodeId}`;

        const pathIndex = safeCanvas.paths.findIndex(p => p.id === handleId);

        if (pathIndex !== -1) {
          safeCanvas.paths[pathIndex] = {
            ...safeCanvas.paths[pathIndex],
            targetBlockId: realNodeId,
            payload: payloadStr,
            template_ref: `${safeType}.${realNodeId}`, // ✅ corrected
          };
        } else {
          safeCanvas.paths.push({
            id: handleId,
            label: '',
            blockType: safeType as any,
            targetBlockId: realNodeId,
            send_immediately: true,
            payload: payloadStr,
            template_ref: `${safeType}.${realNodeId}`, // ✅ corrected
          });
        }

        // 🔧 Also update block.data.paths for consistency
        const updatedBlockPaths = Array.isArray(fromNode.data?.paths)
          ? fromNode.data.paths.map(path =>
            path.id === handleId
              ? {
                ...path,
                targetBlockId: realNodeId,
                payload: payloadStr,
                template_ref: `${safeType}.${realNodeId}`, // ✅ corrected
              }
              : path
          )
          : [];

        updateNodeData(data => {
          return {
            ...data,
            canvas: { ...safeCanvas, paths: [...safeCanvas.paths] },
            paths: updatedBlockPaths,
          };
        });
      }

      // ✅ Always set trigger on new node
      simulatedNode.data = { ...simulatedNode.data, trigger: payloadStr };

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



  return {
    handleOnEdgeDropConnectEnd: onConnectEnd,
    floatingMenuWrapperRef,
    handleAddConnectedNode,
  }
}


