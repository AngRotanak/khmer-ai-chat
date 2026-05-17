import type { ReactNode } from "react"
import { DashboardHeader } from "./DashboardHeader"
import { DashboardFooter } from "./DashboardFooter"

interface DashboardLayoutProps {
  sidebar: ReactNode
  main: ReactNode
  headerTitle?: string
  headerRight?: ReactNode
  footerStatus?: "online" | "offline" | "busy"
  footerVersion?: string
}

export function DashboardLayout({
  sidebar,
  main,
  headerTitle = "Dashboard",
  headerRight,
  footerStatus = "online",
  footerVersion = "v1.0.0",
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-dark-900 text-light-100">
      {/* Sidebar */}
      <aside className="w-20 border-r border-khmer-primary flex flex-col items-center py-4">
        {sidebar}
      </aside>

      {/* Main content */}
      <main className="flex-grow flex flex-col">
        {/* <DashboardHeader title={headerTitle} rightContent={headerRight} /> */}
        <div className="flex-grow flex flex-col">{main}</div>
        {/* <DashboardFooter status={footerStatus} version={footerVersion} /> */}
      </main>
    </div>
  )
}
