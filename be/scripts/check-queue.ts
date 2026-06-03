import 'dotenv/config'
import { aiQueue } from '../src/routes/ai/ai.queue'

async function main() {
  const jobs = await aiQueue.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed'])
  console.log(
    'jobs:',
    jobs.map((j) => ({
      id: j.id,
      name: j.name,
      state: j.finishedOn ? 'completed' : j.processedOn ? 'active' : j.delay && j.delay > 0 ? 'delayed' : 'waiting',
      attempts: j.attemptsMade,
    })),
  )
  await aiQueue.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
