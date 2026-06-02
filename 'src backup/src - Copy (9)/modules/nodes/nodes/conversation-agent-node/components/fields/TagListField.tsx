interface TagListFieldProps {
  label: string
  value: string[]
  onChange: (val: string[]) => void
  placeholder?: string
}

export const TagListField = ({ label, value, onChange, placeholder }: TagListFieldProps) => {
  const handleAdd = (tag: string) => {
    if (tag && !value.includes(tag)) onChange([...value, tag])
  }

  const handleRemove = (tag: string) => {
    onChange(value.filter(t => t !== tag))
  }

  return (
<div className="mb-3">
  <label className="block text-sm font-medium mb-1 text-light-100">{label}</label>
  <div className="flex flex-wrap gap-1 mb-1">
    {value.map(tag => (
      <span
        key={tag}
        className="bg-dark-700 text-light-100 px-2 py-1 rounded text-xs flex items-center"
      >
        {tag}
        <button
          onClick={() => handleRemove(tag)}
          className="ml-1 text-red-400 hover:text-red-300"
        >
          ×
        </button>
      </span>
    ))}
  </div>
  <input
    type="text"
    placeholder={placeholder}
    onKeyDown={e => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAdd(e.currentTarget.value.trim())
        e.currentTarget.value = ''
      }
    }}
    className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
  />
</div>

  )
}
