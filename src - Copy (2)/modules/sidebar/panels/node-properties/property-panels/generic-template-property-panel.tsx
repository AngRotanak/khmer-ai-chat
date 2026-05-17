
import { useState } from 'react'
import type { GenericTemplateNodeData } from '~/modules/nodes/types'
import Picker from '@emoji-mart/react'
import emojiData from '@emoji-mart/data'
import { useApplicationState } from '~/stores/application-state'
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

export default function GenericTemplatePropertyPanel({ id }: { id: string }) {
  const node = useCanvasStore(s => s.nodes.find(n => n.id === id))
  if (!node || node.type !== 'generic-template') {
    return <div className="text-red-500">⚠️ Invalid node</div>
  }

  const data = node.data as GenericTemplateNodeData

  const card: GenericTemplateNodeData['cards'][number] = data.cards?.[0] ?? {
    title: '',
    title_km: '',
    subtitle: '',
    subtitle_km: '',
    image_url: '',
    options: [],
  }
  const flowList = useApplicationState(s => s.flowList)

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiTarget, setEmojiTarget] = useState<'title' | 'subtitle' | null>(null)

  const updateData = (patch: Partial<GenericTemplateNodeData>) => {
    useCanvasStore.getState().setNodes(nodes =>
      produce(nodes, draft => {
        const node = draft.find(n => n.id === id)
        if (!node) return
        Object.assign(node.data, patch)
        node.data.updatedAt = Date.now()
      })
    )
  }


  const updateCardField = (field: keyof typeof card, value: string) => {
    const updatedCard = { ...card, [field]: value }
    updateData({ cards: [updatedCard] })
  }

  const updateOption = (
    index: number,
    updates: Partial<GenericTemplateNodeData['cards'][number]['options'][number]>
  ) => {
    const updatedOptions = [...card.options]
    updatedOptions[index] = {
      ...updatedOptions[index],
      ...updates,
    }
    updateData({ cards: [{ ...card, options: updatedOptions }] })
  }


  const [language, setLanguage] = useState<'en' | 'kh'>('kh')

  const setLanguageAndSave = (lang: 'en' | 'kh') => {
    setLanguage(lang)
    localStorage.setItem('builder-language', lang)
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

      {/* Title */}
      <div className="flex flex-col relative">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">ចំណងជើង</div>
        <input
          maxLength={80}
          value={language === 'en' ? card.title : card.title_km ?? ''}
          onChange={e =>
            updateCardField(language === 'en' ? 'title' : 'title_km', e.target.value)
          }
          placeholder={language === 'en' ? 'Card Title (English)' : 'ចំណងជើងកាត (Khmer)'}
          className="h-8 w-full border border-dark-200 dark:border-dark-600 rounded-md bg-dark-400 dark:bg-dark-800 px-2.5 text-sm font-medium shadow-sm outline-none transition hover:bg-dark-300/60 dark:hover:bg-dark-700 focus:(border-teal-800 bg-dark-500 dark:bg-dark-700 ring-2 ring-teal-500/50)"
        />

        <div className="mt-2 flex gap-x-2">
          <button
            type="button"
            onClick={() => {
              setEmojiTarget('title')
              setShowEmojiPicker(prev => !prev)
            }}
            className="text-xs px-2 py-1 rounded bg-dark-600 hover:bg-dark-500 text-light-100"
          >
            😊 Add Emoji
          </button>
        </div>

        {showEmojiPicker && emojiTarget === 'title' && (
          <div className="absolute top-full -translate-y-5 left-0 right-0 z-50 max-h-[320px] max-w-full overflow-y-auto bg-dark-900 rounded shadow-lg p-2 scrollbar-dark-teal">

            <div className="w-full max-w-[360px] mx-auto">
              <Picker
                data={emojiData}
                theme="dark"
                onEmojiSelect={(emoji: any) => {
                  const field = language === 'kh' ? 'title_km' : 'title'
                  const currentValue = card[field] ?? ''
                  updateCardField(field, currentValue + emoji.native)
                  setShowEmojiPicker(false)
                  setEmojiTarget(null)
                }}
              />
            </div>
          </div>
        )}


        <div className="text-xs mt-1 text-light-900/40 dark:text-light-100/40">
          {(language === 'kh' ? (card.title_km ?? '') : (card.title ?? '')).length}/80
        </div>
        {(language === 'kh'
          ? (card.title_km ?? '').length
          : (card.title ?? '').length) > 80 && (
            <div className="text-xs text-red-500 dark:text-red-400 mt-1">
              ⚠️ លើសពី 80 តួអក្សរ — សូមកាត់ឲ្យខ្លី!
            </div>
          )}
      </div>

      {/* Subtitle */}
      <div className="flex flex-col relative">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">ពិពណ៌នា</div>
        <textarea
          maxLength={80}
          value={language === 'en' ? card.subtitle : card.subtitle_km ?? ''}
          onChange={e =>
            updateCardField(language === 'en' ? 'subtitle' : 'subtitle_km', e.target.value)
          }
          placeholder={
            language === 'en'
              ? 'Card Subtitle (English)'
              : 'ពិពណ៌នាអំពីកាតនេះ (Khmer)'
          }
          className="min-h-24 w-full resize-none border border-dark-200 dark:border-dark-600 rounded-md bg-dark-400 dark:bg-dark-800 px-2.5 py-2 text-sm font-medium shadow-sm outline-none transition hover:bg-dark-300/60 dark:hover:bg-dark-700 focus:(border-teal-800 bg-dark-500 dark:bg-dark-700 ring-2 ring-teal-500/50)"
        />

        <div className="mt-2 flex gap-x-2">
          <button
            type="button"
            onClick={() => {
              setEmojiTarget('subtitle')
              setShowEmojiPicker(prev => !prev)
            }}
            className="text-xs px-2 py-1 rounded bg-dark-600 hover:bg-dark-500 text-light-100"
          >
            😊 Add Emoji
          </button>
        </div>

        {showEmojiPicker && emojiTarget === 'subtitle' && (
          <div className="absolute left-0 right-0 bottom-0 z-50 max-h-[320px] max-w-full overflow-y-auto bg-dark-900 rounded shadow-lg p-2 scrollbar-dark-teal">
            <div className="w-full max-w-[360px] mx-auto">
              <Picker
                data={emojiData}
                theme="dark"
                onEmojiSelect={(emoji: any) => {
                  const field = language === 'kh' ? 'subtitle_km' : 'subtitle'
                  const currentValue = card[field] ?? ''
                  updateCardField(field, currentValue + emoji.native)
                  setShowEmojiPicker(false)
                  setEmojiTarget(null)
                }}
              />
            </div>
          </div>
        )}

        <div className="text-xs mt-1 text-light-900/40 dark:text-light-100/40">
          {(language === 'kh' ? (card.subtitle_km ?? '') : (card.subtitle ?? '')).length}/80
        </div>
        {(language === 'kh'
          ? (card.subtitle_km ?? '').length
          : (card.subtitle ?? '').length) > 80 && (
            <div className="text-xs text-red-500 dark:text-red-400 mt-1">
              ⚠️ ពិពណ៌នាលើសពី 80 តួអក្សរ — សូមកាត់ឲ្យខ្លី!
            </div>
          )}
      </div>



      {/* Options */}
      {card.options.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">Options</div>

          {card.options.map((opt, index) => {
            const payload = opt.payload?.trim() ?? ''

            return (
              <div key={opt.id} className="flex flex-col gap-2 border border-dark-300 dark:border-dark-700 rounded-md p-3 bg-dark-500 dark:bg-dark-900">
                {/* Label + Type */}
                <div className="flex gap-x-2">
                  <input
                    value={language === 'kh' ? opt.label_kh ?? '' : opt.label_en}
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


                {/* Payload Selector (for postback only) */}
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
                      value={opt.payload ?? ''}
                      onChange={e => updateOption(index, { payload: e.target.value })}
                      placeholder="ឬវាយដោយដៃ (ឧ. skin_care_intro)"
                      className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm mt-1 outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
                    />

                    {/* Preview or warning */}
                    <div className="text-xs mt-1">
                      {payload && flowList.includes(payload) ? (
                        <span className="text-teal-400 dark:text-teal-300">✅ Linked to flow: {payload}</span>
                      ) : payload && isMessengerSafePayload(payload) ? (
                        <span className="text-yellow-400">✍️ Manual payload — not auto-linked</span>
                      ) : payload ? (
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


      {/* Image URL */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">Image URL</div>
        <input
          value={card.image_url}
          onChange={e => updateCardField('image_url', e.target.value)}
          className="h-8 w-full border border-dark-200 dark:border-dark-600 rounded-md bg-dark-400 dark:bg-dark-800 px-2.5 text-sm font-medium shadow-sm outline-none transition hover:bg-dark-300/60 dark:hover:bg-dark-700 focus:(border-teal-800 bg-dark-500 dark:bg-dark-700 ring-2 ring-teal-800/50)"
        />
        {card.image_url && (
          <img
            src={card.image_url}
            alt="Preview"
            className="mt-3 w-full rounded-md border border-dark-100 dark:border-dark-600 shadow-sm"
          />
        )}
      </div>



      {/* Layout Selector */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">Layout</div>
        <select
          value={data.layout ?? 'hero'}
          onChange={e => updateData({ layout: e.target.value })}
          className="mt-2 h-8 w-full rounded bg-dark-600 dark:bg-dark-800 px-2.5 text-sm border border-dark-300 dark:border-dark-700 outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="hero">Hero</option>
          <option value="list">List</option>
        </select>
      </div>

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
          onChange={e => updateData({ tone: e.target.value as GenericTemplateNodeData['tone'] })}
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
          onChange={e => updateData({ emoji_style: e.target.value as GenericTemplateNodeData['emoji_style'] })}
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
          onChange={e => updateData({ priority: e.target.value as GenericTemplateNodeData['priority'] })}
          className="mt-2 h-8 w-full rounded bg-dark-600 dark:bg-dark-800 px-2.5 text-sm border border-dark-300 dark:border-dark-700 outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
      </div>

    </div>
  )
}
