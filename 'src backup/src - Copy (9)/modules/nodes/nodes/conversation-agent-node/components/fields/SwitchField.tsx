interface SwitchFieldProps {
  label: string
  value: boolean
  onChange: (val: boolean) => void
}

export const SwitchField = ({ label, value, onChange }: SwitchFieldProps) => (
  <div className="mb-3 flex items-center justify-between">
    <label className="text-sm font-medium">{label}</label>
    <input
      type="checkbox"
      checked={value}
      onChange={e => onChange(e.target.checked)}
      className="toggle toggle-sm"
    />
  </div>
)
