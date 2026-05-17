import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  getAuth,
} from 'firebase/auth'
import { getDatabase, ref, set } from 'firebase/database'
import { useAuthStore } from '~/stores/auth-store'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const auth = getAuth()
      const db = getDatabase()

      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: name })

      const user = result.user
      const token = await user.getIdToken()

      // Store role in Realtime Database
      await set(ref(db, `khmer-ai-chat/users/${user.uid}`), {
        email: user.email,
        displayName: name,
        role: 'admin', // default role
      })

      login(
        {
          id: user.uid,
          email: user.email || '',
          role: 'admin',
          displayName: name,
          avatarUrl: user.photoURL || '',
        },
        token
      )

      navigate({ to: '/dashboard' })
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-900 text-white px-4">
      <h1 className="text-2xl font-bold mb-6">Create Admin Account</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="text"
          placeholder="Display Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 rounded bg-dark-700 text-white border border-teal-500"
        />
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
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
        >
          Sign Up
        </button>
      </form>
      <p className="text-sm text-gray-300 mt-4">
        Already have an account?{' '}
        <a href="/login" className="text-teal-400 underline">
          Log in
        </a>
      </p>
    </div>
  )
}
