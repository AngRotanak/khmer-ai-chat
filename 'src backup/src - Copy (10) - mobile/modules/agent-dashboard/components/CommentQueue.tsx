
import { useEffect, useRef, useState } from "react"
import type { CommentConversation } from "~/modules/nodes/types"

interface CommentQueueProps {
  comments: CommentConversation[]
  onSelect: (conv: CommentConversation) => void
  activeCommentId: string | null
  unreadCommentCounts: Record<string, number>
}

// Helper to format relative time
function formatRelativeTime(rawTimestamp: number): string {
  if (!rawTimestamp || isNaN(rawTimestamp)) return "unknown time"
  const timestamp = rawTimestamp > 1e12 ? rawTimestamp / 1000 : rawTimestamp
  const diff = Date.now() / 1000 - timestamp

  if (diff < 5) return "just now"              // ✅ new case
  if (diff < 60) return `${Math.floor(diff)} sec ago`
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`
  return `${Math.floor(diff / 86400)} days ago`
}

export function CommentQueue({ comments, onSelect, activeCommentId, unreadCommentCounts }: CommentQueueProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // 🔹 Force re-render every 30s so timestamps update automatically
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1) // trigger re-render
    }, 30000) // every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Keyboard shortcuts: Esc clears, / focuses
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
  const filtered: CommentConversation[] = comments.filter(c => {
    const name = c.customerName || c.user_id || ""
    const lastComment = c.lastComment || ""
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastComment.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // 🔹 Deduplicate by user_id → keep latest comment thread
  const grouped = new Map<string, CommentConversation>()
  filtered.forEach(conv => {
    const key = conv.user_id
    const existing = grouped.get(key)
    if (!existing || (conv.timestamp ?? 0) > (existing.timestamp ?? 0)) {
      grouped.set(key, conv)
    }
  })

  const uniqueUsers: CommentConversation[] = Array.from(grouped.values())

  if (uniqueUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-light-400">
        <span className="text-sm">No comment threads yet…</span>
      </div>
    )
  }

  return (
    <div className="w-full md:w-80 border-r border-teal-700 bg-dark-800 flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-2 border-b border-teal-700">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search comments..."
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
        {uniqueUsers.map(conv => {
          const isActive = conv.user_id === activeCommentId
          const userName = conv.customerName || conv.user_id
          const avatar = conv.avatar

          return (
            <button
              key={conv.user_id}
              onClick={() => onSelect(conv)}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                isActive ? "bg-teal-800" : "bg-dark-700 hover:bg-dark-600"
              }`}
            >
              {avatar && (
                <img
                  src={avatar}
                  alt={userName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              )}
              <div className="flex flex-col overflow-hidden flex-grow">
                <span className="text-white font-semibold truncate">{userName}</span>
                <span className="last-text text-light-300 truncate">
                  {conv.lastComment || conv.lastMessage || ""}
                </span>
              </div>

              {/* ✅ Auto-updating relative time with "just now" */}
              <span className="ml-auto text-xs text-light-400 whitespace-nowrap">
                {formatRelativeTime(conv.timestamp)}
              </span>
        
                <div className="relative">
                  {unreadCommentCounts[conv.user_id] > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs rounded-full px-2">
                      {unreadCommentCounts[conv.user_id]}
                    </span>
                  )}
                </div>
            </button>
            
          )
        })}
      </div>
    </div>
  )
}
