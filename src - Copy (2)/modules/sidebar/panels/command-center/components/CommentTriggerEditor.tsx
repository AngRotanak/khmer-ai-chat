import { useState, useEffect } from 'react'
import { getDatabase, ref, onValue, set } from 'firebase/database'
import { toast } from 'sonner'
import EmojiPicker from 'emoji-picker-react'

type CommentTriggerEditorProps = {
  trigger: string // e.g. "thanks", "price"
}

export function CommentTriggerEditor({ trigger }: CommentTriggerEditorProps) {
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyFocused, setReplyFocused] = useState(false)

  useEffect(() => {
    const db = getDatabase()
    const triggerRef = ref(db, `khmer-ai-chat/config/comments/${trigger}`)
    const unsubscribe = onValue(triggerRef, (snapshot) => {
      const data = snapshot.val()
      setReply(data?.reply ?? '')
      setLoading(false)
    })
    return () => unsubscribe()
  }, [trigger])

  const handleSave = async () => {
    setSaving(true)
    const db = getDatabase()
    const triggerRef = ref(db, `khmer-ai-chat/config/comments/${trigger}`)
    await set(triggerRef, { reply })
    toast.success(`Saved reply for "${trigger}"`)
    setSaving(false)
  }

  const handleEmojiClick = (emojiData: any) => {
    setReply((prev) => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  useEffect(() => {
    if (replyFocused) {
      const el = document.getElementById('reply-textarea')
      setTimeout(() => {
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 150)
    }
  }, [replyFocused])

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] overflow-y-auto rounded bg-dark-700 p-3 space-y-2">
      <label className="block text-sm font-medium text-light-100">
        {trigger}
      </label>

      {/* Sticky Reply Bar */}
      <div className="sticky bottom-0 z-40 bg-dark-900 p-2 flex items-center gap-2">
        {/* Emoji Toggle */}
        <button
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          aria-label="Toggle emoji picker"
          className="text-xl px-2 py-1 rounded bg-dark-700 text-white hover:bg-dark-600"
        >
          😊
        </button>

        {/* Textarea */}
        <textarea
          id="reply-textarea"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onFocus={() => setReplyFocused(true)}
          onBlur={() => setReplyFocused(false)}
          disabled={loading || saving}
          rows={2}
          autoFocus
          className="w-full resize-none rounded bg-dark-800 text-light-100 p-2 text-sm md:text-base border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
          placeholder="Enter auto-reply for this comment trigger..."
        />

        {/* Send Button */}
        <button
          onClick={handleSave}
          disabled={!reply || loading || saving}
          aria-label="Send reply"
          className="shrink-0 px-3 py-2 rounded bg-teal-500 text-white text-sm hover:bg-teal-600 disabled:opacity-50"
        >
          Send
        </button>

        {/* Floating Emoji Picker */}
        {showEmojiPicker && (
         <div className="bg-dark-800 rounded shadow-lg p-2">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>

        )}
      </div>
    </div>
  )
}
