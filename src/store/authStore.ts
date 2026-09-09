import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/profile'

interface AuthState {
  session: Session | null
  profile: Profile | null
  /** true mientras se resuelve la sesión inicial al cargar la app */
  isLoading: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  fetchProfile: (userId: string) => Promise<void>
  init: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[authStore] Error cargando perfil:', error.message)
      return
    }
    set({ profile: data as Profile | null })
  },

  init: async () => {
    const { data } = await supabase.auth.getSession()
    set({ session: data.session, isLoading: false })
    if (data.session?.user) {
      await get().fetchProfile(data.session.user.id)
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session })
      if (session?.user) {
        await get().fetchProfile(session.user.id)
      } else {
        set({ profile: null })
      }
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null })
  },
}))
