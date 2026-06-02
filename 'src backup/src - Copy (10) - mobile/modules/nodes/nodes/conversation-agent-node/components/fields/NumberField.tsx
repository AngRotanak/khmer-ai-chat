interface NumberFieldProps {
  label: string
  value: number
  onChange: (val: number) => void
  min?: number
  max?: number
  step?: number
}

export const NumberField = ({ label, value, onChange, min, max, step }: NumberFieldProps) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-light-100/60 mb-1">{label}</label>
    <input
      type="number"
      value={value}
      onChange={e => {
        const raw = e.target.value
        const parsed = parseFloat(raw)
        if (!isNaN(parsed)) {
          onChange(parsed)
        }
      }}
      min={min}
      max={max}
      step={step}
      className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
    />
  </div>
)
