import { create } from 'zustand'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '~/lib/firebase'


type User = {
  id: string
  email: string
  role: string
  displayName: string
  avatarUrl: string
}

type AuthState = {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
  restore: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    set({ user, token })
  },

  logout: () => {
    localStorage.clear()
    set({ user: null, token: null })
  },


restore: () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken()
      set({
        token,
        user: {
          id: user.uid,
          email: user.email || '',
          role: 'admin',
          displayName: user.displayName || 'Khmer Admin',
          avatarUrl: user.photoURL || '',
        },
      })
    }
  })
},

}))
