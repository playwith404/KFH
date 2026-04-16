import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'HUNTER' | 'POLICE' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED'

export type Me = {
  id: string
  email: string
  role: UserRole
  status: UserStatus
}

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  me: Me | null
  setTokens: (accessToken: string, refreshToken?: string | null) => void
  setMe: (me: Me | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      me: null,
      setTokens: (accessToken, refreshToken) =>
        set((prev) => ({
          ...prev,
          accessToken,
          refreshToken: refreshToken ?? prev.refreshToken,
        })),
      setMe: (me) => set({ me }),
      clear: () => set({ accessToken: null, refreshToken: null, me: null }),
    }),
    { name: 'khp_auth' },
  ),
)
