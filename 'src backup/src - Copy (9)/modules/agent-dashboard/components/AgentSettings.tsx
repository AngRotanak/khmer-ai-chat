import { useState, useEffect } from "react"
import { ref, get, set } from "firebase/database"
import { db } from "~/lib/firebase"
import { useApplicationState } from "~/stores/application-state"

// Define union types
type TemplateType = "takeover" | "return" | "close"
type LangType = "en" | "kh"

interface Template {
  en: string
  kh: string
}

interface Templates {
  takeover: Template
  return: Template
  close: Template
}

export function AgentSettings({ currentPageId }: { currentPageId: string }) {
  const { actions } = useApplicationState(s => s)

  const [templates, setTemplates] = useState<Templates>({
    takeover: { en: "", kh: "" },
    return: { en: "", kh: "" },
    close: { en: "", kh: "" }
  })

  // Load templates from Firebase
  useEffect(() => {
    const settingsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/settings/agentWelcomeTemplate`)
    get(settingsRef).then(snap => {
      if (snap.exists()) {
        const data = snap.val() as Partial<Templates>
        const merged: Templates = {
          takeover: { en: "", kh: "", ...(data.takeover || {}) },
          return: { en: "", kh: "", ...(data.return || {}) },
          close: { en: "", kh: "", ...(data.close || {}) }
        }
        setTemplates(merged)
        actions.agentSettings.setTemplates(merged)
      }
    })
  }, [currentPageId, actions.agentSettings])

  // Save templates to Firebase + local store
  const saveTemplates = async () => {
    const settingsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/settings/agentWelcomeTemplate`)
    await set(settingsRef, templates)
    actions.agentSettings.setTemplates(templates)
    console.log("✅ Saved agentWelcomeTemplate:", templates)
  }

  // Update a single field
  function updateTemplate(type: TemplateType, lang: LangType, value: string) {
    setTemplates(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [lang]: value
      }
    }))
  }

  return (
    <div className="p-4 bg-dark-800 rounded-lg space-y-6">
      {(["takeover", "return", "close"] as const).map(type => (
        <div key={type} className="space-y-2">
          <h3 className="text-light-200 font-bold capitalize">{type} Message</h3>

          <label className="block text-sm text-light-300">English</label>
          <textarea
            value={templates[type].en}
            onChange={(e) => updateTemplate(type, "en", e.target.value)}
            className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm 
                       border border-dark-600 focus:outline-none 
                       focus:ring-2 focus:ring-teal-800 focus:border-teal-800 
                       focus:bg-dark-600 transition-colors duration-200 ease-in-out"
            rows={2}
          />

          <label className="block text-sm text-light-300">Khmer</label>
          <textarea
            value={templates[type].kh}
            onChange={(e) => updateTemplate(type, "kh", e.target.value)}
            className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm 
                       border border-dark-600 focus:outline-none 
                       focus:ring-2 focus:ring-teal-800 focus:border-teal-800 
                       focus:bg-dark-600 transition-colors duration-200 ease-in-out"
            rows={2}
          />
        </div>
      ))}

      <button
        onClick={saveTemplates}
        className="px-3 py-1 bg-teal-700 text-white rounded hover:bg-teal-600 transition-colors duration-200"
      >
        Save Templates
      </button>
    </div>
  )
}
