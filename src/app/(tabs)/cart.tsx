import { useCallback, useRef, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet, Platform } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useApp } from '../../lib/AppContext'
import { notify, webOrigin, webRedirect } from '../../lib/utils'
import PaymentModal from '../../components/PaymentModal'

const API = process.env.EXPO_PUBLIC_API_URL

export default function Cart() {
  const { user, refreshCart } = useApp()
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [payUrl, setPayUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const handling = useRef(false)

  const load = useCallback(async () => {
    if (!user) return setItems([])
    const { data } = await supabase
      .from('cart_items').select('id, quantity, products(id, name, price, emoji)')
    setItems(data ?? [])
  }, [user])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const remove = async (id: string) => {
    await supabase.from('cart_items').delete().eq('id', id)
    load()
    refreshCart()
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.products.price, 0)

  const pay = async () => {
    setBusy(true)
    try {
      const { data } = await supabase.auth.getSession()
      const callback_url =
        Platform.OS === 'web' ? `${webOrigin()}/payment-callback` : `${API}/payment/callback`

      const res = await fetch(`${API}/api/paystack/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session?.access_token}`,
        },
        body: JSON.stringify({ callback_url }),
      })
      const json = await res.json()

      if (res.ok && json.url) {
        if (Platform.OS === 'web') {
          webRedirect(json.url) // Paystack page, then back to /payment-callback
          return
        }
        handling.current = false
        setPayUrl(json.url) // phone: open the WebView
      } else {
        notify('Error', json.error || 'Could not start payment')
      }
    } catch {
      notify('Error', 'Network error. Please try again.')
    }
    setBusy(false)
  }

  // Phone only: called when Paystack redirects to /payment/callback
  const onCallback = async (url: string) => {
    if (handling.current) return
    handling.current = true
    setPayUrl(null)

    const reference = new URL(url).searchParams.get('reference')
    try {
      const { data } = await supabase.auth.getSession()
      const res = await fetch(`${API}/api/paystack/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session?.access_token}`,
        },
        body: JSON.stringify({ reference }),
      })
      const json = await res.json()
      if (res.ok) {
        notify(
          'Payment successful 🎉',
          json.emailSent === false
            ? 'Your order is confirmed.'
            : 'Your order is confirmed. A confirmation email is on its way.'
        )
      } else {
        notify('Payment not confirmed', json.error || 'Something went wrong')
      }
    } catch {
      notify('Error', 'Could not confirm your payment.')
    }
    load()
    refreshCart()
  }

  if (!user) {
    return (
      <View style={s.center}>
        <Text style={s.emptyText}>Log in to see your cart</Text>
        <Pressable style={s.btn} onPress={() => router.push('/login')}>
          <Text style={s.btnText}>Login</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff1f2' }}>
      <FlatList
        contentContainerStyle={s.list}
        data={items}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={
          <Text style={[s.emptyText, { textAlign: 'center', marginTop: 40 }]}>Your cart is empty 🍩</Text>
        }
        renderItem={({ item: i }) => (
          <View style={s.item}>
            <Text style={{ fontSize: 34 }}>{i.products.emoji}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.itemName}>{i.products.name}</Text>
              <Text style={s.itemSub}>
                Qty {i.quantity} × ₦{Number(i.products.price).toLocaleString()}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.itemName}>₦{(i.quantity * i.products.price).toLocaleString()}</Text>
              <Pressable onPress={() => remove(i.id)}>
                <Text style={{ color: '#e11d48', fontSize: 12, marginTop: 4 }}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      {items.length > 0 && (
        <View style={s.footer}>
          <View style={s.footerInner}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalLabel}>₦{total.toLocaleString()}</Text>
            </View>
            <Pressable style={[s.btn, busy && { opacity: 0.5 }]} disabled={busy} onPress={pay}>
              <Text style={s.btnText}>{busy ? 'Please wait...' : 'Pay with Paystack'}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <PaymentModal url={payUrl} onClose={() => setPayUrl(null)} onCallback={onCallback} />
    </View>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1f2', gap: 14 },
  emptyText: { color: '#78716c', fontSize: 16 },
  list: { padding: 16, gap: 10, width: '100%', maxWidth: 600, alignSelf: 'center' },
  item: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ffe4e6' },
  itemName: { fontWeight: '600', color: '#1c1917' },
  itemSub: { color: '#78716c', fontSize: 13, marginTop: 2 },
  footer: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderColor: '#ffe4e6' },
  footerInner: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontSize: 18, fontWeight: '700', color: '#1c1917' },
  btn: { backgroundColor: '#e11d48', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
})
