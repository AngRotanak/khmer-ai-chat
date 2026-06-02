import React from 'react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@radix-ui/react-tooltip'
import type { WaitTrigger, Condition } from '~/modules/blocks/types/feature-block'
import type { FeatureBlock, EntryTrigger } from '~/modules/blocks/types/feature-block'

type InfoPanelProps = {
  data: FeatureBlock
  updateData: (patch: Partial<FeatureBlock>) => void
  updatePathTrigger: (index: number, trigger: WaitTrigger) => void
  updatePathCondition: (index: number, field: keyof Condition, value: string) => void
  updatePathDetectionMode: (index: number, mode: 'keyword' | 'intent') => void
  updatePathExpectedIntent: (index: number, intent: string) => void
  updatePathIntentConfidence: (index: number, confidence: number) => void
  updateEntryTrigger: (trigger: EntryTrigger) => void
}


export const InfoPanel: React.FC<InfoPanelProps> = ({
  data,
  updateData,
  updatePathTrigger,
  updatePathCondition,
  updatePathDetectionMode,
  updatePathExpectedIntent,
  updateEntryTrigger,
  updatePathIntentConfidence
}) => {


  return (
    <div className="rounded bg-dark-700 p-3 space-y-2">
      {/* 🔖 Block Name Input */}
      <div className="flex flex-col gap-y-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="text-xs text-light-900/60 dark:text-light-100/60 font-medium mb-1">
                Block Name
              </label>
            </TooltipTrigger>
            <TooltipContent className="bg-dark-400 dark:bg-dark-800 text-light-900 dark:text-light-100 text-xs px-2 py-1 rounded shadow">
              បញ្ចូលឈ្មោះប្លុកដើម្បីស្គាល់ងាយស្រួល
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <textarea
          value={data.name || ''}
          onChange={e => updateData({ name: e.target.value })}
          placeholder="e.g. info_skin_care"
          className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
          maxLength={40}
        />

        <p className="text-[10px] text-light-900/40 dark:text-light-100/40">
          This name will appear on the canvas and help identify the block.
        </p>
      </div>

      {/* 🎯 Entry Trigger Panel */}
      <div className="flex flex-col gap-y-2 px-4 pt-3 pb-1">
        <div className="text-xs text-light-900/60 font-semibold">🎯 Start Automation When</div>
        <select
          value={data.entry_trigger}
          onChange={e => updateEntryTrigger(e.target.value as EntryTrigger)}
          className="h-7 w-full rounded-md bg-dark-800 text-light-100 text-xs border border-transparent px-1 outline-none transition hover:(bg-dark-300 border-teal-600)"
        >
          <option value="message">💬 User sends a message</option>
          <option value="ref_url">🔗 Clicks a referral link</option>
          <option value="qr_code">📷 Scans a QR code</option>
          <option value="comment">💬 Comments on a post</option>
          <option value="shop_message">🛍️ Messages from shop</option>
          <option value="ad_click">📣 Clicks a Facebook Ad</option>
        </select>

      </div>


      {/* ⚙️ Per-Path Settings */}
      {Array.isArray(data.canvas?.paths) && data.canvas.paths.map((path, index) => {
        const mode = path.detection_mode ?? 'keyword'
        console.log('Intent for path', index, path.expected_intent)

        return (
          <div key={path.template_id} className="mt-4 border-t border-dark-200 pt-4">
            <div className="text-xs font-semibold text-light-900/60 mb-2">
              ⚙️ Path {index + 1} Settings
            </div>

            {/* Trigger Selector */}
            <div className="mb-2">
              <label className="text-xs text-light-900/40 mb-1 block">Trigger</label>
              <select
                value={path.trigger ?? 'immediate'}
                onChange={e => updatePathTrigger(index, e.target.value as WaitTrigger)}
                className="w-full h-7 rounded-md bg-dark-800 text-light-100 text-xs border border-dark-200 px-2 outline-none"
              >
                <option value="immediate">⏱ បញ្ជូនភ្លាមៗ</option>
                <option value="delay">⏳ រងចាំ</option>
                <option value="condition">🧠 លក្ខខណ្ឌ</option>
              </select>
            </div>

            {/* Detection Mode Toggle */}
            {['message', 'comment'].includes(data.entry_trigger) && (
              <div className="mb-2">
                <label className="text-xs text-light-900/40 mb-1 block">Detection Mode</label>
                <div className="flex gap-x-4 items-center">
                  <label className="flex items-center gap-x-1 text-xs text-light-100">
                    <input
                      type="radio"
                      name={`detection_mode_${index}`}
                      value="keyword"
                      checked={mode === 'keyword'}
                      onChange={() => updatePathDetectionMode(index, 'keyword')}
                    />
                    Detect specific words
                  </label>
                  <label className="flex items-center gap-x-1 text-xs text-light-100">
                    <input
                      type="radio"
                      name={`detection_mode_${index}`}
                      value="intent"
                      checked={mode === 'intent'}
                      onChange={() => updatePathDetectionMode(index, 'intent')}
                    />
                    Recognize intent (AI)
                  </label>
                </div>
              </div>
            )}

            {mode === 'intent' && (
              <div className="mb-2">
                <label className="text-xs text-light-900/40 mb-1 block">Expected Intent</label>
                <select
                  value={path.expected_intent ?? ''}
                  onChange={e => updatePathExpectedIntent(index, e.target.value)}
                  className="w-full h-7 rounded-md bg-dark-800 text-light-100 text-xs border border-dark-200 px-2 outline-none"
                >
                  <option value="">— Select intent —</option>
                  <option value="ask_price">ask_price</option>
                  <option value="greeting">greeting</option>
                  <option value="feedback">feedback</option>
                  <option value="product_interest">product_interest</option>
                  <option value="complaint">complaint</option>
                </select>
              </div>
            )}

            {mode === 'intent' && (
              <div className="mb-2">
                <label className="text-xs text-light-900/40 mb-1 block">Intent Confidence</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={path.intent_confidence ?? 0.7}
                  onChange={e => updatePathIntentConfidence(index, parseFloat(e.target.value))}
                  className="w-full h-7 rounded-md bg-dark-800 text-light-100 text-xs border border-dark-200 px-2 outline-none"
                  placeholder="e.g. 0.7"
                />
              </div>
            )}


            {/* Condition Editor */}
            {['message', 'comment'].includes(data.entry_trigger) && mode === 'keyword' && (
              <div className="mb-2">
                <label className="text-xs text-light-900/40 mb-1 block">Condition</label>
                <div className="flex gap-x-2">
                  <select
                    value={path.condition?.match ?? 'includes'}
                    onChange={e => updatePathCondition(index, 'match', e.target.value)}
                    className="w-1/3 h-7 rounded-md bg-dark-800 text-light-100 text-xs border border-dark-200 px-2 outline-none"
                  >
                    <option value="includes">includes</option>
                    <option value="equals">equals</option>
                    <option value="startsWith">startsWith</option>
                  </select>
                  <input
                    type="text"
                    value={path.condition?.value ?? ''}
                    onChange={e => updatePathCondition(index, 'value', e.target.value)}
                    className="w-2/3 h-7 rounded-md bg-dark-800 text-light-100 text-xs border border-dark-200 px-2 outline-none"
                    placeholder="Enter condition value"
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}


    </div>
  )
}
