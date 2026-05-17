import { useState, useRef, useEffect } from "react"
import Picker from "@emoji-mart/react"
import emojiData from "@emoji-mart/data"
import { Drawer } from "vaul"
import * as Dialog from "@radix-ui/react-dialog"
import type { Conversation } from '~/modules/nodes/types'
import { AgentGalleryPanel } from '~/modules/agent-dashboard/components/gallery-panel'

interface ReplyBarProps {
  draft: string
  setDraft: (text: string) => void
  pageId: string
  activeConversation: Conversation | null
  onSendMessage: (pageId: string, conv: Conversation, msg: string, extra?: any) => void
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
  const [showGallery, setShowGallery] = useState(false)
  const [policyWarning, setPolicyWarning] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const MAX_CHARS = 500

  // Auto-grow effect
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [draft])

  const handleSendText = async () => {
    if (!draft.trim() || !activeConversation) return

    // 🚨 Block if over character limit
    if (draft.length > MAX_CHARS) {
      setPolicyWarning(`Your message exceeds the ${MAX_CHARS} character limit.`)
      return
    }

    setSending(true)
    onSendMessage(pageId, activeConversation, draft.trim())
    setDraft("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    setSending(false)
  }
  return (
    <div className="sticky bottom-0 bg-dark-800 border-t border-dark-600 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
      {/* Input row */}
      <div className="flex items-end gap-2 w-full min-w-0">
        {/* Textarea + emoji ...*/}
        <div className="flex-grow flex flex-col min-w-0">
          <div className="flex items-center bg-dark-700 rounded-full px-2 py-1">
            <textarea
              ref={textareaRef}
              id="replyBox"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendText()
                }
              }}
              placeholder="Aa"
              rows={1}
              maxLength={MAX_CHARS}
              className="flex-grow resize-none px-2 py-2 bg-transparent text-light-100 
                     focus:outline-none min-w-0 overflow-hidden rounded-full leading-relaxed"
            />
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full 
             text-teal-400 hover:text-teal-300 hover:bg-dark-600 transition"
            >
              😊
            </button>


          </div>

          {/* Character counter + soft warning ..*/}
          <div className="flex justify-between mt-1">
            {draft.length > MAX_CHARS * 0.9 && draft.length <= MAX_CHARS && (
              <span className="text-xs text-yellow-400">
                ⚠️ Approaching {MAX_CHARS} character limit
              </span>
            )}
            <span
              className={`text-xs ${draft.length > MAX_CHARS
                ? "text-red-500 font-semibold"
                : draft.length > MAX_CHARS * 0.9
                  ? "text-red-400"
                  : "text-light-400"
                }`}
            >
              {draft.length}/{MAX_CHARS}
            </span>
          </div>
        </div>

        {/* Conditional buttons */}
        {draft.trim() ? (
          <button
            onClick={handleSendText}
            disabled={sending}
            className={`flex-shrink-0 size-10 flex items-center justify-center rounded-full ${sending
              ? "bg-dark-600 text-light-300"
              : "bg-teal-700 text-white hover:bg-teal-600"
              }`}
          >
            <div className="i-mynaui:send size-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowGallery(true)}
            className="flex-shrink-0 size-10 flex items-center justify-center rounded-full 
                   text-teal-400 hover:text-teal-300 sm:hidden"
          >
            <div className="i-mynaui:image size-5" />
          </button>
        )}
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="absolute bottom-24 right-3 bg-dark-700 border border-dark-600 rounded shadow-lg z-50 p-2">
          <Picker
            data={emojiData}
            onEmojiSelect={(emoji: any) => {
              setDraft(draft + emoji.native)
              setShowEmoji(false)
            }}
            theme="dark"
            previewPosition="none"
            perLine={8}
          />
        </div>
      )}

      {/* Gallery drawer */}
      <Drawer.Root
        noBodyStyles
        open={showGallery}
        onOpenChange={(open) => setShowGallery(open)}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 dark:bg-black/70" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[80%] flex flex-col rounded-t-lg bg-dark-900 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <span className="text-light-100 font-semibold">Media Gallery</span>
              <button
                onClick={() => setShowGallery(false)}
                className="text-light-300 hover:text-teal-400"
              >
                ✕
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4">
              <AgentGalleryPanel
                onSelect={(url, type) => {
                  if (!activeConversation) return
                  if (type === "image") {
                    onSendMessage(pageId, activeConversation, "", { imageUrl: url })
                  } else if (type === "video") {
                    onSendMessage(pageId, activeConversation, "", { videoUrl: url })
                  } else if (type === "audio") {
                    onSendMessage(pageId, activeConversation, "", { audioUrl: url })
                  }
                  setShowGallery(false)
                }}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Policy violation dialog */}
      <Dialog.Root open={!!policyWarning} onOpenChange={() => setPolicyWarning(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60" />
          <Dialog.Content className="bg-dark-800 p-4 rounded-lg max-w-md fixed top-1/3 left-1/2 -translate-x-1/2 mx-4">
            <Dialog.Title className="text-lg font-semibold text-light-100">
              Message Blocked
            </Dialog.Title>
            <Dialog.Description className="text-sm text-light-200 mt-2">
              {policyWarning}
            </Dialog.Description>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setPolicyWarning(null)}
                className="px-3 py-1 rounded bg-dark-600 text-light-200 hover:bg-dark-500"
              >
                Close
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )

}
