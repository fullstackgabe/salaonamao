import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Pressable, ActivityIndicator, ScrollView, Image } from 'react-native'
import { router, useNavigation } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { useAuth } from '@/lib/auth'
import { fetchProfessionalById } from '@/lib/repo'

const DEMO_EMAIL = 'ana@salaonamao.com'
const DEMO_SENHA = 'salao1234'

function LogoutIcon({ size = 28, color = '#ec4899' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

const navBtnStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  backgroundColor: '#fce7f3',
  borderWidth: 1,
  borderColor: '#ec4899',
  borderRadius: 10,
  paddingVertical: 14,
  paddingHorizontal: 16,
  marginBottom: 8,
}
const navBtnText = { color: '#ec4899', fontWeight: '700' as const, fontSize: 15 }

function NavButton({ titulo, onPress, style }: { titulo: string; onPress: () => void; style?: object }) {
  return (
    <TouchableOpacity onPress={onPress} style={[navBtnStyle, style]}>
      <Text style={navBtnText}>{titulo}</Text>
      <Text style={navBtnText}>›</Text>
    </TouchableOpacity>
  )
}

export default function Login() {
  const { session, signIn, signOut } = useAuth()
  const navigation = useNavigation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ name: string; avatar_url: string } | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const professionalId = session?.user?.app_metadata?.professional_id

  useEffect(() => {
    if (!professionalId) { setProfileLoading(false); return }
    fetchProfessionalById(String(professionalId)).then((p) => {
      if (p) setProfile({ name: p.name || '', avatar_url: typeof p.avatar_url === 'string' ? p.avatar_url : '' })
      setProfileLoading(false)
    })
  }, [professionalId])

  const goBackToApp = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))
  const doSignOut = async () => { await signOut(); goBackToApp() }

  useEffect(() => {
    navigation.setOptions({
      headerRight: session
        ? () => (
          <Pressable onPress={doSignOut} hitSlop={12}>
            <LogoutIcon />
          </Pressable>
        )
        : undefined,
    })
  }, [session])

  const submit = async () => {
    setBusy(true); setError(null)
    const err = await signIn(DEMO_EMAIL, DEMO_SENHA)
    setBusy(false)
    if (err) setError(err)
  }

  if (session) {
    return (
      <ScrollView contentContainerStyle={{ padding: 24, backgroundColor: '#fff', flexGrow: 1 }}>
        <View style={{ alignItems: 'center', marginBottom: 24, minHeight: 132, justifyContent: 'center' }}>
          {profileLoading ? (
            <ActivityIndicator color="#ec4899" />
          ) : (
            <>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 12 }} />
              ) : (
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#e5e7eb', marginBottom: 12 }} />
              )}
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{profile?.name || 'Meu perfil'}</Text>
              <Text style={{ color: '#6b7280', marginTop: 4 }}>{session?.user?.email}</Text>
            </>
          )}
        </View>

        {professionalId ? (
          <View>
            <NavButton titulo="Editar perfil" onPress={() => router.push('/editar-perfil')} />
            <NavButton titulo="Portfólio" onPress={() => router.push('/meus-trabalhos')} />
            <NavButton titulo="Especialidades" onPress={() => router.push('/especialidades')} />
            <NavButton titulo="Agendamentos" onPress={() => router.push('/minha-agenda')} />
            <NavButton titulo="Disponibilidade" onPress={() => router.push('/minhas-folgas')} style={{ marginBottom: 2 }} />
          </View>
        ) : (
          <Text style={{ color: '#6b7280', textAlign: 'center', marginVertical: 16 }}>Sua conta ainda não está vinculada a um perfil.</Text>
        )}
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Image source={require('../imgs/logo.png')} style={{ height: 72, width: 180, resizeMode: 'contain' }} />
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
