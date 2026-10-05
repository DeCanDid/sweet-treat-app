import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useApp } from '../../lib/AppContext'

export default function Profile() {
  const { user } = useApp()
  const router = useRouter()

  if (!user) {
    return (
      <View style={s.container}>
        <Text style={s.hint}>You are not logged in</Text>
        <Pressable style={s.btn} onPress={() => router.push('/login')}>
          <Text style={s.btnText}>Login / Sign up</Text>
        </Pressable>
      </View>
    )
  }

  const meta = user.user_metadata
  const avatar = meta?.avatar_url || meta?.picture
  const name = meta?.full_name || user.email || ''

  return (
    <View style={s.container}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={s.avatar} />
      ) : (
        <View style={[s.avatar, s.letter]}>
          <Text style={{ color: '#fff', fontSize: 36, fontWeight: '700' }}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={s.name}>{meta?.full_name || 'My account'}</Text>
      <Text style={s.hint}>{user.email}</Text>

      <Pressable style={[s.btn, { marginTop: 30 }]} onPress={() => supabase.auth.signOut()}>
        <Text style={s.btnText}>Logout</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1f2', gap: 6, padding: 20 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: '#fecdd3' },
  letter: { backgroundColor: '#e11d48', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '700', color: '#1c1917', marginTop: 10 },
  hint: { color: '#78716c', fontSize: 15 },
  btn: { backgroundColor: '#e11d48', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 },
  btnText: { color: '#fff', fontWeight: '700' },
})
