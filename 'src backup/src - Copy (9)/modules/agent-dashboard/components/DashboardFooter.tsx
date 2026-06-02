interface DashboardFooterProps {
  status?: "online" | "offline" | "busy"
  version?: string
}

export function DashboardFooter({ status = "online", version = "v1.0.0" }: DashboardFooterProps) {
  const statusColor =
    status === "online" ? "bg-khmer-primary" :
    status === "busy" ? "bg-khmer-warning" :
    "bg-khmer-danger"

  return (
    <footer className="flex items-center justify-between px-4 py-2 border-t border-dark-700 bg-dark-800 text-xs text-light-400">
      {/* Agent status */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${statusColor}`} />
        <span className="capitalize">{status}</span>
      </div>

      {/* Version info */}
      <span>{version}</span>
    </footer>
  )
}
