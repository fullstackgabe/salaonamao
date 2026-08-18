import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { fetchProfessionalById, updateProfessional, fetchServices } from '@/lib/repo'

export default function Especialidades() {
  const { session } = useAuth()
  const professionalId = session?.user?.app_metadata?.professional_id

  const [loading, setLoading] = useState(true)
  const [specialties, setSpecialties] = useState<string[]>([])
  const [serviceNames, setServiceNames] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (!professionalId) { setLoading(false); return }
    let mounted = true
    fetchProfessionalById(String(professionalId)).then((p) => {
      if (!mounted) return
      if (p) setSpecialties((p.specialties || []) as string[])
      setLoading(false)
    })
    fetchServices().then((rows) => setServiceNames((rows as any[]).map((s) => s.name).sort((a, b) => a.localeCompare(b))))
    return () => { mounted = false }
  }, [professionalId])

  const toggleSpec = (n: string) =>
    setSpecialties((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]))

  const save = async () => {
    if (!professionalId) return
    setSaving(true); setMsg(null)
    const res = await updateProfessional(String(professionalId), { specialties })
    setSaving(false)
    setMsg(res.error ? { type: 'err', text: res.error } : { type: 'ok', text: 'Especialidades salvas!' })
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#ec4899" />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, backgroundColor: '#fff', flexGrow: 1 }}>
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Toque para adicionar ou remover.</Text>
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

      {msg ? (
        <Text style={{ color: msg.type === 'ok' ? '#16a34a' : '#dc2626', marginTop: 12, textAlign: 'center', fontWeight: '600' }}>{msg.text}</Text>
      ) : null}

      <TouchableOpacity
        disabled={saving}
        onPress={save}
        style={{ backgroundColor: '#ec4899', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16, opacity: saving ? 0.6 : 1 }}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Salvar</Text>}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10 }}
      >
        <Text style={{ color: '#6b7280', fontWeight: '700', fontSize: 15 }}>Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
