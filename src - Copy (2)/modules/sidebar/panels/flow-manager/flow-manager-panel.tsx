import { useState, useEffect } from 'react'
import { useApplicationState } from '~/stores/application-state'
import { useAuthStore } from '~/stores/auth-store'
import { useFlowSession } from '~/stores/flow-session'
import SidebarPanelWrapper from '~/modules/sidebar/components/sidebar-panel-wrapper'
import { db } from '~/lib/firebase'
import { ref, onValue, update, get } from 'firebase/database'
import { buildFlowExport, validateTemplates, buildFlowExportDraft } from '~/utils/exportFlow'
import { useCanvasStore } from '~/stores/canvas-store'
import { useReactFlow } from '@xyflow/react'
import { simulateMessengerDelivery } from '~/utils/simulateMessengerDelivery'
import { sanitizeNodes, sanitizeEdges } from '~/modules/flow-builder/constants/default-nodes-edges' // or wherever you define them
import { sanitizeCanvas } from '~/utils/sanitizeCanvas'
import { validateEdges } from '~/utils/validateEdges'
import { getAuth } from 'firebase/auth';

export function FlowManagerPanel() {
  const { activePanel, isMobileView, setActivePanel } = useApplicationState(s => ({
    activePanel: s.sidebar.active,
    isMobileView: s.view.mobile,
    setActivePanel: s.actions.sidebar.setActivePanel,
  }))

  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid ?? 'unknown';

  const flowList = useApplicationState(s => s.flowList)

  const { setFlowList, clearFlowList } = useApplicationState(s => ({
    setFlowList: s.actions.setFlowList,
    clearFlowList: s.actions.clearFlowList,
  }))



  const user = useAuthStore(s => s.user)
  const { currentPageId, setCurrentPageId } = useFlowSession()

  const setNodes = useCanvasStore(s => s.setNodes)
  const setEdges = useCanvasStore(s => s.setEdges)
  const { getNodes, getEdges } = useReactFlow()


  const [flowData, setFlowData] = useState<Record<string, any>>({})
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null)

  const [pages, setPages] = useState<{ id: string; name: string; status: string }[]>([])



  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'disabled'>('all')

  useEffect(() => {
    const pagesRef = ref(db, `khmer-ai-chat/admins/${user?.id}/pages`)
    return onValue(pagesRef, snapshot => {
      const data = snapshot.val()
      if (data) {
        const loaded = Object.entries(data).map(([id, value]) => ({
          id,
          name: (value as any).name,
          status: (value as any).status ?? 'draft',
        }))
        setPages(loaded)
      }
    })
  }, [user?.id])

  // ✅ Auto-select first matching page when status filter changes
  useEffect(() => {
    if (!pages.length || !user?.id) return

    const stillValid = pages.some(p =>
      (statusFilter === 'all' || p.status === statusFilter) &&
      p.id === currentPageId
    )

    if (!stillValid) {
      setCurrentPageId('')
      setFlowData({})
      clearFlowList()
      // ❌ Do NOT clear canvas — preserve unsaved work
    }
  }, [statusFilter, pages, currentPageId, user?.id])



  useEffect(() => {
    if (!currentPageId || !user?.id) return
    const flowRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages/${currentPageId}/flow`)
    return onValue(flowRef, snapshot => {
      const data = snapshot.val()
      if (!data || typeof data !== 'object') {
        setFlowList([])
        return
      }

      const topLevelKeys = getTopLevelFlowKeys(data)
      setFlowList(topLevelKeys.sort())

    })
  }, [user?.id, currentPageId])


  const handleSelectPage = async (pageId: string) => {
    const { setFlowData } = useCanvasStore.getState();

    if (!user?.id) return;

    // 🧹 Clear state if no page selected
    if (!pageId) {
      setCurrentPageId('');
      setFlowData({});
      clearFlowList();
      return;
    }

    setCurrentPageId(pageId);

    try {
      const flowRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages/${pageId}/flow`);
      const snapshot = await get(flowRef);
      const data = snapshot.val();

      // ⚠️ Validate flow data structure
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        console.warn('⚠️ No valid flow data found for page:', pageId);
        setFlowData({});
        clearFlowList();
        return;
      }

      const topLevelKeys = Object.keys(data);
      setFlowData(data);
      setFlowList(topLevelKeys.sort());

      console.log(`✅ Loaded ${topLevelKeys.length} flows for page: ${pageId}`);
      console.log('✅ Flow list:', topLevelKeys);
    } catch (err) {
      console.error('❌ Failed to load flow:', err);
      setFlowData({});
      clearFlowList();
    }
  };

  const handleSaveFlow = async () => {
    if (!currentPageId || !user?.id) return;

    const syncedNodes = sanitizeNodes(getNodes());
    const rawEdges = sanitizeEdges(getEdges());
    const syncedEdges = validateEdges(syncedNodes, rawEdges);

    setNodes(syncedNodes);
    setEdges(syncedEdges);

    if (syncedNodes.length === 0 || syncedEdges.length === 0) {
      alert('⚠️ No flow to export. Please build your flow first.');
      return;
    }

    try {
      // 🧠 Normalize canvas paths before export
      for (const node of syncedNodes) {
        if (node?.data?.canvas) {
          node.data.canvas = normalizeCanvasPathsSafely(node.data.canvas);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100)); // ⏳ Ensure node registration

      // 🧪 Debug: log all template_refs
      const allRefs = syncedNodes.flatMap(n => {
        const canvas = n?.data?.canvas;
        if (
          typeof canvas === "object" &&
          canvas !== null &&
          !Array.isArray(canvas) &&
          "paths" in canvas &&
          Array.isArray(canvas.paths)
        ) {
          return canvas.paths.map(p => p?.template_ref).filter(ref => typeof ref === "string");
        }
        return [];
      });


      console.log("🧪 All template_refs in canvas:", allRefs);

      const exportData = await buildFlowExportDraft(syncedNodes, syncedEdges, user.id);

      const hasBlocks =
        exportData &&
        typeof exportData === 'object' &&
        exportData.feature_blocks_by_type &&
        typeof exportData.feature_blocks_by_type === 'object';

      const hasTemplates =
        exportData.shared_templates &&
        typeof exportData.shared_templates === 'object';

      if (!hasBlocks || !hasTemplates) {
        alert('⚠️ Export failed: missing blocks or templates');
        return;
      }

      const usedTemplateRefs: string[] = [];

      for (const group of Object.values(exportData.feature_blocks_by_type)) {
        if (typeof group !== 'object' || group === null) continue;

        for (const block of Object.values(group)) {
          const paths = Array.isArray(block?.debug?.raw_canvas_paths)
            ? block.debug.raw_canvas_paths
            : [];

          for (const p of paths) {
            if (typeof p?.template_ref === 'string') {
              usedTemplateRefs.push(p.template_ref.trim());
            }
          }
        }
      }

      const sharedTemplateCount = Object.keys(exportData.shared_templates).length;

      if (sharedTemplateCount === 0 && usedTemplateRefs.length > 0) {
        console.warn('⚠️ No shared templates found — all template_refs were already exported as blocks');
      }

      console.log('🚀 Syncing to Firebase:', exportData);
      console.log('✅ Synced shared_templates:', Object.keys(exportData.shared_templates));

      const blockGroups = exportData.feature_blocks_by_type;

      const flowRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages/${currentPageId}/flow`);
      const snapshot = await get(flowRef);
      const existingFlows = snapshot.val() || {};

      const overlapping: string[] = [];
      for (const [type, blocks] of Object.entries(blockGroups)) {
        if (typeof blocks !== 'object' || blocks === null) continue;

        const newBlockIds = Object.keys(blocks);
        const existingBlockIds = Object.keys(
          typeof existingFlows?.[type] === 'object' && existingFlows[type] !== null
            ? existingFlows[type]
            : {}
        );

        overlapping.push(...newBlockIds.filter(id => existingBlockIds.includes(id)));
      }

      if (overlapping.length > 0) {
        const confirmOverwrite = window.confirm(
          `⚠️ The following blocks already exist and will be overwritten:\n\n${overlapping.join('\n')}\n\nContinue?`
        );
        if (!confirmOverwrite) {
          alert('❌ Save cancelled. Choose a different name or confirm overwrite.');
          return;
        }
      }

      await update(flowRef, exportData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);

      const allExported: string[] = [];
      for (const blocks of Object.values(blockGroups)) {
        if (typeof blocks === 'object' && blocks !== null) {
          allExported.push(...Object.keys(blocks));
        }
      }

      alert(`✅ Flow saved successfully! Exported blocks: ${allExported.join(', ')}`);
    } catch (err) {
      console.error('❌ Firebase sync failed:', err);
      setSaveStatus('idle');
      alert('❌ Failed to sync flow to Firebase');
    }
  };


  return (
    <SidebarPanelWrapper>
      {activePanel === 'flow-manager' && (
        <>
          {/* Close Button */}
          <div className="shrink-0 flex justify-end px-3 pt-3">
            <button
              onClick={() => setActivePanel('none')}
              className="text-xs text-light-100/50 hover:text-light-100 dark:text-light-100/40 dark:hover:text-white transition"
              title="Close"
            >
              <div className="i-mynaui:x size-4" />
            </button>
          </div>

          {/* 🧩 Header */}
          <div className="mt-4 flex flex-col items-center p-4 text-center">
            <div className="size-12 flex items-center justify-center rounded-full bg-teal-800 dark:bg-teal-600">
              <div className="i-heroicons-outline:rectangle-group size-6 text-white dark:text-light-100" />
            </div>

            <div className="mt-4 text-balance font-medium text-light-100 dark:text-light-100">
              Flow Manager
            </div>

            <div className="mt-1 w-2/3 text-xs font-medium leading-normal text-light-50/40 dark:text-light-100/40">
              {isMobileView
                ? 'Tap to select and manage flows'
                : 'Select a page and manage its flows'}
            </div>
          </div>

          {/* 🔍 Status Filter + Page Selector */}
          <div className="flex justify-center px-4">
            <div className="w-full max-w-[360px] space-y-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="block w-full rounded bg-dark-900 border border-dark-500 text-sm text-light-100 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                <option value="all" className="bg-dark-700 text-light-100/70">All Statuses</option>
                <option value="active" className="bg-dark-700 text-green-400">Active</option>
                <option value="draft" className="bg-dark-700 text-yellow-400">Draft</option>
                <option value="disabled" className="bg-dark-700 text-gray-400">Disabled</option>
              </select>

              <select
                value={currentPageId ?? ''}
                onChange={(e) => handleSelectPage(e.target.value)}
                className="block w-full rounded bg-dark-900 border border-dark-500 text-sm text-light-100 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                <option value="" disabled className="bg-dark-700 text-light-100/50">
                  ជ្រើសរើសទំព័រ
                </option>
                {pages
                  .filter(p => statusFilter === 'all' || p.status === statusFilter)
                  .map(p => (
                    <option
                      key={p.id}
                      value={p.id}
                      className={`text-xs ${p.status === 'active' ? 'text-green-400' :
                        p.status === 'draft' ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}
                    >
                      {p.name} ({p.status})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* 💾 Save Button */}
          {currentPageId && (
            <div className="px-4 pt-4 flex justify-center">
              <div className="w-full max-w-[360px]">
                <button
                  onClick={handleSaveFlow}
                  disabled={saveStatus === 'saving'}
                  className={`w-full rounded py-2 text-sm text-white ${saveStatus === 'saving' ? 'bg-gray-500' : 'bg-teal-700 hover:bg-teal-600'
                    }`}
                >
                  {saveStatus === 'saving' ? '⏳ កំពុងរក្សាទុក...' : '💾 រក្សាទុកទៅទំព័រ'}
                </button>
                {saveStatus === 'saved' && (
                  <div className="mt-2 text-green-500 text-sm">✅ បានរក្សាទុករួចរាល់</div>
                )}
              </div>
            </div>
          )}

          {/* 📦 Flow List */}
          <div className="mt-6 px-4">
            <div className="text-sm font-semibold text-light-50 dark:text-light-100 mb-2">
              📦 Available Flows
            </div>
            <ul className="flex flex-col gap-2 min-h-[80px]">
              {flowList.length > 0 ? (
                flowList.map(flowId => (

                  <li
                    key={flowId}
                    className={`relative cursor-pointer rounded px-3 py-1 text-sm flex justify-between items-center ${selectedFlowId === flowId
                      ? 'bg-teal-700 text-white'
                      : 'bg-dark-600 hover:bg-dark-500 text-light-100'
                      }`}
                  >
                    <span
                      onClick={() => {
                        setSelectedFlowId(flowId)
                        const block = flowData[flowId]
                        const canvas = extractCanvas(block, flowId)
                        if (!canvas || !Array.isArray(canvas.nodes) || !Array.isArray(canvas.edges)) return
                        const validNodes = sanitizeNodes(canvas.nodes).map(n => ({ ...n, draggable: true, selectable: true }))
                        const validEdges = sanitizeEdges(canvas.edges).map(e => ({ ...e, targetHandle: undefined }))
                        useCanvasStore.getState().setNodes(validNodes)
                        useCanvasStore.getState().setEdges(validEdges)
                      }}
                      className="flex-1 truncate pr-2"
                    >
                      🧩 {flowId}
                    </span>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        const confirmDelete = window.confirm(`⚠️ Delete flow "${flowId}" and all linked blocks?\nThis cannot be undone.`)
                        if (!confirmDelete) return

                        const parentRef = ref(db, `khmer-ai-chat/admins/${user?.id}/pages/${currentPageId}/flow`)
                        try {
                          // ✅ Fetch latest flow data from Firebase
                          const snapshot = await get(parentRef)
                          const latestFlowData = snapshot.val() || {}

                          // ✅ Collect all blocks to delete
                          const allToDelete = collectLinkedBlocks(latestFlowData, flowId)
                          const deletePayload = Object.fromEntries(allToDelete.map(id => [id, null]))

                          // ✅ Delete from Firebase
                          await update(parentRef, deletePayload)

                          // ✅ Reload flow data and flow list
                          const postDeleteSnapshot = await get(parentRef)
                          const updatedFlowData = postDeleteSnapshot.val() || {}
                          const topLevelKeys = getTopLevelFlowKeys(updatedFlowData)

                          setFlowData(updatedFlowData)
                          setFlowList(topLevelKeys.sort())


                          if (selectedFlowId && allToDelete.includes(selectedFlowId)) {
                            setSelectedFlowId(null)
                            useCanvasStore.getState().setNodes([])
                            useCanvasStore.getState().setEdges([])
                          }

                          alert(`✅ Deleted flow "${flowId}" and ${allToDelete.length - 1} linked blocks.`)
                        } catch (err) {
                          console.error('❌ Failed to delete flow:', err)
                          alert('❌ Failed to delete flow. Please try again.')
                        }
                      }}
                      className="ml-2 text-red-400 hover:text-red-600 text-xs"
                      title="Delete flow"
                    >
                      🗑️
                    </button>

                  </li>

                ))
              ) : (
                <li className="text-xs text-light-100/40 italic">No flows available.</li>
              )}
            </ul>

          </div>
        </>
      )}
    </SidebarPanelWrapper>
  )
}


