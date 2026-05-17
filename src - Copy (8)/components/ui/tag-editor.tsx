import { useState, useRef } from 'react'
import { cn } from '~@/utils/cn'

type TagEditorProps = {
  label?: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

export function TagEditor({
  label,
  value,
  onChange,
  placeholder = 'Add tag…',
  className,
}: TagEditorProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = () => {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && input === '') {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className={cn('space-y-1', className)}>
      {label && <div className="text-xs font-medium text-light-50">{label}</div>}
      <div
        className="flex flex-wrap items-center gap-2 rounded-md border border-dark-300 bg-dark-400 px-3 py-2 text-sm"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded bg-amber-700 px-2 py-1 text-xs text-white"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-white hover:text-red-300"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-grow bg-transparent text-white outline-none placeholder:text-light-50/40"
        />
      </div>
    </div>
  )
}
