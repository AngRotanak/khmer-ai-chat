import { useState, useEffect } from 'react'
import { PanelGroup } from './components/layout/PanelGroup'
import { FeatureToggle } from './components/FeatureToggle'
import { CommandEditor } from './components/CommandEditor'
import { CommentTriggerEditor } from './components/CommentTriggerEditor'
import { FallbackEditor } from './components/FallbackEditor'
import { SystemSettingEditor } from './components/SystemSettingEditor'
import { ActivatePageEditor } from './components/ActivatePageEditor'
import SidebarPanelWrapper from '~/modules/sidebar/components/sidebar-panel-wrapper'
import { useApplicationState } from '~/stores/application-state'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { defaultOverlayScrollbarsOptions } from '~/utils/overlayscrollbars.ts'
import { useAuthStore } from '~/stores/auth-store'
import { useFlowSession } from '~/stores/flow-session'
import { toast } from 'sonner'

// Firebase imports
import { db } from '~/lib/firebase'
import { ref, get, onValue, set } from 'firebase/database'

export function CommandCenterPanel() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selectedPageId, setSelectedPageId] = useState<string>('')
  const [pages, setPages] = useState<{ id: string; name: string }[]>([])
  const [smartWelcomeBlocks, setSmartWelcomeBlocks] = useState<Record<string, any>>({})
  const [activeWelcomeBlockId, setActiveWelcomeBlockId] = useState<string>('')
  const [activeLang, setActiveLang] = useState<'en' | 'kh'>('en')

  const [quickMenuBlocks, setQuickMenuBlocks] = useState<Record<string, any>>({})
  const [activeQuickMenuBlockId, setActiveQuickMenuBlockId] = useState<string>('')


  const [defaultLang, setDefaultLang] = useState<'en' | 'kh'>('en')

  const handleSetDefaultLang = async (lang: 'en' | 'kh') => {
    setDefaultLang(lang)
    const langRef = ref(db, `khmer-ai-chat/pages/${selectedPageId}/settings/default_language`)
    await set(langRef, lang)
    toast.success(`Default language for page ${selectedPageId} set to ${lang.toUpperCase()}`)
  }


  const { setActivePanel } = useApplicationState(s => ({
    isMobileView: s.view.mobile,
    setActivePanel: s.actions.sidebar.setActivePanel,
  }))

  const user = useAuthStore(s => s.user)
  const { currentPageId, setCurrentPageId } = useFlowSession()

  const toggle = (key: string) => {
    setExpanded(expanded === key ? null : key)
  }

  // Load available pages from Firebase
  useEffect(() => {
    const pagesRef = ref(db, `khmer-ai-chat/pages`)
    return onValue(pagesRef, snapshot => {
      const data = snapshot.val()
      if (data) {
        const loaded = Object.entries(data).map(([id, value]) => ({
          id,
          name: (value as any).name,
        }))
        setPages(loaded)
      }
    })
  }, [])

  const [flow, setFlow] = useState<any>({})


  const handleSelectPage = async (pageId: string) => {
  if (!pageId) {
    setSelectedPageId('')
    setSmartWelcomeBlocks({})
    setQuickMenuBlocks({})
    setActiveWelcomeBlockId('')
    setActiveQuickMenuBlockId('')
    setFlow({})
    return
  }

  setSelectedPageId(pageId)
  setCurrentPageId(pageId)

  try {
    const flowRef = ref(db, `khmer-ai-chat/pages/${pageId}/flow`)
    const snapshot = await get(flowRef)
    const data = snapshot.val()

    if (!data || typeof data !== 'object') {
      setSmartWelcomeBlocks({})
      setQuickMenuBlocks({})
      setActiveWelcomeBlockId('')
      setActiveQuickMenuBlockId('')
      setFlow({})
      return
    }

    setFlow(data)

    // Smart-welcome blocks
    const smartBlocks = data.feature_blocks_by_type?.['smart-welcome'] || {}
    setSmartWelcomeBlocks(smartBlocks)

    // Quick-menu blocks
    const quickBlocks = data.feature_blocks_by_type?.['quick-menu'] || {}
    setQuickMenuBlocks(quickBlocks)

    // Active welcome flow ID
    const welcomeRef = ref(db, `khmer-ai-chat/pages/${pageId}/config/welcomeFlow`)
    const welcomeSnap = await get(welcomeRef)
    const welcomeData = welcomeSnap.val()
    setActiveWelcomeBlockId(welcomeData?.activeBlockId || '')

    // Active quick menu flow ID
    const quickMenuRef = ref(db, `khmer-ai-chat/pages/${pageId}/config/quickMenuFlow`)
    const quickMenuSnap = await get(quickMenuRef)
    const quickMenuData = quickMenuSnap.val()
    setActiveQuickMenuBlockId(quickMenuData?.activeBlockId || '')

    console.log(`✅ Loaded flow for page: ${pageId}`, data)
  } catch (err) {
    console.error('❌ Failed to load flow:', err)
    setSmartWelcomeBlocks({})
    setQuickMenuBlocks({})
    setActiveWelcomeBlockId('')
    setActiveQuickMenuBlockId('')
    setFlow({})
  }
}


  const handleActivateWelcome = async (blockId: string) => {
    setActiveWelcomeBlockId(blockId)
    if (!selectedPageId) return
    try {
      const welcomeRef = ref(db, `khmer-ai-chat/pages/${selectedPageId}/config/welcomeFlow`)
      await set(welcomeRef, { activeBlockId: blockId })
      console.log(`✅ Activated welcome flow ${blockId} for page ${selectedPageId}`)
    } catch (err) {
      console.error('❌ Failed to activate welcome flow:', err)
    }
  }

  const handleActivateQuickMenu = async (blockId: string) => {
  setActiveQuickMenuBlockId(blockId)
  if (!selectedPageId) return
  try {
    const quickMenuRef = ref(db, `khmer-ai-chat/pages/${selectedPageId}/config/quickMenuFlow`)
    await set(quickMenuRef, { activeBlockId: blockId })
    console.log(`✅ Activated quick menu flow ${blockId} for page ${selectedPageId}`)
  } catch (err) {
    console.error('❌ Failed to activate quick menu flow:', err)
  }
}


  return (
    <SidebarPanelWrapper>
      {/* Close Button */}
      <div className="flex justify-end px-3 pt-3">
        <button
          onClick={() => setActivePanel('none')}
          className="text-xs text-light-100/50 hover:text-light-100 dark:text-light-100/40 dark:hover:text-white transition"
          title="Close"
        >
          <div className="i-mynaui:x size-4" />
        </button>
      </div>

      {/* Header */}
      <div className="mt-4 flex flex-col items-center px-4 text-center">
        <div className="size-12 flex items-center justify-center rounded-full bg-teal-800 dark:bg-teal-600">
          <div className="i-lucide:settings size-6 text-white dark:text-light-100" />
        </div>

        <div className="mt-4 font-medium text-light-100 dark:text-light-100">
          Command Center
        </div>

        <div className="mt-1 w-2/3 text-xs font-medium leading-normal text-light-50/40 dark:text-light-100/40">
          Manage bot features, message commands, comment triggers, fallbacks, and page activation.
        </div>
      </div>



      {/* Scrollable Panel List */}
      <OverlayScrollbarsComponent
        className="flex-1 min-h-0 bg-dark-400 dark:bg-dark-900 px-4 py-6 space-y-6"
        defer
        options={defaultOverlayScrollbarsOptions}
      >

        {/* Global Page Selector */}
        <div className="mb-3">
          <label className="text-xs text-light-900/60 font-medium mb-1">Select Page</label>
          <select
            value={selectedPageId}
            onChange={e => handleSelectPage(e.target.value)}
            className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
          >
            <option value="">-- Select a Page --</option>
            {pages.map(page => (
              <option key={page.id} value={page.id}>
                {page.name}
              </option>
            ))}
          </select>
        </div>

        <PanelGroup
          title="🔘 Feature Toggles"
          expanded={expanded === 'features'}
          onToggle={() => toggle('features')}
        >

          {/* Feature Toggles bound to selected page */}
          {selectedPageId && (
            <>

              <FeatureToggle
                label="Promo Mode"
                path={`pages/${selectedPageId}/config/features/promo`}
                tooltip="Enable promotional replies and broadcast-style messaging for campaigns"
              />
              <FeatureToggle
                label="Intro Message"
                path={`pages/${selectedPageId}/config/features/intro`}
                tooltip="Show a welcome message when users first open the chat or flow"
              />
              <FeatureToggle
                label="Message Reply"
                path={`pages/${selectedPageId}/config/features/auto_reply`}
                tooltip="Automatically reply to inbox messages"
              />
              <FeatureToggle
                label="Comment Reply"
                path={`pages/${selectedPageId}/config/features/auto_reply_comments`}
                tooltip="Automatically reply to Facebook post comments"
              />

              {/* 🧭 Always-On Quick Menu */}
              <FeatureToggle
                label="Quick Menu"
                path={`pages/${selectedPageId}/config/features/quick_menu`}
                tooltip="Always show quick reply buttons (🏠 Home, 🛍️ Product, 🎁 Promo) so users can explore your bot anytime"
              />


              {/* Active Welcome Flow selector */}
              <div className="mt-4">
                <label className="text-xs text-light-900/60 font-medium mb-1">Active Welcome Flow</label>
                <select
                  value={activeWelcomeBlockId}
                  onChange={e => {
                    console.log('Dropdown changed to:', e.target.value)
                    handleActivateWelcome(e.target.value)
                  }}
                  className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
                >
                  <option value="">-- Select Welcome Flow --</option>
                  {Object.entries(smartWelcomeBlocks).map(([id, block]) => (
                    <option key={id} value={id}>
                      {block.config?.campaignTag ?? 'default'} — {block.block_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Quick Menu Flow selector */}
              <div className="mt-4">
                <label className="text-xs text-light-900/60 font-medium mb-1">
                  Active Quick Menu Flow
                </label>
                <select
                  value={activeQuickMenuBlockId}
                  onChange={e => {
                    console.log('Dropdown changed to:', e.target.value)
                    handleActivateQuickMenu(e.target.value)
                  }}
                  className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
                >
                  <option value="">-- Select Quick Menu Flow --</option>
                  {Object.entries(quickMenuBlocks).map(([id, block]) => (
                    <option key={id} value={id}>
                      {block.config?.menu_tag ?? 'default'} — {block.block_name}
                    </option>
                  ))}
                </select>
              </div>

            </>
          )}
        </PanelGroup>

        <PanelGroup
          title="💬 Message Commands"
          expanded={expanded === 'commands'}
          onToggle={() => toggle('commands')}
        >
          <div className="flex gap-1 mb-2 justify-end">
            <button
              onClick={() => setActiveLang('en')}
              className={`px-2 py-0.5 text-xs rounded-md ${activeLang === 'en'
                ? 'bg-teal-500 text-white'
                : 'bg-dark-700 text-light-100'
                }`}
            >
              EN
            </button>
            <button
              onClick={() => setActiveLang('kh')}
              className={`px-2 py-0.5 text-xs rounded-md ${activeLang === 'kh'
                ? 'bg-teal-500 text-white'
                : 'bg-dark-700 text-light-100'
                }`}
            >
              KH
            </button>
          </div>

          {Object.entries(flow.feature_blocks_by_type || {})
            .flatMap(([type, blocks]) =>
              Object.entries(blocks || {})
                .filter(([id, block]) => block && block.entry_trigger === 'message' && block.messenger_delivery_type === 'text-message')
                .map(([id, block]) => (
                  <CommandEditor
                    key={`${id}-${activeLang}`}
                    pageId={selectedPageId}
                    blockId={id}
                    block={block}
                    lang={activeLang}
                  />
                ))
            )}
        </PanelGroup>




        <PanelGroup
          title="💡 Comment Triggers"
          expanded={expanded === 'comments'}
          onToggle={() => toggle('comments')}
        >
          <div className="flex gap-1 mb-2 justify-end">
            <button
              onClick={() => setActiveLang('en')}
              className={`px-2 py-0.5 text-xs rounded-md ${activeLang === 'en'
                ? 'bg-teal-500 text-white'
                : 'bg-dark-700 text-light-100'
                }`}
            >
              EN
            </button>
            <button
              onClick={() => setActiveLang('kh')}
              className={`px-2 py-0.5 text-xs rounded-md ${activeLang === 'kh'
                ? 'bg-teal-500 text-white'
                : 'bg-dark-700 text-light-100'
                }`}
            >
              KH
            </button>
          </div>

          {Object.entries(flow.feature_blocks_by_type || {})
            .flatMap(([type, blocks]) =>
              Object.entries(blocks || {})
                .filter(([id, block]) => block && block.entry_trigger === 'comment')
                .map(([id, block]) => (
                  <CommentTriggerEditor
                    key={`${id}-${activeLang}`}
                    pageId={selectedPageId}
                    blockId={id}
                    block={block}
                    lang={activeLang}   // ✅ only one editor shown
                  />
                ))
            )}
        </PanelGroup>

        <PanelGroup
          title="🛠️ System Settings"
          expanded={expanded === 'system'}
          onToggle={() => toggle('system')}
        >
          {/* Default Language Dropdown */}
          <div className="mb-3">
            <label className="text-xs text-light-900/60 font-medium mb-1">
              Default Language
            </label>
            <select
              value={defaultLang}
              onChange={e => handleSetDefaultLang(e.target.value as 'en' | 'kh')}
              className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500"
            >
              <option value="en">English (EN)</option>
              <option value="kh">Khmer (KH)</option>
            </select>
          </div>

          {/* Keep other system settings as needed */}
          <SystemSettingEditor
            label="Timezone"
            path="settings/timezone"
          />
          <SystemSettingEditor
            label="Admin Notifications"
            path={`pages/${selectedPageId}/settings/admin_notifications`}
          />
          <ActivatePageEditor />
        </PanelGroup>

      </OverlayScrollbarsComponent>
    </SidebarPanelWrapper>
  )
}



