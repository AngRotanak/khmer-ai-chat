import type { Node, NodeProps } from '@xyflow/react'
import { cn } from '~@/utils/cn'
import CustomHandle from '~/modules/flow-builder/components/handles/custom-handle'
import type { ConversationAgentNodeData, RegisterNodeMetadata } from '~/modules/nodes/types'
import { useApplicationState } from '~/stores/application-state'
import { Position, useReactFlow } from '@xyflow/react'
import { useCallback, useMemo, useState, useReducer } from 'react'
import { useDeleteNode } from '~/modules/flow-builder/hooks/use-delete-node'
import { produce } from 'immer'
import { getNodeDetail } from '~/modules/nodes/utils'
import { nanoid } from 'nanoid'


const NODE_TYPE = 'conversation-agent'
type Props = NodeProps<Node<ConversationAgentNodeData, typeof NODE_TYPE>>

export function ConversationAgentNode({ id, data, selected, isConnectable }: Props) {
    const {
        topic,
        welcome_message_en,
        welcome_message_kh,
        fallback_message_en,
        fallback_message_kh
    } = data

    const [showNodePropertiesOf] = useApplicationState(s => [s.actions.sidebar.showNodePropertiesOf])
    const [sourceHandleId] = useState(nanoid())
    const meta = useMemo(() => getNodeDetail('conversation-agent'), [])
    const [, forceRender] = useReducer(x => x + 1, 0)
    const { setNodes } = useReactFlow()
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
        <div
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
                                <div className={cn(meta.icon, 'size-4 text-teal-400')} />
                            </div>
                        </div>
                        <div className="text-xs font-medium leading-none tracking-wide uppercase op-80">
                            CONVERSATION AGENT
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-x-1 pr-0.5">
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
                            onClick={() => showNodeProperties()}
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
                {/* Block Name Display */}
                <div className="px-4 pt-3 pb-1">
                    <div className="font-bold text-xs mb-1 text-primary">
                        🧠 Topic: <span className="text-muted">{topic || 'Untitled'}</span>
                    </div>

                    <div className="text-xs text-muted mb-2">
                        {welcome_message_en || welcome_message_kh
                            ? `💬 ${welcome_message_en || welcome_message_kh}`
                            : 'No welcome message configured.'}
                    </div>

                    <div className="text-xs text-muted mb-2">
                        {fallback_message_en || fallback_message_kh
                            ? `💬 ${fallback_message_en || fallback_message_kh}`
                            : 'No welcome message configured.'}
                    </div>
                </div>
                
                 <CustomHandle
                    type="target"
                    id={sourceHandleId}
                    position={Position.Left}
                    isConnectable={isConnectable}
                />

                {/* Footer */}
                <div className="overflow-clip rounded-b-xl bg-dark-300/30 px-4 py-2 text-xs text-light-900/50">
                    Node: <span className="text-light-900/60 font-semibold">#{id}</span>
                </div>
            </div>

        </div>
    )
}


export const defaultConversationAgentData: ConversationAgentNodeData = {
    topic: '',
    is_active: true,
    intent_id: '',
    confidence_threshold: 0.7,
    flow_payload: '',
    escape_keywords: [],
    trigger_keywords: [],   // ✅ always array
    welcome_message_en: '',
    welcome_message_kh: '',
    fallback_message_en: '',
    fallback_message_kh: '',
    context_lock: true,
    lock_on_entry: false,
    release_on_complete: false,
    sub_intents: []         // ✅ always array
};


export const metadata: RegisterNodeMetadata<ConversationAgentNodeData> = {
    type: 'conversation-agent',
    node: ConversationAgentNode,
    detail: {
        icon: 'i-lucide:focus',
        title: 'Conversation Agent',
        description: 'Hold focused conversation and route replies within a topic.',
    },
    connection: {
        inputs: 1,
        outputs: 1
    },

    available: false,
    defaultData: defaultConversationAgentData,
    propertyPanel: (await import('~/modules/sidebar/panels/khmer-ai-features/conversation-agent-property-panel')).default
}
