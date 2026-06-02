import type { VoiceTemplateNodeData } from '~/modules/nodes/types'
import { useCanvasStore } from '~/stores/canvas-store'
import { produce } from 'immer'
import { useState, useEffect } from 'react'
import { db_firestore } from '~/lib/firebase'
import {
  collection,
  query,
  onSnapshot,
} from 'firebase/firestore'
import { useAuthStore } from '~/stores/auth-store'



type MediaItem = {
  id: string
  media_url: string
  media_type: 'image' | 'video' | 'audio'
  filename: string
  category?: string
  tags?: string[]
  size: number
}

export default function VoiceTemplatePropertyPanel({ id }: { id: string }) {
  const node = useCanvasStore(s => s.nodes.find(n => n.id === id))
  const data = node?.data as VoiceTemplateNodeData | undefined

  const user = useAuthStore(s => s.user)
  const adminId = user?.id

  const [showGallery, setShowGallery] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [tagSearch, setTagSearch] = useState('')
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [categories] = useState<string[]>(['general', 'marketing', 'product'])

  // ✅ Load audio items from Firestore
  useEffect(() => {
    const q = query(collection(db_firestore, `admin_uploads/${adminId}/items`))
    const unsub = onSnapshot(q, snapshot => {
      const items = snapshot.docs.map(doc => doc.data() as MediaItem)
      setMediaItems(items)

      // Build unique categories
      const uniqueCategories = new Set(items.map(i => i.category ?? 'general'))
      // Ensure "general" is always present
      uniqueCategories.add('general')

    })
    return () => unsub()
  }, [])

  if (!node || node.type !== 'voice-template' || !data) {
    return <div className="text-red-500">⚠️ Invalid node</div>
  }

  const updateData = (patch: Partial<VoiceTemplateNodeData>) => {
    useCanvasStore.getState().setNodes(nodes =>
      produce(nodes, draft => {
        const node = draft.find(n => n.id === id)
        if (!node) return
        Object.assign(node.data, patch)
        node.data.updatedAt = Date.now()
      })
    )
  }

  const filtered = mediaItems.filter(i =>
    i.media_type === 'audio' &&
    (categoryFilter === 'all' || i.category === categoryFilter) &&
    (
      tagSearch === '' ||
      (i.tags ?? []).some(tag =>
        tag.toLowerCase().includes(tagSearch.toLowerCase())
      )
    )
  )

  return (
    <div className="flex flex-col gap-4.5 p-4 bg-dark-400 dark:bg-dark-900 text-light-100 dark:text-light-100">
      {/* Voice URL */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60">Voice URL</div>
        <input
          value={data.media_url ?? ''}
          onChange={e => updateData({ media_url: e.target.value })}
          className="h-8 w-full border border-dark-200 dark:border-dark-600 rounded-md bg-dark-400 dark:bg-dark-800 px-2.5 text-sm font-medium shadow-sm outline-none transition hover:bg-dark-300/60 dark:hover:bg-dark-700 focus:(border-teal-800 bg-dark-500 dark:bg-dark-700 ring-2 ring-teal-500/50)"
        />

        {data.media_url && (
          <audio src={data.media_url} controls className="mt-3 w-full" />
        )}

        {/* Toggle for gallery */}
        <button
          onClick={() => setShowGallery(prev => !prev)}
          className="mt-2 text-xs px-2 py-1 rounded bg-dark-600 text-light-100 hover:bg-dark-500 self-start"
        >
          {showGallery ? 'Hide Gallery' : 'Select from Gallery'}
        </button>

        {/* Gallery picker */}
        {showGallery && (
          <div className="space-y-2 mt-2">
            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-2 py-1 rounded bg-dark-700 text-light-100"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Tag search */}
            <input
              type="text"
              placeholder="Search by tag"
              value={tagSearch}
              onChange={e => setTagSearch(e.target.value)}
              className="w-full px-2 py-1 rounded bg-dark-700 text-light-100"
            />

            {/* Audio grid */}
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(item => (
                <div
                  key={item.id}
                  className="border border-dark-600 rounded p-2 cursor-pointer hover:border-teal-500"
                  onClick={() => updateData({ media_url: item.media_url })}
                >
                  <div className="text-xs truncate">{item.filename}</div>
                  <div className="text-xs text-gray-400">Category: {item.category ?? 'general'}</div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-dark-700 text-light-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delay Config */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">Delay (seconds)</div>
        <input
          type="number"
          min={0}
          max={60}
          value={data.delay_seconds ?? 0}
          onChange={e => updateData({ delay_seconds: Number(e.target.value) })}
          className="mt-2 h-8 w-full border border-dark-300 dark:border-dark-700 rounded-md bg-dark-600 dark:bg-dark-800 px-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Typing Indicator */}
      <div className="flex items-center gap-x-2">
        <input
          type="checkbox"
          checked={data.show_typing ?? true}
          onChange={e => updateData({ show_typing: e.target.checked })}
          className="size-4 accent-teal-600 outline-none focus:ring-2 focus:ring-teal-500"
        />
        <label className="text-xs font-medium text-light-100">Show typing indicator</label>
      </div>

      {/* Tone Selector */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">Tone</div>
        <select
          value={data.tone ?? 'neutral'}
          onChange={e => updateData({ tone: e.target.value as VoiceTemplateNodeData['tone'] })}
          className="mt-2 h-8 w-full rounded bg-dark-600 dark:bg-dark-800 px-2.5 text-sm border border-dark-300 dark:border-dark-700 outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="neutral">Neutral</option>
          <option value="friendly">Friendly</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>


      {/* Priority Selector */}
      <div className="flex flex-col">
        <div className="text-xs font-semibold text-light-900/60 dark:text-light-100/60">Priority</div>
        <select
          value={data.priority ?? 'normal'}
          onChange={e => updateData({ priority: e.target.value as VoiceTemplateNodeData['priority'] })}
          className="mt-2 h-8 w-full rounded bg-dark-600 dark:bg-dark-800 px-2.5 text-sm border border-dark-300 dark:border-dark-700 outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
      </div>


    </div>
  )
}
