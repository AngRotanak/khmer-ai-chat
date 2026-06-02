import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexRedirect,
})

function IndexRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    navigate({ to: token ? '/dashboard' : '/login' })
  }, [navigate])

  return null
}
