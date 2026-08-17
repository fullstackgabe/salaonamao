import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/lib/auth'
import ProfessionalEditor from '@/components/ProfessionalEditor'

export default function Login() {
  const { session, signIn, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const goBackToApp = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))

  const submit = async () => {
    setBusy(true); setError(null)
    const err = await signIn(email, password)
    setBusy(false)
    if (err) { setError(err); return }
    setPassword('')
  }

  if (session) {
    const professionalId = session?.user?.app_metadata?.professional_id
    return (
      <ScrollView contentContainerStyle={{ padding: 24, backgroundColor: '#fff', flexGrow: 1 }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Meu perfil</Text>
          <Text style={{ color: '#6b7280', marginTop: 4 }}>{session?.user?.email}</Text>
        </View>

        {professionalId ? (
          <ProfessionalEditor professionalId={String(professionalId)} />
        ) : (
          <Text style={{ color: '#6b7280', textAlign: 'center', marginVertical: 16 }}>Sua conta ainda não está vinculada a um perfil.</Text>
        )}

        <TouchableOpacity
          onPress={async () => { await signOut(); goBackToApp() }}
          style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 20 }}
        >
          <Text style={{ color: '#6b7280', fontWeight: '700', fontSize: 15 }}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  const canSubmit = /.+@.+\..+/.test(email) && password.length >= 6

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fce7f3', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 30 }}>💇‍♀️</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>Área do profissional</Text>
        <Text style={{ color: '#6b7280', marginTop: 4, textAlign: 'center' }}>Entre para gerenciar sua agenda</Text>
      </View>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="E-mail"
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 15 }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Senha"
        placeholderTextColor="#9ca3af"
        secureTextEntry
        style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8, fontSize: 15 }}
      />

      {error ? <Text style={{ color: '#dc2626', marginBottom: 8 }}>{error}</Text> : null}

      <TouchableOpacity
        disabled={!canSubmit || busy}
        onPress={submit}
        style={{ backgroundColor: !canSubmit || busy ? '#f9a8d4' : '#ec4899', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 }}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Entrar</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}
