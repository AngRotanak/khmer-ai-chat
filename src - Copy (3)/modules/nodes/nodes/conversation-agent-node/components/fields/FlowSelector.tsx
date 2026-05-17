import { SelectField } from './SelectField'
import { useFlowCatalog } from '../../hooks/useFlowCatalog'

interface FlowSelectorProps {
  label: string
  value: string
  onChange: (val: string) => void
}

export const FlowSelector = ({ label, value, onChange }: FlowSelectorProps) => {
  const { flows } = useFlowCatalog()

  const options = flows.map(flow => ({
    label: flow.name,
    value: flow.payload
  }))

  return (
    <SelectField
      label={label}
      value={value}
      options={options}
      onChange={onChange}
    />
  )
}
