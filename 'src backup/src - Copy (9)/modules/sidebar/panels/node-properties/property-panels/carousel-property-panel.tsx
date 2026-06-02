import React from 'react'
import type { FeatureBlock, PathItem, CarouselConfig } from '~/modules/blocks/types/feature-block'

type CarouselPropertyPanelProps = {
  data: FeatureBlock
  path?: PathItem
  updateData: (patch: Partial<FeatureBlock>) => void
}

export const CarouselPropertyPanel: React.FC<CarouselPropertyPanelProps> = ({
  data,
  updateData,
}) => {
  // ✅ Safe fallback for config
  const rawConfig = (data?.config as CarouselConfig) || {}

  // ✅ Merge defaults with existing config
  const config: CarouselConfig = {
    tag: rawConfig.tag ?? 'default',
    layout: rawConfig.layout ?? 'carousel',
    autoplay: rawConfig.autoplay ?? false,
    interval: rawConfig.interval ?? 5000,
    showIndicators: rawConfig.showIndicators ?? true,
  }

  return (
    <div className="flex flex-col gap-y-4 p-4 text-light-900 dark:text-light-100">
      {/* 🔖 Block Name Input */}
      <div className="flex flex-col gap-y-1">
        <label className="text-xs text-light-900/60 font-medium mb-1">Block Name</label>
        <input
          type="text"
          value={data.block_name || ''}
          onChange={e => updateData({ block_name: e.target.value })}
          placeholder="e.g. info_skin_care"
          className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
          maxLength={40}
        />
        <p className="text-[10px] text-light-900/40">
          This name will appear on the canvas and help identify the block.
        </p>
      </div>

      {/* 🎞️ Carousel Layout Selector */}
      <div className="flex flex-col gap-y-1">
        <label className="text-xs text-light-900/60 dark:text-light-100/60 font-medium mb-1">
          Carousel Layout
        </label>
        <select
          className="h-8 w-full rounded-md bg-dark-400 dark:bg-dark-800 text-light-900 dark:text-light-100 text-xs border border-dark-100 dark:border-dark-600 px-2 outline-none hover:(bg-dark-300 dark:bg-dark-700 border-dark-200 dark:border-dark-500)"
          value={config.layout}
          onChange={e =>
            updateData({
              config: { ...config, layout: e.target.value },
            })
          }
        >
          <option value="carousel">Carousel</option>
          <option value="horizontal-scroll">Horizontal Scroll</option>
          <option value="fade">Fade</option>
        </select>
      </div>

      {/* ⚙️ Autoplay Toggle */}
      <div className="flex items-center gap-x-2">
        <input
          type="checkbox"
          checked={config.autoplay}
          onChange={e =>
            updateData({
              config: { ...config, autoplay: e.target.checked },
            })
          }
        />
        <label className="text-xs text-light-900/60 dark:text-light-100/60">
          Autoplay
        </label>
      </div>

      {/* ⏱️ Interval Input */}
      {config.autoplay && (
        <div className="flex flex-col gap-y-1">
          <label className="text-xs text-light-900/60 dark:text-light-100/60 font-medium mb-1">
            Autoplay Interval (ms)
          </label>
          <input
            type="number"
            value={config.interval}
            onChange={e =>
              updateData({
                config: { ...config, interval: Number(e.target.value) },
              })
            }
            className="h-8 w-full rounded-md bg-dark-400 dark:bg-dark-800 text-light-900 dark:text-light-100 text-xs border border-dark-100 dark:border-dark-600 px-2 outline-none"
          />
        </div>
      )}

      {/* 🔘 Show Indicators Toggle */}
      <div className="flex items-center gap-x-2">
        <input
          type="checkbox"
          checked={config.showIndicators}
          onChange={e =>
            updateData({
              config: { ...config, showIndicators: e.target.checked },
            })
          }
        />
        <label className="text-xs text-light-900/60 dark:text-light-100/60">
          Show Indicators
        </label>
      </div>

      {/* 🎉 Campaign Tag */}
      <div className="flex flex-col gap-y-1">
        <label className="text-xs text-light-900/60 font-medium mb-1">Campaign Tag</label>
        <input
          type="text"
          value={config.tag || ''}
          onChange={e =>
            updateData({
              config: { ...config, tag: e.target.value }, // ✅ corrected to use `tag`
            })
          }
          placeholder="e.g. new_year, promo, default"
          className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
        />
      </div>
    </div>
  )
}

export default CarouselPropertyPanel
