import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getDatabase, ref, onValue, push, set } from 'firebase/database'

export const Route = createFileRoute('/dashboard/admin/deliveries')({
  component: DeliveryManagementPage,
})

function DeliveryManagementPage() {
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [orderId, setOrderId] = useState('')
  const [destination, setDestination] = useState('')
  const [driverId, setDriverId] = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const db = getDatabase()

  useEffect(() => {
    return onValue(ref(db, 'khmer-ai-chat/deliveries'), (snapshot) => {
      const data = snapshot.val() || {}
      setDeliveries(Object.values(data))
    })
  }, [])

  useEffect(() => {
    return onValue(ref(db, 'khmer-ai-chat/users'), (snapshot) => {
      const data = snapshot.val() || {}
      const driverList = Object.entries(data)
        .filter(([_, u]: any) => u.role === 'driver')
        .map(([uid, u]: any) => ({ id: uid, ...u }))
      setDrivers(driverList)
    })
  }, [])

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const newRef = push(ref(db, 'khmer-ai-chat/deliveries'))
      await set(newRef, {
        id: newRef.key,
        orderId,
        destination,
        driverId,
        status: 'Pending',
        createdAt: Date.now(),
      })

      setSuccess(`Delivery ${orderId} created successfully!`)
      setOrderId('')
      setDestination('')
      setDriverId('')
    } catch (err: any) {
      setError(err.message || 'Failed to create delivery')
    }
  }

  return (
    <div className="p-6 bg-dark-900 min-h-screen text-light-100">
      <h1 className="text-2xl font-bold mb-6 text-brand-teal">Delivery Management</h1>

      {/* ✅ Form using shortcuts */}
      <form onSubmit={handleCreateDelivery} className="panel space-y-4 max-w-md mb-6">
        <input
          type="text"
          placeholder="Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="input w-full"
        />
        <input
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="input w-full"
        />
        <select
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          className="input w-full"
        >
          <option value="">Assign Driver</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.displayName} ({d.email})
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary w-full">
          Create Delivery
        </button>
      </form>

      {error && <p className="text-khmer-danger">{error}</p>}
      {success && <p className="text-brand-teal">{success}</p>}

      {/* ✅ Table using shortcuts */}
      <h2 className="font-bold mb-4 text-brand-teal">All Deliveries</h2>
      <table className="w-full border-collapse panel">
        <thead>
          <tr className="table-header">
            <th className="p-2 border">Order ID</th>
            <th className="p-2 border">Destination</th>
            <th className="p-2 border">Driver</th>
            <th className="p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d) => (
            <tr key={d.id} className="hover:bg-dark-800">
              <td className="p-2 border">{d.orderId}</td>
              <td className="p-2 border">{d.destination}</td>
              <td className="p-2 border">
                {drivers.find((dr) => dr.id === d.driverId)?.displayName || 'Unassigned'}
              </td>
              <td className="p-2 border">{d.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
