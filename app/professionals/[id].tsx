import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
import { fetchProfessionals } from '@/lib/repo'
import { Professional } from '@/types'
import ProfessionalProfile from '@/components/ProfessionalProfile'

export default function ProfessionalPage() {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const [professional, setProfessional] = useState<Professional | null>(null)
  useEffect(() => {
    const idParam = Array.isArray(params.id) ? params.id[0] : params.id
    fetchProfessionals().then((rows: any[]) => {
      const p = rows.find((x: any) => String(x.id) === String(idParam)) || rows[0] || null
      setProfessional(p)
    })
  }, [params.id])
  if (!professional) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
      <ActivityIndicator />
      <Text style={{ marginTop: 8, color: '#6b7280' }}>Carregando profissional…</Text>
    </View>
  )
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ProfessionalProfile professional={professional} />
    </View>
  )
}