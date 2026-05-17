/* eslint-disable */
// @ts-nocheck


import { useState, useEffect } from 'react'
import { db_firestore } from '~/lib/firebase'
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  getDocs
} from 'firebase/firestore'

export interface CatalogItem {
  id?: string
  title: string
  description?: string
  price: number
  discount?: number
  images?: { url: string; isCover?: boolean; thumbnail?: string }[]
  video?: string
  tags?: string[]
  category?: string
  status?: 'draft' | 'published' | 'archived'
  createdAt?: number
  updatedAt?: number
  ownerUid?: string
}

export type SortOption = 'createdAt' | 'price' | 'discount' | 'title'

export function useCatalog(
  currentPageId: string,
  pageSize: number = 10,
  categoryFilter: string | null = null,
  sortBy: SortOption = 'createdAt',
  sortDirection: 'asc' | 'desc' = 'desc'
) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const safePageSize = pageSize && pageSize > 0 ? pageSize : 10

   useEffect(() => {
    if (!currentPageId ) return

    setLoading(true)
    const catalogRef = collection(db_firestore, `admin_uploads/${currentPageId}/catalog`)

    let q = query(
      catalogRef,
      where('status', '==', 'published'),
      orderBy(sortBy, sortDirection),
      limit(safePageSize)
    )

    if (categoryFilter) {
      q = query(
        catalogRef,
        where('status', '==', 'published'),
        where('category', '==', categoryFilter),
        orderBy(sortBy, sortDirection),
        limit(safePageSize)
      )
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const raw = doc.data()
          return {
            id: doc.id,
            title: raw.title || "",
            description: raw.description || "",
            category: raw.category || "",
            price: raw.price || 0,
            discount: raw.discount || 0,
            tags: raw.tags || [],
            images: raw.images || [],
            status: raw.status || "draft",
            createdAt: raw.createdAt || Date.now(),
            updatedAt: raw.updatedAt || Date.now(),
            ownerUid: raw.ownerUid || adminUid,
          } as CatalogItem
        })
        setItems(data)
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
        setHasMore(snapshot.docs.length === safePageSize)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('Failed to load catalog')
        setLoading(false)
      }
    )

    return () => {
      unsub && unsub()
    }
  }, [currentPageId, safePageSize, categoryFilter, sortBy, sortDirection])


  const loadMore = async () => {
    if (!lastDoc || !hasMore || !currentPageId) return
    const catalogRef = collection(db_firestore, `admin_uploads/${currentPageId}/catalog`)
    let q = query(
      catalogRef,
      where('status', '==', 'published'),
      orderBy(sortBy, sortDirection),
      startAfter(lastDoc),
      limit(safePageSize)
    )

    if (categoryFilter) {
      q = query(
        catalogRef,
        where('status', '==', 'published'),
        where('category', '==', categoryFilter),
        orderBy(sortBy, sortDirection),
        startAfter(lastDoc),
        limit(safePageSize)
      )
    }

    const snapshot = await getDocs(q)
    const data = snapshot.docs.map((doc) => {
      const raw = doc.data()
      return {
        id: doc.id,
        title: raw.title || "",
        description: raw.description || "",
        category: raw.category || "",
        price: raw.price || 0,
        discount: raw.discount || 0,
        tags: raw.tags || [],
        images: raw.images || [],
        status: raw.status || "draft",
        createdAt: raw.createdAt || Date.now(),
        updatedAt: raw.updatedAt || Date.now(),
        ownerUid: raw.ownerUid || currentPageId,
      } as CatalogItem
    })
    setItems((prev) => [...prev, ...data])
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
    setHasMore(snapshot.docs.length === safePageSize)
  }

  const addItem = async (item: CatalogItem) => {
    try {
      const catalogRef = collection(db_firestore, `admin_uploads/${currentPageId}/catalog`)
      await addDoc(catalogRef, {
        ...item,
        title: item.title || "",
        category: item.category || "",
        tags: item.tags || [],
        images: item.images || [],
        status: item.status || 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ownerUid: currentPageId,
      })
    } catch (err) {
      console.error(err)
      setError('Failed to add item')
    }
  }

  const updateItem = async (id: string, updates: Partial<CatalogItem>) => {
    try {
      const itemDoc = doc(db_firestore, `admin_uploads/${currentPageId}/catalog/${id}`)
      await updateDoc(itemDoc, { ...updates, updatedAt: Date.now() })
    } catch (err) {
      console.error(err)
      setError('Failed to update item')
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const itemDoc = doc(db_firestore, `admin_uploads/${currentPageId}/catalog/${id}`)
      await deleteDoc(itemDoc)
    } catch (err) {
      console.error(err)
      setError('Failed to delete item')
    }
  }

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    addItem,
    updateItem,
    deleteItem
  }
}
