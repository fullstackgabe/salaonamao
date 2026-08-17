import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native'
import { fetchProfessionalById, updateProfessional, fetchPortfolios, uploadPortfolioImage, deletePortfolioItem, fetchServices, uploadAvatarImage } from '@/lib/repo'

type Props = { professionalId: string }

export default function ProfessionalEditor({ professionalId }: Props) {
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [serviceNames, setServiceNames] = useState<string[]>([])
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [portfolioMsg, setPortfolioMsg] = useState<string | null>(null)

  const loadPortfolio = () => fetchPortfolios(professionalId).then((rows) => setPortfolio(rows as any))

  useEffect(() => {
    let mounted = true
    fetchProfessionalById(professionalId).then((p) => {
      if (!mounted) return
      if (p) {
        setName(p.name || '')
        setBio(p.bio || '')
        setSpecialties((p.specialties || []) as string[])
        setAvatarUrl(typeof p.avatar_url === 'string' ? p.avatar_url : '')
      }
      setLoading(false)
    })
    fetchServices().then((rows) => setServiceNames((rows as any[]).map((s) => s.name).sort((a, b) => a.localeCompare(b))))
    loadPortfolio()
    return () => { mounted = false }
  }, [professionalId])

  const toggleSpec = (n: string) =>
    setSpecialties((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]))

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

  const pickPortfolio = () =>
    openFilePicker(
      async (file) => {
        setUploading(true); setPortfolioMsg(null)
        const res = await uploadPortfolioImage(professionalId, file)
        setUploading(false)
        if (res.error) setPortfolioMsg(res.error)
        else loadPortfolio()
      },
      () => setPortfolioMsg('O upload está disponível na versão web.'),
    )

  const removeItem = async (item: any) => {
    setPortfolioMsg(null)
    const res = await deletePortfolioItem(String(item.id), String(item.image_url))
    if (res.error) setPortfolioMsg(res.error)
    else loadPortfolio()
  }

  const save = async () => {
    setSaving(true); setMsg(null)
    const res = await updateProfessional(professionalId, {
      name: name.trim(),
      bio: bio.trim(),
      specialties,
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
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
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

      <Text style={label}>Especialidades</Text>
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8 }}>Toque para adicionar ou remover.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {serviceNames.map((n) => {
          const on = specialties.includes(n)
          return (
            <TouchableOpacity
              key={n}
              onPress={() => toggleSpec(n)}
              style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999, borderWidth: 1, borderColor: on ? '#ec4899' : '#e5e7eb', backgroundColor: on ? '#ec4899' : '#ffffff' }}
            >
              <Text style={{ width: 12, textAlign: 'center', color: on ? '#ffffff' : '#9ca3af', fontSize: 13, fontWeight: '700' }}>{on ? '✓' : '+'}</Text>
              <Text style={{ marginLeft: 5, color: on ? '#ffffff' : '#374151', fontSize: 13, fontWeight: '500' }}>{n}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={label}>Meus trabalhos</Text>
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8 }}>Adicione fotos dos seus trabalhos para aparecer no seu perfil.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {portfolio.map((item) => (
          <View key={String(item.id)} style={{ width: 96, height: 96, marginRight: 8, marginBottom: 8 }}>
            <Image source={{ uri: String(item.image_url) }} style={{ width: 96, height: 96, borderRadius: 10 }} />
            <TouchableOpacity
              onPress={() => removeItem(item)}
              style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#111827', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          onPress={pickPortfolio}
          disabled={uploading}
          style={{ width: 96, height: 96, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' }}
        >
          {uploading ? <ActivityIndicator color="#ec4899" /> : <Text style={{ color: '#9ca3af', fontSize: 28 }}>＋</Text>}
        </TouchableOpacity>
      </View>
      {portfolioMsg ? <Text style={{ color: '#dc2626', marginTop: 6 }}>{portfolioMsg}</Text> : null}

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
