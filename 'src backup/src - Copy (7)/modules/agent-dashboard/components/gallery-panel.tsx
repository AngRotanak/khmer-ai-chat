import React, { useEffect, useState } from 'react'
import { collection, query, getDocs } from 'firebase/firestore'
import { db_firestore } from '~/lib/firebase'
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

// ✅ Lightweight clone for Agent Dashboard
export const AgentGalleryPanel: React.FC<{ onSelect?: (url: string, type: string) => void }> = ({ onSelect }) => {
  const user = useAuthStore(s => s.user)
  const adminId = user?.id

  const [items, setItems] = useState<MediaItem[]>([])
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // ✅ Fetch uploads (read‑only)
  useEffect(() => {
    if (!adminId) return
    const fetchItems = async () => {
      try {
        const q = query(collection(db_firestore, `admin_uploads/${adminId}/items`))
        const snap = await getDocs(q)
        const data: MediaItem[] = snap.docs.map(docSnap => {
          const d = docSnap.data()
          return {
            id: docSnap.id,
            media_url: d.media_url,
            media_type: d.media_type,
            filename: d.filename,
            category: d.category ?? 'general',
            tags: d.tags ?? [],
            size: d.size ?? 0,
          }
        })
        setItems(data)
      } catch (err) {
        console.error('Error fetching media items:', err)
      }
    }
    fetchItems()
  }, [adminId])

  // ✅ Filtering
  const filtered = items.filter(i => filter === 'all' || i.media_type === filter)
  const currentItem = selectedIndex !== null ? filtered[selectedIndex] : null

  return (
    <div className="p-4 bg-dark-800 rounded-lg space-y-4 relative">
      <h3 className="text-sm font-semibold text-light-100">Media Gallery</h3>

      {/* Filter by type */}
      <div className="flex gap-2">
        {['all', 'image', 'video', 'audio'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-3 py-1 rounded text-xs ${
              filter === f ? 'bg-teal-500 text-white' : 'bg-dark-600 text-light-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Scrollable Grid */}
      <div className="max-h-[400px] overflow-y-auto scrollbar-dark-teal">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className="border border-dark-600 rounded p-2 space-y-1 cursor-pointer hover:border-teal-500"
              onClick={() => onSelect?.(item.media_url, item.media_type)}
            >
              {item.media_type === 'image' && (
                <img src={item.media_url} alt={item.filename} className="w-full h-24 object-cover rounded" />
              )}
              {item.media_type === 'video' && (
                <video src={item.media_url} controls className="w-full h-24 rounded" />
              )}
              {item.media_type === 'audio' && (
                <audio src={item.media_url} controls className="w-full" />
              )}
              <div className="text-xs truncate">{item.filename}</div>
              <div className="text-xs text-gray-400">Category: {item.category}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Simple modal preview */}
      {currentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-dark-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-4 space-y-3">
            <h4 className="text-lg font-semibold text-light-100">Preview</h4>
            {currentItem.media_type === 'image' && (
              <img src={currentItem.media_url} alt={currentItem.filename} className="w-full rounded object-contain max-h-[60vh]" />
            )}
            {currentItem.media_type === 'video' && (
              <video src={currentItem.media_url} controls className="w-full rounded max-h-[60vh]" />
            )}
            {currentItem.media_type === 'audio' && (
              <audio src={currentItem.media_url} controls className="w-full" />
            )}
            <div className="text-sm text-light-100">{currentItem.filename}</div>
            <div className="flex justify-end">
              <button onClick={() => setSelectedIndex(null)} className="text-red-400 text-xs">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
