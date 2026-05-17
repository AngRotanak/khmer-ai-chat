import Picker from '@emoji-mart/react'
import emojiData from '@emoji-mart/data'
import type { ButtonTemplateNodeData } from '~/modules/nodes/types'
import { useApplicationState } from '~/stores/application-state'
import { useCanvasStore } from '~/stores/canvas-store'
import { produce } from 'immer'
import { useState, useEffect } from 'react'

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

export default function ButtonTemplatePropertyPanel({ id }: { id: string }) {
  const node = useCanvasStore(s => s.nodes.find(n => n.id === id))
  const data = node?.data as ButtonTemplateNodeData | undefined

  const flowList = useApplicationState(s => s.flowList)
  const safeFlowList = Array.isArray(flowList) ? flowList : []

  const [language, setLanguage] = useState<'en' | 'kh'>('kh')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)



  useEffect(() => {
    const stored = localStorage.getItem('builder-language')
    if (stored === 'en' || stored === 'kh') setLanguage(stored)
  }, [])


  if (!node || node.type !== 'button-template' || !data) {
    return <div className="text-red-500">⚠️ Invalid node</div>
  }


  const updateData = (patch: Partial<ButtonTemplateNodeData>) => {
    useCanvasStore.getState().setNodes(nodes =>
      produce(nodes, draft => {
        const node = draft.find(n => n.id === id)
        if (!node) return
        Object.assign(node.data, patch)
        node.data.updatedAt = Date.now()
      })
    )
  }

  const currentIntroText = language === 'kh' ? data.intro_text?.kh ?? '' : data.intro_text?.en ?? ''
  const maxLength = 320

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


  const updateOption = (
    index: number,
    patch: Partial<ButtonTemplateNodeData['options'][number]>
  ) => {
    const updated = [...data.options]
    updated[index] = { ...updated[index], ...patch }
    updateData({ options: updated })
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
            : 'bg-dark-400 dark:bg-dark-700 text-light-100 dark:text-light-100 border-dark-100 dark:border-dark-600'
            }`}
        >
          ភាសាខ្មែរ
        </button>

        <button
          type="button"
          onClick={() => setLanguageAndSave('en')}
          className={`px-2 py-1 text-xs rounded border ${language === 'en'
            ? 'bg-teal-600 text-white border-teal-600'
            : 'bg-dark-400 dark:bg-dark-700 text-light-100 dark:text-light-100 border-dark-100 dark:border-dark-600'
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


      {/* Intro Text */}
      <div className="flex flex-col relative">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">
          {language === 'kh' ? 'សារណែនាំ' : 'Intro Message'}
        </div>

        <textarea
          value={currentIntroText}
          onChange={e => updateIntroText(e.target.value)}
          placeholder={language === 'kh' ? 'សរសេរប្រសាសន៍បង្ហាញប៊ូតុងនៅទីនេះ...' : 'Type your intro message here...'}
          className="min-h-24 w-full resize-none border border-dark-200 dark:border-dark-600 rounded-md bg-dark-400 dark:bg-dark-800 px-2.5 py-2 text-sm font-medium shadow-sm outline-none transition hover:bg-dark-300/60 dark:hover:bg-dark-700 focus:(border-teal-800 bg-dark-500 dark:bg-dark-700 ring-2 ring-teal-500/50)"
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


      {/* Options */}
      {data.options.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">
            Buttons
          </div>

          {data.options.map((opt, index) => {
            const payload = opt.payload?.trim() ?? ''
            const label = language === 'kh' ? opt.label_kh ?? '' : opt.label_en ?? ''
            const safePayload = typeof opt.payload === 'string' ? opt.payload : ''
            const isLinked = safePayload && safeFlowList.some(flow => flow.id === safePayload)

            return (
              <div
                key={opt.id}
                className="flex flex-col gap-2 border border-dark-300 dark:border-dark-700 rounded-md p-3 bg-dark-500 dark:bg-dark-600"
              >
                {/* Label + Type */}
                <div className="flex gap-x-2">
                  <input
                    value={label}
                    onChange={e =>
                      updateOption(index, {
                        ...(language === 'kh'
                          ? { label_kh: e.target.value }
                          : { label_en: e.target.value }),
                      })
                    }
                    placeholder={language === 'kh' ? 'ប៊ូតុង (Khmer)' : 'Button (English)'}
                    className="w-2/3 h-8 border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm font-medium shadow-sm outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
                  />

                  <select
                    value={opt.type}
                    onChange={e =>
                      updateOption(index, {
                        type: e.target.value as 'postback' | 'web_url' | 'phone_number',
                      })
                    }
                    className="w-2/3 h-8 border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm font-medium shadow-sm outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
                  >
                    <option value="postback">Postback</option>
                    <option value="web_url">Web URL</option>
                    <option value="phone_number">Phone Number</option>
                  </select>
                </div>

                {/* URL input for web_url */}
                {opt.type === 'web_url' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-light-900/60 dark:text-light-100/60">URL</label>
                    <input
                      value={opt.url ?? ''}
                      onChange={e => updateOption(index, { url: e.target.value })}
                      placeholder="https://example.com"
                      className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
                    />
                  </div>
                )}

                {/* Phone number input */}
                {opt.type === 'phone_number' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-light-900/60 dark:text-light-100/60">Phone Number</label>
                    <input
                      value={opt.payload ?? ''}
                      onChange={e => updateOption(index, { payload: e.target.value })}
                      placeholder="+85512345678"
                      className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
                    />
                    <div className="text-xs mt-1 text-light-900/40 dark:text-light-100/40">
                      Must be a valid international number
                    </div>
                  </div>
                )}

                {/* Payload selector for postback */}
                {opt.type === 'postback' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-light-900/60 dark:text-light-100/60">Payload</label>
                    <p className="text-[10px] text-light-900/40 dark:text-light-100/40 mb-1">
                      ជ្រើសរើស flow ដើម្បីភ្ជាប់ប៊ូតុងនេះ។ អ្នកអាចវាយដោយដៃផងដែរ។
                    </p>

                    {/* Dropdown */}
                    <select
                      value={payload}
                      onChange={e => updateOption(index, { payload: e.target.value })}
                      className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
                    >
                      <option value="">ជ្រើសរើស flow…</option>
                      {safeFlowList.length > 0 ? (
                        safeFlowList.map(flow => (
                          <option key={flow.id} value={flow.id}>
                            🧩 {flow.type} – {flow.name || flow.id}
                          </option>
                        ))
                      ) : (
                        <option disabled value="">⚠️ No flows available</option>
                      )}
                    </select>

                    <input
                      value={opt.payload ?? ''}
                      onChange={e => updateOption(index, { payload: e.target.value })}
                      placeholder="ឬវាយដោយដៃ (ឧ. skin_care_intro)"
                      className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm mt-1 outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
                    />

                    {/* Preview or warning */}
                    <div className="text-xs mt-1">
                      {isLinked ? (
                        <span className="text-teal-400">✅ Linked to flow: {safePayload}</span>
                      ) : safePayload && isMessengerSafePayload(safePayload) ? (
                        <span className="text-yellow-400">✍️ Manual payload — not auto-linked</span>
                      ) : safePayload ? (
                        <span className="text-red-500">⚠️ Invalid or unknown payload</span>
                      ) : (
                        <span className="text-light-100/40 italic">No payload set</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}



      {/* Delay Seconds */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">Delay (seconds)</div>
        <input
          type="number"
          min={0}
          max={60}
          value={data.delay_seconds ?? 0}
          onChange={e => updateData({ delay_seconds: Number(e.target.value) })}
          className="mt-2 h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Show Typing */}
      <div className="flex items-center gap-x-2">
        <input
          type="checkbox"
          checked={data.show_typing ?? false}
          onChange={e => updateData({ show_typing: e.target.checked })}
          className="size-4 accent-teal-600 outline-none focus:ring-2 focus:ring-teal-500"
        />
        <label className="text-xs font-medium text-light-100">Show typing indicator</label>
      </div>

      {/* Tone Selector */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">Tone</div>
        <select
          value={data.tone ?? 'neutral'}
          onChange={e => updateData({ tone: e.target.value as ButtonTemplateNodeData['tone'] })}
          className="mt-2 h-8 w-full rounded bg-dark-600 dark:bg-dark-800 px-2.5 text-sm border border-dark-300 dark:border-dark-700 outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="neutral">Neutral</option>
          <option value="friendly">Friendly</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Emoji Style Selector */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">Emoji Style</div>
        <select
          value={data.emoji_style ?? 'minimal'}
          onChange={e => updateData({ emoji_style: e.target.value as ButtonTemplateNodeData['emoji_style'] })}
          className="mt-2 h-8 w-full rounded bg-dark-600 dark:bg-dark-800 px-2.5 text-sm border border-dark-300 dark:border-dark-700 outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="none">None</option>
          <option value="minimal">Minimal</option>
          <option value="expressive">Expressive</option>
        </select>
      </div>

      {/* Priority Selector */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">Priority</div>
        <select
          value={data.priority ?? 'normal'}
          onChange={e => updateData({ priority: e.target.value as ButtonTemplateNodeData['priority'] })}
          className="mt-2 h-8 w-full rounded bg-dark-600 dark:bg-dark-800 px-2.5 text-sm border border-dark-300 dark:border-dark-700 outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
      </div>

    </div>
  )
}

