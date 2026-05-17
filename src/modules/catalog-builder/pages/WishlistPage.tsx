/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from 'react'
import ProductPreview from '../components/ProductPreview'
import { db_firestore, auth } from '~/lib/firebase'
import {
  doc,
  onSnapshot,
  getDocs,
  collection,
  setDoc,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export default function WishlistPage() {
  const [favorites, setFavorites] = useState([])
  const [products, setProducts] = useState([])
  const [userId, setUserId] = useState(null)
  const [cart, setCart] = useState([])

  // Listen for auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid)
      else setUserId(null)
    })
    return () => unsubAuth()
  }, [])

  // Real-time favorites listener
  useEffect(() => {
    if (!userId) return
    const favDoc = doc(db_firestore, 'favorites', userId)
    const unsubFav = onSnapshot(favDoc, (snapshot) => {
      if (snapshot.exists()) {
        setFavorites(snapshot.data().items || [])
      } else {
        setFavorites([])
      }
    })
    return () => unsubFav()
  }, [userId])

  // Real-time cart listener
  useEffect(() => {
    if (!userId) return
    const cartDoc = doc(db_firestore, 'carts', userId)
    const unsubCart = onSnapshot(cartDoc, (snapshot) => {
      if (snapshot.exists()) {
        setCart(snapshot.data().items || [])
      } else {
        setCart([])
      }
    })
    return () => unsubCart()
  }, [userId])

  // Fetch all products once
  useEffect(() => {
    async function loadProducts() {
      const snapshot = await getDocs(collection(db_firestore, 'products'))
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    }
    loadProducts()
  }, [])

  // Filter products by favorites
  const favoriteProducts = products.filter((p) => favorites.includes(p.id))

  // Remove from wishlist
  const removeFavorite = async (id) => {
    const updated = favorites.filter((f) => f !== id)
    setFavorites(updated)
    if (userId) {
      const favDoc = doc(db_firestore, 'favorites', userId)
      await setDoc(favDoc, { items: updated }, { merge: true })
    }
  }

  // Move to cart
  const moveToCart = async (id) => {
    const updatedCart = [...cart, id]
    setCart(updatedCart)

    // Remove from wishlist
    const updatedFavorites = favorites.filter((f) => f !== id)
    setFavorites(updatedFavorites)

    if (userId) {
      const cartDoc = doc(db_firestore, 'carts', userId)
      await setDoc(cartDoc, { items: updatedCart }, { merge: true })

      const favDoc = doc(db_firestore, 'favorites', userId)
      await setDoc(favDoc, { items: updatedFavorites }, { merge: true })
    }
  }

  return (
    <div className="min-h-screen p-6 bg-light-50 dark:bg-dark-900">
      <h1 className="text-2xl font-bold mb-6">Your Wishlist</h1>

      {!userId ? (
        <p className="text-gray-600 dark:text-gray-400">
          Please sign in to view your wishlist.
        </p>
      ) : favoriteProducts.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          No favorites saved yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteProducts.map((favProduct) => (
            <div key={favProduct.id} className="relative">
              <ProductPreview product={favProduct} />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => removeFavorite(favProduct.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Remove
                </button>
                <button
                  onClick={() => moveToCart(favProduct.id)}
                  className="bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700"
                >
                  Move to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart Section */}
      {cart.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products
              .filter((p) => cart.includes(p.id))
              .map((cartProduct) => (
                <ProductPreview key={cartProduct.id} product={cartProduct} />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
