import type { FC } from 'react'

type Props = {
  label: string
  value: number
  onChange: (value: number) => void
}

const NumberField: FC<Props> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium">{label}</label>
    <input
      className="input"
      type="number"
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      min={0}
    />
  </div>
)

export default NumberField
