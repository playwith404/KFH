import axios, { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

import { API_BASE_URL } from '../config'
import { useAuthStore } from '../stores/auth'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

const raw = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

type RefreshResponse = { access_token: string; expires_in: number; refresh_token?: string }

let refreshPromise: Promise<RefreshResponse> | null = null

async function refreshAccessToken(): Promise<RefreshResponse> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) {
    throw new Error('No refresh token')
  }
  if (!refreshPromise) {
    refreshPromise = raw
      .post<RefreshResponse>('/auth/refresh', { refresh_token: refreshToken })
      .then((r) => r.data)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (!original) return Promise.reject(error)

    const status = error.response?.status
    const url = original.url ?? ''
    const isUnsafeToRetry =
      url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/logout') || url.includes('/auth/refresh')
    if (status === 401 && !original._retry && !isUnsafeToRetry) {
      original._retry = true
      try {
        const refreshed = await refreshAccessToken()
        useAuthStore.getState().setTokens(refreshed.access_token, refreshed.refresh_token ?? null)
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${refreshed.access_token}`
        return api.request(original)
      } catch (e) {
        useAuthStore.getState().clear()
        return Promise.reject(e)
      }
    }

    return Promise.reject(error)
  },
)
