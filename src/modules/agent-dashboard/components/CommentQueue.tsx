import { useEffect, useRef, useState } from "react"
import type { CommentConversation } from "~/modules/nodes/types"

interface CommentQueueProps {
  comments: CommentConversation[]
  onSelect: (conv: CommentConversation) => void
  activeCommentId: string | null
}

// Helper to format relative time
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

function highlightMatch(text: string, term: string) {
  if (!term) return text

  // Split searchTerm into multiple words, ignoring extra spaces
  const terms = term.trim().split(/\s+/).filter(Boolean)

  // Escape regex special chars for each term
  const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))

  // Build a single regex that matches any of the terms
  const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi")

  return text.split(regex).map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="bg-yellow-600 text-black font-semibold">
        {part} {/* preserves original casing */}
      </span>
    ) : (
      part
    )
  )
}



// Helper to bucket by date
function getDateBucket(timestamp: number): "today" | "yesterday" | "older" {
  const now = new Date()
  const convDate = new Date(timestamp * 1000)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (convDate >= today) return "today"
  if (convDate >= yesterday) return "yesterday"
  return "older"
}

export function CommentQueue({ comments, onSelect, activeCommentId }: CommentQueueProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState<"all" | "urgent" | "high" | "normal">("all")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "week">("all")
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-refresh timestamps
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
      if (e.key.toLowerCase() === "u") {
        setFilterPriority(prev => (prev === "urgent" ? "all" : "urgent"))
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // 🔹 Hybrid search: user name, ID, lastComment, status, priority
  let filtered: CommentConversation[] = comments.filter(c => {
    const name = c.customerName || c.user_id || ""
    const lastComment = c.lastComment || ""
    const status = c.status || "Waiting"
    const priority = c.priority || "normal"

    const term = searchTerm.toLowerCase()
    return (
      name.toLowerCase().includes(term) ||
      (c.user_id && c.user_id.toLowerCase().includes(term)) ||
      lastComment.toLowerCase().includes(term) ||
      status.toLowerCase().includes(term) ||
      priority.toLowerCase().includes(term)
    )
  })


  // Deduplicate by user_id → keep latest
  const groupedByUser = new Map<string, CommentConversation>()
  filtered.forEach(conv => {
    const key = conv.user_id
    const existing = groupedByUser.get(key)
    if (!existing || (conv.timestamp ?? 0) > (existing.timestamp ?? 0)) {
      groupedByUser.set(key, conv)
    }
  })

  let uniqueUsers: CommentConversation[] = Array.from(groupedByUser.values())

  // Apply priority filter
  if (filterPriority !== "all") {
    uniqueUsers = uniqueUsers.filter(c => c.priority === filterPriority)
  }

  // Apply date filter
  if (dateFilter === "today") {
    uniqueUsers = uniqueUsers.filter(c => getDateBucket(c.timestamp) === "today")
  } else if (dateFilter === "yesterday") {
    uniqueUsers = uniqueUsers.filter(c => getDateBucket(c.timestamp) === "yesterday")
  } else if (dateFilter === "week") {
    const weekAgo = Date.now() / 1000 - 7 * 24 * 3600
    uniqueUsers = uniqueUsers.filter(c => c.timestamp >= weekAgo)
  }

  // Sort by timestamp, then priority
  const priorityOrder: Record<string, number> = { urgent: 2, high: 1, normal: 0 }
  uniqueUsers.sort((a, b) => {
    const timeDiff = Number(b.timestamp) - Number(a.timestamp)
    if (timeDiff !== 0) return timeDiff
    return (priorityOrder[b.priority || "normal"]) - (priorityOrder[a.priority || "normal"])
  })

  // Group by date bucket
  const grouped: Record<string, CommentConversation[]> = { today: [], yesterday: [], older: [] }
  uniqueUsers.forEach(conv => {
    const bucket = getDateBucket(conv.timestamp)
    grouped[bucket].push(conv)
  })

return (
  <div className="w-full border-r border-teal-700 bg-dark-800 flex flex-col h-full">
    {/* Search + Priority + Date Filter */}
    <div className="p-2 border-b border-teal-700 flex items-center gap-2">
      {/* Search box + clear button */}
      <div className="flex items-center gap-2 flex-[2] min-w-[120px]">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search comments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2 py-1 text-sm rounded bg-dark-700 text-light-100 focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="px-2 py-1 text-sm bg-dark-600 text-light-200 rounded hover:bg-dark-500"
          >
            ✕
          </button>
        )}
      </div>

      {/* Priority filter */}
      <div className="flex-[1] min-w-[100px]">
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as any)}
          className="w-full px-2 py-1 text-sm rounded bg-dark-700 text-light-100"
        >
          <option value="all">{highlightMatch("All Priorities", searchTerm)}</option>
          <option value="urgent">{highlightMatch("Urgent", searchTerm)}</option>
          <option value="high">{highlightMatch("High", searchTerm)}</option>
          <option value="normal">{highlightMatch("Normal", searchTerm)}</option>
        </select>
      </div>

      {/* Date filter */}
      <div className="flex-[1] min-w-[100px]">
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as any)}
          className="w-full px-2 py-1 text-sm rounded bg-dark-700 text-light-100"
        >
          <option value="all">{highlightMatch("All Dates", searchTerm)}</option>
          <option value="today">{highlightMatch("Today", searchTerm)}</option>
          <option value="yesterday">{highlightMatch("Yesterday", searchTerm)}</option>
          <option value="week">{highlightMatch("Last 7 Days", searchTerm)}</option>
        </select>
      </div>
    </div>

    {/* Scrollable grouped list */}
    <div className="flex-grow overflow-y-auto scrollbar-dark-teal p-2 space-y-6">
      {["today", "yesterday", "older"].map(bucket => (
        grouped[bucket].length > 0 && (
          <div key={bucket}>
            <h3 className="text-xs font-semibold text-light-400 uppercase mb-2">
              {bucket === "today" ? "Today" : bucket === "yesterday" ? "Yesterday" : "Older"}
            </h3>

            {/* 🔹 Full-width comment items */}
            <div className="space-y-3">
              {grouped[bucket].map(conv => {
                const isActive = conv.id === activeCommentId
                const userName = conv.customerName || conv.user_id
                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelect(conv)}
                    className={`w-full text-left p-2 rounded-lg flex items-center gap-2 border border-dark-700 shadow-sm 
                      transition-all duration-200 
                      ${isActive 
                        ? "bg-teal-800" 
                        : "bg-dark-700 hover:bg-dark-600 hover:shadow-md"}`}
                  >
                    {/* Avatar */}
                    {conv.avatar ? (
                      <img src={conv.avatar} alt={userName} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-dark-600 flex items-center justify-center text-light-400 flex-shrink-0">?</div>
                    )}

                    {/* Info */}
                    <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">
                          {highlightMatch(userName, searchTerm)}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-200">
                          {highlightMatch(conv.status, searchTerm)}
                        </span>
                        {conv.priority === "urgent" && (
                          <span className="px-2 py-0.5 rounded text-xs bg-yellow-500 text-black">
                            {highlightMatch("⚠️ Urgent", searchTerm)}
                          </span>
                        )}
                        {conv.priority === "high" && (
                          <span className="px-2 py-0.5 rounded text-xs bg-red-600 text-white">
                            {highlightMatch("🔺 High", searchTerm)}
                          </span>
                        )}
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-xs">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-light-300 truncate">
                          {highlightMatch(conv.lastMessage || "…", searchTerm)}
                        </span>
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
      ))}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-light-400">
          <span className="text-sm">No comments match your filter…</span>
        </div>
      )}
    </div>

    {/* Visual indicator for urgent-only mode */}
    {filterPriority === "urgent" && (
      <div className="p-2 bg-yellow-600 text-black text-xs text-center font-semibold">
        ⚠️ Urgent-only mode active (press "u" to toggle)
      </div>
    )}
  </div>
)


}