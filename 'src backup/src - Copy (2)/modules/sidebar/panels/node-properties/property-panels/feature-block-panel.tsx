import type { BuilderNodeType } from '~/modules/nodes/types'
import { InfoPanel } from './info-panel'
import { ProductPanel } from './product-panel'
import { IntentPanel } from './intent-panel'
import { SmartWelcomePanel } from './smart-welcome-panel'
import { QuickMenuPanel } from './quick-menu-panel'
import { CarouselPropertyPanel } from './carousel-property-panel'
import type { Edge } from '@xyflow/react'
import type {
  FeatureBlock,
  Condition,
  WaitTrigger,
  EntryTrigger,
  DetectionMode,
} from '~/modules/blocks/types/feature-block'
import { useCanvasStore } from '~/stores/canvas-store'
import { useMemo } from 'react'
import { produce } from 'immer'

interface Props {
  id: string
  type: BuilderNodeType
  selectedPathId: string
}

export default function FeatureBlockPanel({ id, selectedPathId }: Props) {
  const node = useCanvasStore(s => s.nodes.find(n => n.id === id)) // ✅ remove type check here

  const { paths } = useMemo(() => {
    const canvas = node?.data && typeof node.data === 'object' && 'canvas' in node.data
      ? (node.data as any).canvas
      : undefined

    return parseCanvasSafely(canvas)
  }, [node])

  const index = selectedPathId
    ? paths.findIndex(p => p.id === selectedPathId)
    : -1

  const path = index >= 0 ? paths[index] : undefined

  console.log('🧪 Recomputed index:', index)
  console.log('🧪 Recomputed path:', path)



  if (!node || node.type !== 'feature-block') {
    return <div className="text-red-500">⚠️ Invalid block</div>
  }

  const data = node.data as FeatureBlock
  const config = data.config ?? {}

  const updateData = (patch: Partial<FeatureBlock>) => {
    useCanvasStore.getState().setNodes(nodes =>
      produce(nodes, draft => {
        const node = draft.find(n => n.id === id)
        if (!node) return
        Object.assign(node.data, patch)
        node.data.updatedAt = Date.now()
      })
    )
  }
  const updatePath = (index: number, patch: Partial<FeatureBlock['canvas']['paths'][number]>) => {
    const updatedPaths = [...(data.canvas?.paths ?? [])]
    updatedPaths[index] = {
      ...updatedPaths[index],
      ...patch,
    }

    console.log(`🧪 DEBUG: Updating path ${index} with`, patch)

    updateData({
      canvas: {
        ...data.canvas,
        paths: updatedPaths,
      },
    })
  }

  const updatePathTrigger = (index: number, trigger: WaitTrigger) => {
    updatePath(index, { trigger })
  }

  const updatePathCondition = (index: number, field: keyof Condition, value: string) => {
    const existing = data.canvas?.paths?.[index]?.condition ?? { match: 'includes', value: '' }
    updatePath(index, {
      condition: {
        ...existing,
        [field]: value,
      },
    })
  }

  const updateEntryTrigger = (trigger: EntryTrigger) => {
    const patch: Partial<FeatureBlock> = { entry_trigger: trigger }
    const isTextTrigger = trigger === 'message' || trigger === 'comment'

    if (trigger !== 'message') patch.entry_condition = undefined
    if (!isTextTrigger && data.canvas?.paths) {
      patch.canvas = {
        ...data.canvas,
        paths: data.canvas.paths.map(p => ({ ...p, condition: undefined })),
      }
    }

    updateData(patch)
  }

  const updatePathDetectionMode = (index: number, mode: DetectionMode) => {
    updatePath(index, { detection_mode: mode })
  }

  const updatePathExpectedIntent = (index: number, intent: string) => {
    updatePath(index, { expected_intent: intent })
  }

  const updatePathIntentConfidence = (index: number, confidence: number) => {
    updatePath(index, { intent_confidence: confidence })
  }

  const updatePathPayload = (index: number, payload: string) => {
    const trimmed = payload.trim()
    const freshNode = useCanvasStore.getState().nodes.find(n => n.id === id)

    const currentPath =
      freshNode?.type === 'feature-block' &&
        typeof freshNode.data === 'object' &&
        Array.isArray((freshNode.data as FeatureBlock).canvas?.paths)
        ? (freshNode.data as FeatureBlock).canvas!.paths![index]
        : undefined

    const updatedPayload =
      trimmed === ''
        ? undefined
        : {
          node_id: trimmed,
          template_type: currentPath?.blockType ?? 'text-message',
          lang: 'en',
        }
    updatePath(index, { payload: updatedPayload })
  }


  const handleConfigChange = (newConfig: Record<string, any>) => {
    updateData({ config: newConfig })
  }

  const updateEntryDetectionMode = (mode: 'keyword' | 'intent') => {
    const patch: Partial<FeatureBlock> = { entry_detection_mode: mode }

    if (mode === 'keyword' && !data.entry_condition) {
      patch.entry_condition = { match: 'includes', value: '' }
    }

    updateData(patch)
  }


  const updateEntryExpectedIntent = (intent: string) => {
    updateData({ expected_intent: intent })
  }

  const updateEntryIntentConfidence = (confidence: number) => {
    updateData({ intent_confidence: confidence })
  }



  return (
    <div className="flex flex-col gap-y-4">
      {data.block_type === 'info' && (
        <InfoPanel
          key="info"
          data={data}
          path={path}
          updateData={updateData}
          updatePathTrigger={updatePathTrigger}
          updatePathCondition={updatePathCondition}
          updateEntryTrigger={updateEntryTrigger}
          updateEntryDetectionMode={updateEntryDetectionMode}
          updateEntryExpectedIntent={updateEntryExpectedIntent}
          updateEntryIntentConfidence={updateEntryIntentConfidence}
          updatePathDetectionMode={updatePathDetectionMode}
          updatePathExpectedIntent={updatePathExpectedIntent}
          updatePathIntentConfidence={updatePathIntentConfidence}
          updatePathPayload={updatePathPayload}
        />


      )}
      {data.block_type === 'product' && (
        <ProductPanel
          key="product"
          data={data}
          updateData={updateData}
          config={config}
          onChange={handleConfigChange}
        />
      )}
      {data.block_type === 'intent' && (
        <IntentPanel
          key="intent"
          data={data}
          updateData={updateData}
          config={config}
          onChange={handleConfigChange}
        />
      )}
      {data.block_type === 'smart-welcome' && (
        <SmartWelcomePanel
          key="smart-welcome"
          data={data}
          updateData={updateData}
          config={config}
          onChange={handleConfigChange}
        />
      )}
      {data.block_type === 'menu' && (
        <QuickMenuPanel
          key="menu"
          data={data}
          updateData={updateData}
          config={config}
          onChange={handleConfigChange}
        />
      )}
      {data.block_type === 'carousel' && (
        <CarouselPropertyPanel
          key="carousel"
          data={data}
          updateData={updateData}
          config={config}
          onChange={handleConfigChange}
        />
      )}
    </div>
  )
}


