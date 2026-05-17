import { useState, useEffect } from "react"
import { ref, get, set } from "firebase/database"
import { db } from "~/lib/firebase"
import { useApplicationState } from "~/stores/application-state"
import { PageSelector } from "~/modules/shared/components/PageSelector"
import { toast } from "sonner"   // ✅ toast for success feedback

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

interface AgentConfig {
  autoQueueAll: boolean
  queueOnKeywords: string[]
  defaultPriority: "normal" | "high" | "urgent"
}

export function AgentSettings({ currentPageId }: { currentPageId: string }) {
  const { actions } = useApplicationState(s => s)

  const [templates, setTemplates] = useState<Templates>({
    takeover: { en: "An agent has joined the conversation to assist you. Please continue here.", kh: "ភ្នាក់ងារបានចូលរួមក្នុងការសន្ទនាដើម្បីជួយអ្នក។ សូមបន្តនៅទីនេះ។" },
    return: { en: "The agent has returned control to the bot. You can continue chatting with the assistant.", kh: "ភ្នាក់ងារបានផ្ទេរការគ្រប់គ្រងទៅឱ្យបុត។ អ្នកអាចបន្តជជែកជាមួយជំនួយការបាន។" },
    close: { en: "This conversation has been closed. Thank you for reaching out.", kh: "ការសន្ទនានេះត្រូវបានបិទ។ សូមអរគុណសម្រាប់ការទាក់ទង។" }
  })

  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    autoQueueAll: false,
    queueOnKeywords: [],
    defaultPriority: "normal"
  })

  useEffect(() => {
    if (!currentPageId) return
    const settingsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/settings`)
    get(settingsRef).then(snap => {
      if (snap.exists()) {
        const data = snap.val()
        if (data.agentWelcomeTemplate) {
          const merged: Templates = {
            takeover: { en: "", kh: "", ...(data.agentWelcomeTemplate.takeover || {}) },
            return: { en: "", kh: "", ...(data.agentWelcomeTemplate.return || {}) },
            close: { en: "", kh: "", ...(data.agentWelcomeTemplate.close || {}) }
          }
          setTemplates(merged)
          actions.agentSettings.setTemplates(merged)
        }
        if (data.agentConfig) {
          setAgentConfig({
            autoQueueAll: !!data.agentConfig.autoQueueAll,
            queueOnKeywords: data.agentConfig.queueOnKeywords || [],
            defaultPriority: data.agentConfig.defaultPriority || "normal"
          })
        }
      }
    })
  }, [currentPageId, actions.agentSettings])

  const saveSettings = async () => {
    if (!currentPageId) return
    const settingsRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/settings`)
    await set(settingsRef, {
      agentWelcomeTemplate: templates,
      agentConfig
    })
    actions.agentSettings.setTemplates(templates)
    console.log("✅ Saved settings:", { templates, agentConfig })
    toast.success("Agent settings saved successfully!")   // ✅ toast feedback
    
     try {    
      await fetch("https://asia-east2-khmer-catalog.cloudfunctions.net/khmer_aichatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refresh_config_handler: true,
          page_id: currentPageId
        })
      })

      toast.success(`Refresh config handler successfully`, { id: currentPageId })
    } catch (err) {
      console.error("Failed to trigger refresh:", err)
      toast.error("Failed to saved settings ❌", { id: currentPageId })
    }
  

  }

  function updateTemplate(type: TemplateType, lang: LangType, value: string) {
    setTemplates(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [lang]: value
      }
    }))
  }

  if (!currentPageId) return null

  return (
    <div className="flex flex-col h-full p-4 bg-dark-900 rounded-lg">
      {/* Scrollable content */}
      <div className="flex-grow overflow-y-auto space-y-6 scrollbar-dark-teal">

        {/* Page selector */}
        <div className="p-2 border-b border-dark-600 bg-dark-800 rounded-md">
          <PageSelector />
        </div>

        {/* Template sections */}
        {(["takeover", "return", "close"] as const).map(type => (
          <div
            key={type}
            className="bg-dark-800 rounded-md p-4 border border-teal-700 space-y-3 shadow-md"
          >
            <h3 className="text-teal-400 font-semibold capitalize">
              {type} Message
            </h3>

            <div className="space-y-2">
              <label className="block text-sm text-light-300">English</label>
              <textarea
                value={templates[type].en}
                onChange={(e) => updateTemplate(type, "en", e.target.value)}
                className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm 
                           border border-dark-600 focus:outline-none 
                           focus:ring-2 focus:ring-teal-700 focus:border-teal-700 
                           focus:bg-dark-600 transition-colors duration-200 ease-in-out overflow-y-auto scrollbar-dark-teal"
                rows={2}
              />

              <label className="block text-sm text-light-300">Khmer</label>
              <textarea
                value={templates[type].kh}
                onChange={(e) => updateTemplate(type, "kh", e.target.value)}
                className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm 
                           border border-dark-600 focus:outline-none 
                           focus:ring-2 focus:ring-teal-700 focus:border-teal-700 
                           focus:bg-dark-600 transition-colors duration-200 ease-in-out overflow-y-auto scrollbar-dark-teal"
                rows={2}
              />
            </div>
          </div>
        ))}

        {/* Agent Queue Settings */}
        <div className="bg-dark-800 rounded-md p-4 border border-teal-700 space-y-3 shadow-md">
          <h3 className="text-teal-400 font-semibold">Agent Queue Settings</h3>

          <label className="flex items-center space-x-2 text-light-300">
            <input
              type="checkbox"
              checked={agentConfig.autoQueueAll}
              onChange={e =>
                setAgentConfig(prev => ({ ...prev, autoQueueAll: e.target.checked }))
              }
            />
            <span>Auto‑queue all bot conversations</span>
          </label>

          <div>
            <label className="block text-sm text-light-300">Keywords (comma separated)</label>
            <textarea
              value={agentConfig.queueOnKeywords.join(",")}
              onChange={e =>
                setAgentConfig(prev => ({
                  ...prev,
                  queueOnKeywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean)
                }))
              }
              className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm 
                           border border-dark-600 focus:outline-none 
                           focus:ring-2 focus:ring-teal-700 focus:border-teal-700 
                           focus:bg-dark-600 transition-colors duration-200 ease-in-out overflow-y-auto scrollbar-dark-teal"
              rows={2}
            />


          </div>

          <div>
            <label className="block text-sm text-light-300">Default Priority</label>
            <select
              value={agentConfig.defaultPriority}
              onChange={e =>
                setAgentConfig(prev => ({
                  ...prev,
                  defaultPriority: e.target.value as AgentConfig["defaultPriority"]
                }))
              }
              className="w-full p-2 rounded bg-dark-700 text-light-100 text-sm border border-dark-600"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save button pinned at bottom */}
      <div className="flex justify-end mt-4">
        <button
          onClick={saveSettings}
          className="px-4 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-600 transition-colors duration-200"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}
