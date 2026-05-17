import React from "react"

export function DashboardLayout({
  sidebar,
  // headerTitle,
  // footerStatus,
  // footerVersion,
  main,
}: {
  sidebar?: React.ReactNode
  headerTitle: string
  footerStatus: string
  footerVersion: string
  main: React.ReactNode
}) {
  return (
   <main className="flex-grow flex flex-col overflow-hidden">
    

      {/* Main content area */}
      <div className="flex flex-grow overflow-hidden">
        {/* ✅ Sidebar only renders on desktop */}
        {sidebar && (
          <aside className="hidden md:block w-80 border-r border-dark-600 bg-dark-900">
            {sidebar}
          </aside>
        )}

        {/* Main content fills remaining space */}
        <main className="flex-grow overflow-y-auto">{main}</main>
      </div>

    
    </main>
  )
}
