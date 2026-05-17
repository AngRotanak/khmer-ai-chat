import { SelectField } from './SelectField'
import { useApplicationState } from '~/stores/application-state'
interface FlowSelectorProps {
  label: string
  value: string
  onChange: (val: string) => void
}

interface FlowSelectorProps {
  label: string
  value: string
  onChange: (val: string) => void
  flows?: { id: string; name?: string; type?: string }[]
}


interface FlowSelectorProps {
  label: string
  value: string
  onChange: (val: string) => void
}

export const FlowSelector = ({ label, value, onChange }: FlowSelectorProps) => {
  const flowList = useApplicationState(s => s.flowList)

  // Build options with a disabled placeholder first
  const options = [
    { label: "🧩 ជ្រើសរើស flow…", value: "", disabled: true },
    ...flowList.map(flow => ({
      label: `🧩 ${flow.type ?? ''} – ${flow.name || flow.id}`,
      value: `${flow.type}.${flow.id}` ,
    })),
  ]

  return (
    <SelectField
      label={label}
      value={value}
      options={options}
      onChange={onChange}
    />
  )
}
