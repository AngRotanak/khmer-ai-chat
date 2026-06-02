import React, { useEffect } from 'react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@radix-ui/react-tooltip'

type CarouselPropertyPanelProps = {
  data: {
    name?: string
    config: Record<string, any>
    blockType: string
    paths?: any[]
  }
  updateData: (patch: Partial<any>) => void
  config: Record<string, any>
  onChange: (newConfig: Record<string, any>) => void
}

export const CarouselPropertyPanel: React.FC<CarouselPropertyPanelProps> = ({
  data,
  updateData,
}) => {
  const layout = data.config.layout ?? 'carousel'

  // 🧷 Set default name if missing
  useEffect(() => {
    if (!data.name) {
      updateData({ name: 'carousel' })
    }
  }, [data.name, updateData])

  return (
    <div className="flex flex-col gap-y-4 p-4 text-light-900 dark:text-light-100">
      {/* 🏷️ Block Name Input */}
      <div className="flex flex-col gap-y-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="text-xs text-light-900/60 dark:text-light-100/60 font-medium mb-1">
                Block Name
              </label>
            </TooltipTrigger>
            <TooltipContent className="bg-dark-400 dark:bg-dark-800 text-light-900 dark:text-light-100 text-xs px-2 py-1 rounded shadow">
              បញ្ចូលឈ្មោះប្លុកដើម្បីស្គាល់ងាយស្រួល
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <input
          type="text"
          value={data.name || ''}
          onChange={e => updateData({ name: e.target.value })}
          placeholder="e.g. info_skin_care"
          className="h-8 w-full rounded-md bg-dark-400 dark:bg-dark-800 text-light-900 dark:text-light-100 text-xs border border-dark-100 dark:border-dark-600 px-2 outline-none placeholder:text-light-900/40 dark:placeholder:text-light-100/40 hover:(bg-dark-300 dark:bg-dark-700 border-dark-200 dark:border-dark-500)"
          maxLength={40}
        />

        <p className="text-[10px] text-light-900/40 dark:text-light-100/40">
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
          value={layout}
          onChange={e =>
            updateData({
              config: { ...data.config, layout: e.target.value },
            })
          }
        >
          <option value="carousel">Carousel</option>
          <option value="horizontal-scroll">Horizontal Scroll</option>
          <option value="fade">Fade</option>
        </select>
      </div>
    </div>
  )
}

export default CarouselPropertyPanel
