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



  const handleAddConnectedNode = useCallback(
    (type: BuilderNodeType) => {
      if (!incomingNodeMetadetails?.fromHandle || !incomingNodeMetadetails?.fromNode) return

      const handleId = incomingNodeMetadetails.fromHandle.id
      const fromNode = incomingNodeMetadetails.fromNode

      // ❗ Reject if connecting to a feature-block with no name
      if (type === BuilderNode.FEATURE_BLOCK) {
        const name = typeof fromNode.data?.name === 'string' ? fromNode.data.name.trim() : ''
        
        if (!name) {
          alert('⚠️ Cannot connect: feature-block is missing a name. Please set a name before connecting.')
          setShowMenu(false)
          setIncomingNodeMetadetails(null)
          return
        }
      }


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

      // ✅ Connect FeatureBlock path to new node
      if (fromNode.type === BuilderNode.FEATURE_BLOCK) {
        const data = fromNode.data


        const safeCanvas = parseCanvasSafely(data.canvas)
        const updatedPaths = safeCanvas.paths.map(path => {
          if (path.id === handleId) {
            const safeType =
              type === BuilderNode.TEXT_MESSAGE || type === BuilderNode.GENERIC_TEMPLATE
                ? type
                : null

            const payload = safeType
              ? {
                node_id: realNodeId,
                template_type: safeType,
                lang: 'en',
              }
              : undefined

            return {
              ...path,
              targetBlockId: realNodeId,
              payload,
            }
          }
          return path
        })

        const updatedNodes = getNodes().map(node => {
          if (node.id !== fromNode.id) return node

          return {
            ...node,
            data: {
              ...node.data,
              canvas: {
                ...safeCanvas,
                paths: updatedPaths,
              },
            },
            updatedAt: Date.now(),
          }
        })

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
