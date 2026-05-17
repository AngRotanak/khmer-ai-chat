import { useState, useEffect } from 'react'
import { useApplicationState } from '~/stores/application-state'
import { useAuthStore } from '~/stores/auth-store'
import { useFlowSession } from '~/stores/flow-session'
import SidebarPanelWrapper from '~/modules/sidebar/components/sidebar-panel-wrapper'
import { db } from '~/lib/firebase'
import { ref, onValue, update, get } from 'firebase/database'
import { buildFlowExport } from '~/utils/exportFlow'
import { useCanvasStore } from '~/stores/canvas-store'
import { useReactFlow } from '@xyflow/react'
import { sanitizeNodes, sanitizeEdges } from '~/modules/flow-builder/constants/default-nodes-edges' // or wherever you define them
import { sanitizeCanvas } from '~/utils/sanitizeCanvas'
import { validateEdges } from '~/utils/validateEdges'
import type { Node, Edge } from '@xyflow/react';
import { createRoot } from "react-dom/client";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { nanoid } from 'nanoid';


export type FlowItem = {
  id: string;
  type: string;
  name: string;
  lastUpdated?: string;
};



export function FlowManagerPanel() {

  const { activePanel, isMobileView, setActivePanel } = useApplicationState(s => ({
    activePanel: s.sidebar.active,
    isMobileView: s.view.mobile,
    setActivePanel: s.actions.sidebar.setActivePanel,
  }))

  const flowList = useApplicationState(s => s.flowList);
  const { setFlowList, clearFlowList } = useApplicationState(s => s.actions);

  const EMPTY_FLOW_DATA = {
    feature_blocks_by_type: {},
    shared_templates: {},
    raw_canvas: { nodes: [], edges: [] },
  };


  const user = useAuthStore(s => s.user)
  const { currentPageId, setCurrentPageId } = useFlowSession()



  const { getNodes, getEdges } = useReactFlow()


  const flowData = useCanvasStore(s => s.flowData);
  const setFlowData = useCanvasStore(s => s.setFlowData);
  const setNodes = useCanvasStore(s => s.setNodes)
  const setEdges = useCanvasStore(s => s.setEdges)


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
      setFlowData(EMPTY_FLOW_DATA);
      clearFlowList()
      // ❌ Do NOT clear canvas — preserve unsaved work
    }
  }, [statusFilter, pages, currentPageId, user?.id])



  useEffect(() => {
    if (!currentPageId || !user?.id) return;
    const flowRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/flow`);
    return onValue(flowRef, snapshot => {
      const data = snapshot.val();
      if (!data || typeof data !== 'object') {
        setFlowList([]);
        setFlowData(EMPTY_FLOW_DATA);
        return;
      }

      console.log("Raw feature_blocks_by_type:", data.feature_blocks_by_type);

      const blockGroups = data.feature_blocks_by_type || {};
      const flowItems: FlowItem[] = [];

      for (const [type, blocks] of Object.entries(blockGroups)) {
        if (blocks && typeof blocks === "object") {
          for (const [blockId, blockData] of Object.entries(blocks as Record<string, any>)) {
            if (blockData && typeof blockData === "object") {
              flowItems.push({
                id: blockId,
                type,
                name: blockData.block_name || blockId,
                lastUpdated: blockData.last_updated
                  ? new Date(blockData.last_updated).toLocaleString()
                  : undefined,
              });
            }
          }
        }
      }

      flowItems.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

      setFlowData(data);       // ✅ store the full flow data
      setFlowList(flowItems);  // ✅ store the list
    });
  }, [user?.id, currentPageId]);


const handleSelectPage = async (pageId: string) => {
  const { resetCanvas, setFlowData } = useCanvasStore.getState();

  if (!user?.id) return;

  if (!pageId) {
    setCurrentPageId('');
    resetCanvas();
    setFlowData(null);
    clearFlowList();
    return;
  }

  setCurrentPageId(pageId);

  try {
    const flowRef = ref(db, `khmer-ai-chat/pages/${pageId}/flow`);
    const snapshot = await get(flowRef);
    const data = snapshot.val();

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      console.warn('⚠️ No valid flow data found for page:', pageId);
      resetCanvas();
      setFlowData(null);
      clearFlowList();
      return;
    }

    const blockGroups = data.feature_blocks_by_type || {};
    const flowItems: FlowItem[] = [];

    for (const [type, blocks] of Object.entries(blockGroups)) {
      if (blocks && typeof blocks === "object") {
        for (const [blockId, blockData] of Object.entries(blocks as Record<string, any>)) {
          if (blockData && typeof blockData === "object") {
            flowItems.push({
              id: blockId,
              type,
              name: blockData.block_name || blockId,
              lastUpdated: blockData.last_updated
                ? new Date(blockData.last_updated).toLocaleString()
                : undefined,
            });
          } else {
            console.warn(`⚠️ Skipping invalid block "${blockId}" of type "${type}"`, blockData);
          }
        }
      }
    }

    flowItems.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

    setFlowData(data);
    setFlowList(flowItems);

    console.log(`✅ Loaded ${flowItems.length} flows for page: ${pageId}`);
  } catch (err) {
    console.error('❌ Failed to load flow:', err);
    resetCanvas();
    setFlowData(null);
    clearFlowList();
  }
};


  // const handleSaveFlow_ = async () => {
  //   if (!currentPageId || !user?.id) return;

  //   const syncedNodes = sanitizeNodes(getNodes());
  //   const rawEdges = sanitizeEdges(getEdges());
  //   const syncedEdges = validateEdges(syncedNodes, rawEdges);

  //   setNodes(syncedNodes);
  //   setEdges(syncedEdges);

  //   if (syncedNodes.length === 0 || syncedEdges.length === 0) {
  //     alert('⚠️ No flow to export. Please build your flow first.');
  //     return;
  //   }

  //   try {
  //     // Normalize canvas paths
  //     for (const node of syncedNodes) {
  //       if (node?.data?.canvas) {
  //         node.data.canvas = normalizeCanvasPathsSafely(node.data.canvas);
  //       }
  //     }

  //     await new Promise(resolve => setTimeout(resolve, 100));

  //     const exportData = await buildFlowExport(syncedNodes, syncedEdges, user.id);

  //     const flowRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/flow`);
  //     const snapshot = await get(flowRef);
  //     const existingFlows = snapshot.val() || {};

  //     // 🔄 Merge feature_blocks_by_type
  //     const mergedBlocks: Record<string, any> = { ...existingFlows.feature_blocks_by_type };


  //     for (const [type, blocks] of Object.entries(exportData.feature_blocks_by_type || {})) {
  //       if (!mergedBlocks[type]) mergedBlocks[type] = {};

  //       if (blocks && typeof blocks === "object") {
  //         mergedBlocks[type] = {
  //           ...mergedBlocks[type],
  //           ...blocks, // overwrite only matching block IDs, keep others
  //         };
  //       }
  //     }


  //     // 🔄 Merge shared_templates
  //     const mergedTemplates: Record<string, any> = {
  //       ...(existingFlows.shared_templates || {}),
  //       ...(exportData.shared_templates || {}),
  //     };

  //     // 🚀 Build merged export
  //     const mergedExport = {
  //       ...existingFlows,
  //       feature_blocks_by_type: mergedBlocks,
  //       shared_templates: mergedTemplates,
  //       is_draft: exportData.is_draft,
  //       last_saved_at: new Date().toISOString(),
  //       saved_by: user.id,
  //     };

  //     // Write atomically
  //     const updates: Record<string, any> = {};
  //     updates[`khmer-ai-chat/pages/${currentPageId}/flow`] = mergedExport;
  //     updates[`khmer-ai-chat/page_admin_map/${currentPageId}`] = user.id;

  //     await update(ref(db), updates);

  //     setSaveStatus('saved');
  //     setTimeout(() => setSaveStatus('idle'), 3000);

  //     const allExported: string[] = [];
  //     for (const blocks of Object.values(mergedBlocks)) {
  //       if (typeof blocks === 'object' && blocks !== null) {
  //         allExported.push(...Object.keys(blocks));
  //       }
  //     }

  //     alert(`✅ Flow saved successfully! Exported blocks: ${allExported.join(', ')}`);
  //   } catch (err) {
  //     console.error('❌ Firebase sync failed:', err);
  //     setSaveStatus('idle');
  //     alert('❌ Failed to sync flow to Firebase');
  //   }
  // };

  const handleSaveFlow = async () => {
    if (!currentPageId || !user?.id) return;

    const syncedNodes = sanitizeNodes(getNodes());
    const rawEdges = sanitizeEdges(getEdges());
    const syncedEdges = validateEdges(syncedNodes, rawEdges);

    setNodes(syncedNodes);
    setEdges(syncedEdges);

    if (syncedNodes.length === 0) {
      alert('⚠️ No nodes found. Please add blocks to your flow.');
      return;
    }

    // ⚠️ Allow export even if no edges exist
    if (syncedEdges.length === 0) {
      console.warn('⚠️ No edges found. Exporting nodes only.');
    }

    try {
      // Normalize canvas paths + conversation-agent data
      for (const node of syncedNodes) {
        if (node?.data?.canvas) {
          console.log("handleSaveFlow → BEFORE normalizeCanvasPathsSafely:", JSON.stringify(node.data.canvas));
          node.data.canvas = normalizeCanvasPathsSafely(node.data.canvas);
          console.log("handleSaveFlow → AFTER normalizeCanvasPathsSafely:", JSON.stringify(node.data.canvas));
        }

        // Ensure conversation-agent arrays are valid
        if (node?.type === 'conversation-agent') {
          node.data.trigger_keywords = Array.isArray(node.data.trigger_keywords)
            ? node.data.trigger_keywords
            : [];
          node.data.sub_intents = Array.isArray(node.data.sub_intents)
            ? node.data.sub_intents
            : [];
          node.data.escape_keywords = Array.isArray(node.data.escape_keywords)
            ? node.data.escape_keywords
            : [];
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const exportData = await buildFlowExport(syncedNodes, syncedEdges, user.id);

      const flowRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/flow`);
      const snapshot = await get(flowRef);
      const existingFlows = snapshot.val() || {};

      // 🔄 Merge feature_blocks_by_type
      const mergedBlocks: Record<string, any> = { ...existingFlows.feature_blocks_by_type };

      for (const [type, blocks] of Object.entries(exportData.feature_blocks_by_type || {})) {
        if (!mergedBlocks[type]) mergedBlocks[type] = {};

        if (blocks && typeof blocks === "object") {
          mergedBlocks[type] = {
            ...mergedBlocks[type],
            ...blocks, // overwrite only matching block IDs, keep others
          };
        }
      }

      // 🔄 Merge shared_templates
      const mergedTemplates: Record<string, any> = {
        ...(existingFlows.shared_templates || {}),
        ...(exportData.shared_templates || {}),
      };

      // 🚀 Build merged export
      const mergedExport = {
        ...existingFlows,
        feature_blocks_by_type: mergedBlocks,
        shared_templates: mergedTemplates,
        is_draft: exportData.is_draft,
        last_saved_at: new Date().toISOString(),
        saved_by: user.id,
      };

      // Write atomically
      const updates: Record<string, any> = {};
      updates[`khmer-ai-chat/pages/${currentPageId}/flow`] = mergedExport;
      updates[`khmer-ai-chat/page_admin_map/${currentPageId}`] = user.id;

      await update(ref(db), updates);

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);

      const allExported: string[] = [];
      for (const blocks of Object.values(mergedBlocks)) {
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
                flowList
                  // 🚫 Filter out carousel blocks from top-level list
                  .filter(flow => flow.type !== "carousel")
                  .map(flow => (
                    <li
                      key={flow.id}
                      className={`relative cursor-pointer rounded px-3 py-1 text-sm flex justify-between items-center ${selectedFlowId === flow.id
                        ? "bg-teal-700 text-white"
                        : "bg-dark-600 hover:bg-dark-500 text-light-100"
                        }`}
                    >
                      {/* Flow name + type */}
                      <span
                        onClick={() => {
                          setSelectedFlowId(flow.id);

                          if (!flowData || typeof flowData.feature_blocks_by_type !== "object") {
                            console.warn("⚠️ flowData not ready at click");
                            return;
                          }

                          const typeGroup = flowData.feature_blocks_by_type[flow.type];
                          const block = typeGroup?.[flow.id];
                          if (!block) return;

                          const rawCanvas = block.raw_canvas;
                          if (!rawCanvas) {
                            console.warn("⚠️ No raw_canvas found, falling back to Messenger export");
                            return;
                          }

                          const { nodes, edges } = sanitizeCanvas({
                            nodes: rawCanvas.nodes ?? [],
                            edges: rawCanvas.edges ?? [],
                            updatedAt: Date.now(),
                          });

                          const validEdges = validateEdges(nodes, edges);

                          setNodes(nodes);
                          setEdges(validEdges);
                        }}
                        className="flex-1 truncate pr-2"
                      >
                        🧩 {flow.type} – {flow.name}
                        {flow.lastUpdated && (
                          <span className="ml-2 text-[10px] opacity-50">{flow.lastUpdated}</span>
                        )}
                      </span>


                      {/* Clone button */}
                      <button
                        onClick={async e => {
                          e.preventDefault();
                          e.stopPropagation();

                          const newName = prompt(`Enter new name to clone flow "${flow.name}"`);
                          if (!newName) return;

                          const parentRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/flow`);
                          try {
                            const snapshot = await get(parentRef);
                            const latestFlowData = snapshot.val() || {};

                            // ✅ Get the old block
                            const oldBlock =
                              latestFlowData.feature_blocks_by_type?.[flow.type]?.[flow.id];
                            if (!oldBlock) {
                              console.warn('⚠️ Flow block not found for cloning');
                              return;
                            }

                            // ✅ Clone block
                            const newBlock = JSON.parse(JSON.stringify(oldBlock));
                            const newId = nanoid();

                            newBlock.block_id = newId;
                            newBlock.block_name = newName;

                            // Update raw_canvas + nodes IDs
                            if (newBlock.raw_canvas?.nodes) {
                              newBlock.raw_canvas.nodes.forEach((node: any) => {
                                node.id = newId;
                                if (node.data) {
                                  node.data.block_id = newId;
                                  node.data.block_name = newName;
                                }
                              });
                            }

                            // ✅ Save cloned block back to DB
                            await update(parentRef, {
                              [`feature_blocks_by_type/${flow.type}/${newId}`]: newBlock,
                            });

                            // ✅ Update local state
                            setFlowList([
                              ...flowList,
                              { id: newId, name: newName, type: flow.type },
                            ]);

                            toast.success(`✅ Flow "${flow.name}" cloned as "${newName}"`);
                          } catch (err) {
                            console.error('❌ Failed to clone flow:', err);
                            toast.error('Failed to clone flow. Please try again.');
                          }
                        }}
                        className="ml-2 text-blue-400 hover:text-blue-600 text-xs"
                        title="Clone flow"
                      >
                        📑
                      </button>



                      {/* Delete button */}
                      <button
                        onClick={async e => {
                          e.preventDefault();
                          e.stopPropagation();

                          // ✅ Use simple browser confirm
                          const confirmed = window.confirm(
                            `⚠️ Delete flow "${flow.name}" and all linked blocks?\nThis cannot be undone.`
                          );
                          if (!confirmed) return;

                          const parentRef = ref(db, `khmer-ai-chat/pages/${currentPageId}/flow`);
                          try {
                            const snapshot = await get(parentRef);
                            const latestFlowData = snapshot.val() || {};

                            // ✅ Collect blocks + templates
                            const { blocks, templates } = collectLinkedBlocks(latestFlowData, flow.type, flow.id);

                            const deletePayload: Record<string, any> = {};

                            // ✅ Delete blocks only if feature_blocks_by_type exists
                            if (latestFlowData.feature_blocks_by_type?.[flow.type]) {
                              for (const id of blocks) {
                                deletePayload[`feature_blocks_by_type/${flow.type}/${id}`] = null;
                              }
                            }
                            function sanitizeKey(key: string): string {
                              return key.replace(/[.#$/[\]]/g, "_");
                            }


                            // ✅ Delete referenced templates
                            for (const tpl of templates) {
                              // tpl looks like "text-message.bnNt1Z-UjdXocpxSwISt0"
                              const [, id] = tpl.includes(".") ? tpl.split(".") : [null, tpl];

                              // sanitize just in case
                              const safeKey = sanitizeKey(id);

                              deletePayload[`shared_templates/${safeKey}`] = null;
                            }


                            console.log("🗑️ Deleting blocks:", blocks);
                            console.log("🗑️ Deleting templates:", templates);

                            await update(parentRef, deletePayload);

                            // ✅ Update flow list state
                            const newList = flowList.filter(f => !blocks.includes(f.id));
                            setFlowList(newList);

                            // ✅ Clear canvas if selected flow was deleted OR if no flows remain
                            if (
                              (selectedFlowId && blocks.includes(selectedFlowId)) ||
                              newList.length === 0
                            ) {
                              setSelectedFlowId(null);
                              useCanvasStore.getState().setNodes([]);
                              useCanvasStore.getState().setEdges([]);
                            }

                            toast.success(
                              `Deleted flow "${flow.name}" and ${blocks.length - 1} linked blocks (plus ${templates.length} templates).`
                            );
                          } catch (err) {
                            console.error("❌ Failed to delete flow:", err);
                            toast.error("Failed to delete flow. Please try again.");
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



export function extractCanvas(block: any, flowId: string): { nodes: Node[]; edges: Edge[] } | null {
  if (!block || typeof block !== 'object') {
    console.warn(`❌ Block for "${flowId}" is not an object:`, block);
    return null;
  }

  const canvas = block.canvas;
  if (canvas && typeof canvas === 'object') {
    console.log(`✅ Found canvas in block.canvas for "${flowId}"`);

    // 1. If raw nodes/edges exist, use them directly
    if (Array.isArray(canvas.nodes) || Array.isArray(canvas.edges)) {
      return {
        nodes: Array.isArray(canvas.nodes) ? sanitizeNodes(canvas.nodes) : [],
        edges: Array.isArray(canvas.edges) ? sanitizeEdges(canvas.edges) : [],
      };
    }

    // 2. If paths exist, transform them into nodes/edges
    if (Array.isArray(canvas.paths)) {
      console.log(`⚙️ Transforming paths into nodes/edges for "${flowId}"`);

      const nodes: Node[] = [];
      const edges: Edge[] = [];

      canvas.paths.forEach((path: any, idx: number) => {
        const nodeId = `${flowId}-path-${idx}`;
        nodes.push({
          id: nodeId,
          type: 'default',
          position: { x: 200 * idx, y: 100 },
          data: {
            label: path.template_ref || path.trigger || 'Path',
            condition: path.condition,
            intent: path.expected_intent,
            confidence: path.intent_confidence,
            sendImmediately: path.send_immediately,
          },
        });

        if (idx > 0) {
          edges.push({
            id: `${flowId}-edge-${idx}`,
            source: `${flowId}-path-${idx - 1}`,
            target: nodeId,
          });
        }
      });

      // Add a synthetic Start node if we have at least one path
      if (nodes.length > 0) {
        nodes.unshift({
          id: `${flowId}-start`,
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Start' },
        });
        edges.unshift({
          id: `${flowId}-edge-start`,
          source: `${flowId}-start`,
          target: nodes[1].id,
        });
      }

      return { nodes, edges };
    }

    // 3. Otherwise, return empty canvas
    return { nodes: [], edges: [] };
  }

  // 4. Product canvas
  if (block.product?.canvas && typeof block.product.canvas === 'object') {
    console.log(`✅ Found canvas in block.product.canvas for "${flowId}"`);
    return extractCanvas(block.product, flowId);
  }

  // 5. Nested canvas inside data property
  if (block.data?.canvas && typeof block.data.canvas === 'object') {
    console.log(`✅ Found canvas in block.data.canvas for "${flowId}"`);
    return extractCanvas(block.data, flowId);
  }

  // 6. Legacy nodes/edges directly in block
  const hasLegacy = Array.isArray(block.nodes) || Array.isArray(block.edges);
  if (hasLegacy) {
    console.log(`✅ Found legacy nodes/edges directly in block for "${flowId}"`);
    return {
      nodes: Array.isArray(block.nodes) ? sanitizeNodes(block.nodes) : [],
      edges: Array.isArray(block.edges) ? sanitizeEdges(block.edges) : [],
    };
  }

  // 7. Fallback: look for any nested canvas object
  for (const [key, value] of Object.entries(block)) {
    if (value && typeof value === 'object' && 'nodes' in value && 'edges' in value) {
      console.log(`✅ Found nested canvas in block.${key} for "${flowId}"`);
      return {
        nodes: sanitizeNodes((value as any).nodes),
        edges: sanitizeEdges((value as any).edges),
      };
    }
  }

  console.warn(`❌ No valid canvas structure found in block for "${flowId}"`, block);
  return null;
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


function collectLinkedBlocks(
  flowData: any,
  flowType: string,
  rootId: string
): { blocks: string[]; templates: string[] } {
  const toDeleteBlocks = new Set<string>([rootId]);
  const toDeleteTemplates = new Set<string>();

  function findBlockById(blockId: string): any | null {
    const group = flowData?.feature_blocks_by_type?.[flowType] || {};
    return group?.[blockId] || null;
  }

  function traverse(blockId: string) {
    const block = findBlockById(blockId);
    if (!block) return;

    // ✅ Direct template_ref
    if (block.template_ref) {
      toDeleteTemplates.add(block.template_ref);
    }

    // ✅ Nested template_ref inside raw_canvas nodes
    const nodes = block.raw_canvas?.nodes || [];
    for (const node of nodes) {
      const refId = node?.data?.template_ref;
      if (refId) {
        toDeleteTemplates.add(refId);
      }
    }

    // ✅ Paths inside block data
    const paths = block.paths || [];
    for (const path of paths) {
      if (path.template_ref) {
        toDeleteTemplates.add(path.template_ref);
      }
    }

    // ✅ Traverse edges to linked blocks
    const edges = block.raw_canvas?.edges || [];
    for (const edge of edges) {
      const target = edge?.target;
      if (target && !toDeleteBlocks.has(target)) {
        toDeleteBlocks.add(target);
        traverse(target);
      }
    }
  }

  traverse(rootId);

  return {
    blocks: Array.from(toDeleteBlocks),
    templates: Array.from(toDeleteTemplates),
  };
}

export function normalizeCanvasPathsSafely(canvas: any): any {
  if (!canvas || typeof canvas !== "object" || Array.isArray(canvas)) {
    return canvas;
  }

  const paths: any[] = Array.isArray(canvas.paths) ? canvas.paths : [];
  if (paths.length === 0) {
    canvas.paths = [];
    return canvas;
  }

  function normalizePayload(payload: any): string {
    if (!payload) {
      console.log("normalizePayload → input:", payload, "output:", '');
      return '';
    }
    if (typeof payload === 'string') {
      const out = (payload === 'unknown' || payload === 'unknown.unknown') ? '' : payload;
      console.log("normalizePayload → input (string):", payload, "output:", out);
      return out;
    }
    if (typeof payload === 'object') {
      const nodeId = typeof payload.node_id === 'string' ? payload.node_id : '';
      const type = typeof payload.template_type === 'string' ? payload.template_type : '';
      let out = '';
      if (nodeId && nodeId !== 'unknown' && type && type !== 'unknown') {
        // Prevent double-prepending
        out = nodeId.startsWith(type + ".") ? nodeId : `${type}.${nodeId}`;
      } else if (nodeId && nodeId !== 'unknown') {
        out = nodeId;
      }
      console.log("normalizePayload → input (object):", payload, "output:", out);
      return out;
    }
    console.log("normalizePayload → input (other):", payload, "output:", '');
    return '';
  }

  canvas.paths = paths.map((p: any, idx: number) => {
    if (!p || typeof p !== "object" || Array.isArray(p)) return p;

    console.log(`Path[${idx}] BEFORE:`, JSON.stringify(p));

    const normalizedPayload =
      typeof p?.payload === "string" && p.payload.includes(".")
        ? p.payload
        : normalizePayload(p.payload);

    const ref = (p.template_id && p.template_id !== "unknown")
      ? p.template_id.trim()
      : (p.template_ref && p.template_ref !== "unknown")
        ? p.template_ref
        : normalizedPayload;

    if (ref) {
      p.template_ref = ref;
    }

    p.payload = normalizedPayload;
    delete p.template_id;

    console.log(`Path[${idx}] AFTER:`, JSON.stringify(p));
    return p;
  });

  console.log("normalizeCanvasPathsSafely → finished normalization, path count:", canvas.paths.length);
  return canvas;
}


export function showConfirmModal(message: string): Promise<boolean> {
  return new Promise(resolve => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const root = createRoot(container);

    const Modal = () => (
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]"
        style={{ pointerEvents: "auto" }}
      >
        <div
          className="w-[400px] overflow-hidden border border-dark-200 rounded-xl bg-dark-200 shadow-lg backdrop-blur-xl divide-y divide-dark-300"
        >
          {/* Header */}
          <div className="relative bg-dark-300">
            <div className="absolute inset-0">
              <div className="absolute h-full w-3/5 from-teal-900/20 to-transparent bg-gradient-to-r" />
            </div>
            <div className="relative h-9 flex items-center px-3">
              <span className="text-xs font-medium tracking-wide uppercase text-teal-400">
                Confirm Deletion
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 text-sm text-light-100 whitespace-pre-wrap">
            {message}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-4 py-3 bg-dark-200">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-300 text-black hover:bg-gray-400 transition"
              onClick={() => {
                root.unmount();
                container.remove();
                resolve(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition"
              onClick={() => {
                root.unmount();
                container.remove();
                resolve(true);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );

    root.render(<Modal />);
  });
}

