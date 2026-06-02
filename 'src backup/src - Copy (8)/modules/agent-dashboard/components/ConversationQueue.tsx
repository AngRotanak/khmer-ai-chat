import { useEffect, useRef, useState } from "react"
import { ConversationQueueRow } from "./ConversationQueueRow"
import type { Conversation } from "~/modules/nodes/types"
import { PageSelector } from '~/modules/shared/components/PageSelector'

interface ConversationQueueProps {
  conversations: Conversation[]
  onSelect: (conv: Conversation) => void
}

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

export function ConversationQueue({ conversations, onSelect }: ConversationQueueProps) {
  const getStatus = (c: Conversation): string =>
    typeof c.status === "string" && c.status.length > 0 ? c.status : "Waiting"

  const [searchTerm, setSearchTerm] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [showHint, setShowHint] = useState(true)

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

  const filtered = conversations.filter(c => {
    const name = c.customerName || c.user_id || ""
    const lastMessage = c.lastMessage || ""
    const status = getStatus(c)
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const active = filtered.filter(c => getStatus(c) === "AGENT_HANDLING")
  const waiting = filtered.filter(c => {
    const s = getStatus(c)
    return s === "WAITING_CONVERSATION" || s === "Waiting"
  })
  const resolved = filtered.filter(c => getStatus(c) === "RESOLVED")

  const sortByTime = (list: Conversation[]) =>
    [...list].sort(
      (a, b) =>
        new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    )

  const [showActive, setShowActive] = useState(true)
  const [showWaiting, setShowWaiting] = useState(true)
  const [showResolved, setShowResolved] = useState(false)


  return (
    <div className="w-72 border-r border-teal-700 bg-dark-800 flex flex-col">
      {/* Page selector header */}
      <div className="p-2 border-b border-teal-700 bg-dark-800">
        <PageSelector />
      </div>

      {/* 🔍 Search Bar */}
      <div className="p-2 border-b border-teal-700">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setShowHint(false)}
            onBlur={() => setShowHint(true)}
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

      {/* 🔹 Scrollable queue area (Messenger-style) */}
      <div
        className="flex-grow overflow-y-auto p-2 scrollbar-dark-teal space-y-2"
        // optional: ref={scrollRef} if you want auto-scroll behavior
      >
        {/* Active Section */}
        {active.length > 0 && (
          <div>
            <button
              onClick={() => setShowActive(!showActive)}
              className="w-full px-3 py-2 text-sm font-bold text-orange-400 text-left focus:outline-none"
            >
              {highlightMatch(`Active (${active.length})`, searchTerm)} {showActive ? "▼" : "▶"}
            </button>
            {showActive &&
              sortByTime(active).map(conv => (
                <ConversationQueueRow
                  key={conv.id}
                  conversation={conv}
                  onSelect={onSelect}
                  searchTerm={searchTerm}
                />
              ))}
          </div>
        )}

        {/* Waiting Section */}
        {waiting.length > 0 && (
          <div>
            <button
              onClick={() => setShowWaiting(!showWaiting)}
              className="w-full px-3 py-2 text-sm font-bold text-teal-400 text-left focus:outline-none"
            >
              {highlightMatch(`Waiting (${waiting.length})`, searchTerm)} {showWaiting ? "▼" : "▶"}
            </button>
            {showWaiting &&
              sortByTime(waiting).map(conv => (
                <ConversationQueueRow
                  key={conv.id}
                  conversation={conv}
                  onSelect={onSelect}
                  searchTerm={searchTerm}
                />
              ))}
          </div>
        )}

        {/* Resolved Section */}
        {resolved.length > 0 && (
          <div>
            <button
              onClick={() => setShowResolved(!showResolved)}
              className="w-full px-3 py-2 text-sm font-bold text-light-400 text-left focus:outline-none"
            >
              {highlightMatch(`Resolved (${resolved.length})`, searchTerm)} {showResolved ? "▼" : "▶"}
            </button>
            {showResolved &&
              sortByTime(resolved).map(conv => (
                <ConversationQueueRow
                  key={conv.id}
                  conversation={conv}
                  onSelect={onSelect}
                  searchTerm={searchTerm}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
