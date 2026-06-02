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

// Helper: format timestamp into relative + readable
function formatRelativeAndReadable(timestamp: string | number) {
  if (!timestamp) return ""

  let tsNum = Number(timestamp)

  // If it's in seconds (10 digits), convert to ms
  if (tsNum < 1e12) {
    tsNum = tsNum * 1000
  }

  const date = new Date(tsNum)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  console.log("DEBUG timestamp raw:", timestamp)
  console.log("DEBUG normalized tsNum:", tsNum)
  console.log("DEBUG parsed date:", date.toString())
  console.log("DEBUG diffDay:", diffDay)

  let relative = ""
  if (diffSec < 60) relative = "just now"
  else if (diffMin < 60) relative = `${diffMin}m ago`
  else if (diffHr < 24) relative = `${diffHr}h ago`
  else if (diffDay === 1) relative = "Yesterday"
  else if (diffDay < 7) relative = `${diffDay}d ago`

  const readable = date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

  return relative ? `${relative} • ${readable}` : readable
}

export function ConversationQueueRow({ conversation, onSelect, searchTerm }: ConversationQueueRowProps) {
  const name = conversation?.customerName || conversation?.user_id || "Unknown User"
  const avatar = conversation?.avatar || null
  const timestamp = conversation?.timestamp || ""
  const status: string = conversation?.status ?? "Waiting"
  const lastMessage = conversation?.lastMessage || "(no messages yet)"

  const formattedTime = formatRelativeAndReadable(timestamp)

  console.log("DEBUG ConversationQueueRow:", {
    id: conversation?.id,
    name,
    timestamp,
    formattedTime,
  })

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
      className={`p-3 border-b border-dark-600 cursor-pointer hover:bg-dark-700 ${status === "AGENT_HANDLING" ? "bg-dark-800" : ""
        }`}
    >
      <div className="flex justify-between items-center">

        <div className="flex items-center space-x-2">
          {avatar && (
            <img
              src={avatar}
              alt={name}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-light-100">
              {highlightMatch(name, searchTerm || "")}
            </span>
            <span className="text-xs text-light-400">{formattedTime}</span>
          </div>
        </div>

      </div>

      <div className="flex justify-between items-center mt-1">
        <span className={`text-sm ${statusColor}`}>
          {highlightMatch(status, searchTerm || "")}
        </span>
        <span className="text-sm text-light-300 truncate max-w-xs">
          {highlightMatch(lastMessage, searchTerm || "")}
        </span>
      </div>
    </div>
  )
}
