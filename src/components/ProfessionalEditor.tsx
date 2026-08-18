import { useEffect, useState } from 'react'
import { View, Text, TextInput, Image, ActivityIndicator, TouchableOpacity } from 'react-native'
import { fetchProfessionalById } from '@/lib/repo'

type Props = { professionalId: string }

export default function ProfessionalEditor({ professionalId }: Props) {
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    let mounted = true
    fetchProfessionalById(professionalId).then((p) => {
      if (!mounted) return
      if (p) {
        setName(p.name || '')
        setBio(p.bio || '')
        setAvatarUrl(typeof p.avatar_url === 'string' ? p.avatar_url : '')
      }
      setLoading(false)
    })
    return () => { mounted = false }
  }, [professionalId])

  const label = { color: '#374151', fontWeight: '600' as const, marginBottom: 6, marginTop: 14 }
  const input = { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111827' }

  if (loading) {
    return (
      <View style={{ paddingVertical: 24, alignItems: 'center' }}>
        <ActivityIndicator color="#ec4899" />
      </View>
    )
  }

  return (
    <View>
      <View style={{ alignItems: 'center', marginBottom: 22 }}>
        <View style={{ position: 'relative', opacity: 0.7 }}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} />
          ) : (
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#e5e7eb' }} />
          )}
          <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#ec4899', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' }}>
            <Text style={{ color: '#fff', fontSize: 12 }}>✎</Text>
          </View>
        </View>
      </View>

      <Text style={label}>Nome</Text>
      <TextInput value={name} editable={false} style={[input, { opacity: 0.7 }]} placeholder="Seu nome" placeholderTextColor="#9ca3af" />

      <Text style={label}>Bio</Text>
      <TextInput value={bio} editable={false} multiline style={[input, { minHeight: 90, textAlignVertical: 'top', opacity: 0.7 }]} placeholder="Fale sobre você e seu trabalho" placeholderTextColor="#9ca3af" />

      <TouchableOpacity
        disabled
        style={{ backgroundColor: '#f9a8d4', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Salvar</Text>
      </TouchableOpacity>
    </View>
  )
}
