import type { Node, NodeProps } from '@xyflow/react'
import type { GenericTemplateNodeData, RegisterNodeMetadata } from '~/modules/nodes/types'
import { Position, useReactFlow } from '@xyflow/react'
import { nanoid } from 'nanoid'
import { produce } from 'immer'
import { useCallback, useMemo, useState, useReducer } from 'react'
import { cn } from '~@/utils/cn'
import CustomHandle from '~/modules/flow-builder/components/handles/custom-handle'
import { useDeleteNode } from '~/modules/flow-builder/hooks/use-delete-node'
import { BuilderNode } from '~/modules/nodes/types'
import { getNodeDetail } from '~/modules/nodes/utils'
import { ButtonPath } from './components/button-path'
import { ConditionDropdownSelector } from '~/modules/nodes/nodes/conditional-path-node/components/condition-dropdown-selector'
import { useApplicationState } from '~/stores/application-state'
const NODE_TYPE = BuilderNode.GENERIC_TEMPLATE

type GenericTemplateNodeProps = NodeProps<Node<GenericTemplateNodeData, typeof NODE_TYPE>>

export function GenericTemplateNode({ id, isConnectable, selected, data }: GenericTemplateNodeProps) {
  const meta = useMemo(() => getNodeDetail(NODE_TYPE), [])
  const [sourceHandleId] = useState<string>(nanoid())
  const { setNodes, setEdges } = useReactFlow()
  const deleteNode = useDeleteNode()
  const [, forceRender] = useReducer(x => x + 1, 0) 


  const addOption = useCallback(() => {
    setNodes(nodes => produce(nodes, draft => {
      const node = draft.find(n => n.id === id)
      if (
        node &&
        Array.isArray(node.data.cards) &&
        node.data.cards.length > 0
      ) {
        const card = node.data.cards[0]
        card.options = card.options ?? []

        if (card.options.length >= 3) {
          console.warn(`⚠️ Cannot add more than 3 options to card "${card.title || node.id}"`)
          alert('⚠️ You can only add up to 3 options per card')
          return
        }

        card.options.push({
          id: nanoid(),
          label_en: `Option ${card.options.length + 1}`,
          type: 'postback',
          payload: '',
        })

        node.data = {
          ...node.data,
          cards: [...node.data.cards],
          updatedAt: Date.now(),
        }
      }
    }))
  }, [id, setNodes])




    const removeOption = useCallback((optionId: string) => {
      setNodes(nodes =>
        produce(nodes, draft => {
          const node = draft.find(n => n.id === id)
          if (!node) return

          const cards = node.data.cards
          if (!Array.isArray(cards) || cards.length === 0) return

          const card = cards[0]
          const options = card.options
          if (!Array.isArray(options)) return

          if (options.length <= 1) {
            alert('❌ មិនអាចលុបជម្រើសចុងក្រោយបានទេ — ត្រូវមានយ៉ាងហោចណាស់មួយជម្រើស។')
            return
          }

          const index = options.findIndex(opt => opt.id === optionId)
          if (index === -1) return

          options.splice(index, 1)

          node.data = {
            ...node.data,
            cards: [...cards],
            updatedAt: Date.now(),
          }
        })
      )

      setEdges(edges => edges.filter(edge => edge.sourceHandle !== optionId))
    }, [id, setNodes, setEdges])



  const onConditionChange = useCallback(
    (value: { id: string; condition: string } | null) => {
      setNodes(nodes => produce(nodes, draft => {
        const node = draft.find(n => n.id === id)
        if (node) node.data.condition = value
      }))
    },
    [id, setNodes]
  )
  
  const card = data.cards?.[0]
  const title = card?.title_km || card?.title || ''
  const subtitle = card?.subtitle_km || card?.subtitle || ''
  const hasOptions = Array.isArray(card?.options) && card.options.length > 0

  // const connectorPaths = card.options?.map(opt => ({
  //   id: opt.id,
  //   label: opt.label_kh || opt.label_en || 'Option',
  // })) ?? []

  // useLayoutEffect(() => {
  //   console.log('🔄 Rendering connectorPaths:', connectorPaths)
  //   console.log('📦 Current node data:', JSON.stringify(data, null, 2))

  //   const handle = document.querySelector(`[data-handleid="${connectorPaths[0].id}"]`)
  //   console.log('🔍 DOM handle found:', handle)
  // }, [connectorPaths])
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

      {/* Title + Subtitle */}
      <div className="px-4 py-2">
       
       <div className="text-sm font-semibold text-light-900 dark:text-light-100 break-words whitespace-pre-wrap leading-snug">
        {title}
      </div>

      <div className="mt-1 text-xs text-light-900/60 dark:text-light-400 break-words whitespace-pre-line">
        {subtitle}
      </div>
      
      {!card?.title_km && (
        <div className="text-xs text-red-500 mt-1">
          ⚠️
        </div>
      )}

      </div>

      {/* Config Panel */}
      <div className="flex flex-col divide-y divide-dark-200">
        <div className="flex flex-col p-4">
          <div className="text-xs text-light-900/50 font-medium">Template Type</div>
          <div className="mt-2 flex">
            <ConditionDropdownSelector value={data.condition} onChange={onConditionChange} />
          </div>
        </div>

        {/* Options + Connectors */}
        <div className="flex flex-col p-4">
          <div className="text-xs text-light-900/50 font-medium">Options</div>
          <div className="mt-2 flex flex-col">
            
           {card.options?.map(opt => (
              <div key={opt.id} className="relative flex flex-col">
                {/* 🎯 Source Handle for this option */}              

                <ButtonPath
                  id={opt.id}
                  label={opt.label_kh || opt.label_en || 'Option'}
                  isConnectable={isConnectable}
                  onRemove={() => {
                    if (hasOptions) removeOption(opt.id)
                  }}
                />

                {!opt.label_kh && (
                  <div className="text-xs text-red-500 mt-1">
                    ⚠️
                  </div>
                )}
              </div>
            ))}


          </div>
          <div className="mt-2 flex">
            <button
              type="button"
              className="h-8 w-full flex items-center justify-center border border-dark-50 rounded-md bg-dark-300 px-2.5 outline-none transition active:(border-dark-200 bg-dark-400/50)"
              onClick={addOption}
              title="បន្ថែមជម្រើសថ្មី"
            >
              <div className="text-xs font-medium leading-none tracking-wide">Add Option</div>
              <div className="i-lucide:plus ml-1 size-4.5 text-white op-50" />
            </button>
          </div>
        </div>      

        {/* 🎯 Target Handle */}
        <div className="relative min-h-10">
          <CustomHandle
            type="target"
            id={sourceHandleId}
            position={Position.Left}
            isConnectable={isConnectable}
            className="top-6! hover:(important:ring-2 important:ring-teal-500/50)"
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

export const metadata: RegisterNodeMetadata<GenericTemplateNodeData> = {
  type: NODE_TYPE,
  node: GenericTemplateNode,
  detail: {
    icon: 'i-mynaui:layout',
    title: 'Generic Template',
    description: 'Displays a card with options that can branch to other nodes.',
  },
  connection: {
    inputs: 1,
    outputs: Infinity, // ✅ allows unlimited outgoing connectors
  },
  defaultData: {
  title: '',
  subtitle: '',
  image_url: 'https://storage.googleapis.com/khmer_aichatbot/clients/572772349252949/photo/Home.jpg',
  layout: 'hero',
  options: [
    {
      id: nanoid(),
      label: 'Option 1', // ✅ Add this
      label_en: 'Option 1',
      label_kh: '',
      type: 'postback',
      payload: '',
    },
  ],
  cards: [
    {
      title: '',
      title_km: '',
      subtitle: '',
      subtitle_km: '',
      image_url: 'https://storage.googleapis.com/khmer_aichatbot/clients/572772349252949/photo/Home.jpg',
      layout: 'hero',
      options: [
        {
          id: nanoid(),
          label: 'Option 1', // ✅ Add this
          label_en: 'Option 1',
          label_kh: '',
          type: 'postback',
          payload: '',
        },
      ],
    },
  ],
  condition: {
    id: 'ordered',
    condition: 'អ្នកប្រើបានបញ្ជាទិញផលិតផល',
  },
},

  propertyPanel: (await import('~/modules/sidebar/panels/node-properties/property-panels/generic-template-property-panel')).default,
}
