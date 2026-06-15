import { Worker } from 'bullmq'
import { createRedis } from '../../common/providers/redis.provider'
import { AI_QUEUE_NAME } from './ai.queue'
import { PrismaService } from '../../common/services/prisma.service'
import { saveAiResultAtomic } from './ai.service'
import OpenAI from 'openai'
import { publishAiEvent } from './ai.sse'
import envConfig from '../../common/config'
import { z } from 'zod'

const connection = createRedis()
const prisma = new PrismaService()
const OPENAI_TIMEOUT_MS = 30_000

const AiResponseSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().min(1),
        dueDate: z.string().nullable().optional(),
      }),
    )
    .optional()
    .default([]),
  emailDraft: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
})

type AiResponseType = z.infer<typeof AiResponseSchema>

function withTimeout<T>(promise: Promise<T>, ms = OPENAI_TIMEOUT_MS) {
  return Promise.race([promise, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('OpenAI timeout')), ms))])
}

const isGroq = envConfig.AI_PROVIDER === 'groq';

const openai = new OpenAI(
  isGroq
    ? {
        apiKey: envConfig.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      }
    : {
        apiKey: envConfig.OPENAI_API_KEY,
      }
);

const MODEL = isGroq
  ? (envConfig.GROQ_MODEL || 'llama-3.3-70b-versatile')
  : (envConfig.OPENAI_MODEL || 'gpt-4o-mini');

async function callOpenAiAndParse(meetingNote: string, jobId: string, dealId: string): Promise<AiResponseType> {
  const prompt = `You are an assistant that extracts actionable items from a meeting note.\nReturn ONLY a single valid JSON object (no explanation) with keys:\n{\n  "tasks": [{ "title": "<string>", "dueDate": "<ISO-8601 or null>" }],\n  "emailDraft": "<string>",\n  "summary": "<string>"\n}\nNote: You MUST write a detailed follow-up email draft in Vietnamese under "emailDraft", and a brief summary in Vietnamese under "summary". Do not set them to null.\nMeeting Note:\n"""${meetingNote}"""\n`

  const doCall = async () => {
    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.0,
      max_tokens: 800,
    })
    const content = resp.choices?.[0]?.message?.content
    if (!content) throw new Error('No content from OpenAI')
    return String(content)
  }

  let text: string
  try {
    text = await withTimeout(doCall())
  } catch (err) {
    const e: any = new Error('OpenAI timeout or network error')
    e.code = 'OPENAI_TIMEOUT'
    e.raw = err
    throw e
  }

  const extractJson = (s: string) => {
    const m = s.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('No JSON object found in model output')
    return JSON.parse(m[0])
  }

  try {
    const parsed = extractJson(text)
    const validated = AiResponseSchema.parse(parsed)
    return validated
  } catch (firstErr) {
    try {
      const retryPrompt = `The previous output was not valid JSON. Reply with only a single valid JSON object matching schema {"tasks":[{"title":"string","dueDate":"ISO-8601 or null"}],"emailDraft":"string","summary":"string"}. All texts must be written in Vietnamese. Meeting note:\n"""${meetingNote}"""`
      const retryResp = await withTimeout(
        openai.chat.completions.create({
          model: MODEL,
          messages: [{ role: 'user', content: retryPrompt }],
          temperature: 0.0,
          max_tokens: 800,
        }),
      )
      const retryText = String(retryResp.choices?.[0]?.message?.content || '')
      const parsed2 = extractJson(retryText)
      const validated2 = AiResponseSchema.parse(parsed2)
      return validated2
    } catch (secondErr) {
      const e: any = new Error('OpenAI returned invalid JSON after retry')
      e.details = { first: (firstErr as Error).message, retry: (secondErr as Error).message }
      throw e
    }
  }
}

new Worker(
  AI_QUEUE_NAME,
  async (job) => {
    const { jobId, dealId, tenantId, userId, meetingNote } = job.data as {
      jobId: string
      dealId: string
      tenantId: string
      userId: string
      meetingNote: string
    }

    let aiResult: AiResponseType | null = null
    try {
      aiResult = await callOpenAiAndParse(meetingNote, jobId, dealId)
    } catch (err: any) {
      // Map known OpenAI errors to friendly SSE messages and publish to subscribers
      const status = err?.raw?.status || err?.status
      let reason = err?.code || status || 'OPENAI_ERROR'

      if (err.code === 'OPENAI_TIMEOUT') {
        console.error('OpenAI timeout', { jobId, dealId, err: err.raw })
        reason = 'OPENAI_TIMEOUT'
        try {
          publishAiEvent(tenantId, dealId, 'ai-error', {
            message: 'Phân tích AI mất quá nhiều thời gian. Vui lòng thử lại.',
            jobId,
            reason,
          })
        } catch (e) {
          console.error('Failed to publish SSE ai-error for timeout', { jobId, dealId, err: e })
        }
        throw new Error(reason)
      }

      if (status === 401 || status === 403) {
        console.error('OpenAI auth error', { jobId, dealId, status, message: err.message })
        reason = 'OPENAI_AUTH_ERROR'
        try {
          publishAiEvent(tenantId, dealId, 'ai-error', {
            message: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng liên hệ admin.',
            jobId,
            reason,
          })
        } catch (e) {
          console.error('Failed to publish SSE ai-error for auth', { jobId, dealId, err: e })
        }
        throw new Error(reason)
      }

      if (status === 429) {
        console.error('OpenAI rate limit', { jobId, dealId, status })
        reason = 'OPENAI_RATE_LIMIT'
        try {
          publishAiEvent(tenantId, dealId, 'ai-error', {
            message: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau vài phút.',
            jobId,
            reason,
          })
        } catch (e) {
          console.error('Failed to publish SSE ai-error for rate limit', { jobId, dealId, err: e })
        }
        throw new Error(reason)
      }

      console.error('OpenAI parse/response error', { jobId, dealId, message: err.message, details: err.details })
      try {
        publishAiEvent(tenantId, dealId, 'ai-error', {
          message: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại.',
          jobId,
          reason,
        })
      } catch (e) {
        console.error('Failed to publish SSE ai-error for generic OpenAI error', { jobId, dealId, err: e })
      }
      throw err
    }

    try {
      await saveAiResultAtomic(prisma, aiResult!, jobId, tenantId, dealId, meetingNote)
      await connection.incr(`cache:tenant_version:${tenantId}`)
      // publish ai-complete to any SSE subscribers
      try {
        publishAiEvent(tenantId, dealId, 'ai-complete', {
          tasks: aiResult!.tasks ?? [],
          emailDraft: aiResult!.emailDraft ?? null,
          summary: aiResult!.summary ?? null,
          jobId,
        })
      } catch (e) {
        console.error('Failed to publish SSE ai-complete', { jobId, dealId, err: e })
      }

      return { ok: true }
    } catch (err) {
      console.error('DB transaction failed', { jobId, dealId, err })
      try {
        publishAiEvent(tenantId, dealId, 'ai-error', { message: 'Lưu kết quả AI thất bại. Vui lòng thử lại.', jobId })
      } catch (e) {
        console.error('Failed to publish SSE ai-error', { jobId, dealId, err: e })
      }
      throw new Error(`DB transaction failed: ${String((err as Error).message || err)}`)
    }
  },
  { connection: connection as any, concurrency: 2 },
)
