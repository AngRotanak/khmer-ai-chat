import React, { useEffect } from 'react'
import { FlowDropdownSelector } from '~/utils/FlowDropdownSelector'
// import { useApplicationState } from '~/stores/application-state'

type QuickMenuOption = {
  type: 'text' | 'user_phone_number' | 'user_email'
  label_en?: string
  label_kh?: string
  payload?: string
  image_url?: string
}


type QuickMenuPanelProps = {
  data: {
    id: string
    name?: string
    config: {
      title: string
      options: QuickMenuOption[]
    }
    blockType: string
    paths?: any[]
  }
  flowList: string[]
  nodes: {
    id: string
    type: string
    data?: {
      blockType?: string
      cards?: { title?: string; title_km?: string }[]
    }
  }[]
  updateData: (patch: Partial<any>) => void
  config: {
    title: string
    options: QuickMenuOption[]
  }
  onChange: (newConfig: Record<string, any>) => void
}

export const QuickMenuPanel: React.FC<QuickMenuPanelProps> = ({
  data,
  updateData,
  config,
  onChange,
  flowList,
  nodes,
}) => {
  const safeOptions = Array.isArray(config.options) ? config.options : []
  

  // ✅ Auto-initialize with one quick reply
  useEffect(() => {
    if (safeOptions.length === 0) {
      const target = nodes.find(
        n =>
          n.id !== data.id &&
          ['info', 'product', 'carousel', 'smart-welcome'].includes(n.data?.blockType ?? '')
      )

      const label_en = target?.data?.cards?.[0]?.title ?? 'Option'
      const label_kh = target?.data?.cards?.[0]?.title_km ?? 'ជម្រើស'
      const payload = target?.id ?? ''

      onChange({
        ...config,
        options: [
          {
            type: 'text',
            label_en: `🧩 ${label_en}`,
            label_kh: `🧩 ${label_kh}`,
            payload,
          },
        ],
      })
    }
  }, [])

  const updateOption = (index: number, updates: Partial<QuickMenuOption>) => {
    const updated = [...safeOptions]
    updated[index] = { ...updated[index], ...updates }
    onChange({ ...config, options: updated })
  }

  const addOption = () => {
    const updated = [
      ...safeOptions,
      { type: 'text', label_en: '', label_kh: '', payload: '' },
    ]
    onChange({ ...config, options: updated })
  }

  const removeOption = (index: number) => {
    const updated = [...safeOptions]
    updated.splice(index, 1)
    onChange({ ...config, options: updated })
  }

  return (
    <div className="flex flex-col gap-y-4 p-4 text-light-900 dark:text-light-100">
      {/* 🔖 Block Name Input */}
      <div className="flex flex-col gap-y-1">
        <label className="text-xs font-medium text-light-900/60 dark:text-light-100/60">Block Name</label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => updateData({ name: e.target.value })}
          placeholder="e.g. menu_skin_care"
          className="h-8 w-full rounded-md bg-dark-400 dark:bg-dark-800 text-xs px-2 border border-dark-100 dark:border-dark-600 outline-none placeholder:text-light-900/40 dark:placeholder:text-light-100/40"
          maxLength={40}
        />
      </div>

      {/* 🗣 Intro Text */}
<div className="flex flex-col">
  <div className="text-xs font-semibold text-light-900/60">Intro Text</div>
  <input
    type="text"
    value={language === 'kh' ? data.intro_text?.kh ?? '' : data.intro_text?.en ?? ''}
    onChange={e =>
      updateData({
        intro_text: {
          ...data.intro_text,
          [language]: e.target.value,
        },
      })
    }
    placeholder={language === 'kh' ? 'សូមជ្រើសរើសជម្រើសខាងក្រោម' : 'Choose an option below'}
    className="mt-2 h-8 w-full border border-dark-300 rounded-md bg-dark-600 px-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500"
  />
</div>


      {/* 📋 Menu Title */}
      <div className="flex flex-col gap-y-1">
        <label className="text-xs font-medium text-light-900/60 dark:text-light-100/60">Menu Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={e => onChange({ ...config, title: e.target.value })}
          placeholder="e.g. Choose a category"
          className="h-8 w-full rounded-md bg-dark-400 dark:bg-dark-800 text-xs px-2 border border-dark-100 dark:border-dark-600 outline-none placeholder:text-light-900/40 dark:placeholder:text-light-100/40"
        />
      </div>

      {/* 📌 Menu Options */}
      <div className="flex flex-col gap-y-2">
        <label className="text-xs font-medium text-light-900/60 dark:text-light-100/60">Quick Replies</label>

        {safeOptions.map((option, index) => (
          <div key={index} className="flex flex-col gap-y-1 border border-dark-200 dark:border-dark-700 rounded-md p-2 bg-dark-300 dark:bg-dark-800">
            {/* 🔘 Type Selector */}
            <select
              value={option.type}
              onChange={e => updateOption(index, { type: e.target.value as QuickMenuOption['type'] })}
              className="h-8 w-full rounded-md bg-dark-400 dark:bg-dark-700 text-xs px-2 border border-dark-100 dark:border-dark-600 outline-none"
            >
              <option value="text">📝 Text</option>
              <option value="user_phone_number">📞 Request Phone Number</option>
              <option value="user_email">📧 Request Email</option>
            </select>

            {/* 🏷️ Labels (only for text) */}
            {option.type === 'text' && (
              <>
                <input
                  type="text"
                  value={option.label_en ?? ''}
                  onChange={e => updateOption(index, { label_en: e.target.value })}
                  placeholder="Label (English)"
                  className="h-8 w-full rounded-md bg-dark-400 dark:bg-dark-700 text-xs px-2 border border-dark-100 dark:border-dark-600 outline-none placeholder:text-light-900/40 dark:placeholder:text-light-100/40"
                />
                <input
                  type="text"
                  value={option.label_kh ?? ''}
                  onChange={e => updateOption(index, { label_kh: e.target.value })}
                  placeholder="Label (Khmer)"
                  className="h-8 w-full rounded-md bg-dark-400 dark:bg-dark-700 text-xs px-2 border border-dark-100 dark:border-dark-600 outline-none placeholder:text-light-900/40 dark:placeholder:text-light-100/40"
                />
              </>
            )}

            {/* 🔗 Payload (only for text) */}
            {option.type === 'text' && (
              <FlowDropdownSelector
                value={option.payload ?? ''}
                onChange={flowKey => updateOption(index, { payload: flowKey })}
                flowList={flowList}
                label="Link to Flow"
                placeholder="ជ្រើសរើស flow…"
              />
            )}

            {/* ❌ Remove Button */}
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="mt-1 text-red-400 dark:text-red-300 text-xs hover:text-red-300 dark:hover:text-red-200 self-end"
            >
              ✕ Remove Option
            </button>
          </div>
        ))}

        {/* ➕ Add Option Button */}
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