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

export default function CartPage() {
  const [cart, setCart] = useState([])
  const [products, setProducts] = useState([])
  const [userId, setUserId] = useState(null)

  // Listen for auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid)
      else setUserId(null)
    })
    return () => unsubAuth()
  }, [])

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

  // Cart items with product details
  const cartProducts = cart.map((item) => {
    const product = products.find((p) => p.id === item.id)
    return product ? { ...product, quantity: item.quantity } : null
  }).filter(Boolean)

  // Update quantity
  const updateQuantity = async (id, quantity) => {
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity } : item
    )
    setCart(updatedCart)
    if (userId) {
      const cartDoc = doc(db_firestore, 'carts', userId)
      await setDoc(cartDoc, { items: updatedCart }, { merge: true })
    }
  }

  // Remove item
  const removeFromCart = async (id) => {
    const updatedCart = cart.filter((item) => item.id !== id)
    setCart(updatedCart)
    if (userId) {
      const cartDoc = doc(db_firestore, 'carts', userId)
      await setDoc(cartDoc, { items: updatedCart }, { merge: true })
    }
  }

  // Calculate total
  const totalPrice = cartProducts.reduce(
    (sum, p) => sum + (p.price - (p.discount || 0)) * p.quantity,
    0
  )

  // Proceed to checkout
  const proceedToCheckout = () => {
    console.log('Proceeding to checkout with:', cartProducts)
    // TODO: integrate with order pipeline / payment gateway
  }

  return (
    <div className="min-h-screen p-6 bg-light-50 dark:bg-dark-900">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {!userId ? (
        <p className="text-gray-600 dark:text-gray-400">
          Please sign in to view your cart.
        </p>
      ) : cartProducts.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">Your cart is empty.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cartProducts.map((cartProduct) => (
              <div key={cartProduct.id} className="relative border p-4 rounded">
                <ProductPreview product={cartProduct} />
                <div className="mt-2 flex items-center gap-2">
                  <label>Qty:</label>
                  <input
                    type="number"
                    min="1"
                    value={cartProduct.quantity}
                    onChange={(e) =>
                      updateQuantity(cartProduct.id, parseInt(e.target.value))
                    }
                    className="w-16 border rounded p-1"
                  />
                  <button
                    onClick={() => removeFromCart(cartProduct.id)}
                    className="ml-auto bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="mt-8 border-t pt-4">
            <h2 className="text-xl font-semibold mb-2">Summary</h2>
            <p className="text-lg">Total: ${totalPrice.toFixed(2)}</p>
            <button
              onClick={proceedToCheckout}
              className="mt-4 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  )
}
