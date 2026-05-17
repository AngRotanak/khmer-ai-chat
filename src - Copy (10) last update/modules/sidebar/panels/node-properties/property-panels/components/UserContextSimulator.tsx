type Props = {
  value: Record<string, boolean>
  onChange: (ctx: Record<string, boolean>) => void
  conditionList: { id: string; condition: string }[]
}

export function UserContextSimulator({ value, onChange, conditionList }: Props) {
  const toggle = (key: string) => {
    const updated = { ...value, [key]: !value[key] }
    onChange(updated)
  }

  return (
    <div className="mt-4 p-3 rounded bg-dark-800 border border-dark-600 text-light-100 text-xs space-y-2">
      <div className="font-semibold text-light-300 mb-1">🧪 Simulate User Context</div>
      {conditionList.map(({ id, condition }) => (
        <label key={id} className="flex items-center gap-x-2">
          <input
            type="checkbox"
            checked={value[id]}
            onChange={() => toggle(id)}
            className="size-4 accent-teal-500"
          />
          <span>{condition}</span>
        </label>
      ))}
    </div>
  )
}
