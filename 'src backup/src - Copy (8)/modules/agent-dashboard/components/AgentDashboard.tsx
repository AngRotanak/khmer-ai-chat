import React from 'react'
import { Line } from 'react-chartjs-2'
import { useAgentStats } from '~/modules/agent-dashboard/hooks/useAgentStats'
import { useAgentStatsHistory } from '~/modules/agent-dashboard/hooks/useAgentStatsHistory'

export function AgentDashboard() {
    const { conversations, metrics } = useAgentStats()
    const history = useAgentStatsHistory()

    const dates = Object.keys(history).sort()
    const satisfactionData = dates.map(d => history[d]?.satisfaction ?? 0)
    const resolutionData = dates.map(d => history[d]?.resolutionRate ?? 0)

    const chartData = {
        labels: dates,
        datasets: [
            {
                label: 'Satisfaction',
                data: satisfactionData,
                borderColor: 'green',
                fill: false,
            },
            {
                label: 'Resolution Rate',
                data: resolutionData,
                borderColor: 'blue',
                fill: false,
            }
        ]
    }

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live Stats */}
            <div className="bg-white shadow rounded p-4">
                <h2 className="text-lg font-bold mb-4">📊 Live Stats</h2>
                <ul className="space-y-2">
                    <li>Active Conversations: {conversations.active}</li>
                    <li>Waiting: {conversations.waiting}</li>
                    <li>Resolved: {conversations.resolved}</li>
                    <li>Avg Response Time: {metrics.responseTime}s</li>
                    <li>Resolution Rate: {metrics.resolutionRate}%</li>
                    <li>Satisfaction: {metrics.satisfaction}%</li>
                </ul>
            </div>

            {/* Trend Chart */}
            <div className="bg-white shadow rounded p-4">
                <h2 className="text-lg font-bold mb-4">📈 Trends</h2>
                {/* ✅ Add key to avoid canvas reuse error */}
                <Line key={dates.join('-')} data={{
                    labels: dates,
                    datasets: [
                        { label: 'Satisfaction', data: satisfactionData, borderColor: 'green', fill: false },
                        { label: 'Resolution Rate', data: resolutionData, borderColor: 'blue', fill: false }
                    ]
                }} />
            </div>
        </div>
    )
}
