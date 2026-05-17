import type { BuilderNodeType } from '~/modules/nodes/types'
import { InfoPanel } from './info-panel'
import { ProductPanel } from './product-panel'
import { IntentPanel } from './intent-panel'
import { SmartWelcomePanel } from './smart-welcome-panel'
import { QuickMenuPanel } from './quick-menu-panel'
import { CarouselPropertyPanel } from './carousel-property-panel'
import type { Condition, WaitTrigger, EntryTrigger, DetectionMode } from '~/modules/blocks/types/feature-block'
import type {
  FeatureBlock,
} from '~/modules/blocks/types/feature-block'



interface Props {
  id: string
  type: BuilderNodeType
  data: FeatureBlock
  updateData: (data: Partial<FeatureBlock>) => void
}



export default function FeatureBlockPanel({ data, updateData }: Props) {
  if (!data || !data.block_type || !data.config) {
    return <div className="text-red-500">⚠️ Invalid block data</div>
  }

  const config = data.config ?? {}

  const handleConfigChange = (newConfig: Record<string, any>) => {
    updateData({ config: newConfig })
  }

  const updatePathTrigger = (index: number, trigger: WaitTrigger) => {
    const updatedPaths = [...(data.canvas?.paths ?? [])]
    updatedPaths[index] = {
      ...updatedPaths[index],
      trigger,
    }
    updateData({
      canvas: {
        ...data.canvas,
        paths: updatedPaths,
      },
    })
  }

  const updatePathCondition = (index: number, field: keyof Condition, value: string) => {
    const updatedPaths = [...(data.canvas?.paths ?? [])]
    const existingCondition = updatedPaths[index].condition ?? { match: 'includes', value: '' }
    updatedPaths[index] = {
      ...updatedPaths[index],
      condition: {
        ...existingCondition,
        [field]: value,
      },
    }
    updateData({
      canvas: {
        ...data.canvas,
        paths: updatedPaths,
      },
    })
  }

const updateEntryTrigger = (trigger: EntryTrigger) => {
  const patch: Partial<FeatureBlock> = {
    entry_trigger: trigger,
  }

  const isTextTrigger = trigger === 'message' || trigger === 'comment'

  // 🧹 Clear entry_condition if not 'message'
  if (trigger !== 'message') {
    patch.entry_condition = undefined
  }

  // 🧹 Clear all path conditions if not a text-based trigger
  if (!isTextTrigger && data.canvas?.paths) {
    patch.canvas = {
      ...data.canvas,
      paths: data.canvas.paths.map(p => ({
        ...p,
        condition: undefined,
      })),
    }
  }

  updateData(patch)
}

  const updatePathDetectionMode = (index: number, mode: DetectionMode) => {
  const updatedPaths = [...(data.canvas?.paths ?? [])]
  updatedPaths[index] = {
    ...updatedPaths[index],
    detection_mode: mode,
  }
  updateData({
    canvas: {
      ...data.canvas,
      paths: updatedPaths,
    },
  })
}

const updatePathExpectedIntent = (index: number, intent: string) => {
  const updatedPaths = [...(data.canvas?.paths ?? [])]
  updatedPaths[index] = {
    ...updatedPaths[index],
    expected_intent: intent,
  }
  updateData({
    canvas: {
      ...data.canvas,
      paths: updatedPaths,
    },
  })
}

const updatePathIntentConfidence = (index: number, confidence: number) => {
  const updatedPaths = [...(data.canvas?.paths ?? [])]
  updatedPaths[index] = {
    ...updatedPaths[index],
    intent_confidence: confidence,
  }
  updateData({
    canvas: {
      ...data.canvas,
      paths: updatedPaths,
    },
  })
}



  return (
    <div className="flex flex-col gap-y-4">
      {data.block_type === 'info' && (
        <InfoPanel
          key="info"
          data={data}
          updateData={updateData}
          updatePathTrigger={updatePathTrigger}
          updatePathCondition={updatePathCondition}
          updateEntryTrigger={updateEntryTrigger}
          updatePathDetectionMode={updatePathDetectionMode}
          updatePathExpectedIntent={updatePathExpectedIntent} 
          updatePathIntentConfidence={updatePathIntentConfidence}
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
