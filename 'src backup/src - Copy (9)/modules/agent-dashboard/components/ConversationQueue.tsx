import { useEffect, useRef, useState } from "react"
import { PageSelector } from "~/modules/shared/components/PageSelector"
import type { Conversation } from "~/modules/nodes/types"

interface ConversationQueueProps {
  conversations: Conversation[]
  onSelect: (conv: Conversation) => void
  activeConversationId: string | null
  unreadCounts: Record<string, number>
}

// 🔹 Helper to format relative time
function formatRelativeTime(rawTimestamp: number): string {
  if (!rawTimestamp || isNaN(rawTimestamp)) return "unknown time"
  const timestamp = rawTimestamp > 1e12 ? rawTimestamp / 1000 : rawTimestamp
  const diff = Date.now() / 1000 - timestamp

  if (diff < 5) return "just now"
  if (diff < 60) return `${Math.floor(diff)} sec ago`
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`
  return `${Math.floor(diff / 86400)} days ago`
}

export function ConversationQueue({
  conversations,
  onSelect,
  activeConversationId,
  unreadCounts,
}: ConversationQueueProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // 🔹 Force re-render every 30s so timestamps auto-update
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchTerm("")
        inputRef.current?.blur()
      }
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // 🔹 Filter by search term
  const filtered = conversations.filter((c) => {
    const name = c.customerName || c.user_id || ""
    const lastMessage = c.lastMessage || ""
    const status = c.status || "Waiting"
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (!filtered || filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-light-400">
        <span className="text-sm">No conversations yet…</span>
      </div>
    )
  }

  return (
    <div className="w-80 border-r border-teal-700 bg-dark-800 flex flex-col h-full">
      {/* Page selector header */}
      <div className="p-2 border-b border-teal-700 bg-dark-800">
        <PageSelector />
      </div>

      {/* Search Bar */}
      <div className="p-2 border-b border-teal-700">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-2 py-1 text-sm rounded bg-dark-700 text-light-100 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="px-2 py-1 text-sm bg-dark-600 text-light-200 rounded hover:bg-dark-500 focus:outline-none"
            >
              x
            </button>
          )}
        </div>
      </div>

      {/* Scrollable queue */}
      <div className="flex-grow overflow-y-auto p-2 scrollbar-dark-teal space-y-4">
        {filtered.map((conv) => {
          const isActive = conv.id === activeConversationId
          const userName = conv.customerName || conv.user_id

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                isActive ? "bg-teal-800" : "bg-dark-700 hover:bg-dark-600"
              }`}
            >
              {/* Avatar */}
              {conv.avatar ? (
                <img
                  src={conv.avatar}
                  alt={userName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-dark-600 flex items-center justify-center text-light-400">
                  ?
                </div>
              )}

              {/* Conversation info */}
              <div className="flex flex-col overflow-hidden flex-grow">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white truncate">
                    {userName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-200">
                    {conv.status}
                  </span>

                  {/* 🔹 Unread badge */}
                  {unreadCounts[conv.id] > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-xs">
                      {unreadCounts[conv.id]}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-light-300 truncate">
                    {conv.lastMessage || "…"}
                  </span>
                  {/* ✅ Show relative time of last message */}
                  <span className="ml-2 text-xs text-light-400 whitespace-nowrap">
                    {formatRelativeTime(conv.timestamp)}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
