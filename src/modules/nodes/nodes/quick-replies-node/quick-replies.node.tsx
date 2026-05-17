import type { Node, NodeProps } from '@xyflow/react'
import type { RegisterNodeMetadata, QuickRepliesNodeData } from '~/modules/nodes/types'
import { Position } from '@xyflow/react'
import { nanoid } from 'nanoid'
import { produce } from 'immer'
import { useCallback, useMemo, useReducer, useState } from 'react'
import { cn } from '~@/utils/cn'
import CustomHandle from '~/modules/flow-builder/components/handles/custom-handle'
import { useDeleteNode } from '~/modules/flow-builder/hooks/use-delete-node'
import { BuilderNode } from '~/modules/nodes/types'
import { getNodeDetail } from '~/modules/nodes/utils'
import { useApplicationState } from '~/stores/application-state'
import { ButtonPath } from './components/button-path'
import { useCanvasStore } from '~/stores/canvas-store'


const NODE_TYPE = BuilderNode.QUICK_REPLIES

type QuickRepliesNodeProps = NodeProps<Node<QuickRepliesNodeData, typeof NODE_TYPE>>

export function QuickRepliesNode({ id, isConnectable, selected, data }: QuickRepliesNodeProps) {
  const meta = useMemo(() => getNodeDetail(NODE_TYPE), [])
  const [sourceHandleId] = useState<string>(nanoid())
  const setNodes = useCanvasStore(s => s.setNodes)
  const setEdges = useCanvasStore(s => s.setEdges)


  const deleteNode = useDeleteNode()
  const [, forceRender] = useReducer(x => x + 1, 0)
  const [showNodePropertiesOf] = useApplicationState(s => [s.actions.sidebar.showNodePropertiesOf])

  const replies = data.replies ?? []

  const addReply = useCallback(() => {
    setNodes(nodes =>
      produce(nodes, draft => {
        const node = draft.find(n => n.id === id)
        if (!node) return

        // ✅ Safe access inside Immer scope
        const replies = Array.isArray(node.data.replies) ? node.data.replies : []
        if (replies.length >= 13) {
          alert('⚠️ You can only add up to 13 quick replies.')
          return
        }

        replies.push({
          id: nanoid(),
          label_en: `Reply ${replies.length + 1}`,
          label_kh: '',
          payload: '',
          type: 'text',
        })

        node.data.replies = replies
        node.data.updatedAt = Date.now()
      })
    )
  }, [id, setNodes])

  const removeReply = useCallback((replyId: string) => {
    setNodes(nodes =>
      produce(nodes, draft => {
        const node = draft.find(n => n.id === id)
        if (!node || !Array.isArray(node.data.replies)) return

        if (node.data.replies.length <= 1) {
          alert('❌ ត្រូវមានយ៉ាងហោចណាស់មួយជម្រើស។')
          return
        }

        const index = node.data.replies.findIndex(r => r.id === replyId)
        if (index !== -1) node.data.replies.splice(index, 1)

        node.data.updatedAt = Date.now()
      })
    )

    setEdges(edges => edges.filter(edge => edge.sourceHandle !== replyId))
  }, [id, setNodes, setEdges])

  const toggleActive = useCallback(() => {
    setNodes(nodes =>
      produce(nodes, draft => {
        const node = draft.find(n => n.id === id)
        if (!node) return

        node.data.is_active = !node.data.is_active
        node.data.updatedAt = Date.now()
      })
    )
    forceRender()
  }, [id, setNodes])


  const showNodeProperties = useCallback(() => {
    showNodePropertiesOf({ id, type: NODE_TYPE })
  }, [id, showNodePropertiesOf])

  return (
    <div
      key={data.updatedAt || 'initial'}
      data-selected={selected}
      className="w-xs border border-dark-200 rounded-xl bg-dark-300/50 shadow-sm backdrop-blur-xl transition divide-y divide-dark-200 data-[selected=true]:(border-teal-600 ring-1 ring-teal-600/50)"
      onDoubleClick={showNodeProperties}
    >
      {/* Header */}
      <div className="relative overflow-clip rounded-t-xl bg-dark-300/50">
        <div className="absolute inset-0">
          <div className="absolute h-full w-3/5 from-teal-800/20 to-transparent bg-gradient-to-r" />
        </div>
        <div className="relative h-9 flex items-center justify-between gap-x-4 px-0.5 py-0.5">
          <div className="flex grow items-center pl-0.5">
            <div className="size-7 flex items-center justify-center">
              <div className="size-6 flex items-center justify-center rounded-lg">
                <div className={cn(meta.icon, 'size-4')} />
              </div>
            </div>
            <div className="ml-1 text-xs font-medium leading-none tracking-wide uppercase op-80">
              <span className="translate-y-px">{meta.title}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-x-0.5 pr-0.5">
            <button
              type="button"
              className={cn(
                'size-7 flex items-center justify-center border border-transparent rounded-lg bg-transparent outline-none transition',
                'hover:(bg-dark-100)',
                data.is_active
                  ? 'text-teal-150 active:(border-dark-200 bg-dark-400/50)'
                  : 'text-red-150 active:(border-dark-200 bg-dark-400/50)'
              )}
              onClick={toggleActive}
              title={data.is_active ? 'បិទបង្ហាញ block' : 'បើកបង្ហាញ block'}
            >
              <div className="text-xs leading-none">{data.is_active ? '🟢' : '🔴'}</div>
            </button>

            <button
              type="button"
              className="size-7 flex items-center justify-center border border-transparent rounded-lg bg-transparent outline-none transition active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100)"
              onClick={showNodeProperties}
            >
              <div className="i-mynaui:cog size-4" />
            </button>

            <button
              type="button"
              className="size-7 flex items-center justify-center border border-transparent rounded-lg bg-transparent text-red-400 outline-none transition active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100)"
              onClick={() => deleteNode(id)}
            >
              <div className="i-mynaui:trash size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 🗣 Intro Text */}
      {(data.intro_text?.kh || data.intro_text?.en) && (
        <div className="px-3 py-2 text-sm text-light-100">
          {data.intro_text?.kh || data.intro_text?.en}
        </div>
      )}


      {/* Config Panel */}
      <div className="flex flex-col divide-y divide-dark-200">

        {/* 🔘 Quick Replies */}
        <div className="flex flex-col px-3 py-2">
          {replies.map(reply => (
            <div key={reply.id} className="relative flex flex-col">
              <ButtonPath
                id={reply.id}
                label={reply.label_kh || reply.label_en || 'Reply 1'}
                isConnectable={isConnectable}
                onRemove={() => removeReply(reply.id)}
              />
              {!reply.label_kh && (
                <div className="text-[11px] text-red-500 mt-0.5">⚠️</div>
              )}
            </div>
          ))}

          <div className="mt-2 flex">
            <button
              type="button"
              className="h-8 w-full flex items-center justify-center border border-dark-50 rounded-md bg-dark-300 px-2.5 outline-none transition active:(border-dark-200 bg-dark-400/50)"
              onClick={addReply}
              title="បន្ថែមជម្រើសថ្មី"
            >
              <div className="text-xs font-medium leading-none tracking-wide">Add Reply</div>
              <div className="i-lucide:plus ml-1 size-4.5 text-white op-50" />
            </button>
          </div>
        </div>

        {/* 🎯 Target Handle */}
        <div className="relative h-0">
          <CustomHandle
            type="target"
            id={sourceHandleId}
            position={Position.Left}
            isConnectable={isConnectable}
            className="top-2! hover:(important:ring-2 important:ring-purple-500/50)"
          />
        </div>

        {/* 🧾 Footer */}
        <div className="overflow-clip rounded-b-xl bg-dark-300/30 px-4 py-2 text-xs text-light-900/50">
          Node: <span className="text-light-900/60 font-semibold">#{id}</span>
        </div>
      </div>
    </div>
  )
}

export const metadata: RegisterNodeMetadata<QuickRepliesNodeData> = {
  type: BuilderNode.QUICK_REPLIES,
  node: QuickRepliesNode,
  detail: {
    icon: 'i-mynaui:menu',
    title: 'Quick Replies',
    description: 'Displays Messenger-style quick reply buttons that can branch to other nodes.',
  },
  connection: {
    inputs: 1,
    outputs: Infinity, // ✅ allows unlimited outgoing connectors
  },
  defaultData: {
    is_active: true, // ✅ default to active
    updatedAt: Date.now(),
    intro_text: {
      en: 'Choose an option below:',
      kh: 'សូមជ្រើសរើសជម្រើសខាងក្រោម៖',
    },
    replies: [
      {
        id: nanoid(),
        label_en: 'Reply 1',
        label_kh: '',
        payload: '',
        type: 'text',
      },
    ],

  },
  propertyPanel: (await import('~/modules/sidebar/panels/node-properties/property-panels/quick-replies-property-panel')).default,
}