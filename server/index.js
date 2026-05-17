import express from 'express'
import cors from 'cors'
import agentStatsRouter from './routes/agentStats.js'

const app = express()
const PORT = 3000

// ✅ Allow requests from your frontend (5173)
app.use(cors({
  origin: 'http://localhost:5173'
}))

app.use(express.json())
app.use('/api/agent', agentStatsRouter)

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})
