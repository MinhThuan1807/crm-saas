import { AxiosError } from 'axios'

export interface ApiErrorResponse {
  message: string
  statusCode: number
  error?: string
}

export type ApiError = AxiosError<ApiErrorResponse>
