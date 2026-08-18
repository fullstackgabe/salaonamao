import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native'
import { fetchProfessionalById, updateProfessional, uploadAvatarImage } from '@/lib/repo'

type Props = { professionalId: string }

export default function ProfessionalEditor({ professionalId }: Props) {
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

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

  const openFilePicker = (onFile: (file: File) => void, onUnavailable: () => void) => {
    const doc: any = (globalThis as any).document
    if (Platform.OS !== 'web' || !doc) { onUnavailable(); return }
    const input = doc.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => { const f = input.files?.[0]; if (f) onFile(f) }
    input.click()
  }

  const pickAvatar = () =>
    openFilePicker(
      async (file) => {
        setAvatarUploading(true); setAvatarMsg(null)
        const res = await uploadAvatarImage(professionalId, file)
        setAvatarUploading(false)
        if (res.error) setAvatarMsg(res.error)
        else setAvatarUrl(res.url || '')
      },
      () => setAvatarMsg('O upload está disponível na versão web.'),
    )

  const save = async () => {
    setSaving(true); setMsg(null)
    const res = await updateProfessional(professionalId, {
      name: name.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl.trim(),
    })
    setSaving(false)
    setMsg(res.error ? { type: 'err', text: res.error } : { type: 'ok', text: 'Cadastro salvo!' })
  }

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
        <TouchableOpacity onPress={pickAvatar} disabled={avatarUploading} style={{ position: 'relative' }}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} />
          ) : (
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#e5e7eb' }} />
          )}
          <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#ec4899', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' }}>
            {avatarUploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontSize: 12 }}>✎</Text>}
          </View>
        </TouchableOpacity>
        {avatarMsg ? <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{avatarMsg}</Text> : null}
      </View>

      <Text style={label}>Nome</Text>
      <TextInput value={name} onChangeText={setName} style={input} placeholder="Seu nome" placeholderTextColor="#9ca3af" />

      <Text style={label}>Bio</Text>
      <TextInput value={bio} onChangeText={setBio} multiline style={[input, { minHeight: 90, textAlignVertical: 'top' }]} placeholder="Fale sobre você e seu trabalho" placeholderTextColor="#9ca3af" />

      {msg ? (
        <Text style={{ color: msg.type === 'ok' ? '#16a34a' : '#dc2626', marginTop: 12, textAlign: 'center', fontWeight: '600' }}>{msg.text}</Text>
      ) : null}

      <TouchableOpacity
        disabled={saving || !name.trim()}
        onPress={save}
        style={{ backgroundColor: saving || !name.trim() ? '#f9a8d4' : '#ec4899', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 }}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Salvar</Text>}
      </TouchableOpacity>
    </View>
  )
}
