import { useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from '../lib/supabase'
import { webOrigin } from '../lib/utils'

WebBrowser.maybeCompleteAuthSession()

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const submit = async () => {
    setError('')
    setInfo('')
    setBusy(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.replace('/')
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) setError(error.message)
      else if (data.session) router.replace('/')
      else setInfo('Account created! Check your email to confirm it, then log in.')
    }
    setBusy(false)
  }

  const google = async () => {
    setError('')
    setBusy(true)

    // Browser: normal redirect flow, Supabase picks the session up on return
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: webOrigin() },
      })
      if (error) {
        setError(error.message)
        setBusy(false)
      }
      return
    }

    // Phone: open a browser sheet and read the tokens from the deep link
    const redirectTo = Linking.createURL('/')
    console.log('Redirect URL (add this to Supabase):', redirectTo)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    })
    if (error || !data.url) {
      setError(error?.message || 'Could not start Google login')
      setBusy(false)
      return
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
    if (result.type === 'success') {
      const part = result.url.split('#')[1] ?? result.url.split('?')[1] ?? ''
      const params = new URLSearchParams(part)
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token })
        router.replace('/')
      } else {
        setError('Google login did not return a session.')
      }
    }
    setBusy(false)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff1f2' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <View style={s.wrap}>
            <Text style={{ fontSize: 56, textAlign: 'center' }}>🍰</Text>
            <Text style={s.brand}>Sweet Treats</Text>

            <View style={s.card}>
              <Text style={s.title}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>

              <Pressable style={s.google} onPress={google} disabled={busy}>
                <Text style={s.googleText}>Continue with Google</Text>
              </Pressable>

              <Text style={s.or}>or with email</Text>

              {mode === 'signup' && (
                <TextInput style={s.input} placeholder="Full name" value={name} onChangeText={setName} />
              )}
              <TextInput
                style={s.input}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={s.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              {!!error && <Text style={s.error}>{error}</Text>}
              {!!info && <Text style={s.info}>{info}</Text>}

              <Pressable style={[s.btn, busy && { opacity: 0.5 }]} onPress={submit} disabled={busy}>
                <Text style={s.btnText}>
                  {busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setError('')
                  setInfo('')
                }}
              >
                <Text style={s.switch}>
                  {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { padding: 20, justifyContent: 'center', flexGrow: 1 },
  wrap: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  brand: { textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#e11d48', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 12, borderWidth: 1, borderColor: '#ffe4e6' },
  title: { fontSize: 22, fontWeight: '700', color: '#1c1917' },
  google: { borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  googleText: { fontWeight: '600', color: '#44403c' },
  or: { textAlign: 'center', color: '#a8a29e', fontSize: 12 },
  input: { borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  error: { color: '#b91c1c', backgroundColor: '#fef2f2', padding: 10, borderRadius: 8 },
  info: { color: '#15803d', backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8 },
  btn: { backgroundColor: '#e11d48', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  switch: { textAlign: 'center', color: '#e11d48', marginTop: 4 },
})
