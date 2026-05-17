import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { useAuthStore } from '~/stores/auth-store'
import { NavigationBarModule } from '~/modules/navigation-bar/navigation-bar-module'

export const Route = createFileRoute('/dashboard/')({
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user, token, restore } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    restore()
    const timeout = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!loading) {
      if (!token) {
        navigate({ to: '/login' })          // logged out → go to login
      } else if (user?.role !== 'admin') {
        navigate({ to: '/unauthorized' })   // logged in but not admin
      }
    }
  }, [loading, token, user?.role, navigate])

  if (loading || !token || user?.role !== 'admin') return null

  return (
    <HelmetProvider>
      <Helmet>
        <title>KhmerAi.Chat Admin Dashboard</title>
        <meta name="theme-color" content="#009CA6" />
      </Helmet>

      <div className="flex flex-col min-h-screen bg-dark-900 text-white">
        {/* ✅ Top navigation bar */}
        <NavigationBarModule />

        {/* ✅ Central hub content */}
        <div className="flex flex-col items-center justify-center flex-1 px-4">
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
          <p className="mb-4 text-gray-300">Select a module to manage:</p>

          <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
            <button
              onClick={() => navigate({ to: '/dashboard/flow' })}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
            >
              Flow Builder
            </button>
            <button
              onClick={() => navigate({ to: '/dashboard/agents' })}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
            >
              Agent Dashboard
            </button>
            <button
              onClick={() => navigate({ to: '/dashboard/admin/reply-helpers' })}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
            >
              Manage Reply Helpers
            </button>
            <button
              onClick={() => navigate({ to: '/smart-catalog' })}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
            >
              Smart e‑catalog
            </button>
            <button
              onClick={() => navigate({ to: '/dashboard/admin/create-driver' })}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
            >
              Create Driver
            </button>
            <button
              onClick={() => navigate({ to: '/dashboard/admin/deliveries' })}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
            >
              Delivery Management
            </button>
            <button
              onClick={() => navigate({ to: '/dashboard/admin/driver-map' })}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
            >
              Driver Activity Map
            </button>
          </div>
        </div>
      </div>
    </HelmetProvider>
  )
}

export default AdminDashboardPage
