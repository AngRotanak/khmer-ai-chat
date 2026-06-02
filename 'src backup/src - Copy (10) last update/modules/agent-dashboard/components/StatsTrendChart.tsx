import { Line } from 'react-chartjs-2'
import { useAgentStatsHistory } from '~/modules/agent-dashboard/hooks/useAgentStatsHistory'

export function StatsTrendChart() {
  const history = useAgentStatsHistory()

  const dates = Object.keys(history).sort()
  const satisfactionData = dates.map(d => history[d].satisfaction)
  const resolutionData = dates.map(d => history[d].resolutionRate)

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

  return <Line data={chartData} />
}
