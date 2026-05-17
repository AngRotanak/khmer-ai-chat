import type { FC } from 'react'

type Option = { label: string; value: string }

type Props = {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
}

const SelectField: FC<Props> = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium">{label}</label>
    <select
      className="input"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
)

export default SelectField
