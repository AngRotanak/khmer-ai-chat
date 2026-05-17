import type { Node, NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { nanoid } from 'nanoid'
import { useState, useMemo, useCallback, useReducer, useEffect } from 'react'
import { cn } from '~@/utils/cn'
import CustomHandle from '~/modules/flow-builder/components/handles/custom-handle'
import { useDeleteNode } from '~/modules/flow-builder/hooks/use-delete-node'
import { ButtonPath } from '~/modules/nodes/nodes/generic-template-node/components/button-path'
import { getNodeDetail } from '~/modules/nodes/utils'
import { useApplicationState } from '~/stores/application-state'
import { produce } from 'immer'
import type {
  FeatureBlock,
  PathItem,
  Canvas,
  WaitTrigger
} from '~/modules/blocks/types/feature-block'
import type { RegisterNodeMetadata } from '~/modules/nodes/types'

import { useCanvasStore } from '~/stores/canvas-store'


const NODE_TYPE = 'feature-block'
type Props = NodeProps<Node<FeatureBlock, typeof NODE_TYPE>>


export function FeatureBlockNode({ id, data, selected, isConnectable }: Props) {
  const setNodes = useCanvasStore(s => s.setNodes)
  const setEdges = useCanvasStore(s => s.setEdges)


  const deleteNode = useDeleteNode()

  const [sourceHandleId] = useState(nanoid())
  const meta = useMemo(() => getNodeDetail('feature-block'), [])
  const [, forceRender] = useReducer(x => x + 1, 0)
  const [showNodePropertiesOf] = useApplicationState(s => [s.actions.sidebar.showNodePropertiesOf])

  const showNodeProperties = useCallback(() => {
    showNodePropertiesOf({ id, type: NODE_TYPE })
  }, [id, showNodePropertiesOf])



  const updateBlockType = (type: FeatureBlock['block_type']) => {
    console.group(`🔧 updateBlockType called`);
    console.log(`➡️ Requested new type: ${type}`);

    setNodes(nodes =>
      nodes.map(node => {
        if (node.id !== id) return node;

        const oldType = node.data?.block_type;
        console.log(`🧩 Updating node ${node.id}`);
        console.log(`   • Old type: ${oldType}`);
        console.log(`   • New type: ${type}`);

        const canvas = getSafeCanvas(node.data);
        const paths = Array.isArray(canvas?.paths) ? canvas.paths : [];

        let safePaths: PathItem[];

        if (type === 'quick-menu') {
          safePaths = [{
            id: nanoid(),
            template_ref: `${id}_quickmenu_path`,
            payload: undefined,
            send_immediately: true,
            label: 'Quick Menu',
            blockType: 'quick-replies',   // Messenger type for quick menu
            targetBlockId: null,
            trigger: 'immediate',
            detection_mode: 'keyword',
            expected_intent: '',
            intent_confidence: 0.7,
            condition: { match: 'includes', value: '' },
            delay: { seconds: 0 },
          }];
          console.log(`   • Paths reset for quick-menu`);
        }
        else if (type === 'form-block') {
          safePaths = [{
            id: nanoid(),
            template_ref: `${id}_form_path_1`,
            payload: undefined,
            send_immediately: true,
            label: 'Field 1',
            blockType: 'text-message',   // each field asks for input
            targetBlockId: null,
            trigger: 'on_reply',         // waits for user reply
            detection_mode: 'keyword',
            expected_intent: '',
            intent_confidence: 0.7,
            condition: { match: 'includes', value: '' },
            delay: { seconds: 0 },
          }];
          console.log(`   • Paths initialized for form-block`);
        }
        else {
          safePaths = paths.length === 0
            ? [{
              id: nanoid(),
              template_ref: `${id}_path_1`,
              payload: undefined,
              send_immediately: true,
              label: type === 'carousel' ? 'Card 1' : 'Path 1',
              blockType: type === 'carousel' ? 'generic-template' : 'text-message',
              targetBlockId: null,
              trigger: 'immediate',
              detection_mode: 'keyword',
              expected_intent: '',
              intent_confidence: 0.7,
              condition: { match: 'includes', value: '' },
              delay: { seconds: 0 },
            }]
            : paths.map((p, i) => {
              const shouldConvert = type === 'carousel' && p.blockType !== 'generic-template';
              if (shouldConvert) {
                console.log(`   • Converting path ${p.id} to generic-template`);
              }
              return {
                ...p,
                label: type === 'carousel' ? `Card ${i + 1}` : `Path ${i + 1}`,
                blockType: shouldConvert ? 'generic-template' : p.blockType,
                template_ref: p.template_ref ?? `${id}_path_${i + 1}`,
                delay: p.delay ?? { seconds: 0 },
              };
            });
        }

        const defaultConfig: Record<string, any> = (() => {
          switch (type) {
            case 'product':
              return { product_id: '', show_price: true };
            case 'intent':
              return { expected_intent: '', confidence: 0.7 };
            case 'smart-welcome':
              return { greeting: '', fallback: '' };
            case 'quick-menu':
              return { defaultLang: 'kh', inactivityHours: 24, alwaysShow: true, menu_tag: 'default' };
            case 'carousel':
              return { layout: 'horizontal' };
            case 'form-block':   // ✅ new
              return {
                fields: [],              // array of field definitions
                confirmation_message_en: '',
                confirmation_message_kh: '',
                flow_payload: ''
              };
            default:
              return {};
          }
        })();


        console.log(`   • Default config set:`, defaultConfig);

        return {
          ...node,
          data: {
            ...node.data,
            block_type: type,
            config: defaultConfig,
            canvas: {
              ...canvas,
              paths: safePaths,
            },
          },
        };
      })
    );

    console.groupEnd();
  };


  const addPath = () => {
    setNodes(nodes =>
      nodes.map(node => {
        if (node.id !== id) return node

        const canvas = getSafeCanvas(node.data)

        if (node.data.block_type === 'carousel' && canvas.paths.length >= 10) {
          alert('❌ មិនអាចបន្ថែមកាតលើសពី 10 បានទេ')
          return node
        }

        const isCarousel = node.data.block_type === 'carousel'
        const newLabel = isCarousel ? `Card ${canvas.paths.length + 1}` : `Path ${canvas.paths.length + 1}`
        const newBlockType = isCarousel ? 'generic-template' : 'text-message'


        const newPath: PathItem = {
          id: nanoid(),
          template_ref: `${id}_path_${canvas.paths.length + 1}`, // ✅ required
          label: newLabel,
          blockType: newBlockType,
          targetBlockId: null,
          send_immediately: true,
          trigger: 'immediate',
          detection_mode: 'keyword',
          expected_intent: '',
          intent_confidence: 0.7,
          condition: { match: 'includes', value: '' },
          delay: { seconds: 0 }, // ✅ required if trigger is 'delay'
          payload: undefined // ✅ optional, will be auto-linked later
        }


        return {
          ...node,
          data: {
            ...node.data,
            canvas: {
              layout: canvas.layout,
              paths: [...canvas.paths, newPath]
            }
          }
        }
      })
    )

  }


  const removePath = (templateId: string) => {
    setNodes(nodes =>
      nodes.map(node => {
        if (node.id !== id) return node
        const canvas = getSafeCanvas(node.data)
        const paths = Array.isArray(canvas.paths) ? canvas.paths : []
        if (paths.length <= 1) {
          alert('❌ មិនអាចលុប path ចុងក្រោយបានទេ — ត្រូវមានយ៉ាងហោចណាស់មួយ path។')
          return node
        }

        return {
          ...node,
          data: {
            ...node.data,
            canvas: {
              ...canvas,
              paths: paths.filter(p => p.id !== templateId)
            }

          }
        }
      })
    )

    setEdges(edges => edges.filter(edge => edge.sourceHandle !== templateId))
  }


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

  function getTriggerLabel(trigger?: WaitTrigger): string {
    switch (trigger) {
      case 'immediate':
        return '⏱ បញ្ជូនភ្លាមៗ'
      case 'delay':
        return '⏳ រងចាំ'
      case 'condition':
        return '🧠 លក្ខខណ្ឌ'
      case 'on_reply':
        return '💬 ចាំការឆ្លើយតប'
      default:
        return '⏱ មិនបានកំណត់'
    }
  }



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
              value={data.block_type}
              onChange={e => updateBlockType(e.target.value as FeatureBlock['block_type'])}
              className="h-7 w-26 rounded-md bg-dark-800 text-light-100 text-xs border border-transparent px-1 outline-none transition hover:(bg-dark-300 border-teal-600) active:(ring-2 ring-teal-600/50)"
            >
              <option value="info">ℹ️ Info</option>
              <option value="smart-welcome">👋 Welcome</option>
              <option value="quick-menu">📋 Quick Menu</option>
              <option value="carousel">🖼️ Carousel</option>
              <option value="form-block">📝 Form Block</option> {/* ✅ new */}
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
              className="size-7 flex items-center justify-center border border-transparent rounded-lg bg-transparent text-red-400 outline-none transition active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100)"
              onClick={() => deleteNode(id)}
            >
              <div className="i-mynaui:trash size-4" />
            </button>
          </div>
        </div>
      </div>


      {/* Name + Paths */}
      <div className="flex flex-col divide-y divide-dark-200">
        {/* Block Name Display */}
        {data.block_name && (
          <div className="px-4 pt-3 pb-1">
            <div className="text-xs text-light-900/60 font-semibold">
              🔖 {data.block_name}
            </div>
          </div>
        )}



        {/* Paths Section */}
        {data.block_type !== 'form-block' && (
          <div className="flex flex-col p-4">
            {data.canvas?.paths?.length > 0 && (
              <div className="mt-2 flex flex-col">
                {data.canvas.paths.map(path => (
                  <ButtonPath
                    key={path.id}
                    id={path.id}
                    label={`${path.label}: ${getTriggerLabel(path.trigger ?? 'immediate')}`}
                    isConnectable={isConnectable}
                    onRemove={() => removePath(path.id)}
                  />
                ))}
              </div>
            )}

            <div className="mt-2 flex">
              {data.block_type !== 'quick-menu' && (
                <button
                  type="button"
                  className="h-8 w-full flex items-center justify-center border border-dark-50 rounded-md bg-dark-300 px-2.5 outline-none transition active:(border-dark-200 bg-dark-400/50)"
                  onClick={addPath}
                >
                  <div className="text-xs font-medium leading-none tracking-wide">Add Path</div>
                  <div className="i-lucide:plus ml-1 size-4.5 text-white op-50" />
                </button>
              )}
            </div>
          </div>
        )}


        {/* Handle */}
        <div className="relative h-0">
          <CustomHandle
            type="target"
            id={sourceHandleId}
            position={Position.Left}
            isConnectable={isConnectable}
            className="top-2! hover:(important:ring-2 important:ring-purple-500/50)"
            title="ភ្ជាប់ពីជំហានមុន"
            onTouchStart={e => e.stopPropagation()}
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



import { getPreviewFeatureBlockData } from '~/modules/nodes/index';

export const metadata: RegisterNodeMetadata<FeatureBlock> = {
  type: 'feature-block',
  node: FeatureBlockNode,
  detail: {
    icon: 'i-lucide:layout-template',
    title: 'Feature Block',
    description: 'Trigger different block types from one node.',
  },
  connection: {
    inputs: 0,
    outputs: Infinity,
  },
  available: false,
  defaultData: getPreviewFeatureBlockData(), // ✅ now Messenger-safe
  propertyPanel: (await import('~/modules/sidebar/panels/node-properties/property-panels/feature-block-panel')).default,
};



function getSafeCanvas(data: Partial<FeatureBlock>): Canvas {
  const layout = data.canvas?.layout === 'horizontal' ? 'horizontal' : 'vertical';
  const paths = Array.isArray(data.canvas?.paths) ? data.canvas.paths : [];
  return { layout, paths };
}
