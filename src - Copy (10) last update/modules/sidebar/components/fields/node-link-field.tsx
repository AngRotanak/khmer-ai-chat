import type { FC } from 'react'

type Props = {
  label: string
  targetNodeId: string | null
  onLink: (targetId: string | null) => void
}

const NodeLinkField: FC<Props> = ({ label, targetNodeId, onLink }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium">{label}</label>
    <input
      className="input"
      type="text"
      value={targetNodeId ?? ''}
      onChange={e => onLink(e.target.value || null)}
      placeholder="Target node ID"
    />
  </div>
)

export default NodeLinkField
