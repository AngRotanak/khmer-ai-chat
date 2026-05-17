import { useState, useEffect } from 'react'
import { useApplicationState } from '~/stores/application-state'
import { useAuthStore } from '~/stores/auth-store'
import { useFlowSession } from '~/stores/flow-session'
import SidebarPanelWrapper from '~/modules/sidebar/components/sidebar-panel-wrapper'
import { db } from '~/lib/firebase'
import { ref, onValue, set, get } from 'firebase/database'
import { buildFlowExport } from'~/utils/exportFlow'
import { useCanvasStore } from '~/stores/canvas-store'


export function FlowManagerPanel() {
  const { activePanel, isMobileView } = useApplicationState(s => ({
    activePanel: s.sidebar.active,
    isMobileView: s.view.mobile,
  }))

  const user = useAuthStore(s => s.user)

   if (!user) {
    return <div className="p-4 text-light-100">⏳ កំពុងផ្ទុកអ្នកប្រើ...</div>
  }


  const { currentPageId, setCurrentPageId } = useFlowSession()
  const { setNodes, setEdges, nodes, edges } = useCanvasStore()


  const [pages, setPages] = useState<{ id: string; name: string; status: string }[]>([])
  const [flowList, setFlowList] = useState<string[]>([])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'disabled'>('all')


  useEffect(() => {
    const pagesRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages`)
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
  }, [user.id])

  useEffect(() => {
    if (!currentPageId) return
    const flowsRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages/${currentPageId}/flows`)
    return onValue(flowsRef, snapshot => {
      const data = snapshot.val()
      const list = data ? Object.keys(data) : []
      setFlowList(list)
    })
  }, [user.id, currentPageId])


  const handleSelectPage = async (pageId: string) => {
  setCurrentPageId(pageId)

  const flowRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages/${pageId}/flow`)
  const snapshot = await get(flowRef)
  const flowData = snapshot.val()

  if (!flowData || typeof flowData !== 'object') {
    console.warn('⚠️ No flow data found for page:', pageId)
    setNodes([])
    setEdges([])
    return
  }

  // 🧩 Get first block value (not the key)
  const firstBlock = Object.values(flowData)[0] as any

  if (!firstBlock || typeof firstBlock !== 'object') {
    console.warn('⚠️ No valid block found in flowData:', flowData)
    setNodes([])
    setEdges([])
    return
  }

  const canvas = firstBlock.canvas

  if (canvas && Array.isArray(canvas.nodes) && Array.isArray(canvas.edges)) {
    setNodes(canvas.nodes)
    setEdges(canvas.edges)
  } else {
    console.warn('⚠️ No valid canvas found in block:', firstBlock)
    setNodes([])
    setEdges([])
  }
}



const handleSaveFlow = async () => {
  if (!currentPageId || !user?.id) return

  console.log('🧩 nodes:', nodes)
  console.log('🔗 edges:', edges)

  if (!Array.isArray(nodes) || !Array.isArray(edges) || nodes.length === 0 || edges.length === 0) {
    alert('⚠️ No flow to export. Please build your flow first.')
    return
  }

  try {
    const exportData = buildFlowExport(nodes, edges)

    if (!exportData?.product || Object.keys(exportData.product).length === 0) {
      console.warn('⚠️ Export failed: no valid blocks found')
      alert('⚠️ Export failed: no valid blocks found')
      return
    }

    const blockName = (() => {
    for (const node of nodes) {
      const name = node?.data?.name
      if (typeof name === 'string' && name.trim()) {
        return name.trim()
      }
    }
    return `block_${currentPageId}`
  })()


    const namedExport = {
      [blockName]: exportData.product
    }

    const flowRef = ref(db, `khmer-ai-chat/admins/${user.id}/pages/${currentPageId}/flow`)
    await set(flowRef, namedExport)

    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 3000)

    alert(`✅ Flow "${blockName}" synced to Firebase successfully!`)
  } catch (err) {
    console.error('❌ Firebase sync failed:', err)
    setSaveStatus('idle')
    alert('❌ Failed to sync flow to Firebase')
  }
}

  return (
    <SidebarPanelWrapper>
      {activePanel === 'flow-manager' && (
        <>
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
                      className={`text-xs ${
                        p.status === 'active' ? 'text-green-400' :
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
                  className={`w-full rounded py-2 text-sm text-white ${
                    saveStatus === 'saving' ? 'bg-gray-500' : 'bg-teal-700 hover:bg-teal-600'
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
                    draggable
                    onDragStart={() => {
                      const payload = { type: 'flow-import', flowId }
                      const json = JSON.stringify(payload)
                      const dt = new DataTransfer()
                      dt.setData('application/json', json)
                      document.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt }))
                    }}
                    className="cursor-move rounded bg-dark-600 px-3 py-1 text-sm hover:bg-dark-500"
                  >
                    🧩 {flowId}
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
