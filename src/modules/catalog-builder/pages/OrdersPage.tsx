/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from 'react'
import { db_firestore, auth } from '~/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [userId, setUserId] = useState(null)

  // Listen for auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid)
      else setUserId(null)
    })
    return () => unsubAuth()
  }, [])

  // Real-time orders listener
  useEffect(() => {
    if (!userId) return
    const ordersRef = collection(db_firestore, 'orders')
    const q = query(ordersRef, where('userId', '==', userId))
    const unsubOrders = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsubOrders()
  }, [userId])

  return (
    <div className="min-h-screen p-6 bg-light-50 dark:bg-dark-900">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

      {!userId ? (
        <p className="text-gray-600 dark:text-gray-400">
          Please sign in to view your orders.
        </p>
      ) : orders.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          You have no orders yet.
        </p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded p-4 bg-white dark:bg-dark-800 shadow"
            >
              <h2 className="text-lg font-semibold mb-2">
                Order #{order.id.slice(0, 6).toUpperCase()}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
              <p className="mt-2">
                <span className="font-semibold">Status:</span>{' '}
                <span
                  className={`px-2 py-1 rounded ${
                    order.status === 'pending'
                      ? 'bg-yellow-200 text-yellow-800'
                      : order.status === 'shipped'
                      ? 'bg-blue-200 text-blue-800'
                      : order.status === 'delivered'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {order.status}
                </span>
              </p>

              {/* Items */}
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Items:</h3>
                <ul className="list-disc pl-6">
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      {item.title} × {item.quantity} — $
                      {(item.price - (item.discount || 0)) * item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Total */}
              <p className="mt-4 font-bold">
                Total: ${order.total?.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
