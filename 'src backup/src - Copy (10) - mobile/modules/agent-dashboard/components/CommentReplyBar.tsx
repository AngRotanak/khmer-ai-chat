import { useState, useEffect, useRef } from "react"
import Picker from "@emoji-mart/react"
import emojiData from "@emoji-mart/data"

interface CommentReplyBarProps {
  draft: string
  setDraft: (text: string) => void
  pageToken: string
  postId: string
  postTitle?: string | null
  commentId: string
  commentText?: string | null
  onCancelReply?: () => void
  onSendCommentReply: (
    commentId: string,
    msg: string,
    pageToken: string,
    postId: string
  ) => void
}

export function CommentReplyBar({
  draft,
  setDraft,
  pageToken,
  postId,
  postTitle,
  commentId,
  commentText,
  onCancelReply,
  onSendCommentReply,
}: CommentReplyBarProps) {
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)


  // ✅ Focus whenever commentId changes
  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [commentId])

  const handleSendText = async () => {
    if (!draft.trim() || !commentId || !postId) return
    setSending(true)

    onSendCommentReply(commentId, draft.trim(), pageToken, postId)

    setDraft("")
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
    }
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
    inputRef.current?.focus() // ✅ return focus after picking emoji
  }

  return (
    <div className="flex flex-col border-t border-dark-600 bg-dark-800 relative">
      {/* ✅ Context banner */}
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
          cancle
        </button>
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 p-2">
        <div className="flex-grow flex items-center bg-dark-700 rounded px-2">
          <textarea
            ref={inputRef}   // attach ref
            id="commentReplyBox"
            value={draft}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Write a reply..."
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
