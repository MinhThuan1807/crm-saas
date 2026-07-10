import { DealStage } from '../../../../generated/prisma-client/client'

export const STAGE_PROBABILITIES = {
  [DealStage.PROSPECT]: 0.1,
  [DealStage.QUALIFIED]: 0.3,
  [DealStage.PROPOSAL]: 0.6,
  [DealStage.CLOSED_WON]: 1.0,
  [DealStage.CLOSED_LOST]: 0.0,
}

export function parseDates(startDateStr?: string, endDateStr?: string) {
  const now = new Date()
  let start = new Date(now.getFullYear(), 0, 1) // default Jan 1st of current year
  let end = new Date(now)

  if (startDateStr) {
    const parsed = new Date(startDateStr)
    if (!isNaN(parsed.getTime())) start = parsed
  }
  if (endDateStr) {
    const parsed = new Date(endDateStr)
    if (!isNaN(parsed.getTime())) end = parsed
  }
  return { start, end }
}
