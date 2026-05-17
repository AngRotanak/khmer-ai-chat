import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { getDatabase, ref, get } from 'firebase/database'
import { useAuthStore } from '~/stores/auth-store'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)

  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const auth = getAuth()
      const db = getDatabase()

      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      )

      const result = await signInWithEmailAndPassword(auth, email, password)
      const user = result.user
      const token = await user.getIdToken()

      const snapshot = await get(ref(db, `khmer-ai-chat/users/${user.uid}`))
      const role = snapshot.exists() ? snapshot.val().role : 'viewer'

      login(
        {
          id: user.uid,
          email: user.email || '',
          role,
          displayName: user.displayName || 'Khmer Admin',
          avatarUrl: user.photoURL || '',
        },
        token
      )

      // ✅ Instead of redirecting immediately, show selection screen
      setLoggedIn(true)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('rememberMe')
    if (saved !== null) setRememberMe(saved === 'true')
  }, [])

  useEffect(() => {
    localStorage.setItem('rememberMe', String(rememberMe))
  }, [rememberMe])

  // ✅ If logged in, show selection screen
  if (loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark-900 text-white px-4">
        <h1 className="text-2xl font-bold mb-6">Welcome</h1>
        <p className="mb-4 text-gray-300">Select where you want to go:</p>
        <div className="space-y-3 w-full max-w-sm">
          <button
            onClick={() => navigate({ to: '/dashboard/flow' })}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
          >
            Flow Builder
          </button>
          <button
            onClick={() => navigate({ to: '/dashboard/agents' })}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
          >
            Agent Dashboard
          </button>
          <button
            onClick={() => navigate({ to: '/dashboard/admin/reply-helpers' })}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
          >
            Manage Reply Helpers
          </button>
          <button
            onClick={() => navigate({ to: '/smart-catalog' })}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
          >
            Smart e‑catalog
          </button>

          {/* <button
            onClick={() =>
              navigate({
                to: '/track/$tracking_id',
                params: { tracking_id: delivery.tracking_id },
              })
            }

            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
          >
            Track Delivery
          </button> */}


        </div>
      </div>
    )
  }

  // ✅ Default login form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-900 text-white px-4">
      <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 rounded bg-dark-700 text-white border border-teal-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 rounded bg-dark-700 text-white border border-teal-500"
        />

        <label
          className="flex items-center space-x-2 text-sm text-gray-300 group"
          title="Stay logged in after closing the browser. រក្សាទុកការចូលប្រើប្រាស់"
        >
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="form-checkbox h-4 w-4 text-teal-500"
          />
          <span>
            Remember Me{' '}
            <span className="text-xs text-gray-400">(រក្សាទុកការចូលប្រើប្រាស់)</span>
          </span>
        </label>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
        >
          Log In
        </button>
      </form>

      <p className="text-sm text-gray-300 mt-4">
        Need an account?{' '}
        <a href="/signup" className="text-teal-400 underline">
          Sign up
        </a>
      </p>
    </div>
  )
}
