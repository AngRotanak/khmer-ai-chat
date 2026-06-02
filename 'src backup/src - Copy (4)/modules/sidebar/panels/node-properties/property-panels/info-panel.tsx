import React from 'react'
import type { WaitTrigger, Condition } from '~/modules/blocks/types/feature-block'
import type { FeatureBlock, EntryTrigger, PathItem, CommentTriggerConfig } from '~/modules/blocks/types/feature-block'
import { isMessengerSafePayload } from '~/helpers/payload-utils'
import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '~/lib/firebase'
import { useFlowSession } from '~/stores/flow-session'

type InfoPanelProps = {
  data: FeatureBlock
  path: PathItem | undefined
  updateData: (patch: Partial<FeatureBlock>) => void
  updatePathTrigger: (index: number, trigger: WaitTrigger) => void
  updatePathCondition: (index: number, field: keyof Condition, value: string) => void
  updatePathDetectionMode: (index: number, mode: 'keyword' | 'intent') => void
  updatePathExpectedIntent: (index: number, intent: string) => void
  updatePathIntentConfidence: (index: number, confidence: number) => void
  updateEntryTrigger: (trigger: EntryTrigger) => void
  updatePathPayload: (index: number, payload: string) => void // ✅ Add this line
  updateEntryDetectionMode: (mode: 'keyword' | 'intent') => void
  updateEntryExpectedIntent: (intent: string) => void
  updateEntryIntentConfidence: (confidence: number) => void

}


