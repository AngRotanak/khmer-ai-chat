import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { getButtonChains } from '~/utils/flowLogic'
import { buildFlowExport } from'~/utils/exportFlow'

import { ref, get, set } from 'firebase/database'
import { db } from '~/lib/firebase'

import type { Node, Edge } from '@xyflow/react'

export function ensureHandlesAreValid(nodes: Node[], edges: Edge[]): Node[] {
  return nodes.map(node => {
    if (node.type === 'feature-block') {
      const existingPaths = Array.isArray(node.data?.paths) ? node.data.paths : []
      const edgeHandles = edges
        .filter(e => e.source === node.id && typeof e.sourceHandle === 'string')
        .map(e => e.sourceHandle)

      const missingHandles = edgeHandles.filter(h => !existingPaths.some(p => p.id === h))
      const newPaths = missingHandles.map((id, i) => ({
        id,
        label: `Card ${existingPaths.length + i + 1}`,
        blockType: 'generic-template',
        targetBlockId: null
      }))

      return {
        ...node,
        data: {
          ...node.data,
          paths: [...existingPaths, ...newPaths]
        }
      }
    }

    if (node.type === 'generic-template') {
      const existingOptions = Array.isArray(node.data?.options) ? node.data.options : []
      const edgeTargets = edges
        .filter(e => e.target === node.id && typeof e.targetHandle === 'string')
        .map(e => e.targetHandle)

      const missingOptions = edgeTargets.filter(h => !existingOptions.some(o => o.id === h))
      const newOptions = missingOptions.map((id, i) => ({
        id,
        label: `Option ${existingOptions.length + i + 1}`,
        type: 'postback',
        payload: ''
      }))

      return {
        ...node,
        data: {
          ...node.data,
          options: [...existingOptions, ...newOptions]
        }
      }
    }

    return node
  })
}

export function patchMissingTargetBlockIds(nodes: Node[], edges: Edge[]): Node[] {
  return nodes.map(node => {
    if (node.type !== 'feature-block') return node

    const paths = Array.isArray(node.data?.paths) ? node.data.paths : []

    const patchedPaths = paths.map(path => {
      if (path.targetBlockId) return path

      const edge = edges.find(e =>
        e.source === node.id &&
        e.sourceHandle === path.id &&
        typeof e.target === 'string'
      )

      if (!path.targetBlockId && edge?.target) {
        console.warn(`🔧 Patched path "${path.id}" in node "${node.id}" → targetBlockId = "${edge.target}"`)
      }

      return {
        ...path,
        targetBlockId: edge?.target ?? null
      }
    })

    return {
      ...node,
      data: {
        ...node.data,
        paths: patchedPaths
      }
    }
  })
}

function ensureNodeDataExists(nodes: Node[]): Node[] {
  return nodes.map(node => {
    if (node.data && typeof node.data === 'object') return node

    // Patch based on node type
    if (node.type === 'feature-block') {
      return {
        ...node,
        data: {
          name: '',
          blockType: 'carousel',
          paths: [],
          is_active: false,
        }
      }
    }

    if (node.type === 'generic-template') {
      return {
        ...node,
        data: {
          cards: [],
          is_active: false,
          layout: 'hero',
          options: [],
        }
      }
    }

    return {
      ...node,
      data: {}
    }
  })
}


