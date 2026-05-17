interface SelectFieldOption<T extends string> {
  label: string
  value: T
}

interface SelectFieldProps<T extends string> {
  label: string
  value: T
  options: SelectFieldOption<T>[]
  onChange: (val: T) => void
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange
}: SelectFieldProps<T>) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-light-100/60 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400 overflow-y-auto scrollbar-dark-teal"
      >
         <option value="">-- Select {label} --</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
