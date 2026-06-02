import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/unauthorized')({
  component: UnauthorizedPage,
})

function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-900 text-white px-4">
      <h1 className="text-3xl font-bold mb-4 text-red-500">Access Denied</h1>
      <p className="text-lg text-gray-300 mb-6 text-center">
        You don’t have permission to access this page. Please contact an admin if you believe this is a mistake.
      </p>
      <button
        onClick={() => navigate({ to: '/login' })}
        className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
      >
        Return to Login
      </button>
    </div>
  )
}
