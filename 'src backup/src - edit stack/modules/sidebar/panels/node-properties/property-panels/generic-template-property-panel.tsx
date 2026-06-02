
import { useState } from 'react'
import type { NodePropertyPanelProps } from '~/modules/sidebar/panels/node-properties/constants/property-panels'

import type {GenericTemplateNodeData } from '~/modules/nodes/types'
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

export default function GenericTemplatePropertyPanel({
  id,
  // type,
  data,
  updateData,
  nodes,
}: NodePropertyPanelProps & { data: GenericTemplateNodeData }) {

const card: GenericTemplateNodeData['cards'][number] = data.cards?.[0] ?? {
  title: '',
  title_km: '',
  subtitle: '',
  subtitle_km: '',
  image_url: '',
  options: [],
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


  const [language, setLanguage] = useState<'en' | 'km'>('km')

  const setLanguageAndSave = (lang: 'en' | 'km') => {
    setLanguage(lang)
    localStorage.setItem('builder-language', lang)
  }

//   useEffect(() => {
//   if (!data.cards || data.cards.length === 0) {
//     updateData({
//       cards: [{
//         title: '',
//         title_km: '',
//         subtitle: '',
//         subtitle_km: '',
//         image_url: '',
//         options: [],
//       }],
//     })
//   }
// }, [data.cards, updateData])

  return (
    <div className="flex flex-col gap-4.5 p-4 bg-dark-400 dark:bg-dark-900 text-light-100 dark:text-light-100">
      {/* Language Toggle */}
      <div className="flex gap-x-2">
        <button
          type="button"
          onClick={() => setLanguageAndSave('km')}
          className={`px-2 py-1 text-xs rounded border ${
            language === 'km'
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-dark-400 dark:bg-dark-700 text-light-100 dark:text-light-100 border-dark-100 dark:border-dark-600'
          }`}
        >
          ភាសាខ្មែរ
        </button>

        <button
          type="button"
          onClick={() => setLanguageAndSave('en')}
          className={`px-2 py-1 text-xs rounded border ${
            language === 'en'
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
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">ចំណងជើង</div>
        <input
          maxLength={80}
          value={language === 'en' ? card.title : card.title_km ?? ''}
          onChange={e =>
            updateCardField(language === 'en' ? 'title' : 'title_km', e.target.value)
          }
          placeholder={language === 'en' ? 'Card Title (English)' : 'ចំណងជើងកាត (Khmer)'}
          className="h-8 w-full border border-dark-200 dark:border-dark-600 rounded-md bg-dark-400 dark:bg-dark-800 px-2.5 text-sm font-medium shadow-sm outline-none transition hover:bg-dark-300/60 dark:hover:bg-dark-700 focus:(border-teal-800 bg-dark-500 dark:bg-dark-700 ring-2 ring-teal-800/50)"
        />
        <div className="text-xs mt-1 text-light-900/40 dark:text-light-100/40">
          {(language === 'km' ? (card.title_km ?? '') : (card.title ?? '')).length}/80
        </div>
        {(language === 'km'
          ? (card.title_km ?? '').length
          : (card.title ?? '').length) > 80 && (
          <div className="text-xs text-red-500 dark:text-red-400 mt-1">
            ⚠️ លើសពី 80 តួអក្សរ — សូមកាត់ឲ្យខ្លី!
          </div>
        )}
      </div>

      {/* Subtitle */}
      <div className="flex flex-col">
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
          className="min-h-24 w-full resize-none border border-dark-200 dark:border-dark-600 rounded-md bg-dark-400 dark:bg-dark-800 px-2.5 py-2 text-sm font-medium shadow-sm outline-none transition hover:bg-dark-300/60 dark:hover:bg-dark-700 focus:(border-teal-800 bg-dark-500 dark:bg-dark-700 ring-2 ring-teal-800/50)"
        />
        <div className="text-xs mt-1 text-light-900/40 dark:text-light-100/40">
          {(language === 'km' ? (card.subtitle_km ?? '') : (card.subtitle ?? '')).length}/80
        </div>
        {(language === 'km'
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
          {card.options.map((opt, index) => (
            <div key={opt.id} className="flex flex-col gap-2 border border-dark-200 dark:border-dark-600 rounded-md p-3 bg-dark-400 dark:bg-dark-800">
              {/* Label + Type */}
              <div className="flex gap-x-2">
                <input
                  value={language === 'km' ? opt.label_kh ?? '' : opt.label_en}
                  onChange={e =>
                    updateOption(index, {
                      ...(language === 'km'
                        ? { label_kh: e.target.value }
                        : { label_en: e.target.value }),
                    })
                  }
                  placeholder={language === 'km' ? 'ប៊ូតុង (Khmer)' : 'Button (English)'}
                  className="w-2/3 h-8 border border-dark-200 dark:border-dark-600 rounded-md bg-dark-500 dark:bg-dark-700 px-2.5 text-sm font-medium shadow-sm outline-none hover:bg-dark-300/60 dark:hover:bg-dark-600"
                />

                <select
                  value={opt.type}
                  onChange={e =>
                    updateOption(index, {
                      type: e.target.value as 'postback' | 'web_url' | 'phone_number',
                    })
                  }
                  className="w-2/3 h-8 border border-dark-200 dark:border-dark-600 rounded-md bg-dark-500 dark:bg-dark-700 px-2.5 text-sm font-medium shadow-sm outline-none hover:bg-dark-300/60 dark:hover:bg-dark-600"
                >
                  <option value="postback">Postback</option>
                  <option value="web_url">Web URL</option>
                  <option value="phone_number">Phone Number</option>
                </select>
              </div>
              

              {opt.payload && (
                <div className="text-xs mt-1">
                  {(() => {
                    const trimmed = opt.payload.trim().toLowerCase()

                    if (trimmed.startsWith('payload_')) {
                      return <span className="text-teal-500">✅ Auto-linked (legacy)</span>
                    }

                    const matched = nodes.some(n => {
                      const nodeId = n.id?.trim().toLowerCase()
                      const nodeName = typeof n.data?.name === 'string' ? n.data.name.trim().toLowerCase() : ''
                      return trimmed === nodeId || trimmed === nodeName
                    })

                    if (matched) return <span className="text-teal-500">✅ Auto-linked</span>
                    if (isMessengerSafePayload(opt.payload)) return <span className="text-yellow-400">✍️ Manual payload</span>
                    return <span className="text-red-500">⚠️ Invalid payload</span>
                  })()}
                </div>
              )}



              {/* Payload input (only for postback) */}
              {opt.type === 'postback' && (
                <input
                  value={opt.payload ?? ''}
                  onChange={e => updateOption(index, { payload: e.target.value })}
                  placeholder="Payload value (e.g. info_skin_care)"
                  className="h-8 w-full border border-dark-200 dark:border-dark-600 rounded-md bg-dark-500 dark:bg-dark-700 px-2.5 text-sm font-medium shadow-sm outline-none hover:bg-dark-300/60 dark:hover:bg-dark-600"
                
                />
              )}
            </div>
          ))}
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
    </div>
  )
}
