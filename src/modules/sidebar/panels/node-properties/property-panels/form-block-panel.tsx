import { nanoid } from 'nanoid'
import { useState } from 'react'
import { cn } from '~@/utils/cn'
import Picker from '@emoji-mart/react'
import emojiData from '@emoji-mart/data'
import type { FeatureBlock, FormBlockConfig } from '~/modules/blocks/types/feature-block'
import { useApplicationState } from '~/stores/application-state'

interface FormBlockPanelProps {
  data: FeatureBlock
  updateData: (patch: Partial<FeatureBlock>) => void
}


export function FormBlockPanel({ data, updateData }: FormBlockPanelProps) {
  const config = (data.config ?? {
    fields: [],
    confirmation_message_en: '',
    confirmation_message_kh: '',
    flow_payload: ''
  }) as FormBlockConfig

  const [language, setLanguage] = useState<'km' | 'en'>('km')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const flowList = useApplicationState(s => s.flowList)


  // ✅ Safe initialization
const [formConfig, setFormConfig] = useState<FormBlockConfig>(
  (data.config as FormBlockConfig) ?? {
    fields: [],
    confirmation_message_en: "",
    confirmation_message_kh: "",
    flow_payload: "",
    finish_message_en: "",      // ✅ new
    finish_message_kh: ""       // ✅ new
  }
);


  // ✅ Update helper
function updateFormConfig(partial: Partial<FormBlockConfig>) {
  const newConfig: FormBlockConfig = { ...formConfig, ...partial }
  setFormConfig(newConfig)
  updateData({ config: newConfig }) // ✅ use updateData instead of onChange
}


  // ✅ Confirmation message update
  const currentMessage =
    language === 'km' ? formConfig.confirmation_message_kh : formConfig.confirmation_message_en

  const updateMessage = (msg: string) => {
    if (language === 'km') {
      updateFormConfig({ confirmation_message_kh: msg })
    } else {
      updateFormConfig({ confirmation_message_en: msg })
    }
  }

  // ✅ Field management
  const addField = () => {
    const newField = {
      id: nanoid(),
      label_en: '',
      label_kh: '',
      validation: 'text' as const,
      required: false
    }
    updateFormConfig({ fields: [...formConfig.fields, newField] })
  }

  const updateField = (index: number, patch: Partial<FormBlockConfig['fields'][number]>) => {
    const fields = [...formConfig.fields]
    fields[index] = { ...fields[index], ...patch }
    updateFormConfig({ fields })
  }

  const removeField = (id: string) => {
    const fields = formConfig.fields.filter(f => f.id !== id)
    updateFormConfig({ fields })
  }


  return (
    <div className="flex flex-col gap-y-4 p-3 border border-dark-300 rounded-md bg-dark-800">
      {/* 🔖 Block Name Input */}
      <div className="flex flex-col gap-y-1">
        <label className="text-xs text-light-900/60 font-medium mb-1">Block Name</label>
        <input
          type="text"
          value={data.block_name || ''}
          onChange={e => updateData({ block_name: e.target.value })}
          placeholder="e.g. order"
          className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
          maxLength={40}
        />
        <p className="text-[10px] text-light-900/40">
          This name will appear on the canvas and help identify the block.
        </p>
      </div>

      {/* 🌐 Language Toggle */}
      <div className="flex gap-x-2">
        <button
          type="button"
          onClick={() => setLanguage('km')}
          className={cn(
            'px-2 py-1 text-xs rounded border outline-none focus:ring-2 focus:ring-teal-500',
            language === 'km'
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-dark-600 text-light-100 border-dark-300'
          )}
        >
          ភាសាខ្មែរ
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={cn(
            'px-2 py-1 text-xs rounded border outline-none focus:ring-2 focus:ring-teal-500',
            language === 'en'
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-dark-600 text-light-100 border-dark-300'
          )}
        >
          English
        </button>
      </div>

      {/* 📝 Confirmation Message Textarea */}
      <div className="flex flex-col relative">
        <div className="text-xs font-semibold text-light-900/60">
          {language === 'km' ? 'សារបញ្ជាក់' : 'Confirmation Message'}
        </div>

        <textarea
          value={currentMessage}
          onChange={e => updateMessage(e.target.value)}
          placeholder={language === 'km' ? 'សរសេរសារបញ្ជាក់នៅទីនេះ...' : 'Type confirmation message here...'}
          className="mt-2 w-full h-15 rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 outline-none focus:ring-1 focus:ring-teal-500 overflow-y-auto scrollbar-dark-teal"
        />

        {/* <div className="mt-2 flex items-center gap-x-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            className="text-xs px-2 py-1 rounded bg-dark-600 hover:bg-dark-500 text-light-100 outline-none focus:ring-2 focus:ring-teal-500"
          >
            😊 Add Emoji
          </button>
        </div> */}

        {showEmojiPicker && (
          <div className="absolute left-0 right-0 bottom-0 z-50 max-h-[320px] max-w-full overflow-y-auto bg-dark-900 rounded shadow-lg p-2 scrollbar-dark-teal">
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
        )}

        <div className="text-xs mt-1 text-light-900/40">
          {currentMessage.length}/320
        </div>
        {currentMessage.length > 320 && (
          <div className="text-xs text-red-500 mt-1">
            ⚠️ {language === 'km' ? 'សារលើសពី 320 តួអក្សរ' : 'Message exceeds 320 characters'}
          </div>
        )}
      </div>

      {/* 📝 Finish Message Textarea */}
<div className="flex flex-col relative mt-4">
  <div className="text-xs font-semibold text-light-900/60">
    {language === 'km' ? 'សារបញ្ចប់' : 'Ending Message'}
  </div>

  <textarea
    value={language === 'km' ? formConfig.finish_message_kh : formConfig.finish_message_en}
    onChange={e =>
      updateFormConfig(
        language === 'km'
          ? { finish_message_kh: e.target.value }
          : { finish_message_en: e.target.value }
      )
    }
    placeholder={
      language === 'km'
        ? 'សរសេរសារបញ្ចប់នៅទីនេះ...'
        : 'Type ending message here...'
    }
    className="mt-2 w-full h-15 rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 outline-none focus:ring-1 focus:ring-teal-500 overflow-y-auto scrollbar-dark-teal"
  />
</div>


      {/* Submit Payload selector */}
      <div className="flex flex-col gap-1 mt-3">
        <label className="text-xs text-light-900/60 dark:text-light-100/60">
          Submit Payload
        </label>
        <p className="text-[10px] text-light-900/40 dark:text-light-100/40 mb-1">
          Choose the flow or action triggered when the user confirms the form.
        </p>

        <select
          value={formConfig.flow_payload}
          onChange={e => updateFormConfig({ flow_payload: e.target.value })}
          className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
        >
          <option value="">Select flow…</option>
          <option value="FLOW::exit_intent">🚪 Exit Conversation</option>
          <option value="FLOW::end_conversation">🛑 End Conversation</option>
          <option value="FLOW::fallback">❓ Fallback</option>
          {flowList.map(flow => (
            <option key={flow.id} value={`${flow.type}.${flow.id}`}>
              🧩 {flow.type} – {flow.name || flow.id}
            </option>
          ))}
        </select>

        <input
          value={formConfig.flow_payload ?? ""}
          onChange={e => updateFormConfig({ flow_payload: e.target.value })}
          placeholder="Or type manually (e.g. order_submit)"
          className="h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm mt-1 outline-none transition hover:bg-dark-400 dark:hover:bg-dark-700 focus:(border-teal-500 ring-2 ring-teal-500/50)"
        />
      </div>



      {/* 📋 Fields */}
      <div className="flex flex-col gap-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-light-900">Fields</span>
          <button
            type="button"
            onClick={addField}
            className="bg-teal-600 text-white rounded px-2 py-1 text-xs hover:bg-teal-500 focus:ring-2 focus:ring-teal-400"
          >
            ➕ Add Field
          </button>
        </div>

        {config.fields.map((field, i) => (
          <div
            key={field.id}
            className="flex flex-col gap-y-3 border border-dark-400 rounded-lg bg-dark-700 p-3 shadow-sm hover:border-teal-500 transition"
          >
            {/* Field Header */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-light-100">
                Field {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeField(field.id)}
                className="text-xs text-red-400 hover:text-red-300 focus:ring-1 focus:ring-red-500"
              >
                ❌ Remove
              </button>
            </div>

            {/* Labels */}
            <input
              type="text"
              placeholder="Label EN"
              value={field.label_en}
              onChange={e => updateField(i, { label_en: e.target.value })}
              className="rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:border-teal-500 outline-none focus:ring-1 focus:ring-teal-400"
            />
            <input
              type="text"
              placeholder="Label KH"
              value={field.label_kh}
              onChange={e => updateField(i, { label_kh: e.target.value })}
              className="rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:border-teal-500 outline-none focus:ring-1 focus:ring-teal-400"
            />

            {/* Validation */}
            <select
              value={field.validation}
              onChange={e =>
                updateField(i, {
                  validation: e.target.value as FormBlockConfig['fields'][number]['validation'],
                })
              }
              className="rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:border-teal-500 outline-none focus:ring-1 focus:ring-teal-400"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="email">Email</option>
              <option value="url">URL</option>
              <option value="custom">Custom</option>
            </select>

            {/* Required Toggle */}
            <label className="flex items-center gap-x-2 text-xs text-light-900">
              <input
                type="checkbox"
                checked={field.required}
                onChange={e => updateField(i, { required: e.target.checked })}
                className="accent-teal-500"
              />
              Required
            </label>
          </div>
        ))}
      </div>

    </div>
  )
}
