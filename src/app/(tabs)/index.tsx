import { useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useApp } from '../../lib/AppContext'

type Product = { id: string; name: string; description: string; price: number; emoji: string }

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([])
  const [addedId, setAddedId] = useState<string | null>(null)
  const { user, refreshCart } = useApp()
  const router = useRouter()

  useEffect(() => {
    supabase.from('products').select('*').then(({ data }) => setProducts(data ?? []))
  }, [])

  const addToCart = async (productId: string) => {
    if (!user) return router.push('/login')

    const { data: existing } = await supabase
      .from('cart_items').select('id, quantity').eq('product_id', productId).maybeSingle()

    if (existing) {
      await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id)
    } else {
      await supabase.from('cart_items').insert({ user_id: user.id, product_id: productId, quantity: 1 })
    }

    refreshCart()
    setAddedId(productId)
    setTimeout(() => setAddedId(null), 1200)
  }

  return (
    <FlatList
      style={{ backgroundColor: '#fff1f2' }}
      contentContainerStyle={s.list}
      data={products}
      keyExtractor={(p) => p.id}
      renderItem={({ item: p }) => (
        <View style={s.card}>
          <Text style={s.emoji}>{p.emoji}</Text>
          <Text style={s.name}>{p.name}</Text>
          <Text style={s.desc}>{p.description}</Text>
          <View style={s.row}>
            <Text style={s.price}>₦{Number(p.price).toLocaleString()}</Text>
            <Pressable
              onPress={() => addToCart(p.id)}
              style={[s.btn, addedId === p.id && { backgroundColor: '#22c55e' }]}
            >
              <Text style={s.btnText}>{addedId === p.id ? 'Added ✓' : 'Add to cart'}</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  )
}

const s = StyleSheet.create({
  list: { padding: 16, gap: 14, width: '100%', maxWidth: 600, alignSelf: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#ffe4e6' },
  emoji: { fontSize: 64, textAlign: 'center', backgroundColor: '#fff1f2', borderRadius: 12, paddingVertical: 14 },
  name: { fontSize: 18, fontWeight: '600', marginTop: 12, color: '#1c1917' },
  desc: { color: '#78716c', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  price: { fontSize: 20, fontWeight: '700', color: '#e11d48' },
  btn: { backgroundColor: '#e11d48', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  btnText: { color: '#fff', fontWeight: '600' },
})
