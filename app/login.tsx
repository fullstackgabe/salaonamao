import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/lib/auth'
import ProfessionalEditor from '@/components/ProfessionalEditor'

const DEMO_EMAIL = 'ana@salaonamao.com'
const DEMO_SENHA = 'salao1234'

export default function Login() {
  const { session, signIn, signOut } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const goBackToApp = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))

  const submit = async () => {
    setBusy(true); setError(null)
    const err = await signIn(DEMO_EMAIL, DEMO_SENHA)
    setBusy(false)
    if (err) setError(err)
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
          <ProfessionalEditor professionalId={String(professionalId)}>
            <TouchableOpacity
              onPress={() => router.push('/minha-agenda')}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fce7f3', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8 }}
            >
              <Text style={{ color: '#ec4899', fontWeight: '700', fontSize: 15 }}>Minha agenda</Text>
              <Text style={{ color: '#ec4899', fontWeight: '700' }}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/minhas-folgas')}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fce7f3', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 2 }}
            >
              <Text style={{ color: '#ec4899', fontWeight: '700', fontSize: 15 }}>Minhas folgas</Text>
              <Text style={{ color: '#ec4899', fontWeight: '700' }}>›</Text>
            </TouchableOpacity>
          </ProfessionalEditor>
        ) : (
          <Text style={{ color: '#6b7280', textAlign: 'center', marginVertical: 16 }}>Sua conta ainda não está vinculada a um perfil.</Text>
        )}

        <TouchableOpacity
          onPress={async () => { await signOut(); goBackToApp() }}
          style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10 }}
        >
          <Text style={{ color: '#6b7280', fontWeight: '700', fontSize: 15 }}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Image source={require('../imgs/logo.png')} style={{ height: 56, width: 140, resizeMode: 'contain', marginBottom: 12 }} />
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>Área do profissional</Text>
        <Text style={{ color: '#6b7280', marginTop: 4, textAlign: 'center' }}>Entre para gerenciar sua agenda e seu perfil</Text>
      </View>

      <TextInput
        value={DEMO_EMAIL}
        editable={false}
        style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 15, opacity: 0.7 }}
      />
      <TextInput
        value={DEMO_SENHA}
        editable={false}
        secureTextEntry
        style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8, fontSize: 15, opacity: 0.7 }}
      />

      {error ? <Text style={{ color: '#dc2626', marginBottom: 8 }}>{error}</Text> : null}

      <TouchableOpacity
        disabled={busy}
        onPress={submit}
        style={{ backgroundColor: '#ec4899', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 }}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Entrar</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}
