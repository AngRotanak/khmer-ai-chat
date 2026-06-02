import React from 'react'

type FlowDropdownSelectorProps = {
  value: string
  onChange: (flowKey: string) => void
  flowList: string[] // ✅ simplified to string[]
  label?: string
  placeholder?: string
  disabled?: boolean
}

export const FlowDropdownSelector: React.FC<FlowDropdownSelectorProps> = ({
  value,
  onChange,
  flowList = [],
  label = 'Link to Flow',
  placeholder = 'ជ្រើសរើស flow…',
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-y-1">
      {label && (
        <label className="text-xs text-light-900/60 dark:text-light-100/60 font-medium">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50) disabled:(opacity-50 cursor-not-allowed)"
      >
        <option value="">{placeholder}</option>
        {flowList.length > 0 ? (
          flowList.map(flowId => (
            <option key={flowId} value={flowId}>
              🧩 {flowId}
            </option>
          ))
        ) : (
          <option disabled value="">
            ⚠️ No flows available
          </option>
        )}
      </select>
    </div>
  )
}
