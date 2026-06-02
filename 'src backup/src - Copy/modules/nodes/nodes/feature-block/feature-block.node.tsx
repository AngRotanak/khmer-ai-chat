import type { Node, NodeProps } from '@xyflow/react'
import { Position, useReactFlow } from '@xyflow/react'
import { nanoid } from 'nanoid'
import {useState, useMemo, useCallback, useReducer, useEffect} from 'react'
import { cn } from '~@/utils/cn'
import CustomHandle from '~/modules/flow-builder/components/handles/custom-handle'
import { useDeleteNode } from '~/modules/flow-builder/hooks/use-delete-node'
import { ButtonPath } from '~/modules/nodes/nodes/generic-template-node/components/button-path'
import type { FeatureBlockNodeData, RegisterNodeMetadata } from '~/modules/nodes/types'
import { getNodeDetail } from '~/modules/nodes/utils'
import { useApplicationState } from '~/stores/application-state'
import { produce } from 'immer'

const NODE_TYPE = 'feature-block'

type Props = NodeProps<Node<FeatureBlockNodeData, typeof NODE_TYPE>>

export function FeatureBlockNode({ id, data, selected, isConnectable }: Props) {
  const { setNodes, setEdges } = useReactFlow()
  const deleteNode = useDeleteNode()
  const [sourceHandleId] = useState(nanoid())
  const meta = useMemo(() => getNodeDetail('feature-block'), [])
  const [, forceRender] = useReducer(x => x + 1, 0) 

  const updateBlockType = (type: FeatureBlockNodeData['blockType']) => {
    setNodes(nodes =>
      nodes.map(node => {
        if (node.id !== id) return node

        const existingPaths = Array.isArray(node.data?.paths) ? node.data.paths : []

        // ✅ If no paths exist, create a default one
        const safePaths = existingPaths.length === 0
          ? [{
              id: nanoid(),
              label: type === 'carousel' ? 'Card 1' : 'Path 1',
              blockType: type === 'carousel' ? 'generic-template' : 'text-message',
              targetBlockId: null,
            }]
          : existingPaths.map((p, i) => {
              const shouldConvert = type === 'carousel' && p.blockType !== 'generic-template'
              return {
                ...p,
                label: type === 'carousel' ? `Card ${i + 1}` : `Path ${i + 1}`,
                blockType: shouldConvert ? 'generic-template' : p.blockType,
              }
            })

        return {
          ...node,
          data: {
            ...node.data,
            blockType: type,
            config: {},
            paths: safePaths,
          },
        }
      })
    )
  }


 const addPath = () => {
  setNodes(nodes =>
    nodes.map(node => {
      if (node.id !== id) return node

      const existingPaths = Array.isArray(node.data?.paths) ? node.data.paths : []

      // Enforce carousel card limit
      if (data.blockType === 'carousel' && existingPaths.length >= 10) {
        alert('❌ មិនអាចបន្ថែមកាតលើសពី 10 បានទេ')
        return node
      }

      // Determine label and block type
      const isCarousel = data.blockType === 'carousel'
      const newLabel = isCarousel
        ? `Card ${existingPaths.length + 1}`
        : `Path ${existingPaths.length + 1}`

      const newBlockType = isCarousel ? 'generic-template' : 'text-message'

      const newPath = {
        id: nanoid(),
        label: newLabel,
        blockType: newBlockType,
        targetBlockId: null,
      }

      return {
        ...node,
        data: {
          ...node.data,
          paths: [...existingPaths, newPath],
        },
      }
    })
  )
}


const removePath = (pathId: string) => {
  setNodes(nodes =>
    nodes.map(node => {
      if (node.id !== id) return node

      const existingPaths = Array.isArray(node.data?.paths) ? node.data.paths : []

      if (existingPaths.length <= 1) {
        alert('❌ មិនអាចលុប path ចុងក្រោយបានទេ — ត្រូវមានយ៉ាងហោចណាស់មួយ path។')
        return node
      }

      return {
        ...node,
        data: {
          ...node.data,
          paths: existingPaths.filter(p => p.id !== pathId),
        },
      }
    })
  )

  setEdges(edges => edges.filter(edge => edge.sourceHandle !== pathId))
}

  const [showNodePropertiesOf] = useApplicationState(s => [s.actions.sidebar.showNodePropertiesOf])

  const showNodeProperties = useCallback(() => {
    showNodePropertiesOf({ id, type: NODE_TYPE })
  }, [id, showNodePropertiesOf])

  // const showNodeProperties = useCallback(() => {
  // setNodes(nodes =>
  //   nodes.map(node => {
  //     if (node.id !== id || node.type !== 'feature-block') return node

  //     return {
  //       ...node,
  //       data: {
  //         ...node.data,
  //         name: '', // ✅ Clear name to avoid confusion
  //       },
  //     }
  //   })
  // )


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

  useEffect(() => {
    setNodes(nodes =>
      nodes.map(node => {
        if (node.id !== id) return node

        const needsKh = !Array.isArray(node.data?.kh)
        const needsEn = !Array.isArray(node.data?.en)

        if (!needsKh && !needsEn) return node

        return {
          ...node,
          data: {
            ...node.data,
            kh: needsKh
              ? [{ template_type: 'text', is_active: true, text: 'សួស្តី! 👋 សូមស្វាគមន៍មកកាន់បុតខ្មែរ។' }]
              : node.data.kh,
            en: needsEn
              ? [{ template_type: 'text', is_active: true, text: 'Hello! 👋 Welcome to KhmerAi.Chat.' }]
              : node.data.en,
          },
        }
      })
    )
  }, [])


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
              Feature
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-x-1 pr-0.5">
            <select
              value={data.blockType}
              onChange={e => updateBlockType(e.target.value as FeatureBlockNodeData['blockType'])}
              onClick={() => showNodeProperties()}
              className="h-7 w-26 rounded-md bg-dark-800 text-light-100 text-xs border border-dark-200 px-1 outline-none transition hover:(bg-dark-300 border-teal-600) focus:(ring-2 ring-teal-600/50)"
            >
              <option value="info">ℹ️ Info</option>
              <option value="product">🛍️ Product</option>
              <option value="intent">🧠 Intent</option>
              <option value="smart-welcome">👋 Welcome</option>
              <option value="quick-menu">📋 Menu</option>
              <option value="carousel">🖼️ Carousel</option>

            </select>

             <button
              type="button"
              className="size-7 flex items-center justify-center border border-transparent rounded-lg bg-transparent outline-none transition active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100)"
              onClick={() => showNodeProperties()}
            >
              <div className="i-mynaui:cog size-4" />
            </button>

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
              className="size-7 flex items-center justify-center border border-dark-200 rounded-md bg-dark-900 text-red-400 outline-none transition hover:(bg-dark-300 border-red-400) active:(bg-dark-500 border-red-500)"
              onClick={() => deleteNode(id)}
              title="លុបប្លុកនេះ"
            >
              <div className="i-mynaui:trash size-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Name + Paths */}
      <div className="flex flex-col divide-y divide-dark-200">
        {/* Block Name Display */}
        {data.name && (
          <div className="px-4 pt-3 pb-1">
            <div className="text-xs text-light-900/60 font-semibold">
              🔖 {data.name}
            </div>
          </div>
        )}

        {/* Paths Section */}
        <div className="flex flex-col p-4">
          <div className="text-xs text-light-900/50 font-medium">
            {data.blockType === 'carousel' ? 'Cards' : 'Paths'}
          </div>

          {data.paths?.length > 0 && (
            <div className="mt-2 flex flex-col">

             {data.paths.map(path => (
                <ButtonPath
                  key={path.id}
                  id={path.id}
                  label={path.label}
                  isConnectable={isConnectable}
                  onRemove={() => removePath(path.id)}
                />
              ))}

            </div>
          )}
          <div className="mt-2 flex">
            <button
              type="button"
              className="h-8 w-full flex items-center justify-center border border-dark-50 rounded-md bg-dark-300 px-2.5 outline-none transition active:(border-dark-200 bg-dark-400/50)"
              onClick={addPath}
            >
              <div className="text-xs font-medium leading-none tracking-wide">Add Path</div>
              <div className="i-lucide:plus ml-1 size-4.5 text-white op-50" />
            </button>
          </div>
        </div>

        {/* Handle */}
        <div className="relative min-h-10">
          {/* <CustomHandle
            type="target"
            id={sourceHandleId}
            position={Position.Left}
            isConnectable={isConnectable}
            className="top-6! hover:(important:ring-2 important:ring-teal-500/50)"
          /> */}

           <CustomHandle
              type="target"
              id={sourceHandleId}
              position={Position.Left} // ✅ Moves handle to top edge
              isConnectable={isConnectable}
              className="top-6! hover:(important:ring-2 important:ring-purple-500/50)"
              title="ភ្ជាប់ពីជំហានមុន"
              onTouchStart={e => e.stopPropagation()} // ✅ Prevent canvas drag
            />

        </div>
       

        {/* Footer */}
        <div className="overflow-clip rounded-b-xl bg-dark-300/30 px-4 py-2 text-xs text-light-900/50">
          Node: <span className="text-light-900/60 font-semibold">#{id}</span>
        </div>
      </div>
    </div>
    )
  }


export const metadata: RegisterNodeMetadata<FeatureBlockNodeData> = {
  type: 'feature-block',
  node: FeatureBlockNode,
  detail: {
    icon: 'i-lucide:layout-template',
    title: 'Feature Block',
    description: 'Trigger different block types from one node.',
  },
  connection: {
    inputs: 0,
    outputs: Infinity, // ✅ allow up to 3 paths for carousel
  },
  available: false, // ✅ make it available in the node list
  defaultData: {
    blockType: 'info', // ✅ default is now 'info'
    config: {},
    paths: [
      {
        id: nanoid(),
        label: 'Path 1',
        blockType: 'text-message',
        targetBlockId: null,
      },
    ],
  },
   propertyPanel: (await import('~/modules/sidebar/panels/node-properties/property-panels/feature-block-panel')).default,
}
