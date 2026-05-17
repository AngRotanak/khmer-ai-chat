/* eslint-disable */
// @ts-nocheck

import { useState, useEffect } from 'react'
import { db_firestore } from '~/lib/firebase'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'

export interface ProductImage {
  id?: string
  url: string
  isCover: boolean
  thumbnail?: string
}

export interface Product {
  id?: string
  title: string
  description?: string
  price: number
  discount?: number
  video?: any
  images?: ProductImage[]
  tags?: string[]
  category?: string
  status?: 'draft' | 'published' | 'archived'
  createdAt?: number
  updatedAt?: number
  ownerUid?: string
  collaborators?: string[]
}

export function useProductEditor(adminUid: string, productId?: string) {
  const [product, setProduct] = useState<Product>({
    title: '',
    description: '',
    price: 0,
    discount: 0,
    video: null,
    images: [],
    tags: [],
    category: '',
    status: 'draft',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Load product if editing existing
  useEffect(() => {
    const fetchProduct = async () => {
      if (!adminUid || !productId) return
      setLoading(true)
      try {
        const ref = doc(db_firestore, `admin_uploads/${adminUid}/catalog/${productId}`)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() } as Product)
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [adminUid, productId])

  const updateField = (field: keyof Product, value: any) => {
    setProduct((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const generateThumbnail = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = imageUrl
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const maxWidth = 200
        const scale = maxWidth / img.width
        canvas.width = maxWidth
        canvas.height = img.height * scale
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg'))
      }
    })
  }

  const saveProduct = async () => {
    if (!product.title || product.price <= 0) {
      setError('Title and price are required')
      return
    }
    if (!adminUid) {
      setError('Missing admin UID')
      return
    }
    setLoading(true)
    try {
      let imagesPayload = product.images || []

      for (const img of imagesPayload) {
        if (img.url && !img.thumbnail) {
          img.thumbnail = await generateThumbnail(img.url)
        }
      }

      const payload: Product = {
        ...product,
        images: imagesPayload.map((img) => ({
          url: img.url,
          isCover: img.isCover || false,
          thumbnail: img.thumbnail || null,
        })),
        updatedAt: Date.now(),
        ownerUid: adminUid,
      }

      if (product.id) {
        const ref = doc(db_firestore, `admin_uploads/${adminUid}/catalog/${product.id}`)
        await updateDoc(ref, payload)
      } else {
        const newId = crypto.randomUUID()
        const ref = doc(db_firestore, `admin_uploads/${adminUid}/catalog/${newId}`)
        await setDoc(ref, {
          ...payload,
          createdAt: Date.now(),
          status: product.status || 'draft',
        })
        setProduct((prev) => ({ ...prev, id: newId }))
      }
      setSaved(true)
    } catch (err) {
      console.error(err)
      setError('Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async () => {
    if (!adminUid || !product.id) return
    setLoading(true)
    try {
      const ref = doc(db_firestore, `admin_uploads/${adminUid}/catalog/${product.id}`)
      await deleteDoc(ref)
      setProduct({
        title: '',
        description: '',
        price: 0,
        discount: 0,
        video: null,
        images: [],
        tags: [],
        category: '',
        status: 'draft',
      })
      setSaved(false)
    } catch (err) {
      console.error(err)
      setError('Failed to delete product')
    } finally {
      setLoading(false)
    }
  }

  return {
    product,
    loading,
    error,
    saved,
    updateField,
    saveProduct,
    deleteProduct,
  }
}
