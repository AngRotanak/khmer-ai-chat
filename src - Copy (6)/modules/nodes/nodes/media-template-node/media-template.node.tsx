
import type { Node, NodeProps } from '@xyflow/react'
import type { RegisterNodeMetadata, MediaTemplateNodeData } from '~/modules/nodes/types'
import { Position, useReactFlow } from '@xyflow/react'
import { nanoid } from 'nanoid'
import { produce } from 'immer'
import { useCallback, useMemo, useReducer } from 'react'
import { cn } from '~@/utils/cn'
import CustomHandle from '~/modules/flow-builder/components/handles/custom-handle'
import { useDeleteNode } from '~/modules/flow-builder/hooks/use-delete-node'
import { BuilderNode } from '~/modules/nodes/types'
import { getNodeDetail } from '~/modules/nodes/utils'
import { useApplicationState } from '~/stores/application-state'
import { ButtonPath } from './components/button-path'

const NODE_TYPE = BuilderNode.MEDIA_TEMPLATE

type MediaTemplateNodeProps = NodeProps<Node<MediaTemplateNodeData, typeof NODE_TYPE>>

export function MediaTemplateNode({ id, isConnectable, selected, data }: MediaTemplateNodeProps) {
  const meta = useMemo(() => getNodeDetail(NODE_TYPE), [])
  const { setNodes, setEdges } = useReactFlow()
  const deleteNode = useDeleteNode()
  const [, forceRender] = useReducer(x => x + 1, 0)
  const [showNodePropertiesOf] = useApplicationState(s => [s.actions.sidebar.showNodePropertiesOf])

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

  const removeOption = useCallback(() => {
    setNodes(nodes =>
      produce(nodes, draft => {
        const node = draft.find(n => n.id === id)
        if (!node) return
        node.data.options = []
        node.data.updatedAt = Date.now()
      })
    )
    setEdges(edges => edges.filter(edge => edge.sourceHandle !== data.options?.[0]?.id))
  }, [id, setNodes, setEdges, data.options])

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

      {/* Preview */}
      <div className="flex flex-col px-4 py-3 gap-y-2">
        <div className="text-xs text-light-900/50 font-medium">Media Type</div>
        <div className="text-sm text-light-100 font-semibold">{data.media_type.toUpperCase()}</div>

        {data.intro_text?.kh || data.intro_text?.en ? (
          <div className="text-sm text-light-100">{data.intro_text.kh || data.intro_text.en}</div>
        ) : null}

        {/* {data.media_url && (
          <div className="mt-2">
            <div className="text-xs text-light-900/50 font-medium">Media URL</div>
            <div className="text-xs text-light-100 break-all">{data.media_url}</div>
          </div>
        )} */}
      </div>

      {/* Button Option */}
      {data.options?.[0] && (
        <div className="flex flex-col px-3 py-2">
          <ButtonPath
            id={data.options[0].id}
            label={data.options[0].label_kh || data.options[0].label_en || 'Option'}
            isConnectable={isConnectable}
            onRemove={removeOption}
          />
        </div>
      )}

      {/* Handle */}
      <div className="relative h-0">
        <CustomHandle
          type="target"
          id={id}
          position={Position.Left}
          isConnectable={isConnectable}
          className="top-2! hover:(important:ring-2 important:ring-purple-500/50)"
        />
      </div>

      {/* Footer */}
      <div className="overflow-clip rounded-b-xl bg-dark-300/30 px-4 py-2 text-xs text-light-900/50">
        Node: <span className="text-light-900/60 font-semibold">#{id}</span>
      </div>
    </div>
  )
}

export const metadata: RegisterNodeMetadata<MediaTemplateNodeData> = {
  type: BuilderNode.MEDIA_TEMPLATE,
  node: MediaTemplateNode,
  detail: {
    icon: 'i-mynaui:video', // or 'i-mynaui:photo' or 'i-mynaui:music' depending on default media_type
    title: 'Media Template',
    description: 'Displays a single image, video, or audio with an optional button.',
  },
  connection: {
    inputs: 1,
    outputs: 1, // Messenger only allows one button per media template
  },
  defaultData: {
    type: 'media-template',
    is_active: true,
    media_type: 'image',
    media_url: '',
    intro_text: {
      en: 'Check out this media!',
      kh: 'សូមមើលមាតិកានេះ!',
    },
    options: [
      {
        id: nanoid(),
        label_en: 'View More',
        label_kh: '',
        type: 'postback',
        payload: '',
      },
    ]
  },

  propertyPanel: (await import('~/modules/sidebar/panels/node-properties/property-panels/media-template-property-panel')).default,
}
