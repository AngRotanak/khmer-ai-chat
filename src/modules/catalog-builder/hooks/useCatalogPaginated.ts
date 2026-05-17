/* eslint-disable */
// @ts-nocheck

import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore'
import { db } from '~/lib/firebase'
import type { Product } from '../types/catalogTypes'

export function useCatalogPaginated(pageSize: number = 10) {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [page, setPage] = useState(1)

  // ✅ Always enforce a safe limit
  const safeLimit = pageSize && pageSize > 0 ? pageSize : 10

  async function fetchPage(reset = false) {
    setLoading(true)
    try {
      let q = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc'),
        limit(safeLimit)
      )

      if (!reset && lastDoc) {
        q = query(
          collection(db, 'products'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(safeLimit)
        )
      }

      const snapshot = await getDocs(q)
      const products: Product[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[]

      setItems(products)
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)

      if (reset) setPage(1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage(true)
  }, [])

  return { items, loading, error, fetchPage, page, setPage }
}
