import { useEffect, useRef, useState } from "react"
import type { Conversation } from "~/modules/nodes/types"
import { PageSelector } from '~/modules/shared/components/PageSelector'
import { ChatBubbleLeftIcon, ChatBubbleOvalLeftIcon } from "@heroicons/react/24/outline"

interface ConversationQueueProps {
  conversations: Conversation[]
  onSelect: (conv: Conversation) => void
}

export function ConversationQueue({ conversations, onSelect }: ConversationQueueProps) {
  const getStatus = (c: Conversation): string =>
    typeof c.status === "string" && c.status.length > 0 ? c.status : "Waiting"

  const [searchTerm, setSearchTerm] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

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

  // 🔹 Group by conversation_id (unique per thread)
  const grouped = filtered.reduce((acc, conv) => {
    acc[conv.id] = [conv]
    return acc
  }, {} as Record<string, Conversation[]>)

  return (
    <div className="w-80 border-r border-teal-700 bg-dark-800 flex flex-col">
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

      {/* 🔹 Scrollable queue area */}
      <div className="flex-grow overflow-y-auto p-2 scrollbar-dark-teal space-y-4">
        {Object.entries(grouped).map(([convId, convs]) => {
          const conv = convs[0]
          const userName = conv.customerName || conv.user_id
          const avatar = conv.avatar

          // Post title for comments
          const postTitle =
            conv.type === "comment"
              ? conv.posts && Object.values(conv.posts)[0]?.post?.title || "Comment"
              : null

          return (
            <div key={convId} className="p-3 rounded-lg bg-dark-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                {avatar && (
                  <img
                    src={avatar}
                    alt={userName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <div className="flex flex-col">
                  <span className="text-white font-semibold">{userName}</span>
                  <span className="text-xs text-light-400">{conv.lastMessage}</span>
                </div>
              </div>

              <button
                onClick={() => onSelect(conv)}
                className="flex items-center px-2 py-1 rounded bg-dark-600 text-xs hover:bg-dark-500 focus:outline-none"
              >
                {conv.type === "message" ? (
                  <>
                    <ChatBubbleLeftIcon className="h-4 w-4 text-teal-400 mr-1" />
                    Messenger
                  </>
                ) : (
                  <>
                    <ChatBubbleOvalLeftIcon className="h-4 w-4 text-blue-400 mr-1" />
                    {postTitle}
                  </>
                )}
                <span className="ml-2 text-light-400">{conv.status}</span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
