import { useState } from 'react'
import Picker from '@emoji-mart/react'
import emojiData from '@emoji-mart/data'
import type { ButtonTemplateNodeData } from '~/modules/nodes/types'
import type { NodePropertyPanelProps } from '~/modules/sidebar/panels/node-properties/constants/property-panels'
import { ConditionDropdownSelector } from '~/modules/nodes/nodes/conditional-path-node/components/condition-dropdown-selector'
import { useApplicationState } from '~/stores/application-state'

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

export default function ButtonTemplatePropertyPanel({
    id,
    data,
    updateData,
}: NodePropertyPanelProps & { data: ButtonTemplateNodeData }) {
    const flowList = useApplicationState(s => s.flowList)
    const [language, setLanguage] = useState<'en' | 'kh'>('kh')
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

      const option: ButtonTemplateNodeData['options'][number] = data.options?.[0] ?? {
        title: '',
        title_km: '',
        subtitle: '',
        subtitle_km: '',
        image_url: '',
        options: [],
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

            {/* Intro Text */}
            <div className="flex flex-col relative">
                <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">
                    {language === 'kh' ? 'សារណែនាំ' : 'Intro Message'}
                </div>

                <textarea
                    value={currentIntroText}
                    onChange={e => updateIntroText(e.target.value)}
                    placeholder={language === 'kh' ? 'សរសេរប្រសាសន៍បង្ហាញប៊ូតុងនៅទីនេះ...' : 'Type your intro message here...'}
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

            {/* Options */}


            {/* Options */}


{options.length > 0 && (
  <div className="flex flex-col gap-4">
    <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">Buttons</div>

    {options.map((opt, index) => {
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

                                        <input
                                            value={opt.payload ?? ''}
                                            onChange={e => updateOption(index, { payload: e.target.value })}
                                            placeholder="ឬវាយដោយដៃ (ឧ. skin_care_intro)"
                                            className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm mt-1 outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
                                        />

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



            {/* ⚙️ Condition Selector */}
            <div className="flex flex-col gap-y-1 pt-4">
                <label className="text-sm font-medium text-light-900">Trigger Condition</label>
                <ConditionDropdownSelector
                    value={data.condition ?? null}
                    onChange={value => updateData({ condition: value })}
                />
            </div>
        </div>
    )
}