type SafeCanvas = {
  layout: 'horizontal' | 'vertical';
  nodes: Node[];
  edges: Edge[];
  paths: any[];
};

function parseCanvasSafely(canvas: unknown): SafeCanvas {
  const fallbackLayout: 'horizontal' | 'vertical' = 'vertical';
  const fallbackNodes: Node[] = [];
  const fallbackEdges: Edge[] = [];
  const fallbackPaths: any[] = [];

  if (
    canvas &&
    typeof canvas === 'object' &&
    !Array.isArray(canvas) &&
    canvas.constructor === Object
  ) {
    const layout =
      typeof (canvas as any).layout === 'string' &&
        ((canvas as any).layout === 'horizontal' || (canvas as any).layout === 'vertical')
        ? (canvas as any).layout
        : fallbackLayout;

    const nodes = Array.isArray((canvas as any).nodes)
      ? (canvas as any).nodes.filter(
        (n: any) => typeof n === 'object' && n !== null && typeof n.id === 'string'
      )
      : fallbackNodes;

    const edges = Array.isArray((canvas as any).edges)
      ? (canvas as any).edges.filter(
        (e: any) => typeof e === 'object' && e !== null
      )
      : fallbackEdges;

    const paths = Array.isArray((canvas as any).paths)
      ? (canvas as any).paths.filter(
        (p: any) => typeof p === 'object' && p !== null
      )
      : fallbackPaths;

    return { layout, nodes, edges, paths };
  }

  console.warn(`⚠️ canvas is not a valid object:`, canvas);
  return {
    layout: fallbackLayout,
    nodes: fallbackNodes,
    edges: fallbackEdges,
    paths: fallbackPaths
  };
}

