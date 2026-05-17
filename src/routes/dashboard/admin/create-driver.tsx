import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { getDatabase, ref, set } from 'firebase/database'

export const Route = createFileRoute('/dashboard/admin/create-driver')({
  component: CreateDriverPage,
})

function CreateDriverPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const auth = getAuth()
      const db = getDatabase()

      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: name })

      const user = result.user

      await set(ref(db, `khmer-ai-chat/users/${user.uid}`), {
        email: user.email,
        displayName: name,
        role: 'driver',
        businessId,
        createdAt: Date.now(),
      })

      setSuccess(`Driver ${name} created successfully!`)
      setEmail('')
      setPassword('')
      setName('')
      setBusinessId('')
    } catch (err: any) {
      setError(err.message || 'Failed to create driver')
    }
  }

  return (
    <div className="p-6 bg-dark-900 min-h-screen text-light-100">
      <h1 className="text-2xl font-bold mb-6 text-brand-teal">Create Driver Account</h1>

      {/* ✅ Form using shortcuts */}
      <form onSubmit={handleSubmit} className="panel space-y-4 max-w-md">
        <input
          type="text"
          placeholder="Driver Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input w-full"
        />
        <input
          type="email"
          placeholder="Driver Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input w-full"
        />
        <input
          type="password"
          placeholder="Temporary Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input w-full"
        />
        <input
          type="text"
          placeholder="Business ID"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          className="input w-full"
        />

        {error && <p className="text-khmer-danger">{error}</p>}
        {success && <p className="text-brand-teal">{success}</p>}

        <button type="submit" className="btn-primary w-full">
          Create Driver
        </button>
      </form>
    </div>
  )
}
