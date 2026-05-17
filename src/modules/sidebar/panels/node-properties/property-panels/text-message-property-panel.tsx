import { useState, useEffect } from 'react'
import type { TextMessageNodeData, BuilderNodeType } from '~/modules/nodes/types'
import { cn } from '~@/utils/cn'
import emojiData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useCanvasStore } from '~/stores/canvas-store'
import { produce } from 'immer'
import { useFlowSession } from "~/stores/flow-session"
import { useApplicationState } from '~/stores/application-state'

export default function TextMessageNodePropertyPanel({ id }: { id: string; type: BuilderNodeType }) {
  const node = useCanvasStore(s => s.nodes.find(n => n.id === id))
  const data = node?.data as TextMessageNodeData | undefined
  const { currentPageId } = useFlowSession()
  const [language, setLanguage] = useState<'en' | 'km'>('km')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // 🆕 state for referral flow selection
  const [selectedFlowId, setSelectedFlowId] = useState<string>('')

  const flowList = useApplicationState(s => s.flowList)


  useEffect(() => {
    const stored = localStorage.getItem('builder-language')
    if (stored === 'en' || stored === 'km') setLanguage(stored)
  }, [])

  if (!node || node.type !== 'text-message' || !data) {
    return <div className="text-red-500">⚠️ Invalid node</div>
  }

  const updateData = (patch: Partial<TextMessageNodeData>) => {
    useCanvasStore.getState().setNodes(nodes =>
      produce(nodes, draft => {
        const node = draft.find(n => n.id === id)
        if (!node) return
        Object.assign(node.data, patch)
        node.data.updatedAt = Date.now()
      })
    )
  }

  const setLanguageAndSave = (lang: 'en' | 'km') => {
    setLanguage(lang)
    localStorage.setItem('builder-language', lang)
  }

  const currentMessage = language === 'km' ? data.message_kh ?? '' : data.message_en ?? ''
  const updateMessage = (value: string) => {
    updateData(language === 'km' ? { message_kh: value } : { message_en: value })
  }



  return (
    <div className="rounded bg-dark-700 p-3 space-y-4 relative">
      {/* 🏷️ Block Name */}
      <div className="flex flex-col">
        <label className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">Block Name</label>
        <input
          type="text"
          value={data.name ?? ''}
          onChange={e => updateData({ name: e.target.value })}
          placeholder="e.g. confirm_order"
          maxLength={40}
          className="mt-2 h-8 w-full rounded bg-dark-600 dark:bg-dark-800 px-2.5 text-sm border border-dark-300 dark:border-dark-700 placeholder:text-light-900/40 dark:placeholder:text-light-100/40 outline-none focus:ring-2 focus:ring-teal-500"
        />
        <p className="text-[10px] text-light-900/40 dark:text-light-100/40 mt-1">
          Optional name to help identify this block in the canvas and export.
        </p>
      </div>

      {/* Language Toggle */}
      <div className="flex gap-x-2">
        <button
          type="button"
          onClick={() => setLanguageAndSave('km')}
          className={cn(
            'px-2 py-1 text-xs rounded border outline-none focus:ring-2 focus:ring-teal-500',
            language === 'km'
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-dark-600 dark:bg-dark-700 text-light-100 border-dark-300 dark:border-dark-700'
          )}
        >
          ភាសាខ្មែរ
        </button>
        <button
          type="button"
          onClick={() => setLanguageAndSave('en')}
          className={cn(
            'px-2 py-1 text-xs rounded border outline-none focus:ring-2 focus:ring-teal-500',
            language === 'en'
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-dark-600 dark:bg-dark-700 text-light-100 border-dark-300 dark:border-dark-700'
          )}
        >
          English
        </button>
      </div>

      {/* Unique Identifier */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">Unique Identifier</div>
        <input
          type="text"
          value={id}
          readOnly
          className="mt-2 h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm font-medium shadow-sm outline-none read-only:(text-light-900/80 dark:text-light-100/80 opacity-80 hover:bg-dark-400/30)"
        />
      </div>

      {/* 🆕 Referral Flow Selector (only for comment channel) */}
      {data.channel === 'comment' && (
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">
            Referral Flow
          </label>
          <select
            value={selectedFlowId}
            onChange={e => {
              const selected = e.target.value
              setSelectedFlowId(selected)

              const flowMeta = flowList.find(f => `${f.type}.${f.id}` === selected)
              const refString = flowMeta ? `${flowMeta.type}.${flowMeta.name}` : selected
              const referralUrl = `https://m.me/${currentPageId}?ref=${refString}`

              // Auto-append referral URL to message
              const newMessage = currentMessage
                ? `${currentMessage}\n\n📩 ${referralUrl}`
                : referralUrl

              updateMessage(newMessage)
            }}
            className="mt-2 h-8 w-full rounded bg-dark-600 dark:bg-dark-800 px-2.5 text-sm border border-dark-300 dark:border-dark-700 outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">-- Select Flow --</option>
            {flowList
              .filter(flow => flow.type !== "carousel")
              .map(flow => (
                <option key={flow.id} value={`${flow.type}.${flow.id}`}>
                  🧩 {flow.type} – {flow.name}
                </option>
              ))}
          </select>
          <p className="text-[10px] text-light-900/40 dark:text-light-100/40 mt-1">
            Selecting a flow will append its Messenger referral link to your comment reply.
          </p>
        </div>
      )}

      {/* Message Textarea */}
      <div className="flex flex-col relative">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">
          {language === 'km' ? 'សារ' : 'Message'}
        </div>

        <textarea
          value={currentMessage}
          onChange={e => updateMessage(e.target.value)}
          placeholder={language === 'km' ? 'សរសេរសាររបស់អ្នកនៅទីនេះ...' : 'Type your message here...'}
          className="mt-2 w-full h-32 rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 outline-none focus:ring-2 focus:ring-teal-500 overflow-y-auto scrollbar-dark-teal"
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
          <div className="absolute left-0 right-0 bottom-0 z-50 max-h-[320px] max-w-full overflow-y-auto bg-dark-900 rounded shadow-lg p-2 scrollbar-dark-teal">
            <div className="w-full max-w-[360px] mx-auto">
              <Picker
                data={emojiData}
                theme="dark"
                onEmojiSelect={(emoji: any) => {
                  if (emoji?.native) {
                    updateMessage(currentMessage + emoji.native)
                    setShowEmojiPicker(false)
                  }
                }}
              />
            </div>
          </div>
        )}

        <div className="text-xs mt-1 text-light-900/40 dark:text-light-100/40">
          {currentMessage.length}/320
        </div>

        {currentMessage.length > 320 && (
          <div className="text-xs text-red-500 mt-1">
            ⚠️ {language === 'km' ? 'សារលើសពី 320 តួអក្សរ' : 'Message exceeds 320 characters'}
          </div>
        )}
      </div>

      {/* Delay Config */}
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

      {/* Typing Indicator */}
      <div className="flex items-center gap-x-2">
        <input
          type="checkbox"
          checked={data.show_typing ?? true}
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
          onChange={e => updateData({ tone: e.target.value as TextMessageNodeData['tone'] })}
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
          onChange={e => updateData({ emoji_style: e.target.value as TextMessageNodeData['emoji_style'] })}
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
          onChange={e => updateData({ priority: e.target.value as TextMessageNodeData['priority'] })}
          className="mt-2 h-8 w-full rounded bg-dark-600 dark:bg-dark-800 px-2.5 text-sm border border-dark-300 dark:border-dark-700 outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="normal">Normal</option>
          <option value="high">High</option>
           <option value="urgent">Urgent</option> {/* ✅ new option */}
        </select>
      </div>


    </div>

  )
}
