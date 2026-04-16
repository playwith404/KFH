import { useQuery } from '@tanstack/react-query'

import { api } from './client'
import type { MeResponse, OnboardingStatus, PointsLedgerResponse } from './types'
import { useAuthStore } from '../stores/auth'

export function useMeQuery(enabled = true) {
  const setMe = useAuthStore((s) => s.setMe)
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<MeResponse>('/auth/me')
      setMe(res.data)
      return res.data
    },
    enabled,
    staleTime: 30_000,
  })
}

export function useOnboardingStatusQuery(enabled = true) {
  return useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: async () => {
      const res = await api.get<OnboardingStatus>('/onboarding/status')
      return res.data
    },
    enabled,
    staleTime: 10_000,
  })
}

export function usePointsLedgerQuery(enabled = true) {
  return useQuery({
    queryKey: ['points', 'ledger'],
    queryFn: async () => {
      const res = await api.get<PointsLedgerResponse>('/points/ledger')
      return res.data
    },
    enabled,
    staleTime: 5_000,
  })
}
