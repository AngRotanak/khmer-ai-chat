import { useLang } from '~/helpers/use-lang'

interface RepeaterFieldProps<T> {
  label: string
  value: T[]
  onChange: (val: T[]) => void
  fields: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode
  createDefault: () => T
  hideLabel?: boolean
  className?: string
}

export const RepeaterField = <T,>({
  label,
  value,
  onChange,
  fields,
  createDefault,
  hideLabel = false,
  className = ''
}: RepeaterFieldProps<T>) => {
  const t = useLang()
  const handleUpdate = (index: number, patch: Partial<T>) => {
    const updated = [...value]
    updated[index] = { ...updated[index], ...patch }
    onChange(updated)
  }

  const handleAdd = () => {
    onChange([...value, createDefault()])
  }

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className={`mb-3 ${className}`}>
      {!hideLabel && (
        <label className="block text-sm font-medium mb-2 text-light-100/70">{label}</label>
      )}
      {value.map((item, index) => (
        <div key={index} className="border rounded-lg p-3 mb-2 bg-dark-900 border-dark-500 space-y-2">
          {fields(item, patch => handleUpdate(index, patch), index)}
          <button
            onClick={() => handleRemove(index)}
            className="text-red-500 text-xs hover:underline"
          >
            {`✖ ${t('Remove')}`}
          </button>
        </div>
      ))}
      <button
        onClick={handleAdd}
        className="text-blue-500 text-xs mt-2 hover:underline"
      >
        {`＋ ${t('Add')}`}
      </button>
    </div>
  )
}
