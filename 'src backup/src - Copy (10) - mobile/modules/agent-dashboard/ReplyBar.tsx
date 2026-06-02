import { useState } from "react"
import Picker from "@emoji-mart/react"
import emojiData from "@emoji-mart/data"
import type { Conversation } from "~/modules/nodes/types"

interface ReplyBarProps {
  draft: string
  setDraft: (text: string) => void
  pageId: string
  pageToken: string
  activeConversation: Conversation | null
  activeTab: "messages" | "comments"
  selectedCommentId?: string | null
  postId?: string | null
  postTitle?: string | null
  commentText?: string | null
  onCancelReply?: () => void
  onSendMessage: (pageId: string, conv: Conversation, msg: string) => void
  onSendCommentReply: (
    commentId: string,
    msg: string,
    pageToken: string,
    postId: string
  ) => void
}

export function ReplyBar({
  draft,
  setDraft,
  pageId,
  pageToken,
  activeConversation,
  activeTab,
  selectedCommentId,
  postId,
  postTitle,
  commentText,
  onCancelReply,
  onSendMessage,
  onSendCommentReply,
}: ReplyBarProps) {
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)

  const handleSend = async () => {
    if (!draft.trim()) return
    setSending(true)

    if (activeTab === "messages" && activeConversation) {
      onSendMessage(pageId, activeConversation, draft.trim())
    } else if (activeTab === "comments" && selectedCommentId && postId) {
      onSendCommentReply(selectedCommentId, draft.trim(), pageToken, postId)
    }

    setDraft("")
    const textarea = document.getElementById("replyBox") as HTMLTextAreaElement
    if (textarea) textarea.style.height = "auto"
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto"
    e.target.style.height = `${e.target.scrollHeight}px`
    setDraft(e.target.value)
  }

  const addEmoji = (emoji: any) => {
    setDraft(draft + emoji.native)
    setShowEmoji(false)
  }

  const renderStatusBadge = () => {
    if (!activeConversation) return null
    const status = activeConversation.status
    const map: Record<string, { color: string; icon: string }> = {
      Waiting: { color: "bg-yellow-700 text-yellow-200", icon: "⏳" },
      "Agent active": { color: "bg-teal-700 text-teal-200", icon: "👤" },
      "Bot active": { color: "bg-blue-700 text-blue-200", icon: "🤖" },
      Pending: { color: "bg-purple-700 text-purple-200", icon: "⌛" },
    }
    const { color, icon } = map[status] || {
      color: "bg-gray-700 text-gray-200",
      icon: "⏳",
    }

    return (
      <div className={`flex items-center justify-center text-xs px-2 py-1 ${color}`}>
        <span className="mr-1">{icon}</span>
        {status}
      </div>
    )
  }

  return (
    <div className="flex flex-col border-t border-dark-600 bg-dark-800 relative">
      {/* Context banner for comment replies */}
      {activeTab === "comments" && selectedCommentId && postId && (
        <div className="text-center text-light-400 text-sm p-2 border-b border-dark-600 flex justify-between items-center">
          <span>
            Replying to: <span className="text-teal-400">“{commentText}”</span>
            {postTitle && (
              <> on Post: <span className="text-teal-400">{postTitle}</span></>
            )}
          </span>
          <button
            onClick={onCancelReply}
            className="text-light-400 hover:text-red-400 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Status badge */}
      {activeConversation && (
        <div className="flex justify-center border-b border-dark-600">
          {renderStatusBadge()}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2 p-2">
        <div className="flex-grow flex items-center bg-dark-700 rounded px-2">
          <textarea
            id="replyBox"
            value={draft}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Aa"
            rows={1}
            className="flex-grow resize-none px-2 py-2 bg-transparent text-light-100 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="px-3 py-1 text-teal-400 hover:text-teal-300"
          >
            😊
          </button>
        </div>
        <button
          onClick={handleSend}
          disabled={sending}
          className={`px-4 py-2 rounded ${
            sending ? "bg-dark-600 text-light-300" : "bg-teal-700 text-white"
          }`}
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>

      {showEmoji && (
        <div className="absolute bottom-14 right-2 bg-dark-700 border border-dark-600 rounded shadow-lg z-50">
          <Picker
            data={emojiData}
            onEmojiSelect={addEmoji}
            theme="dark"
            previewPosition="none"
            perLine={8}
          />
        </div>
      )}
    </div>
  )
}
