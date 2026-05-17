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
  const [personalizeReplies, setPersonalizeReplies] = useState(false) // ✅ local toggle

  

  // ✅ Focus whenever commentId changes
  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [commentId])

const handleSendText = async () => {
  if (!draft.trim() || !commentId || !postId) return
  setSending(true)

  // Personalization handled here with the checkbox
  const personalizedMsg =
    personalizeReplies && commentText
      ? `Hi ${commentText}, ${draft.trim()}`
      : draft.trim()

  // Call back once — timeline handles looping
  onSendCommentReply(commentId, personalizedMsg, pageToken, postId)

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
  <div className="flex flex-col border-t border-dark-600 bg-dark-800 relative p-4">
    {/* ✅ Context banner */}
    <div className="text-center text-light-400 text-sm p-2 border-b border-dark-600 flex justify-between items-center rounded-t-md">
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
        Cancel
      </button>
    </div>

    {/* ✅ Personalization toggle inside the bar */}
    <div className="flex items-center gap-2 px-3 py-1 border-t border-dark-600 bg-dark-900">
      <input
        type="checkbox"
        checked={personalizeReplies}
        onChange={() => setPersonalizeReplies(!personalizeReplies)}
        className="accent-teal-600"
      />
      <span className="text-xs text-light-400">
        Personalize replies with commenter name
      </span>
    </div>

    {/* Input row */}
    <div className="flex items-center gap-2 mt-2 w-full min-w-0">
      {/* Textarea + emoji */}
      <div className="flex-grow flex items-center bg-dark-700 rounded-full px-2 py-1 min-w-0">
        <textarea
          ref={inputRef}
          id="commentReplyBox"
          value={draft}
          onChange={(e) => {
            handleInput(e)
            e.target.style.height = "auto"
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          onKeyDown={handleKeyDown}
          placeholder="Write a reply..."
          rows={1}
          className="flex-grow resize-none px-2 py-2 bg-transparent text-light-100 
                   focus:outline-none min-w-0 overflow-hidden rounded-full"
        />
        {/* Emoji toggle fixed-size */}
        <button
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full 
                     text-teal-400 hover:text-teal-300 hover:bg-dark-600 transition"
        >
          😊
        </button>
      </div>

      {/* Conditional Send button */}
      {draft.trim() && (
        <button
          onClick={handleSendText}
          disabled={sending}
          className={`flex-shrink-0 size-10 flex items-center justify-center rounded-full ${
            sending
              ? "bg-dark-600 text-light-300"
              : "bg-teal-700 text-white hover:bg-teal-600"
          }`}
        >
          <div className="i-mynaui:send size-5" />
        </button>
      )}
    </div>

    {showEmoji && (
      <div className="absolute bottom-24 right-3 bg-dark-700 border border-dark-600 rounded shadow-lg z-50 p-2">
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

