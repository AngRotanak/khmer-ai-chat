import React from 'react'

type QuickMenuPanelProps = {
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

export const QuickMenuPanel: React.FC<QuickMenuPanelProps> = ({
  data,
  updateData,
  config,
  onChange,
}) => {
  const updateOption = (index: number, value: string) => {
    const updated = [...(config.options || [])]
    updated[index] = value
    onChange({ ...config, options: updated })
  }

  const addOption = () => {
    const updated = [...(config.options || []), '']
    onChange({ ...config, options: updated })
  }

  const removeOption = (index: number) => {
    const updated = [...(config.options || [])]
    updated.splice(index, 1)
    onChange({ ...config, options: updated })
  }

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
          placeholder="e.g. menu_skin_care"
          className="h-8 w-full rounded-md bg-dark-400 dark:bg-dark-800 text-light-900 dark:text-light-100 text-xs border border-dark-100 dark:border-dark-600 px-2 outline-none placeholder:text-light-900/40 dark:placeholder:text-light-100/40 hover:(bg-dark-300 dark:bg-dark-700 border-dark-200 dark:border-dark-500)"
          maxLength={40}
        />
      </div>

      {/* 📋 Menu Title */}
      <div className="flex flex-col gap-y-1">
        <label className="text-xs text-light-900/60 dark:text-light-100/60 font-medium">
          Menu Title
        </label>
        <input
          type="text"
          value={config.title || ''}
          onChange={e => onChange({ ...config, title: e.target.value })}
          placeholder="e.g. Choose a category"
          className="h-8 w-full rounded-md bg-dark-400 dark:bg-dark-800 text-light-900 dark:text-light-100 text-xs border border-dark-100 dark:border-dark-600 px-2 outline-none placeholder:text-light-900/40 dark:placeholder:text-light-100/40 hover:(bg-dark-300 dark:bg-dark-700 border-dark-200 dark:border-dark-500)"
        />
      </div>

      {/* 📌 Menu Options */}
      <div className="flex flex-col gap-y-2">
        <label className="text-xs text-light-900/60 dark:text-light-100/60 font-medium">
          Menu Options
        </label>
        {(config.options || []).map((option: string, index: number) => (
          <div key={index} className="flex items-center gap-x-2">
            <input
              type="text"
              value={option}
              onChange={e => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="h-8 w-full rounded-md bg-dark-400 dark:bg-dark-800 text-light-900 dark:text-light-100 text-xs border border-dark-100 dark:border-dark-600 px-2 outline-none placeholder:text-light-900/40 dark:placeholder:text-light-100/40 hover:(bg-dark-300 dark:bg-dark-700 border-dark-200 dark:border-dark-500)"
            />
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="text-red-400 dark:text-red-300 text-xs hover:text-red-300 dark:hover:text-red-200"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="mt-2 h-8 w-full flex items-center justify-center border border-dark-50 dark:border-dark-600 rounded-md bg-dark-300 dark:bg-dark-700 px-2.5 text-xs text-light-900/60 dark:text-light-100/60 hover:(bg-dark-400 dark:bg-dark-600 border-dark-200 dark:border-dark-500)"
        >
          ➕ Add Option
        </button>
      </div>
    </div>
  )
}

export default QuickMenuPanel
