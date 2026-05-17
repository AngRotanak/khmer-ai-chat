import type { Conversation } from "~/modules/nodes/types"

interface ConversationQueueRowProps {
  conversation: Conversation
  onSelect: (conv: Conversation) => void
  searchTerm?: string
}

// Highlight helper
function highlightMatch(text: string, searchTerm: string) {
  if (!searchTerm) return text
  const regex = new RegExp(`(${searchTerm})`, "gi")
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="bg-yellow-600 font-bold">{part}</span>
    ) : (
      part
    )
  )
}

export function ConversationQueueRow({ conversation, onSelect, searchTerm }: ConversationQueueRowProps) {
  // Normalize values with safe fallbacks
  const name = conversation?.customerName || conversation?.user_id || "Unknown User"
  const avatar = conversation?.avatar || null
  const timestamp = conversation?.timestamp || ""
  const status: string = conversation?.status ?? "Waiting"
  const lastMessage = conversation?.lastMessage || "(no messages yet)"

  // Map status to colors
  const statusColor =
    status === "AGENT_HANDLING"
      ? "text-orange-400"
      : status === "WAITING_CONVERSATION"
      ? "text-teal-400"
      : "text-light-400"

  return (
    <div
      key={conversation?.id}
      onClick={() => onSelect(conversation)}
      className={`p-3 border-b border-dark-600 cursor-pointer hover:bg-dark-700 ${
        status === "AGENT_HANDLING" ? "bg-dark-800" : ""
      }`}
    >
      <div className="flex justify-between items-center">
        {/* ✅ Show avatar + name */}
        <div className="flex items-center space-x-2">
          {avatar && (
            <img
              src={avatar}
              alt={name}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <span className="font-semibold text-light-100">
            {highlightMatch(name, searchTerm || "")}
          </span>
        </div>
        <span className="text-xs text-light-400">{timestamp}</span>
      </div>

      <div className="flex justify-between items-center mt-1">
        {/* ✅ Highlight status */}
        <span className={`text-sm ${statusColor}`}>
          {highlightMatch(status, searchTerm || "")}
        </span>
        
        {/* ✅ Highlight last message */}
        <span className="text-sm text-light-300 truncate max-w-xs">
          {highlightMatch(lastMessage, searchTerm || "")}
        </span>
      </div>
    </div>
  )
}
