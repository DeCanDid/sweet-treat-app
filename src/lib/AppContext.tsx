import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AppState = {
  user: User | null
  loading: boolean
  cartCount: number
  refreshCart: () => Promise<void>
}

const AppContext = createContext<AppState>({
  user: null,
  loading: true,
  cartCount: 0,
  refreshCart: async () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const refreshCart = useCallback(async () => {
    if (!session) return setCartCount(0)
    const { data } = await supabase.from('cart_items').select('quantity')
    setCartCount((data ?? []).reduce((sum, i) => sum + i.quantity, 0))
  }, [session])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  return (
    <AppContext.Provider value={{ user: session?.user ?? null, loading, cartCount, refreshCart }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
