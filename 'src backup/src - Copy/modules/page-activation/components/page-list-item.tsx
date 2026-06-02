import type { PageEntry } from '~/modules/sidebar/panels/activate-page/activate-page-panels'
import { useState } from 'react'


export function PageListItem({
  page,
  onRename,
  onDelete,
  onSelect,
}: {
  page: PageEntry
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onSelect: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(page.name)

  const handleRename = () => {
    onRename(page.id, name.trim() || 'ទំព័រដែលគ្មានឈ្មោះ')
    setEditing(false)
  }

  return (
    <li
      className="bg-dark-800 border border-dark-600 rounded px-3 py-2 text-sm text-light-100 flex justify-between items-center gap-2 cursor-pointer hover:bg-dark-700"
      onClick={onSelect}
    >
      {editing ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          className="bg-dark-700 text-light-100 px-2 py-1 rounded w-full text-sm"
          autoFocus
          placeholder="កែឈ្មោះ"
        />
      ) : (
        <span
          onClick={(e) => {
            e.stopPropagation()
            setEditing(true)
          }}
          title="កែឈ្មោះ"
        >
          {page.name}
        </span>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(page.id)
        }}
        className="text-red-400 hover:text-red-300 text-xs"
        title="លុប"
      >
        ❌
      </button>
    </li>
  )
}
