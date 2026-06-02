import React from 'react'

type IntentPanelProps = {
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

export const IntentPanel: React.FC<IntentPanelProps> = ({
  data,
  updateData,
  config,
  onChange,
}) => {
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

      {/* 🧠 Intent Keyword */}
      <div className="flex flex-col gap-y-1">
        <label className="text-xs text-light-900/60 dark:text-light-100/60 font-medium">
          Intent Keyword
        </label>
        <input
          type="text"
          value={config.keyword || ''}
          onChange={e => onChange({ ...config, keyword: e.target.value })}
          placeholder="e.g. skin_care"
          className="h-8 w-full rounded-md bg-dark-400 dark:bg-dark-800 text-light-900 dark:text-light-100 text-xs border border-dark-100 dark:border-dark-600 px-2 outline-none placeholder:text-light-900/40 dark:placeholder:text-light-100/40 hover:(bg-dark-300 dark:bg-dark-700 border-dark-200 dark:border-dark-500)"
        />
      </div>
    </div>
  )
}

export default IntentPanel
