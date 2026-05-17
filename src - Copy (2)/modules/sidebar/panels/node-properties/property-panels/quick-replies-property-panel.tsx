import { useState } from 'react'
import type { QuickRepliesNodeData } from '~/modules/nodes/types'
import { useApplicationState } from '~/stores/application-state'
import emojiData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useCanvasStore } from '~/stores/canvas-store'
import { produce } from 'immer'

function isMessengerSafePayload(id: string): boolean {
  return (
    typeof id === 'string' &&
    id.trim() !== '' &&
    !id.startsWith('_') &&
    !id.includes('#') &&
    !id.includes('/') &&
    !id.includes('[') &&
    !id.includes(']')
  )
}

export default function QuickRepliesPropertyPanel({ id }: { id: string }) {
  const node = useCanvasStore(s => s.nodes.find(n => n.id === id))
  if (!node || node.type !== 'quick-replies') {
    return <div className="text-red-500">⚠️ Invalid node</div>
  }
  const data = node.data as QuickRepliesNodeData

  

  const flowList = useApplicationState(s => s.flowList)
  const [language, setLanguage] = useState<'en' | 'kh'>('kh')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const updateData = (patch: Partial<QuickRepliesNodeData>) => {
    useCanvasStore.getState().setNodes(nodes =>
      produce(nodes, draft => {
        const node = draft.find(n => n.id === id)
        if (!node) return
        Object.assign(node.data, patch)
      })
    )
  }

  const currentIntroText = language === 'kh' ? data.intro_text?.kh ?? '' : data.intro_text?.en ?? ''
  const maxLength = 120

  const setLanguageAndSave = (lang: 'en' | 'kh') => {
    setLanguage(lang)
    localStorage.setItem('builder-language', lang)
  }

  const updateIntroText = (text: string) => {
    updateData({
      intro_text: {
        ...data.intro_text,
        [language]: text.slice(0, maxLength),
      },
    })
  }

  const updateReply = (index: number, updates: Partial<QuickRepliesNodeData['replies'][number]>) => {
    const updated = [...data.replies]
    updated[index] = { ...updated[index], ...updates }
    updateData({ replies: updated })
  }

  return (
    <div className="flex flex-col gap-4.5 p-4 bg-dark-400 dark:bg-dark-900 text-light-100 dark:text-light-100">
      {/* Language Toggle */}
      <div className="flex gap-x-2">
        <button
          type="button"
          onClick={() => setLanguageAndSave('kh')}
          className={`px-2 py-1 text-xs rounded border ${language === 'kh'
            ? 'bg-teal-600 text-white border-teal-600'
            : 'bg-dark-400 dark:bg-dark-700 text-light-100 border-dark-100 dark:border-dark-600'
            }`}
        >
          ភាសាខ្មែរ
        </button>
        <button
          type="button"
          onClick={() => setLanguageAndSave('en')}
          className={`px-2 py-1 text-xs rounded border ${language === 'en'
            ? 'bg-teal-600 text-white border-teal-600'
            : 'bg-dark-400 dark:bg-dark-700 text-light-100 border-dark-100 dark:border-dark-600'
            }`}
        >
          English
        </button>
      </div>

      {/* Unique ID */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">Unique Identifier</div>
        <input
          type="text"
          value={id}
          readOnly
          className="mt-2 h-8 w-full border border-dark-200 dark:border-dark-600 rounded-md bg-dark-400 dark:bg-dark-800 px-2.5 text-sm font-medium shadow-sm outline-none read-only:(text-light-900/80 dark:text-light-100/80 opacity-80 hover:bg-dark-300/30)"
        />
      </div>

      {/* 🗣 Intro Textarea */}
      <div className="flex flex-col relative">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">
          {language === 'kh' ? 'សារណែនាំ' : 'Intro Message'}
        </div>

        <input
          value={currentIntroText}
          onChange={e => updateIntroText(e.target.value)}
          placeholder={language === 'en' ? 'Card Title (English)' : 'ចំណងជើងកាត (Khmer)'}
          className="h-8 w-full border border-dark-200 dark:border-dark-600 rounded-md bg-dark-400 dark:bg-dark-800 px-2.5 text-sm font-medium shadow-sm outline-none transition hover:bg-dark-300/60 dark:hover:bg-dark-700 focus:(border-teal-800 bg-dark-500 dark:bg-dark-700 ring-2 ring-teal-500/50)"
        />
        <div className="mt-2 flex items-center gap-x-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            className="text-xs px-2 py-1 rounded bg-dark-600 hover:bg-dark-500 text-light-100 outline-none focus:ring-2 focus:ring-teal-500"
          >
            😊 Add Emoji
          </button>
        </div>

        {showEmojiPicker && (
          <div className="absolute top-full -translate-y-5 left-0 right-0 z-50 max-h-[320px] max-w-full overflow-y-auto bg-dark-900 rounded shadow-lg p-2 scrollbar-dark-teal">
            <div className="w-full max-w-[360px] mx-auto">
              <Picker
                data={emojiData}
                theme="dark"
                onEmojiSelect={(emoji: any) => {
                  if (emoji?.native) {
                    updateIntroText(currentIntroText + emoji.native)
                    setShowEmojiPicker(false)
                  }
                }}
              />
            </div>
          </div>
        )}

        <div className="text-xs mt-1 text-light-900/40 dark:text-light-100/40">
          {currentIntroText.length}/{maxLength}
        </div>

        {currentIntroText.length > maxLength && (
          <div className="text-xs text-red-500 mt-1">
            ⚠️ {language === 'kh' ? 'សារលើសពី 320 តួអក្សរ' : 'Intro message exceeds 320 characters'}
          </div>
        )}
      </div>

      {/* Replies */}
      <div className="flex flex-col gap-4">
        <div className="text-xs font-semibold text-light-900/60">Quick Replies</div>
        {data.replies.map((reply, index) => (
          <div key={reply.id} className="flex flex-col gap-2 border border-dark-300 rounded-md p-3 bg-dark-500">
            <input
              value={language === 'kh' ? reply.label_kh ?? '' : reply.label_en ?? ''}
              onChange={e =>
                updateReply(index, language === 'kh'
                  ? { label_kh: e.target.value }
                  : { label_en: e.target.value })
              }
              placeholder={language === 'kh' ? 'ប៊ូតុង (Khmer)' : 'Button (English)'}
              className="h-8 w-full border border-dark-300 rounded-md bg-dark-600 px-2.5 text-sm font-medium shadow-sm outline-none transition hover:bg-dark-400 focus:(border-teal-500 ring-2 ring-teal-500/50)"
            />

            <select
              value={reply.type}
              onChange={e => updateReply(index, { type: e.target.value as 'text' | 'request_phone' | 'user_email' })}
              className="h-8 w-full border border-dark-300 rounded-md bg-dark-600 px-2.5 text-sm outline-none focus:(border-teal-500 ring-2 ring-teal-500/50)"
            >
              <option value="text">Text (with payload)</option>
              <option value="request_phone">Request Phone Number</option>
              <option value="user_email">Request Email</option>
            </select>
            
            {/* URL input for Phone Number */}
            {reply.type === 'user_phone_number' && (
              <div className="text-xs text-light-900/50 italic">
                Messenger will prompt the user to share their phone number.
              </div>
            )}

            {/* Phone number input email*/}
            {reply.type === 'user_email' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-light-900/60 dark:text-light-100/60">Email</label>
                <input
                  value={reply.payload ?? ''}
                  onChange={e => updateReply(index, { payload: e.target.value })}
                  placeholder="email:"
                  className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
                />
                <div className="text-xs mt-1 text-light-900/40 dark:text-light-100/40">
                  Must be a valid international number
                </div>
              </div>
            )}

            {/* Payload Selector (for postback only) */}
            {reply.type === 'text' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-light-900/60 dark:text-light-100/60">Payload</label>
                <p className="text-[10px] text-light-900/40 dark:text-light-100/40 mb-1">
                  ជ្រើសរើស flow ដើម្បីភ្ជាប់ប៊ូតុងនេះ។ អ្នកអាចវាយដោយដៃផងដែរ។
                </p>

                {/* Dropdown */}
                <select
                  value={reply.payload}
                  onChange={e => updateReply(index, { payload: e.target.value })}
                  className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
                >
                  <option value="">ជ្រើសរើស flow…</option>
                  {flowList.length > 0 ? (
                    flowList.map(flowId => (
                      <option key={flowId} value={flowId}>
                        🧩 {flowId}
                      </option>
                    ))
                  ) : (
                    <option disabled value="">⚠️ No flows available</option>
                  )}
                </select>

                {/* Manual override */}
                <input
                  value={reply.payload ?? ''}
                  onChange={e => updateReply(index, { payload: e.target.value })}
                  placeholder="ឬវាយដោយដៃ (ឧ. skin_care_intro)"
                  className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm mt-1 outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
                />

                {/* Preview or warning */}
                <div className="text-xs mt-1">
                  {reply.payload && flowList.includes(reply.payload) ? (
                    <span className="text-teal-400 dark:text-teal-300">✅ Linked to flow: {reply.payload}</span>
                  ) : reply.payload && isMessengerSafePayload(reply.payload) ? (
                    <span className="text-yellow-400">✍️ Manual payload — not auto-linked</span>
                  ) : reply.payload ? (
                    <span className="text-red-500">⚠️ Invalid or unknown payload</span>
                  ) : (
                    <span className="text-light-100/40 italic">No payload set</span>
                  )}
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  )
}
