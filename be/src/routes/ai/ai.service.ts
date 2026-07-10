import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { aiQueue } from './ai.queue'
import { v4 as uuidv4 } from 'uuid'
import { PrismaService } from '../../common/services/prisma.service'
import { openai, AI_MODEL } from './ai.client'

export interface EnqueueOpts {
  dealId: string
  tenantId: string
  userId: string
  meetingNote: string
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)

  constructor(private readonly prisma: PrismaService) {}

  async callModel(prompt: string, options?: { temperature?: number }) {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? 0.1,
    });
    return response.choices[0]?.message?.content || '';
  }

  async enqueueAnalysis(opts: EnqueueOpts) {
    const jobId = uuidv4()
    const payload = { jobId, ...opts }

    try {
      const job = await aiQueue.add('analyze', payload, {
        attempts: 3,
        backoff: { type: 'fixed', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      })

      return jobId
    } catch (err) {
      // bubble up as 503 so controller can return SERVICE_UNAVAILABLE
      throw new HttpException('AI queue unavailable. Please try later.', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  // Instance wrapper for convenience when used inside Nest context
  async saveAiResultAtomic(
    parsed: { tasks?: Array<{ title: string; dueDate?: string }>; emailDraft?: string | null; summary?: string | null },
    jobId: string,
    tenantId: string,
    dealId: string,
    sourceNote?: string,
  ) {
    return saveAiResultAtomic(this.prisma, parsed, jobId, tenantId, dealId, sourceNote, this.logger)
  }
}

// Exported helper so non-Nest workers (e.g. standalone Bull worker) can reuse the same logic
export async function saveAiResultAtomic(
  prisma: PrismaService,
  parsed: { tasks?: Array<{ title: string; dueDate?: string }>; emailDraft?: string | null; summary?: string | null },
  jobId: string,
  tenantId: string,
  dealId: string,
  sourceNote?: string,
  logger?: Logger,
) {
  const log = logger ?? new Logger('saveAiResultAtomic')

  return prisma.$transaction(async (tx) => {
    // create SUMMARY
    await tx.aiSuggestion.create({
      data: {
        tenantId,
        jobId,
        dealId,
        type: 'SUMMARY',
        content: JSON.stringify({ summary: parsed.summary ?? null }),
        sourceNote: sourceNote ?? null,
      },
    })

    // create EMAIL_DRAFT
    await tx.aiSuggestion.create({
      data: {
        tenantId,
        jobId,
        dealId,
        type: 'EMAIL_DRAFT',
        content: JSON.stringify({ emailDraft: parsed.emailDraft ?? null }),
        sourceNote: sourceNote ?? null,
      },
    })

    // create TASK_LIST
    await tx.aiSuggestion.create({
      data: {
        tenantId,
        jobId,
        dealId,
        type: 'TASK_LIST',
        content: JSON.stringify({ tasks: parsed.tasks ?? [] }),
        sourceNote: sourceNote ?? null,
      },
    })

    return { suggestionsCreated: 3, tasksCreated: 0 }
  })
}
