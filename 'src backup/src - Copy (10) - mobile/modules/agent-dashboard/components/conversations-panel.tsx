type ConversationsPanelProps = {
  activeCount: number
  waitingCount: number
  resolvedCount: number
}

export function ConversationsPanel({ activeCount, waitingCount, resolvedCount }: ConversationsPanelProps) {
  return (
    <div className="p-4">
      <h2 className="font-bold mb-4">Conversation Filters</h2>
      <ul className="space-y-2 text-sm">
        <li className="flex justify-between">
          <span>Active</span>
          <span className="font-semibold">{activeCount}</span>
        </li>
        <li className="flex justify-between">
          <span>Waiting</span>
          <span className="font-semibold">{waitingCount}</span>
        </li>
        <li className="flex justify-between">
          <span>Resolved</span>
          <span className="font-semibold">{resolvedCount}</span>
        </li>
      </ul>
    </div>
  )
}
