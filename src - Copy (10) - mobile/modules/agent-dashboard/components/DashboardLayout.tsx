import React from "react"

export function DashboardLayout({
  sidebar,
  headerTitle,
  footerStatus,
  footerVersion,
  main,
}: {
  sidebar?: React.ReactNode
  headerTitle: string
  footerStatus: string
  footerVersion: string
  main: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {/* <header className="flex items-center justify-between p-4 border-b border-dark-600 bg-dark-800">
        <h1 className="text-light-100 font-semibold">{headerTitle}</h1>
        <span className="text-light-400 text-sm">{footerVersion}</span>
      </header> */}

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

      {/* Footer */}
      {/* <footer className="p-2 border-t border-dark-600 bg-dark-800 text-light-400 text-sm">
        Status: {footerStatus}
      </footer> */}
    </div>
  )
}
