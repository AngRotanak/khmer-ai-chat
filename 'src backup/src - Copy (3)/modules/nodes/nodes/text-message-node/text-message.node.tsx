import type { Node, NodeProps } from '@xyflow/react'
import type { RegisterNodeMetadata } from '~/modules/nodes/types'
import { Position } from '@xyflow/react'
import { produce } from 'immer'
import { nanoid } from 'nanoid'

import { isEmpty } from 'radash'
import { memo, useCallback, useMemo, useState, useReducer } from 'react'
import { cn } from '~@/utils/cn'
import CustomHandle from '~/modules/flow-builder/components/handles/custom-handle'
import { useDeleteNode } from '~/modules/flow-builder/hooks/use-delete-node'
import { BuilderNode } from '~/modules/nodes/types'
import { getNodeDetail } from '~/modules/nodes/utils'
import TextMessageNodePropertyPanel from '~/modules/sidebar/panels/node-properties/property-panels/text-message-property-panel'
import type { TextMessageNodeData } from '~/modules/nodes/types'
import { useApplicationState } from '~/stores/application-state'
import { useCanvasStore } from '~/stores/canvas-store'




const NODE_TYPE = BuilderNode.TEXT_MESSAGE
type TextMessageNodeProps = NodeProps<Node<TextMessageNodeData, typeof NODE_TYPE>>

export function TextMessageNode({ id, isConnectable, selected, data }: TextMessageNodeProps) {
  const meta = useMemo(() => getNodeDetail(NODE_TYPE), [])

  const [showNodePropertiesOf] = useApplicationState(s => [s.actions.sidebar.showNodePropertiesOf])
  const [sourceHandleId] = useState<string>(nanoid())
  const [, forceRender] = useReducer(x => x + 1, 0)

  const setNodes = useCanvasStore(s => s.setNodes)

  const deleteNode = useDeleteNode()

  const showNodeProperties = useCallback(() => {
    showNodePropertiesOf({ id, type: NODE_TYPE })
  }, [id, showNodePropertiesOf])

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


  return (
    <>
      <div
        data-selected={selected}
        className="w-xs overflow-clip border border-dark-200 rounded-xl bg-dark-300/50 shadow-sm backdrop-blur-xl transition divide-y divide-dark-200 data-[selected=true]:(border-teal-600 ring-1 ring-teal-600/50)"
        onDoubleClick={showNodeProperties}
      >
        <div className="relative bg-dark-300/50">
          <div className="absolute inset-0">
            <div className="absolute h-full w-3/5 from-teal-900/20 to-transparent bg-gradient-to-r" />
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
                <div className="text-xs leading-none">
                  {data.is_active ? '🟢' : '🔴'}
                </div>
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

        <div className="flex flex-col divide-y divide-dark-200">
          <div className="flex flex-col p-4">
            <div
              className={cn(
                'text-sm leading-snug space-y-1 whitespace-pre-wrap break-words',
                isEmpty(data.message_kh) && isEmpty(data.message_en) ? 'mt-1' : ''
              )}
            >
              {isEmpty(data.message_kh) && isEmpty(data.message_en) ? (
                <span className="text-light-900/80 italic">No message yet...</span>
              ) : (
                <>
                  {data.message_kh && (
                    <div className="text-light-100">{data.message_kh}</div>
                  )}
                  {data.message_en && (
                    <>
                      <div className="h-2 border-t border-teal-300/40 my-2" />
                      <div className="text-light-100/80 italic">{data.message_en}</div>
                    </>
                  )}
                  <div className="mt-1 text-xs text-light-900/50">
                    Tone: <span className="text-light-900/70">{data.tone}</span> | Emoji: <span className="text-light-900/70">{data.emoji_style}</span>
                  </div>
                </>
              )}

              {isEmpty(data.message_kh) && (
                <div className="mt-1 text-xs text-red-400 italic">⚠️ Missing Khmer message</div>
              )}
            </div>
          </div>

          <div className="bg-dark-300/30 px-4 py-2 text-xs text-light-900/50">
            Node: <span className="text-light-900/60 font-semibold">#{id}</span>
          </div>
        </div>
      </div>



      <CustomHandle
        type="target"
        id={sourceHandleId}
        position={Position.Left}
        isConnectable={isConnectable}
      />

      {/* <CustomHandle
        type="source"
        id={sourceHandleId}
        position={Position.Right}
        isConnectable={isConnectable}
      /> */}
    </>
  )

}

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: RegisterNodeMetadata<TextMessageNodeData> = {
  type: 'text-message',
  node: memo(TextMessageNode),
  detail: {
    icon: 'i-mynaui:chat',
    title: 'Text Message',
    description:
      'Send a text message to the user using different messaging platforms like WhatsApp, Messenger, etc.',
  },
  connection: {
    inputs: 1,
    outputs: 1,
  },
  defaultData: {
    type: 'text-message',
    channel: 'sms',
    message_en: '', // ✅ editable field
    message_kh: '', // ✅ editable field
    template_ref: '', // ✅ optional during editing
    is_active: true,
    delay_seconds: 0,
    show_typing: true,
    tone: 'neutral',
    emoji_style: 'minimal',
    priority: 'normal',
    trigger_condition: '',
  },
  propertyPanel: TextMessageNodePropertyPanel,
};
