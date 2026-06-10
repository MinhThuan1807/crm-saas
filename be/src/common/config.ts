import z from 'zod'

import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'

const envFilePath = path.resolve('.env')

// Support both local .env file and container-injected environment variables.
if (fs.existsSync(envFilePath)) {
  config({ path: envFilePath })
}

const ConfigSchema = z.object({
  DATABASE_URL: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),

  FRONTEND_URL: z.string(),
  NODE_ENV: z.string(),
  PORT: z.string(),

  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().positive(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
})

// const configServer = plainToInstance(ConfigSchema, process.env);
const configServer = ConfigSchema.safeParse(process.env)

if (!configServer.success) {
  console.log('Invalid environment variables:')
  // throw configServer.error;
  console.log(configServer.error)
  process.exit(1)
}

// console.log(process.env)
// console.log(e);

const envConfig = configServer.data

export default envConfig
