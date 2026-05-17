/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from 'react'
import { db_firestore, auth } from '~/lib/firebase'
import {
  doc,
  onSnapshot,
  getDocs,
  collection,
  setDoc,
  addDoc,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export default function CheckoutPage() {
  const [cart, setCart] = useState([])
  const [products, setProducts] = useState([])
  const [userId, setUserId] = useState(null)

  // Shipping info
  const [shipping, setShipping] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  })

  // Payment option
  const [paymentMethod, setPaymentMethod] = useState('credit')

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
  const cartProducts = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.id)
      return product ? { ...product, quantity: item.quantity } : null
    })
    .filter(Boolean)

  // Calculate total
  const totalPrice = cartProducts.reduce(
    (sum, p) => sum + (p.price - (p.discount || 0)) * p.quantity,
    0
  )

  // Handle checkout
  const handleCheckout = async () => {
    if (!userId) return
    const order = {
      userId,
      items: cartProducts,
      shipping,
      paymentMethod,
      total: totalPrice,
      createdAt: new Date().toISOString(),
      status: 'pending',
    }
    await addDoc(collection(db_firestore, 'orders'), order)

    // Clear cart after checkout
    const cartDoc = doc(db_firestore, 'carts', userId)
    await setDoc(cartDoc, { items: [] }, { merge: true })

    alert('✅ Order placed successfully!')
  }

  return (
    <div className="min-h-screen p-6 bg-light-50 dark:bg-dark-900">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {!userId ? (
        <p className="text-gray-600 dark:text-gray-400">
          Please sign in to proceed with checkout.
        </p>
      ) : cartProducts.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          Your cart is empty.
        </p>
      ) : (
        <>
          {/* Shipping Info */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Shipping Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                value={shipping.name}
                onChange={(e) =>
                  setShipping({ ...shipping, name: e.target.value })
                }
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Address"
                value={shipping.address}
                onChange={(e) =>
                  setShipping({ ...shipping, address: e.target.value })
                }
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="City"
                value={shipping.city}
                onChange={(e) =>
                  setShipping({ ...shipping, city: e.target.value })
                }
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={shipping.postalCode}
                onChange={(e) =>
                  setShipping({ ...shipping, postalCode: e.target.value })
                }
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Country"
                value={shipping.country}
                onChange={(e) =>
                  setShipping({ ...shipping, country: e.target.value })
                }
                className="border p-2 rounded"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Payment Method</h2>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="credit">Credit Card</option>
              <option value="paypal">PayPal</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </div>

          {/* Order Summary */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Order Summary</h2>
            <ul className="list-disc pl-6">
              {cartProducts.map((p) => (
                <li key={p.id}>
                  {p.title} × {p.quantity} — $
                  {(p.price - (p.discount || 0)) * p.quantity}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-lg font-bold">
              Total: ${totalPrice.toFixed(2)}
            </p>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded"
          >
            Place Order
          </button>
        </>
      )}
    </div>
  )
}