export function FlowToolbar() {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow()

  // 🔗 Save Chains to Backend
  const saveChainsToBackend = useCallback(() => {
    const chains = getButtonChains(getNodes(), getEdges())
    const hasError = chains.some(c => c.error)

    if (hasError) {
      console.warn('❌ Invalid chains:', chains)
      alert('⚠️ Some chains are invalid. Please fix them before saving.')
      return
    }

    fetch('/api/flows/save-chains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryKey: 'welcome', chains })
    }).then(() => {
      alert('✅ Chains saved to backend!')
    }).catch(() => {
      alert('❌ Failed to save chains.')
    })
  }, [getNodes, getEdges])

  // 💾 Save to Local
  const saveFlow = useCallback(() => {
    const flow = { nodes: getNodes(), edges: getEdges() }
    localStorage.setItem('khmer_flow_draft', JSON.stringify(flow))
    alert('✅ Flow saved locally!')
  }, [getNodes, getEdges])

  // 📂 Load from Local
  const loadFlow = useCallback(() => {
    const raw = localStorage.getItem('khmer_flow_draft')
    if (!raw) return alert('⚠️ No saved flow found.')
    try {
      const { nodes, edges } = JSON.parse(raw)
      setNodes(nodes)
      setEdges(edges)
      alert('✅ Flow loaded from local!')
    } catch {
      alert('❌ Failed to load flow.')
    }
  }, [setNodes, setEdges])

  // 🧩 Export as .json
  const exportFlow = useCallback(() => {
    const flow = { nodes: getNodes(), edges: getEdges() }
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'khmer-flow.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [getNodes, getEdges])

  // 📥 Import from .json
  const importFlow = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const { nodes, edges } = JSON.parse(reader.result as string)
        setNodes(nodes)
        setEdges(edges)
        alert('✅ Flow imported from file!')
      } catch {
        alert('❌ Invalid flow file.')
      }
    }
    reader.readAsText(file)
  }, [setNodes, setEdges])

  // 🔁 Sync to Firebase
  const handleExport = useCallback(async () => {
    try {
      const exportData = buildFlowExport(getNodes(), getEdges())

      const flowRef = ref(db, 'smart_flow') // Save entire export structure
      const cleanExport = JSON.parse(JSON.stringify(exportData))
      await set(flowRef, cleanExport)


      alert('✅ Flow synced to Firebase successfully!')
    } catch (err) {
      console.error('❌ Firebase sync failed:', err)
      alert('❌ Failed to sync flow to Firebase')
    }
  }, [getNodes, getEdges])


  // ☁️ Import from Firebase
const handleImport = useCallback(async () => {
  console.log('📥 Starting Firebase import...')

  try {
    const flowRef = ref(db, 'smart_flow/product/canvas') // ✅ Target only the canvas block
    console.log('📡 Fetching from Firebase path: smart_flow/product/canvas')

    const snapshot = await get(flowRef)

    if (!snapshot.exists()) {
      console.warn('⚠️ Firebase snapshot does not exist')
      alert('⚠️ No saved flow found in Firebase')
      return
    }

    const canvas = snapshot.val()
    console.log('📦 Raw canvas from Firebase:', canvas)

    const nodes = Array.isArray(canvas.nodes) ? canvas.nodes : []
    const edges = Array.isArray(canvas.edges) ? canvas.edges : []

    console.log('🔧 Extracted nodes and edges:', { nodes, edges })

    const withData = ensureNodeDataExists(nodes)
    console.log('🧱 After ensureNodeDataExists:', withData)

    const withHandles = ensureHandlesAreValid(withData, edges)
    console.log('🔗 After ensureHandlesAreValid:', withHandles)

    const fixedNodes = patchMissingTargetBlockIds(withHandles, edges)
    console.log('✅ Final patched nodes:', fixedNodes)

    setNodes(fixedNodes)
    setEdges(edges)

    alert('✅ Flow imported from Firebase!')
  } catch (err) {
    console.error('❌ Firebase import failed:', err)
    alert('❌ Failed to import flow from Firebase')
  }
}, [setNodes, setEdges])


  return (
    <div className="absolute top-2 left-2 z-50 flex items-center gap-x-2 bg-dark-300/80 backdrop-blur-md px-3 py-2 rounded-lg border border-dark-200 shadow-md">
      <button onClick={saveChainsToBackend} title="Save Chains">
        <div className="i-lucide:list-start size-5 text-light-900 hover:text-teal-500" />
      </button>

      <button onClick={saveFlow} title="Save Locally">
        <div className="i-lucide:save size-5 text-light-900 hover:text-teal-500" />
      </button>

      <button onClick={loadFlow} title="Load Local">
        <div className="i-lucide:folder-open size-5 text-light-900 hover:text-teal-500" />
      </button>

      <button onClick={exportFlow} title="Export .json">
        <div className="i-lucide:download size-5 text-light-900 hover:text-teal-500" />
      </button>

      <label title="Import .json">
        <div className="i-lucide:upload size-5 text-light-900 hover:text-teal-500 cursor-pointer" />
        <input type="file" accept=".json" onChange={importFlow} className="hidden" />
      </label>

      <button onClick={handleExport} title="Sync to Firebase">
        <div className="i-lucide:cloud-upload size-5 text-light-900 hover:text-teal-500" />
      </button>

      <button onClick={handleImport} title="Load from Firebase">
        <div className="i-lucide:cloud-download size-5 text-light-900 hover:text-teal-500" />
      </button>
    </div>
  )
}
