import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useApp } from '../lib/AppContext'

const API = process.env.EXPO_PUBLIC_API_URL

export default function PaymentCallback() {
  const { reference } = useLocalSearchParams<{ reference?: string }>()
  const router = useRouter()
  const { refreshCart } = useApp()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('')
  const [emailSent, setEmailSent] = useState(true)
  const ran = useRef(false)

  useEffect(() => {
    if (!reference) {
      setStatus('failed')
      setMessage('Missing payment reference.')
      return
    }
    if (ran.current) return
    ran.current = true

    const run = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setStatus('failed')
        setMessage('You are not logged in. Please log in again.')
        return
      }
      try {
        const res = await fetch(`${API}/api/paystack/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ reference }),
        })
        const json = await res.json()
        if (res.ok) {
          setEmailSent(json.emailSent !== false)
          setStatus('success')
          refreshCart()
        } else {
          setStatus('failed')
          setMessage(json.error || 'Something went wrong.')
        }
      } catch {
        setStatus('failed')
        setMessage('Network error. Please try again.')
      }
    }
    run()
  }, [reference])

  return (
    <View style={s.container}>
      <View style={s.card}>
        {status === 'loading' && (
          <>
            <ActivityIndicator color="#e11d48" size="large" />
            <Text style={s.text}>Confirming your payment...</Text>
          </>
        )}

        {status === 'success' && (
          <>
            <Text style={s.emoji}>🎉</Text>
            <Text style={s.title}>Payment successful!</Text>
            <Text style={s.text}>
              {emailSent
                ? 'Your order is confirmed and a confirmation email is on its way.'
                : 'Your order is confirmed.'}
            </Text>
            <Pressable style={s.btn} onPress={() => router.replace('/')}>
              <Text style={s.btnText}>Continue shopping</Text>
            </Pressable>
          </>
        )}

        {status === 'failed' && (
          <>
            <Text style={s.emoji}>😕</Text>
            <Text style={s.title}>Payment not confirmed</Text>
            <Text style={s.text}>{message}</Text>
            <Pressable style={s.btn} onPress={() => router.replace('/cart')}>
              <Text style={s.btnText}>Back to cart</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1f2', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', gap: 10, width: '100%', maxWidth: 420, borderWidth: 1, borderColor: '#ffe4e6' },
  emoji: { fontSize: 56 },
  title: { fontSize: 22, fontWeight: '700', color: '#be123c' },
  text: { color: '#57534e', textAlign: 'center' },
  btn: { backgroundColor: '#e11d48', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, marginTop: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
})
