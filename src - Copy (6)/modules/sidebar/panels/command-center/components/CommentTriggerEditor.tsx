import { useState, useEffect } from 'react'
import { getDatabase, ref, onValue, set, update } from 'firebase/database'
import { toast } from 'sonner'
import EmojiPicker from 'emoji-picker-react'

type CommentTriggerEditorProps = {
  pageId: string
  blockId: string
  block: any // the flow block object
  lang: 'en' | 'kh'   // ✅ explicitly typed
}

export function CommentTriggerEditor({ pageId, blockId, block, lang}: CommentTriggerEditorProps) {
  const [reply, setReply] = useState('')
  const [scope, setScope] = useState<'all' | 'post'>((block.config?.scope as 'all' | 'post') ?? 'all')
  const [postId, setPostId] = useState(block.config?.post_id ?? '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyFocused, setReplyFocused] = useState(false)

  // Each comment-trigger block points to a template_ref
  const templateId = block.canvas?.paths?.[0]?.template_ref

  useEffect(() => {
    if (!pageId || !templateId) return
    const db = getDatabase()
    const templateRef = ref(db, `khmer-ai-chat/pages/${pageId}/flow/shared_templates/${templateId}/locales/${lang}`)
    const unsubscribe = onValue(templateRef, (snapshot) => {
      const data = snapshot.val()
      setReply(data?.text ?? '')
      setLoading(false)
    })
    return () => unsubscribe()
  }, [pageId, templateId])

  const handleSave = async () => {
    if (!pageId || !templateId) return
    setSaving(true)
    const db = getDatabase()

    // ✅ Save reply text
    const templateRef = ref(db, `khmer-ai-chat/pages/${pageId}/flow/shared_templates/${templateId}/locales/${lang}`)
    await set(templateRef, reply)

    // ✅ Save config (scope + post_id) into block
    const blockRef = ref(db, `khmer-ai-chat/pages/${pageId}/flow/feature_blocks_by_type/${block.block_type}/${blockId}/config`)
    await update(blockRef, {
      scope,
      post_id: scope === 'post' ? postId : null
    })

    toast.success(`Saved reply & config for trigger "${block.block_name}"`)
    setSaving(false)
  }

  const handleEmojiClick = (emojiData: any) => {
    setReply((prev) => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  useEffect(() => {
    if (replyFocused) {
      const el = document.getElementById(`reply-textarea-${blockId}`)
      setTimeout(() => {
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 150)
    }
  }, [replyFocused, blockId])

  return (
    <div className="rounded bg-dark-700 p-3 space-y-3">
      <label className="block text-sm font-medium text-light-100">
        {block.block_name}
      </label>

      {/* Scope selector */}
      <div className="flex gap-2 items-center">
        <label className="text-xs text-light-300">Scope:</label>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as 'all' | 'post')}
          className="rounded bg-dark-800 text-light-100 p-1 text-sm border border-dark-500"
        >
          <option value="all">All posts</option>
          <option value="post">Specific post only</option>
        </select>
      </div>

      {/* Post ID input (only if scope=post) */}
      {scope === 'post' && (
        <div className="flex gap-2 items-center">
          <label className="text-xs text-light-300">Post ID:</label>
          <input
            type="text"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            className="w-full rounded bg-dark-800 text-light-100 p-2 text-sm border border-dark-500"
            placeholder="Enter Facebook Post ID"
          />
        </div>
      )}

      {/* Reply editor */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          aria-label="Toggle emoji picker"
          className="text-xl px-2 py-1 rounded bg-dark-700 text-white hover:bg-dark-600"
        >
          😊
        </button>

        <textarea
          id={`reply-textarea-${blockId}`}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onFocus={() => setReplyFocused(true)}
          onBlur={() => setReplyFocused(false)}
          disabled={loading || saving}
          rows={2}
          className="w-full resize-none rounded bg-dark-800 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
          placeholder="Enter auto-reply for this comment trigger..."
        />

        <button
          onClick={handleSave}
          disabled={!reply || loading || saving}
          aria-label="Save reply"
          className="shrink-0 px-3 py-2 rounded bg-teal-500 text-white text-sm hover:bg-teal-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {showEmojiPicker && (
        <div className="bg-dark-800 rounded shadow-lg p-2">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  )
}