function extractCanvas(block: any, flowId: string) {
  if (!block || typeof block !== 'object') {
    console.warn(`❌ Block for "${flowId}" is not an object:`, block)
    return null
  }

  if (typeof block.canvas === 'object') {
    console.log(`✅ Found canvas in block.canvas for "${flowId}"`)
    return block.canvas
  }

  if (typeof block.product?.canvas === 'object') {
    console.log(`✅ Found canvas in block.product.canvas for "${flowId}"`)
    return block.product.canvas
  }

  const hasLegacy = Array.isArray(block.nodes) || Array.isArray(block.edges)
  if (hasLegacy) {
    console.log(`✅ Found legacy nodes/edges directly in block for "${flowId}"`)
    return {
      nodes: Array.isArray(block.nodes) ? block.nodes : [],
      edges: Array.isArray(block.edges) ? block.edges : [],
    }
  }

  console.warn(`❌ No valid canvas structure found in block for "${flowId}"`, block)
  return null
}

export function getTopLevelFlowKeys(flowData: Record<string, any>): string[] {
  const allKeys = Object.keys(flowData)
  const linkedBlockIds = new Set<string>()

  for (const block of Object.values(flowData)) {
    const linked =
      Array.isArray(block?.flow_data?.linked_blocks)
        ? block.flow_data.linked_blocks
        : []

    for (const id of linked) {
      linkedBlockIds.add(id)
    }
  }

  return allKeys.filter(key => !linkedBlockIds.has(key))
}

