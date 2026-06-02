import React, { useEffect } from 'react'

type SmartWelcomePanelProps = {
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

export const SmartWelcomePanel: React.FC<SmartWelcomePanelProps> = ({
  data,
  updateData,
  config,
  onChange,
}) => {
  // 🧷 Set default name if missing
  useEffect(() => {
    if (!data.name) {
      updateData({ name: 'welcome' })
    }
  }, [data.name, updateData])

  return (
    <div className="flex flex-col gap-y-4 p-4 text-light-900 dark:text-light-100">
      {/* 🔖 Block Name Display (Disabled Input) */}
      <div className="flex flex-col gap-y-1">
        <label className="text-xs text-light-900/60 dark:text-light-100/60 font-medium mb-1">
          Block Name
        </label>
        <input
          type="text"
          value={data.name || 'welcome'}
          disabled
          className="h-8 w-full rounded-md bg-dark-300 dark:bg-dark-700 text-light-900/40 dark:text-light-100/40 text-xs border border-dark-100 dark:border-dark-600 px-2 outline-none cursor-not-allowed"
        />
        <p className="text-[10px] text-light-900/40 dark:text-light-100/40">
          This block name is fixed to <strong>welcome</strong>.
        </p>
      </div>

      {/* 👋 Welcome Message */}
      <div className="flex flex-col gap-y-1">
        <label className="text-xs text-light-900/60 dark:text-light-100/60 font-medium">
          Welcome Message
        </label>
        <textarea
          value={config.message || ''}
          onChange={e => onChange({ ...config, message: e.target.value })}
          placeholder="e.g. សូមស្វាគមន៍! តើអ្នកចង់ស្វែងរកអ្វី?"
          className="min-h-[60px] w-full rounded-md bg-dark-400 dark:bg-dark-800 text-light-900 dark:text-light-100 text-xs border border-dark-100 dark:border-dark-600 px-2 py-1 outline-none placeholder:text-light-900/40 dark:placeholder:text-light-100/40 hover:(bg-dark-300 dark:bg-dark-700 border-dark-200 dark:border-dark-500)"
        />
      </div>
    </div>
  )
}

export default SmartWelcomePanel
