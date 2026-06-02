type MetricsPanelProps = {
  responseTime: number // average response time in seconds
  resolutionRate: number // percentage of resolved conversations
  satisfaction: number // satisfaction score (0–100)
}

export function MetricsPanel({ responseTime, resolutionRate, satisfaction }: MetricsPanelProps) {
  return (
    <div className="p-4">
      <h2 className="font-bold mb-4">Agent Metrics</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Average Response Time:</span>
          <span className="font-semibold">{responseTime}s</span>
        </div>
        <div className="flex justify-between">
          <span>Resolution Rate:</span>
          <span className="font-semibold">{resolutionRate}%</span>
        </div>
        <div className="flex justify-between">
          <span>Customer Satisfaction:</span>
          <span className="font-semibold">{satisfaction}%</span>
        </div>
      </div>
    </div>
  )
}
