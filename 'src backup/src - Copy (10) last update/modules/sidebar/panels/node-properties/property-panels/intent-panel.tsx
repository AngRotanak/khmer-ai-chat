import React from 'react'
import type { FeatureBlock, PathItem} from '~/modules/blocks/types/feature-block'

type IntentPanelProps = {
  data: FeatureBlock
  path: PathItem | undefined
  updateData: (patch: Partial<FeatureBlock>) => void
}

export const IntentPanel: React.FC<IntentPanelProps> = ({
  data,
  updateData,
}) => {

  // const config = (data.config as IntentConfig) || {
  //   inactivityHours: 24,
  //   defaultLang: 'en',
  //   personalizeName: false,
  //   campaignTag: 'default',
  // }

  return (
    <div className="flex flex-col gap-y-4 p-4 text-light-900 dark:text-light-100">
      {/* 🔖 Block Name Input */}
      <div className="flex flex-col gap-y-1">
        <label
          className="text-xs text-light-900/60 dark:text-light-100/60 font-medium mb-1"
          title="បញ្ចូលឈ្មោះប្លុកដើម្បីស្គាល់ងាយស្រួល"
        >
          Block Name
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => updateData({ name: e.target.value })}
          placeholder="e.g. intent_skin_care"
          className="h-8 w-full rounded-md bg-dark-400 dark:bg-dark-800 text-light-900 dark:text-light-100 text-xs border border-dark-100 dark:border-dark-600 px-2 outline-none placeholder:text-light-900/40 dark:placeholder:text-light-100/40 hover:(bg-dark-300 dark:bg-dark-700 border-dark-200 dark:border-dark-500)"
          maxLength={40}
        />
      </div>

     
    </div>
  )
}

export default IntentPanel
