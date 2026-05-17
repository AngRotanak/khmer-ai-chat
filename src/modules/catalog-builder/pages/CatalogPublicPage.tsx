/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect, useRef, useCallback } from 'react'
import ProductPreview from '../components/ProductPreview'
import CategorySidebar from '../components/CategorySidebar'
import { db_firestore, auth } from '~/lib/firebase'
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export default function CatalogPublicPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [sortOption, setSortOption] = useState('title') // default sort

  // Favorites state
  const [favorites, setFavorites] = useState([])
  const [userId, setUserId] = useState(null)

  // Pagination state
  const [lastDoc, setLastDoc] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const loaderRef = useRef(null)

  // Firestore references
  const productsRef = collection(db_firestore, 'products')
  const categoriesRef = collection(db_firestore, 'categories')

  // Listen for auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid)
        // Load favorites from Firestore
        const favDoc = doc(db_firestore, 'favorites', user.uid)
        const snapshot = await getDoc(favDoc)
        if (snapshot.exists()) {
          setFavorites(snapshot.data().items || [])
        }
      } else {
        setUserId(null)
        setFavorites([])
      }
    })
    return () => unsubAuth()
  }, [])

  // Initial load with real-time listener
  useEffect(() => {
    const q = query(productsRef, orderBy(sortOption), limit(9))
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setProducts(docs)
      setLastDoc(snapshot.docs[snapshot.docs.length - 1])
      setHasMore(snapshot.docs.length === 9)
    })

    const unsubCategories = onSnapshot(categoriesRef, (snapshot) => {
      setCategories(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })

    return () => {
      unsub()
      unsubCategories()
    }
  }, [sortOption])

  // Load more products (pagination)
  const loadMore = useCallback(async () => {
    if (!lastDoc || loadingMore) return
    setLoadingMore(true)
    const q = query(productsRef, orderBy(sortOption), startAfter(lastDoc), limit(9))
    const snapshot = await getDocs(q)
    const newDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    setProducts((prev) => [...prev, ...newDocs])
    setLastDoc(snapshot.docs[snapshot.docs.length - 1])
    setHasMore(snapshot.docs.length === 9)
    setLoadingMore(false)
  }, [lastDoc, loadingMore, sortOption])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore()
        }
      },
      { threshold: 1 }
    )
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current)
    }
  }, [loadMore, hasMore])

  // Filter products by category, search, and tag
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory ? p.category === activeCategory : true
    const matchesSearch = searchTerm
      ? p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      : true
    const matchesTag = activeTag ? p.tags?.includes(activeTag) : true
    return matchesCategory && matchesSearch && matchesTag
  })

  // Toggle favorites with Firestore persistence
  const toggleFavorite = async (id) => {
    let updated
    if (favorites.includes(id)) {
      updated = favorites.filter((f) => f !== id)
    } else {
      updated = [...favorites, id]
    }
    setFavorites(updated)

    if (userId) {
      const favDoc = doc(db_firestore, 'favorites', userId)
      await setDoc(favDoc, { items: updated }, { merge: true })
    }
  }

  return (
    <div className="flex min-h-screen bg-light-50 dark:bg-dark-900">
      {/* Sidebar for categories */}
      <CategorySidebar
        categories={categories}
        onSelect={(id) => setActiveCategory(id)}
        onAddCategory={() => {}}
        onMoveCategory={() => {}}
      />

      {/* Main catalog grid */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Our Catalog</h1>

        {/* Search + Tag Filters + Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full sm:w-1/3 border p-2 rounded"
          />

          <div className="flex gap-2">
            {['New', 'Sale', 'Featured'].map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-3 py-1 rounded ${
                  activeTag === tag
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="title">Sort: Title (A-Z)</option>
            <option value="price">Sort: Price (Low → High)</option>
            <option value="discount">Sort: Discount (High → Low)</option>
            <option value="createdAt">Sort: Newest</option>
          </select>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No products found {activeCategory ? `in this category` : ''}{' '}
            {activeTag ? `with tag "${activeTag}"` : ''}.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="relative">
                  <ProductPreview product={product} />
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className={`absolute top-2 right-2 px-2 py-1 rounded ${
                      favorites.includes(product.id)
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {favorites.includes(product.id) ? '♥' : '♡'}
                  </button>
                </div>
              ))}
            </div>

            {/* Infinite Scroll Loader */}
            {hasMore && (
              <div ref={loaderRef} className="flex justify-center mt-6">
                {loadingMore && (
                  <span className="text-gray-500 dark:text-gray-400">
                    Loading more products...
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Your Wishlist</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products
                .filter((p) => favorites.includes(p.id))
                .map((favProduct) => (
                  <ProductPreview key={favProduct.id} product={favProduct} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