export const InfoPanel: React.FC<InfoPanelProps> = ({
  data,
  path,
  updateData,
  updatePathTrigger,
  updatePathCondition,
  updatePathDetectionMode,
  updatePathExpectedIntent,
  updateEntryTrigger,
  updatePathIntentConfidence,
  updatePathPayload,
  updateEntryDetectionMode,
  updateEntryExpectedIntent,
  updateEntryIntentConfidence
}) => {
  // existing state
  const [rawDelay, setRawDelay] = useState<string>(String(path?.delay?.seconds ?? 3))
  const [availableIntents, setAvailableIntents] = useState<{ id: string; name: string }[]>([])

  // ✅ new state for keyword input
  const [keywordInput, setKeywordInput] = useState('')

  const { currentPageId } = useFlowSession()
  if (!currentPageId) {
    return <div>Please select a page first</div>
  }


  // ✅ initialize keywordInput whenever entry_condition.value changes
  useEffect(() => {
    if (Array.isArray(data.entry_condition?.value)) {
      setKeywordInput(data.entry_condition.value.join(', '))
    } else {
      setKeywordInput(data.entry_condition?.value ?? '')
    }
  }, [data.entry_condition?.value])

  useEffect(() => {
    const intentRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/agents/intents`)
    onValue(intentRef, snapshot => {
      const data = snapshot.val()
      const result = Object.entries(data ?? {}).map(([key, value]: [string, any]) => ({
        id: key,
        name: value.display_name?.kh || value.display_name?.en || key,
      }))
      setAvailableIntents(result)
    })
  }, [currentPageId])


  return (
    <div className="space-y-4">
      {/* 🧱 Block-Level Configuration */}
      <div className="border border-dark-300 rounded-md p-3 space-y-3 bg-dark-800">
        <div className="text-xs font-semibold text-light-900/60 mb-2">🧱 Block Configuration</div>

        {/* 🔖 Block Name Input */}
        <div className="flex flex-col gap-y-1">
          <label className="text-xs text-light-900/60 font-medium mb-1">Block Name</label>
          <input
            type="text"
            value={data.block_name || ''}
            onChange={e => updateData({ block_name: e.target.value })}
            placeholder="e.g. info_skin_care"
            className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
            maxLength={40}
          />
          <p className="text-[10px] text-light-900/40">
            This name will appear on the canvas and help identify the block.
          </p>
        </div>


        {/* 🎯 Entry Trigger */}
        <div>
          <label className="text-xs font-semibold text-light-900/60 mb-1 block">🎯 Start Automation When</label>
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

        {data.entry_trigger === 'comment' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-light-900/60">Scope</label>
            <select
              value={(data.config as CommentTriggerConfig)?.scope || 'all'}
              onChange={e =>
                updateData({
                  config: { ...(data.config || {}), scope: e.target.value }
                })
              }
              className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
            >
              <option value="all">All posts</option>
              <option value="post">Specific post only</option>
            </select>

            {(data.config as CommentTriggerConfig)?.scope === 'post' && (
              <input
                type="text"
                value={(data.config as CommentTriggerConfig)?.post_id || ''}
                onChange={e =>
                  updateData({
                    config: { ...(data.config || {}), post_id: e.target.value }
                  })
                }
                placeholder="Enter Post ID"
                className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
              />
            )}
          </div>
        )}


        {/* 🔍 Entry Detection Mode */}
        <div>
          <label className="text-xs text-light-900/40 mb-1 block">Detection Mode</label>
          <div className="flex gap-x-4 items-center">
            <label className="flex items-center gap-x-1 text-xs text-light-100">
              <input
                type="radio"
                name="entry_detection_mode"
                value="keyword"
                checked={data.entry_detection_mode === 'keyword'}
                onChange={() => updateEntryDetectionMode('keyword')}
              />
              Keyword
            </label>
            <label className="flex items-center gap-x-1 text-xs text-light-100">
              <input
                type="radio"
                name="entry_detection_mode"
                value="intent"
                checked={data.entry_detection_mode === 'intent'}
                onChange={() => updateEntryDetectionMode('intent')}
              />
              Intent (AI)
            </label>
          </div>
        </div>


        {/* 🧠 Keyword Condition for Block Entry */}
        {['message', 'comment'].includes(data.entry_trigger) &&
          data.entry_detection_mode === 'keyword' && (
            <div>
              <label className="text-xs text-light-900/40 mb-1 block">Keyword Condition</label>
              <div className="flex gap-x-2">
                {/* Match type selector */}
                <select
                  value={data.entry_condition?.match ?? 'includes'}
                  onChange={e => {
                    const allowedMatches = ['includes', 'equals', 'startsWith'] as const
                    const selected = e.target.value
                    const safeMatch = allowedMatches.includes(selected as any)
                      ? (selected as Condition['match'])
                      : 'includes'

                    updateData({
                      entry_condition: {
                        ...(data.entry_condition ?? { match: 'includes', value: '' }),
                        match: safeMatch,
                      },
                    })
                  }}
                  className="w-1/3 h-7 rounded-md bg-dark-800 text-light-100 text-xs border border-dark-200 px-2 outline-none"
                >
                  <option value="includes">includes</option>
                  <option value="equals">equals</option>
                  <option value="startsWith">startsWith</option>
                </select>

                {/* Keyword(s) input */}
                <input
                  type="text"
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)} // ✅ raw string while typing
                  onBlur={() => {
                    const keywords = keywordInput.split(',')
                      .map(k => k.trim())
                      .filter(Boolean)

                    updateData({
                      entry_condition: {
                        ...(data.entry_condition ?? { match: 'includes', value: '' }),
                        value: keywords.length > 1 ? keywords : (keywords[0] || ''),
                      },
                    })
                  }}
                  className="w-2/3 h-7 rounded-md bg-dark-800 text-light-100 text-xs border border-dark-200 px-2 outline-none"
                  placeholder="Enter keywords, separated by commas"
                />
              </div>
              <p className="text-[10px] text-light-900/40 mt-1">
                You can enter one keyword or multiple keywords separated by commas.
              </p>
            </div>
          )}



        {/* 🎯 Expected Intent */}
        {/* 🎯 Expected Intent */}
        {data.entry_detection_mode === 'intent' && (
          <div>
            <label className="text-xs text-light-900/40 mb-1 block">Expected Intent</label>
            <select
              value={data.expected_intent ?? ''}
              onChange={e => updateEntryExpectedIntent(e.target.value)}
              className="h-7 w-full rounded-md bg-dark-800 text-light-100 text-xs border border-transparent px-1 outline-none transition hover:(bg-dark-300 border-teal-600)"
            >
              <option value="">-- Select an intent --</option>
              {availableIntents.map(intent => (
                <option key={intent.id} value={intent.id}>
                  {intent.name}
                </option>
              ))}
            </select>
          </div>
        )}


        {/* 📈 Intent Confidence */}
        {data.entry_detection_mode === 'intent' && (
          <div>
            <label className="text-xs text-light-900/40 mb-1 block">Intent Confidence</label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={data.intent_confidence ?? 0.85}
              onChange={e => updateEntryIntentConfidence(parseFloat(e.target.value))}
              className="w-full h-7 rounded-md bg-dark-800 text-light-100 text-xs border border-dark-200 px-2 outline-none"
              placeholder="e.g. 0.85"
            />
          </div>
        )}
      </div>

      {/* 🧩 Path-Level Configuration */}
      <div className="border border-dark-300 rounded-md p-3 space-y-3 bg-dark-800">
        <div className="text-xs font-semibold text-light-900/60 mb-2">🧩 Path Configuration</div>

        {Array.isArray(data.canvas?.paths) && data.canvas.paths.map((path, index) => {
          const mode = path.detection_mode ?? 'keyword'

          return (
            <div key={path.id} className="flex flex-col gap-2 border border-dark-300 dark:border-dark-700 rounded-md p-3 bg-dark-500 dark:bg-dark-600">
              <div className="text-xs font-semibold text-light-900/60 mb-2">⚙️ Path {index + 1} Settings</div>

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
                  <option value="on_reply">💬 ចាំការឆ្លើយតប</option>
                </select>
              </div>

              {path.trigger === 'delay' && (
                <div className="mb-2">
                  <label className="text-xs text-light-900/40 mb-1 block">Delay (seconds)</label>
                  <input
                    type="number"
                    value={rawDelay}
                    onChange={e => setRawDelay(e.target.value)}
                    onBlur={() => {
                      const seconds = parseInt(rawDelay, 10)
                      const safeSeconds = isNaN(seconds) || seconds < 3 ? 3 : seconds
                      updateData({
                        canvas: {
                          ...data.canvas,
                          paths: data.canvas.paths.map((p, i) =>
                            i === index
                              ? {
                                ...p,
                                delay: {
                                  ...p.delay,
                                  seconds: safeSeconds,
                                },
                              }
                              : p
                          ),
                        },
                      })

                      setRawDelay(String(safeSeconds))
                    }}
                    className="w-full h-7 rounded-md bg-dark-800 text-light-100 text-xs border border-dark-200 px-2 outline-none"
                    placeholder="e.g. 3"
                  />

                  <p className="text-[10px] text-light-900/40 mt-1">
                    Minimum delay is 3 seconds. This controls how long to wait before sending the next message.
                  </p>
                </div>
              )}


              {/* Send Immediately */}
              <div className="mb-2">
                <label className="text-xs text-light-900/40 mb-1 block">Send Immediately</label>
                <div className="flex items-center gap-x-2">
                  <input
                    type="checkbox"
                    checked={path.send_immediately ?? false}
                    onChange={e =>
                      updateData({
                        canvas: {
                          ...data.canvas,
                          paths: data.canvas.paths.map((p, i) =>
                            i === index ? { ...p, send_immediately: e.target.checked } : p
                          )
                        }
                      })
                    }
                  />
                  <span className="text-xs text-light-100">Send this message without waiting for user input</span>
                </div>
              </div>

              {/* Detection Mode */}
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


              {/* Expected Intent */}
              {mode === 'intent' && (
                <div className="mb-2">
                  <label className="text-xs text-light-900/40 mb-1 block">Expected Intent</label>
                  <select
                    value={path.expected_intent ?? ''}
                    onChange={e => updatePathExpectedIntent(index, e.target.value)}
                    className="w-full h-7 rounded-md bg-dark-800 text-light-100 text-xs border border-dark-200 px-2 outline-none"
                  >
                    <option value="">-- Select an intent --</option>
                    {availableIntents.map(intent => (
                      <option key={intent.id} value={intent.id}>
                        {intent.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Intent Confidence */}

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
                  <p className="text-[10px] text-light-900/40 mt-1">
                    Minimum confidence required to match this intent. Lower values allow looser matches.
                  </p>
                </div>
              )}

              {/* Keyword Condition Editor */}
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

              {/* 🔗 Payload Section */}
              {path && (() => {
                const payload = path.payload

                if (isMessengerSafePayload(payload)) {
                  return (
                    <div className="mb-2">
                      <label className="text-xs text-light-900/40 mb-1 block">Payload (optional)</label>
                      <input
                        type="text"
                        value={payload.node_id}
                        onChange={e => updatePathPayload(index, e.target.value)}
                        className="w-full h-7 rounded-md bg-dark-800 text-light-100 text-xs border border-dark-200 px-2 outline-none"
                        placeholder="e.g. info_skin_care"
                      />
                      <p className="text-[10px] text-light-900/40 mt-1">
                        This payload will be auto-linked to the target block when connected.
                      </p>
                      <div className="text-[10px] mt-1 font-mono text-green-400">✅ Messenger-safe</div>
                    </div>
                  )
                }

                if (payload && typeof payload === 'object') {
                  return (
                    <div className="text-[10px] mt-1 font-mono text-yellow-400">
                      ⚠️ Payload exists but is malformed
                    </div>
                  )
                }

                return (
                  <div className="text-[10px] mt-1 font-mono text-red-400">
                    ⛔ No payload linked
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>


    </div>
  )
}
