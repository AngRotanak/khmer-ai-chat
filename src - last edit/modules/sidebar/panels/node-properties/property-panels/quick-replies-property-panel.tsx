import { useState } from 'react'
import type { NodePropertyPanelProps } from '~/modules/sidebar/panels/node-properties/constants/property-panels'
import type { QuickRepliesNodeData } from '~/modules/nodes/types'
import { useApplicationState } from '~/stores/application-state'
import { ConditionDropdownSelector } from '~/modules/nodes/nodes/conditional-path-node/components/condition-dropdown-selector'
import emojiData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'


export default function QuickRepliesPropertyPanel({
  id,
  data,
  updateData,
}: NodePropertyPanelProps & { data: QuickRepliesNodeData }) {
  const flowList = useApplicationState(s => s.flowList)
  const [language, setLanguage] = useState<'en' | 'kh'>('kh')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)



  const currentIntroText = language === 'kh' ? data.intro_text?.kh ?? '' : data.intro_text?.en ?? ''
  const maxLength = 120

  const updateIntroText = (text: string) => {
    updateData({
      intro_text: {
        ...data.intro_text,
        [language]: text.slice(0, maxLength),
      },
    })
  }


  const setLanguageAndSave = (lang: 'en' | 'kh') => {
    setLanguage(lang)
    localStorage.setItem('builder-language', lang)
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
        <div className="text-xs font-semibold text-light-900/60">Unique Identifier</div>
        <input
          type="text"
          value={id}
          readOnly
          className="mt-2 h-8 w-full border border-dark-200 rounded-md bg-dark-400 px-2.5 text-sm font-medium shadow-sm outline-none read-only:(text-light-900/80 opacity-80 hover:bg-dark-300/30)"
        />
      </div>

      {/* 🗣 Intro Textarea */}
      <div className="flex flex-col relative">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">
          {language === 'kh' ? 'សារណែនាំ' : 'Intro Message'}
        </div>

        <textarea
          value={currentIntroText}
          onChange={e => updateIntroText(e.target.value)}
          placeholder={language === 'kh' ? 'សរសេរប្រសាសន៍បង្ហាញជម្រើសនៅទីនេះ...' : 'Type your intro message here...'}
          className="mt-2 w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 outline-none focus:ring-2 focus:ring-teal-500"
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
              onChange={e => updateReply(index, { type: e.target.value as 'text' | 'user_phone_number' | 'user_email' })}
              className="h-8 w-full border border-dark-300 rounded-md bg-dark-600 px-2.5 text-sm outline-none focus:(border-teal-500 ring-2 ring-teal-500/50)"
            >
              <option value="text">Text (with payload)</option>
              <option value="user_phone_number">Request Phone Number</option>
              <option value="user_email">Request Email</option>
            </select>

            {reply.type === 'text' && (
              <>
                <label className="text-xs text-light-900/60">Payload</label>
                <select
                  value={reply.payload}
                  onChange={e => updateReply(index, { payload: e.target.value })}
                  className="h-8 w-full border border-dark-300 rounded-md bg-dark-600 px-2.5 text-sm outline-none"
                >
                  <option value="">ជ្រើសរើស flow…</option>
                  {flowList.map(flowId => (
                    <option key={flowId} value={flowId}>
                      🧩 {flowId}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Condition */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60">Trigger Condition</div>
        <ConditionDropdownSelector
          value={data.condition ?? null}
          onChange={value => updateData({ condition: value })}
        />
      </div>
    </div>
  )
}
