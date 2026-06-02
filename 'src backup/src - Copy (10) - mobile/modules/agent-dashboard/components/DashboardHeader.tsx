import type { ReactNode } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

interface DashboardHeaderProps {
    title: string
    rightContent?: ReactNode
}

export function DashboardHeader({ title, rightContent }: DashboardHeaderProps) {
    return (
        <header className="flex items-center justify-between px-4 py-2 border-b border-dark-700 bg-dark-800">
            {/* Page title */}
            <h1 className="text-lg font-semibold text-light-100">{title}</h1>


            {/* Search + avatar or custom right content */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-48 pl-8 py-1.5 rounded-md bg-dark-700 text-light-100 border border-dark-600
                 focus:outline-none focus:border-khmer-primary placeholder-light-400"
                    />
                    <MagnifyingGlassIcon className="absolute left-2 top-1.5 h-4 w-4 text-light-400" />
                </div>

                {rightContent ? (
                    rightContent
                ) : (
                    <img
                        src="/agent-avatar.png"
                        alt="Agent"
                        className="h-8 w-8 rounded-full object-cover border border-khmer-primary shadow-sm"
                    />
                )}
            </div>


        </header>
    )
}
