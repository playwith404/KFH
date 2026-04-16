const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

const defaultApiBaseUrl = import.meta.env.PROD ? `${window.location.origin}/api/v1` : 'http://localhost:8700/api/v1'
const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.toString()

const shouldIgnoreEnvApiBaseUrl = Boolean(envApiBaseUrl && envApiBaseUrl.includes('localhost') && !isLocalHost)

export const API_BASE_URL = (shouldIgnoreEnvApiBaseUrl ? undefined : envApiBaseUrl) || defaultApiBaseUrl

const defaultWsBaseUrl = (() => {
  if (!import.meta.env.PROD) return 'ws://localhost:8700'
  const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${wsScheme}://${window.location.host}`
})()
const envWsBaseUrl = import.meta.env.VITE_WS_BASE_URL?.toString()

const shouldIgnoreEnvWsBaseUrl = Boolean(envWsBaseUrl && envWsBaseUrl.includes('localhost') && !isLocalHost)

export const WS_BASE_URL = (shouldIgnoreEnvWsBaseUrl ? undefined : envWsBaseUrl) || defaultWsBaseUrl