function collectLinkedBlocks(flowData: Record<string, any>, rootId: string): string[] {
  const visited = new Set<string>()
  const queue = [rootId]

  while (queue.length > 0) {
    const current = queue.pop()
    if (!current || visited.has(current)) continue
    visited.add(current)

    const linked = Array.isArray(flowData[current]?.flow_data?.linked_blocks)
      ? flowData[current].flow_data.linked_blocks
      : []

    for (const childId of linked) {
      if (!visited.has(childId)) {
        queue.push(childId)
      }
    }
  }

  return Array.from(visited)
}

export function normalizeCanvasPathsSafely(canvas: any): any {
  if (!canvas || typeof canvas !== "object") return canvas;

  const paths = Array.isArray(canvas.paths) ? canvas.paths : [];

  canvas.paths = paths.map((p) => {
    if (!p || typeof p !== "object") return p;

    const ref =
      typeof p.template_id === "string" && p.template_id.trim() !== ""
        ? p.template_id.trim()
        : p.payload && typeof p.payload === "object" && typeof p.payload.node_id === "string"
          ? p.payload.node_id
          : null;

    if (ref) p.template_ref = ref;
    delete p.template_id;

    if (!p.payload || typeof p.payload !== "object") {
      p.payload = {
        node_id: ref ?? "unknown",
        template_type: "unknown",
        lang: "en"
      };
    }

    return p;
  });

  return canvas;
}