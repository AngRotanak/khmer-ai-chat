interface TextAreaProps {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

export const TextArea = ({ label, value, onChange, placeholder }: TextAreaProps) => (
  <div className="mb-3">
    <label className="block text-sm font-medium mb-1">{label}</label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
      rows={2}
    />
  </div>
)
