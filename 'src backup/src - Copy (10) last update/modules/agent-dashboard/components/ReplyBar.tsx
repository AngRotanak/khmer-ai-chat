import { useState } from "react"
import Picker from "@emoji-mart/react"
import emojiData from "@emoji-mart/data"
import type { Conversation } from '~/modules/nodes/types'

interface ReplyBarProps {
  draft: string
  setDraft: (text: string) => void
  pageId: string
  activeConversation: Conversation | null
  onSendMessage: (pageId: string, conv: Conversation, msg: string) => void
}



export function ReplyBar({
  draft,
  setDraft,
  pageId,
  activeConversation,
  onSendMessage,
}: ReplyBarProps) {
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)

  const handleSendText = async () => {
    if (!draft.trim() || !activeConversation) return
    setSending(true)

    onSendMessage(pageId, activeConversation, draft.trim())

    setDraft("")
    const textarea = document.getElementById("replyBox") as HTMLTextAreaElement
    if (textarea) textarea.style.height = "auto"
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
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



  return (
    <div className="flex flex-col border-t border-dark-600 bg-dark-800 relative">      
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
          onClick={handleSendText}
          disabled={sending}
          className={`px-4 py-2 rounded ${sending ? "bg-dark-600 text-light-300" : "bg-teal-700 text-white"
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
