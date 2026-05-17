import React from 'react'
import type { FeatureBlock, PathItem, QuickMenuConfig } from '~/modules/blocks/types/feature-block'

type QuickMenuPanelProps = {
  data: FeatureBlock
  path: PathItem | undefined
  updateData: (patch: Partial<FeatureBlock>) => void
}

export const QuickMenuPanel: React.FC<QuickMenuPanelProps> = ({
  data,
  path,
  updateData,
}) => {
  // ✅ Default to unchecked (false)
const rawConfig = data.config as QuickMenuConfig | undefined

const config: QuickMenuConfig = {
  defaultLang: rawConfig?.defaultLang ?? 'kh',
  inactivityHours: rawConfig?.inactivityHours ?? 24,
  alwaysShow: rawConfig?.alwaysShow ?? true,
  menu_tag: rawConfig?.menu_tag ?? 'default',
}

  return (
    <div className="space-y-4">
      {/* 🧱 Block-Level Configuration */}
      <div className="border border-dark-300 rounded-md p-3 space-y-3 bg-dark-800">
        <div className="text-xs font-semibold text-light-900/60 mb-2">
          🧭 Quick Menu Block
        </div>

        {/* 🔖 Block Name */}
        <div className="flex flex-col gap-y-1">
          <label className="text-xs text-light-900/60 font-medium mb-1">Block Name</label>
          <input
            type="text"
            value={data.block_name || ''}
            onChange={e => updateData({ block_name: e.target.value })}
            placeholder="e.g. quick_menu_new_year"
            className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
            maxLength={40}
          />
          <p className="text-[10px] text-light-900/40">
            Use a unique name (e.g. <code>quick_menu_new_year</code>). Only one quick menu block will be active at a time.
          </p>
        </div>

          {/* 🔄 Always Show */}
        <div className="flex items-center gap-x-2">
          <input
            type="checkbox"
            checked={config.alwaysShow}
            onChange={e =>
              updateData({ config: { ...config, alwaysShow: e.target.checked } })
            }
            className="h-4 w-4 rounded border border-dark-500 bg-dark-900"
          />
          <label className="text-xs text-light-900/60 font-medium">
            Always show quick menu on every new message
          </label>
        </div>

        {/* ⚡ Inactivity Hours (visible if alwaysShow = false) */}
        {!config.alwaysShow && (
          <div className="flex items-center gap-x-2">
            <input
              type="number"
              value={config.inactivityHours}
              onChange={e =>
                updateData({ config: { ...config, inactivityHours: Number(e.target.value) } })
              }
              className="h-8 w-24 rounded-md bg-dark-900 text-light-100 text-xs px-2 border border-dark-500"
              min={1}
            />
            <span className="text-xs">Hours of inactivity before showing quick menu</span>
          </div>
        )}




        {/* 🌐 Default Language */}
        <div className="flex flex-col gap-y-1">
          <label className="text-xs text-light-900/60 font-medium mb-1">Default Language</label>
          <select
            value={config.defaultLang || 'kh'}
            onChange={e => updateData({ config: { ...config, defaultLang: e.target.value } })}
            className="h-8 w-full rounded-md bg-dark-900 text-light-100 text-xs px-2 border border-dark-500"
          >
            <option value="km">Khmer</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* 🏷️ Menu Tag */}
        <div className="flex flex-col gap-y-1">
          <label className="text-xs text-light-900/60 font-medium mb-1">Menu Tag</label>
          <input
            type="text"
            value={config.menu_tag || ''}
            onChange={e => updateData({ config: { ...config, menu_tag: e.target.value } })}
            placeholder="e.g. default, new_year, special_event"
            className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
          />
        </div>
      </div>
    </div>
  )
}

export default QuickMenuPanel

