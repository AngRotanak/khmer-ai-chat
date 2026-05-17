import type { ReactNode } from "react"

import { AdminHeader } from "./AdminHeader"
import { AppFooter } from "./AppFooter"

type AdminLayoutProps = {
  title: string
  children: ReactNode
}

export function AdminLayout({ title, children }: AdminLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white">
      {/* Shared Header */}
      <AdminHeader title={title} />

      {/* Main content */}
      <main className="flex-1 px-6 py-4 space-y-8 pb-24">
        {children}
      </main>

      {/* Shared Footer */}
      <AppFooter />
    </div>
  )
}
