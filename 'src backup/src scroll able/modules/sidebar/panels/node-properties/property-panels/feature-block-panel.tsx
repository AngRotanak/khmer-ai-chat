import type { BuilderNodeType } from '~/modules/nodes/types'
import { InfoPanel } from './info-panel'
import { ProductPanel } from './product-panel'
import { IntentPanel } from './intent-panel'
import { SmartWelcomePanel } from './smart-welcome-panel'
import { QuickMenuPanel } from './quick-menu-panel'
import { CarouselPropertyPanel } from './carousel-property-panel'

interface Props {
  id: string
  type: BuilderNodeType
  data: {
    name?: string
    config: Record<string, any>
    blockType: string
    paths?: any[]
  }
  updateData: (data: Partial<any>) => void
}

export default function FeatureBlockPanel({data, updateData }: Props) {
  if (!data || !data.blockType || !data.config) {
    return <div className="text-red-500">⚠️ Invalid block data</div>
  }

  const { blockType, config } = data

  const handleConfigChange = (newConfig: Record<string, any>) => {
    updateData({ config: newConfig })
  }

 return (
  <div className="flex flex-col gap-y-4">
    {blockType === 'info' && (
      <InfoPanel
        key="info"
        data={data}
        updateData={updateData}
        config={config}
        onChange={handleConfigChange}
      />
    )}
    {blockType === 'product' && (
      <ProductPanel
        key="product"
        data={data}
        updateData={updateData}
        config={config}
        onChange={handleConfigChange}
      />
    )}
    {blockType === 'intent' && (
      <IntentPanel
        key="intent"
        data={data}
        updateData={updateData}
        config={config}
        onChange={handleConfigChange}
      />
    )}
    {blockType === 'smart-welcome' && (
      <SmartWelcomePanel
        key="smart-welcome"
        data={data}
        updateData={updateData}
        config={config}
        onChange={handleConfigChange}
      />
    )}
    {blockType === 'quick-menu' && (
      <QuickMenuPanel
        key="quick-menu"
        data={data}
        updateData={updateData}
        config={config}
        onChange={handleConfigChange}
      />
    )}

    {blockType === 'carousel' && (
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
