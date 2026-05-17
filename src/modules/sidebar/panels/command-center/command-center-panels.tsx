import { useState, useEffect } from 'react'
import { PanelGroup } from './components/layout/PanelGroup'
import { FeatureToggle } from './components/FeatureToggle'
// import { CommandEditor } from './components/CommandEditor'
// import { CommentTriggerEditor } from './components/CommentTriggerEditor'
// import { SystemSettingEditor } from './components/SystemSettingEditor'
import { ActivatePageEditor } from './components/ActivatePageEditor'
import SidebarPanelWrapper from '~/modules/sidebar/components/sidebar-panel-wrapper'
import { useApplicationState } from '~/stores/application-state'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { defaultOverlayScrollbarsOptions } from '~/utils/overlayscrollbars.ts'
import { useFlowSession } from '~/stores/flow-session'
import { toast } from "sonner"
import { useAuthStore } from '~/stores/auth-store'
// Firebase imports
import { db } from '~/lib/firebase'
import { ref, get, onValue, set } from 'firebase/database'
import { useCanvasStore } from '~/stores/canvas-store'


export function CommandCenterPanel() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const { currentPageId, setCurrentPageId } = useFlowSession() // ✅ use global

  const user = useAuthStore(s => s.user)
  const [pages, setPages] = useState<{ id: string; name: string }[]>([])

  const [smartWelcomeBlocks, setSmartWelcomeBlocks] = useState<Record<string, any>>({})
  const [activeWelcomeBlockId, setActiveWelcomeBlockId] = useState<string>('')
  // const [activeLang, setActiveLang] = useState<'en' | 'kh'>('en')

  const [quickMenuBlocks, setQuickMenuBlocks] = useState<Record<string, any>>({})
  const [activeQuickMenuBlockId, setActiveQuickMenuBlockId] = useState<string>('')
  const [features, setFeatures] = useState<Record<string, boolean>>({})

  // ✅ Include enabled flag in type
  const [iceBreakers, setIceBreakers] = useState<
    { question: string; enabled: boolean }[]
  >([]);

  const [defaultLang, setDefaultLang] = useState<'en' | 'kh'>('en')

  const handleSetDefaultLang = async (lang: 'en' | 'kh') => {
    setDefaultLang(lang)
    const langRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/settings/default_language`)
    await set(langRef, lang)
    toast.success(`Default language for page ${currentPageId} set to ${lang.toUpperCase()}`)
  }

  useEffect(() => {
    toast.success("✅ Sonner toast test fired")
  }, [])


  useEffect(() => {
    if (!currentPageId) return
    const featuresRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/config/features`)
    return onValue(featuresRef, snapshot => {
      const raw = snapshot.val() || {}
      const normalized: Record<string, boolean> = {}

      Object.entries(raw).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && 'enabled' in value) {
          normalized[key] = !!(value as any).enabled
        } else {
          normalized[key] = !!value
        }
      })

      setFeatures(normalized)
      // console.log("✅ Normalized features:", normalized)
    })
  }, [currentPageId])




  const { setActivePanel } = useApplicationState(s => ({
    isMobileView: s.view.mobile,
    setActivePanel: s.actions.sidebar.setActivePanel,
  }))



  const toggle = (key: string) => {
    setExpanded(expanded === key ? null : key)
  }



  // Load available pages from Firebase
  useEffect(() => {
    const pagesRef = ref(db, `khmer-ai-chat/admins/${user?.id}/pages`)

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

  const { setFlowData } = useCanvasStore.getState()


  useEffect(() => {
    if (!currentPageId) return

    // Rehydrate from global flow data
    const { feature_blocks_by_type } = useCanvasStore.getState().flowData || {}

    const smartBlocks = feature_blocks_by_type?.['smart-welcome'] || {}
    setSmartWelcomeBlocks(smartBlocks)

    const quickBlocks = feature_blocks_by_type?.['quick-menu'] || {}
    setQuickMenuBlocks(quickBlocks)

    // Also reload active IDs from Firebase config
    const reloadConfig = async () => {
      const welcomeRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/config/welcomeFlow`)
      const welcomeSnap = await get(welcomeRef)
      setActiveWelcomeBlockId(welcomeSnap.val()?.activeBlockId || '')

      const quickMenuRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/config/quickMenuFlow`)
      const quickMenuSnap = await get(quickMenuRef)
      setActiveQuickMenuBlockId(quickMenuSnap.val()?.activeBlockId || '')
    }

    reloadConfig()
  }, [currentPageId])


  const EMPTY_FLOW_DATA = {
    feature_blocks_by_type: {},
    shared_templates: {},
    raw_canvas: { nodes: [], edges: [] },
  }


  const handleSelectPage = async (pageId: string) => {
    if (!pageId) {
      setCurrentPageId('')   // ✅ clear global
      setSmartWelcomeBlocks({})
      setQuickMenuBlocks({})
      setActiveWelcomeBlockId('')
      setActiveQuickMenuBlockId('')
      setFlowData(EMPTY_FLOW_DATA)   // ✅ use global store
      return
    }

    setCurrentPageId(pageId)   // ✅ set global

    try {
      const flowRef = ref(db, `khmer-ai-chat/pages/${pageId}/flow`)
      const snapshot = await get(flowRef)
      const data = snapshot.val()

      if (!data || typeof data !== 'object') {
        setSmartWelcomeBlocks({})
        setQuickMenuBlocks({})
        setActiveWelcomeBlockId('')
        setActiveQuickMenuBlockId('')
        setFlowData(EMPTY_FLOW_DATA)   // ✅ use global store
        return
      }

      setFlowData(data)   // ✅ use global store

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
      setFlowData(EMPTY_FLOW_DATA)   // ✅ use global store
    }
  }


  const handleActivateWelcome = async (blockId: string) => {
    setActiveWelcomeBlockId(blockId)
    if (!currentPageId) return

    // Show loading toast
    const toastId = toast.loading("Updating Welcome Flow...")

    try {
      const welcomeRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/config/welcomeFlow`)
      await set(welcomeRef, { activeBlockId: blockId })

      await fetch('https://asia-east2-khmer-catalog.cloudfunctions.net/khmer_aichatbot', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refresh_config_handler: true,
          page_id: currentPageId
        })
      })

      // Update toast to success
      toast.success(`Welcome Flow updated to ${blockId}`, { id: toastId })
    } catch (err) {
      console.error("❌ Failed to activate welcome flow:", err)
      // Update toast to error
      toast.error("Failed to update Welcome Flow ❌", { id: toastId })
    }
  }

  const handleActivateQuickMenu = async (blockId: string) => {
    setActiveQuickMenuBlockId(blockId)
    if (!currentPageId) return

    const toastId = toast.loading("Updating Quick Menu Flow...")

    try {
      const quickMenuRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/config/quickMenuFlow`)
      await set(quickMenuRef, { activeBlockId: blockId })

      await fetch('https://asia-east2-khmer-catalog.cloudfunctions.net/khmer_aichatbot', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refresh_config_handler: true,
          page_id: currentPageId
        })
      })

      toast.success(`Quick Menu Flow updated to ${blockId}`, { id: toastId })
    } catch (err) {
      console.error("❌ Failed to activate quick menu flow:", err)
      toast.error("Failed to update Quick Menu Flow ❌", { id: toastId })
    }
  }

  // ❌ Remove an ice breaker by index (normalized)
  const removeIceBreaker = (index: number) => {
    setIceBreakers(prev =>
      prev
        .filter((_, i) => i !== index)
        .map(ib => ({
          question: ib.question || "",
          enabled: ib.enabled !== false // default true
        }))
    );
  };


  // 🔄 Load ice breakers from Firebase when page changes
  useEffect(() => {
    if (!currentPageId) return;

    const loadIceBreakers = async () => {
      try {
        const iceRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/config/ice_breakers`);
        const snap = await get(iceRef);
        const data = snap.val() || [];

        // Normalize: only question + enabled
        const normalized = Array.isArray(data)
          ? data.map((ib: any) => ({
            question: ib.question || "",
            enabled: ib.enabled !== false // default true
          }))
          : [];

        setIceBreakers(normalized);
      } catch (err) {
        console.error("❌ Failed to load ice breakers:", err);
        setIceBreakers([]);
      }
    };

    loadIceBreakers();
  }, [currentPageId]);


  // 💾 Save ice breakers back to Firebase
  const handleSaveIceBreakers = async () => {
    if (!currentPageId) return;
    try {
      const refPath = ref(db, `khmer-ai-chat/pages/${currentPageId}/config/ice_breakers`);
      await set(refPath, iceBreakers);
      toast.success("Ice breakers updated!");
    } catch (err) {
      console.error("❌ Failed to save ice breakers:", err);
      toast.error("Failed to update ice breakers ❌");
    }
  };

  // ➕ Add a new ice breaker (default enabled)
  const addIceBreaker = () => {
    setIceBreakers(prev => [
      ...prev,
      { question: "", payload: `ICEBREAKER_${prev.length}`, enabled: true }
    ]);
  };

  // ✏️ Update an existing ice breaker by index
  const updateIceBreaker = (
    index: number,
    updated: Partial<{ question: string; enabled: boolean }>
  ) => {
    setIceBreakers(prev =>
      prev.map((ib, i) =>
        i === index
          ? {
            question: updated.question ?? ib.question,
            enabled: updated.enabled ?? ib.enabled,
          }
          : ib
      )
    );
  };


  // 🌍 Push only enabled ice breakers to Messenger Profile API
  const handlePublishIceBreakers = async () => {
    if (!currentPageId) return;

    try {
      // 1. Load the page access token from Firebase
      const tokenRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/meta/page_access_token`);
      const tokenSnap = await get(tokenRef);
      const PAGE_ACCESS_TOKEN = tokenSnap.val();

      if (!PAGE_ACCESS_TOKEN) {
        toast.error("❌ No Page Access Token found for this page");
        return;
      }

      // 2. Filter only enabled ice breakers
      const enabledIceBreakers = iceBreakers
        .filter(ib => ib.enabled)
        .map((ib, idx) => ({
          question: ib.question || "",
          // Messenger still requires a payload field, so use a simple fallback
          payload: `ICEBREAKER_${idx}`
        }));

      if (enabledIceBreakers.length === 0) {
        // Either remove this block or change it to a softer message
        toast.info("No ice breakers selected — nothing published.");
        return;
      }


      // 3. Push to Messenger Profile API
      const response = await fetch(
        `https://graph.facebook.com/v25.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ice_breakers: enabledIceBreakers }),
        }
      );

      const result = await response.json();
      console.log("✅ Published enabled ice breakers:", result);

      if (result.error) {
        toast.error(`❌ Failed: ${result.error.message}`);
      } else {
        toast.success("Enabled ice breakers published to Messenger!");
      }
    } catch (err) {
      console.error("❌ Failed to publish ice breakers:", err);
      toast.error("Failed to publish ice breakers ❌");
    }
  };


  // 🔄 Reset (remove) ice breakers from Messenger Profile API
  const handleResetIceBreakers = async () => {
    if (!currentPageId) return;

    try {
      // 1. Load the page access token from Firebase
      const tokenRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/meta/page_access_token`);
      const tokenSnap = await get(tokenRef);
      const PAGE_ACCESS_TOKEN = tokenSnap.val();

      if (!PAGE_ACCESS_TOKEN) {
        toast.error("❌ No Page Access Token found for this page");
        return;
      }

      // 2. Call Messenger Profile API to reset ice breakers
      const response = await fetch(
        `https://graph.facebook.com/v17.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: ["ice_breakers"] }),
        }
      );

      const result = await response.json();
      console.log("✅ Reset ice breakers:", result);
      toast.success("Ice breakers reset from Messenger!");
    } catch (err) {
      console.error("❌ Failed to reset ice breakers:", err);
      toast.error("Failed to reset ice breakers ❌");
    }
  };


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
            value={currentPageId ?? ''}   // ✅ bind to global
            onChange={e => handleSelectPage(e.target.value)}
            className="w-full rounded bg-dark-900 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
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
          {currentPageId && (
            <>
              <FeatureToggle
                label="Enable Message Bot"
                path={`pages/${currentPageId}/config/features/enable_message_bot`}
                tooltip="Turn the inbox message bot on or off globally"
                variant="main"
              />

              <FeatureToggle
                label="Enable Comment Bot"
                path={`pages/${currentPageId}/config/features/enable_comment_bot`}
                tooltip="Turn the comment reply bot on or off globally"
                variant="main"
              />

              {features.enable_message_bot && (
                <>
                 <FeatureToggle
                    label="Ask Language on New User"
                    path={`pages/${currentPageId}/config/features/ask_language_on_new_user`}
                    tooltip="Prompt new users to select their language before executing any payload"
                  />
                  <FeatureToggle
                    label="Promo Mode"
                    path={`pages/${currentPageId}/config/features/promo`}
                    tooltip="Enable promotional replies and broadcast-style messaging for campaigns"
                  />
                  <FeatureToggle
                    label="Intro Message"
                    path={`pages/${currentPageId}/config/features/intro`}
                    tooltip="Show a welcome message when users first open the chat or flow"
                  />
                                  
                  <FeatureToggle
                    label="Quick Menu"
                    path={`pages/${currentPageId}/config/features/quick_menu`}
                    tooltip="Always show quick reply buttons (🏠 Home, 🛍️ Product, 🎁 Promo)"
                  />                 
                  <FeatureToggle
                    label="Message Reply"
                    path={`pages/${currentPageId}/config/features/auto_reply_messages`}
                    tooltip="Automatically reply to inbox messages"
                  />  
                  {/* 🧠 Intent Prediction Toggles */}
                  <FeatureToggle
                    label="AI Smart Reply (Messages)"
                    path={`pages/${currentPageId}/config/features/intent_prediction_messages`}
                    tooltip="Enable AI to understand user inbox messages and predict their intent"
                  />
                </>
              )}

              {features.enable_comment_bot && (
                <>
                <FeatureToggle
                    label="Comment Reply"
                    path={`pages/${currentPageId}/config/features/auto_reply_comments`}
                    tooltip="Automatically reply to Facebook post comments"
                  />
                <FeatureToggle
                    label="AI Smart Reply (Comments)"
                    path={`pages/${currentPageId}/config/features/intent_prediction_comments`}
                    tooltip="Enable AI to understand Facebook post comments and predict their intent"
                  />
                  
                  
                </>
              )}

              {/* Active Welcome Flow selector */}
              <div className="mt-4">
                <label className="text-xs text-light-900/60 font-medium mb-1">
                  Active Welcome Flow
                </label>
                <select
                  value={activeWelcomeBlockId}
                  onChange={e => handleActivateWelcome(e.target.value)}
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
                  onChange={e => handleActivateQuickMenu(e.target.value)}
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
          title="❄️ Ice Breakers"
          expanded={expanded === 'iceBreakers'}
          onToggle={() => toggle('iceBreakers')}
        >
          <div className="space-y-4">
            <label className="text-xs font-medium text-light-900/70">
              Configure Ice Breakers
            </label>

            {iceBreakers.map((ib, idx) => (
              <div
                key={idx}
                className="space-y-3 bg-dark-800 p-3 rounded border border-dark-600"
              >
                {/* Enable/Disable toggle */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-light-200">
                    <input
                      type="checkbox"
                      checked={ib.enabled ?? true}
                      onChange={e =>
                        updateIceBreaker(idx, { ...ib, enabled: e.target.checked })
                      }
                      className="form-checkbox h-4 w-4 text-teal-500 rounded focus:ring-teal-400"
                    />
                    Enable Ice Breaker
                  </label>

                  {/* Remove button */}
                  <button
                    type="button"
                    className="size-7 flex items-center justify-center border border-transparent rounded-lg bg-transparent text-red-400 outline-none transition active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100)"
                    onClick={() => removeIceBreaker(idx)}
                  >
                    <div className="i-mynaui:trash size-4" />
                  </button>


                </div>

                {/* Long question input */}
                <input
                  value={ib.question}
                  onChange={e =>
                    updateIceBreaker(idx, { ...ib, question: e.target.value })
                  }
                  placeholder="Enter ice breaker question..."
                  className="w-full rounded bg-dark-700 text-light-100 p-2 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>
            ))}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-1 mt-2">
              <button
                onClick={addIceBreaker}
                className="px-2 py-0.5 bg-transparent  text-white rounded text-xs active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100)"
              >
                ➕ Add
              </button>
              <button
                onClick={handleSaveIceBreakers}
                className="px-2 py-0.5 bg-transparent  text-white rounded text-xs active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100)"
              >
                💾 Save
              </button>
              <button
                onClick={handlePublishIceBreakers}
                className="px-2 py-0.5 bg-transparent  text-white rounded text-xs active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100)"
              >
                🌍 Public
              </button>
              <button
                onClick={handleResetIceBreakers}
                className="px-2 py-0.5 bg-transparent  text-white rounded text-xs active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100)"
              >
                🔄 Reset
              </button>
            </div>


          </div>
        </PanelGroup>


        {/* <PanelGroup
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

          {Object.values(flow.feature_blocks_by_type || {})
            .flatMap(blocks =>
              Object.entries(blocks || {})
                .filter(([, block]) =>
                  block &&
                  block.entry_trigger === 'message' &&
                  block.messenger_delivery_type === 'text-message'
                )
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

          {Object.values(flow.feature_blocks_by_type || {})
            .flatMap(blocks =>
              Object.entries(blocks || {})
                .filter(([, block]) => block && block.entry_trigger === 'comment')
                .map(([id, block]) => (
                  <CommentTriggerEditor
                    key={`${id}-${activeLang}`}
                    pageId={selectedPageId}
                    blockId={id}
                    block={block}
                    lang={activeLang}
                  />
                ))
            )}
        </PanelGroup> */}


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
          {/* <SystemSettingEditor
            label="Timezone"
            path="settings/timezone"
          />
          <SystemSettingEditor
            label="Admin Notifications"
            path={`pages/${currentPageId}/settings/admin_notifications`}
          /> */}

          <ActivatePageEditor />
        </PanelGroup>

      </OverlayScrollbarsComponent>
    </SidebarPanelWrapper>
  )
}



