/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from 'react'
import { db_firestore } from '~/lib/firebase'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  query,
} from 'firebase/firestore'
import { Bar, Pie, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale
)

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])

  // Real-time orders listener
  useEffect(() => {
    const ordersRef = collection(db_firestore, 'orders')
    const q = query(ordersRef, orderBy('createdAt', 'desc'))
    const unsubOrders = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsubOrders()
  }, [])

  // Update order status
  const updateStatus = async (id, status) => {
    const orderDoc = doc(db_firestore, 'orders', id)
    await updateDoc(orderDoc, { status })
  }

  // Analytics data
  const statusCounts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1
      return acc
    },
    {}
  )

  const dailyCounts = orders.reduce((acc, o) => {
    const date = new Date(o.createdAt).toLocaleDateString()
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const monthlyRevenue = orders.reduce((acc, o) => {
    const month = new Date(o.createdAt).toLocaleString('default', {
      month: 'short',
      year: 'numeric',
    })
    acc[month] = (acc[month] || 0) + (o.total || 0)
    return acc
  }, {})

  const salesTotals = orders.reduce((acc, o) => acc + (o.total || 0), 0)

  return (
    <div className="min-h-screen p-6 bg-light-50 dark:bg-dark-900">
      <h1 className="text-2xl font-bold mb-6">Admin - Orders & Analytics</h1>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Status Pie Chart */}
        <div className="bg-white dark:bg-dark-800 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Orders by Status</h2>
          <Pie
            data={{
              labels: Object.keys(statusCounts),
              datasets: [
                {
                  data: Object.values(statusCounts),
                  backgroundColor: ['#facc15', '#3b82f6', '#22c55e'],
                },
              ],
            }}
          />
        </div>

        {/* Daily Orders Line Chart */}
        <div className="bg-white dark:bg-dark-800 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Daily Orders</h2>
          <Line
            data={{
              labels: Object.keys(dailyCounts),
              datasets: [
                {
                  label: 'Orders',
                  data: Object.values(dailyCounts),
                  borderColor: '#3b82f6',
                  backgroundColor: '#93c5fd',
                },
              ],
            }}
          />
        </div>
      </div>

      {/* Monthly Revenue Bar Chart */}
      <div className="bg-white dark:bg-dark-800 p-4 rounded shadow mb-10">
        <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
        <Bar
          data={{
            labels: Object.keys(monthlyRevenue),
            datasets: [
              {
                label: 'Revenue ($)',
                data: Object.values(monthlyRevenue),
                backgroundColor: '#22c55e',
              },
            ],
          }}
        />
      </div>

      {/* Sales Summary */}
      <div className="bg-white dark:bg-dark-800 p-4 rounded shadow mb-10">
        <h2 className="text-lg font-semibold mb-2">Total Sales</h2>
        <p className="text-xl font-bold">${salesTotals.toFixed(2)}</p>
      </div>

      {/* Orders List */}
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
              <span className="font-semibold">Customer:</span> {order.userId}
            </p>
            <p className="mt-2">
              <span className="font-semibold">Status:</span> {order.status}
            </p>

            {/* Status Controls */}
            <div className="mt-4 flex gap-2">
              {['pending', 'shipped', 'delivered'].map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(order.id, status)}
                  className={`px-3 py-1 rounded ${
                    order.status === status
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

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
            <p className="mt-4 font-bold">Total: ${order.total?.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
