import React, { useEffect, useState } from 'react'
import {
  collection,
  query,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { nanoid } from 'nanoid'
import { storage, db_firestore } from '~/lib/firebase'
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

export const GalleryPanel: React.FC<{ onSelect?: (url: string, type: string) => void }> = ({ onSelect }) => {
  const user = useAuthStore(s => s.user)
  const adminId = user?.id

  const [items, setItems] = useState<MediaItem[]>([])
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all')
  const [categories, setCategories] = useState<string[]>(['general', 'marketing', 'product'])

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);



  const [tagsInput, setTagsInput] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('general')

  const [toast, setToast] = useState<string | null>(null)
  const [categoryInput, setCategoryInput] = useState('')

  const [showCategoryManager, setShowCategoryManager] = useState(false)


  // ✅ Fetch uploads
  useEffect(() => {
    if (!adminId) return
    const fetchItems = async () => {
      try {
        // ✅ point to subcollection under this admin
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

        // Build unique categories
        const uniqueCategories = new Set(items.map(i => i.category ?? 'general'))
        // Ensure "general" is always present
        uniqueCategories.add('general')
      } catch (err) {
        console.error('Error fetching media items:', err)
      }
    }
    fetchItems()
  }, [adminId])


  // ✅ Add new category
  const handleAddCategory = () => {
    const cat = categoryInput.trim().toLowerCase()
    if (cat && !categories.includes(cat)) {
      setCategories(prev => [...prev, cat])
      setCategoryInput('')
    }
  }

  const confirmRemoveCategory = (cat: string) => {
    if (!cat) return
    if (cat === 'general') {
      alert('Cannot remove the default "general" category.')
      return
    }
    if (window.confirm(`Are you sure you want to remove category "${cat}"? Items will be moved to "general".`)) {
      handleRemoveCategory(cat)
      setCategoryInput('')
    }
  }

  const handleRemoveCategory = async (cat: string) => {
    // Move items to "general"
    const itemsToUpdate = items.filter(i => i.category === cat)
    for (const item of itemsToUpdate) {
      await setDoc(doc(db_firestore, 'admin_uploads', item.id), {
        ...item,
        category: 'general'
      })
    }
    // Update local categories
    setCategories(prev => prev.filter(c => c !== cat))
  }


  // ✅ Upload single file
  const handleUpload = async (file: File) => {
    if (!adminId) return;

    try {
      const ext = file.name.split('.').pop();
      const filename = `${nanoid()}.${ext}`;
      const fileRef = ref(storage, `uploads/${adminId}/${filename}`);

      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      const type = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : 'audio';

      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      await setDoc(doc(db_firestore, `admin_uploads/${adminId}/items`, filename), {
        admin_id: adminId,
        filename: file.name,
        media_url: url,
        media_type: type,
        category: categoryFilter === 'all' ? 'general' : categoryFilter,
        tags,
        size: file.size,
        uploaded_at: serverTimestamp(),
      });

      setItems(prev => [
        ...prev,
        {
          id: filename,
          media_url: url,
          media_type: type,
          filename: file.name,
          category: categoryFilter === 'all' ? 'general' : categoryFilter,
          tags,
          size: file.size,
        },
      ]);

      setTagsInput('');
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };

  // ✅ Upload multiple files
  const handleUploadMultiple = async (files: FileList) => {
    for (const file of Array.from(files)) {
      await handleUpload(file);
    }
  };


  // ✅ Delete
  const handleDelete = async (id: string) => {
    if (!adminId) return
    try {
      await deleteDoc(doc(db_firestore, `admin_uploads/${adminId}/items`, id))
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error('Error deleting media item:', err)
    }
  }


  // ✅ Copy URL with toast
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setToast('✅ URL copied to clipboard!')
      setTimeout(() => setToast(null), 2000)
    })
  }

  // ✅ Filtering
  const filtered = items.filter(i =>
    (filter === 'all' || i.media_type === filter) &&
    (categoryFilter === 'all' || i.category === categoryFilter) &&
    (tagSearch === '' || i.tags?.some(tag =>
      tag.includes(tagSearch.toLowerCase())
    ))
  )



  const currentItem = selectedIndex !== null ? filtered[selectedIndex] : null

  return (
    <div className="p-4 bg-dark-800 rounded-lg space-y-4 relative">
      <h3 className="text-sm font-semibold text-light-100">Media Gallery</h3>

      {/* Toast at bottom-right */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-teal-600 text-white px-3 py-2 rounded shadow text-xs">
          {toast}
        </div>
      )}


      {/* Upload controls */}
      <div className="space-y-2">

        {/* Category dropdown row */}
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="flex-1 px-2 py-1 rounded bg-dark-700 text-light-100"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Toggle button */}
          <button
            onClick={() => setShowCategoryManager(prev => !prev)}
            className="px-2 py-1 text-xs rounded bg-dark-600 text-light-100 hover:bg-dark-500"
          >
            {showCategoryManager ? 'Close' : 'Edit'}
          </button>
        </div>

        {/* Add/Remove category block (hidden until toggled) */}
        {showCategoryManager && (
          <div className="space-y-2 mt-2">
            <input
              type="text"
              placeholder="Enter category name"
              value={categoryInput}
              onChange={e => setCategoryInput(e.target.value)}
              className="w-full px-2 py-1 rounded bg-dark-700 text-light-100"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleAddCategory}
                className="px-3 py-1 text-xs rounded bg-teal-600 text-white hover:bg-teal-500"
              >
                + Add
              </button>
              <button
                onClick={() => confirmRemoveCategory(categoryInput)}
                className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        )}


        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          className="w-full px-2 py-1 rounded bg-dark-700 text-light-100"
        />


        <input
          type="file"
          accept="image/*,video/*,audio/*"
          multiple
          onChange={e => {
            if (e.target.files) {
              handleUploadMultiple(e.target.files);
            }
          }}
          className="w-full text-sm text-light-100"
        />
      </div>

      {/* Filter by type */}
      <div className="flex gap-2">
        {['all', 'image', 'video', 'audio'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-3 py-1 rounded text-xs ${filter === f ? 'bg-teal-500 text-white' : 'bg-dark-600 text-light-100'
              }`}
          >
            {f}
          </button>
        ))}
      </div>


      {/* Tag search */}
      <input
        type="text"
        placeholder="Search by tag"
        value={tagSearch}
        onChange={e => setTagSearch(e.target.value)}
        className="w-full px-2 py-1 rounded bg-dark-700 text-light-100"
      />

      {/* Scrollable Grid */}
      <div className="max-h-[400px] overflow-y-auto scrollbar-dark-teal">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item, idx) => (
            <div key={item.id} className="border border-dark-600 rounded p-2 space-y-1">
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

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {item.tags?.map(tag => (
                  <span key={tag} className="bg-dark-600 text-xs px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {onSelect && (
                  <button
                    onClick={() => onSelect(item.media_url, item.media_type)}
                    className="text-teal-400 text-xs"
                  >
                    Use
                  </button>
                )}
                <button
                  onClick={() => handleCopyUrl(item.media_url)}
                  className="text-green-400 text-xs"
                >
                  URL
                </button>
                <button
                  onClick={() => setSelectedIndex(idx)}
                  className="text-blue-400 text-xs"
                >
                  View
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-400 text-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Popup modal for full view with navigation */}
      {currentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div
            className="bg-dark-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-4 space-y-3"
            onTouchStart={e => setTouchStart(e.changedTouches[0].clientX)}
            onTouchEnd={e => {
              if (touchStart === null) return;
              const delta = e.changedTouches[0].clientX - touchStart;

              // swipe right → prev
              if (delta > 50 && selectedIndex !== null && selectedIndex > 0) {
                setSelectedIndex(selectedIndex - 1);
              }

              // swipe left → next
              if (
                delta < -50 &&
                selectedIndex !== null &&
                selectedIndex < filtered.length - 1
              ) {
                setSelectedIndex(selectedIndex + 1);
              }

              setTouchStart(null);
            }}
          >
            <h4 className="text-lg font-semibold text-light-100">Media Details</h4>

            {currentItem.media_type === "image" && (
              <img
                src={currentItem.media_url}
                alt={currentItem.filename}
                className="w-full rounded object-contain max-h-[60vh]"
              />
            )}
            {currentItem.media_type === "video" && (
              <video
                src={currentItem.media_url}
                controls
                className="w-full rounded max-h-[60vh]"
              />
            )}
            {currentItem.media_type === "audio" && (
              <audio src={currentItem.media_url} controls className="w-full" />
            )}

            <div className="text-sm text-light-100">
              <strong>Filename:</strong> {currentItem.filename}
            </div>
            <div className="text-sm text-light-100">
              <strong>Category:</strong> {currentItem.category}
            </div>
            <div className="text-sm text-light-100">
              <strong>Size:</strong> {(currentItem.size / 1024).toFixed(1)} KB
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {currentItem.tags?.map(tag => (
                <span key={tag} className="bg-dark-600 text-xs px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-2">
              <button
                disabled={selectedIndex === 0}
                onClick={() =>
                  setSelectedIndex(prev => (prev !== null ? prev - 1 : null))
                }
                className="text-xs text-light-100 disabled:opacity-50"
              >
                ◀ Prev
              </button>
              <button
                disabled={selectedIndex === filtered.length - 1}
                onClick={() =>
                  setSelectedIndex(prev => (prev !== null ? prev + 1 : null))
                }
                className="text-xs text-light-100 disabled:opacity-50"
              >
                Next ▶
              </button>
            </div>

            {/* Actions inside modal */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentItem.media_url);
                  setToast("✅ URL copied to clipboard!");
                  setTimeout(() => setToast(null), 2000);
                }}
                className="text-green-400 text-xs"
              >
                Copy URL
              </button>
              <button
                onClick={() => setSelectedIndex(null)}
                className="text-red-400 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}


