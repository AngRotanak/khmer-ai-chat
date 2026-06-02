
interface Stats {
  active: number
  avgResponse: string
  resolutionRate: number
  satisfaction: string
}


export function AgentMetrics({ stats }: { stats: Stats }) {
  return (
    <section className="p-2 bg-dark-900 text-light-100 border-t border-dark-600 flex justify-around text-sm">
      <div>Active: {stats.active}</div>
      <div>Avg Response: {stats.avgResponse}</div>
      <div>Resolution Rate: {stats.resolutionRate}%</div>
      <div>Satisfaction: {stats.satisfaction}</div>
    </section>
  )
}
