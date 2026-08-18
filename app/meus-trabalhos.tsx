import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { fetchPortfolios, deletePortfolioItem } from '@/lib/repo'

export default function MeusTrabalhos() {
  const { session } = useAuth()
  const professionalId = session?.user?.app_metadata?.professional_id

  const [portfolio, setPortfolio] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [portfolioMsg, setPortfolioMsg] = useState<string | null>(null)

  const loadPortfolio = () => {
    if (!professionalId) { setLoading(false); return }
    fetchPortfolios(String(professionalId)).then((rows) => { setPortfolio(rows as any); setLoading(false) })
  }

  useEffect(() => { loadPortfolio() }, [professionalId])

  const removeItem = async (item: any) => {
    setPortfolioMsg(null)
    const res = await deletePortfolioItem(String(item.id), String(item.image_url))
    if (res.error) setPortfolioMsg(res.error)
    else loadPortfolio()
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
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Adicione fotos dos seus trabalhos para aparecer no seu perfil.</Text>
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
          disabled
          style={{ width: 96, height: 96, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa', opacity: 0.7 }}
        >
          <Text style={{ color: '#9ca3af', fontSize: 28 }}>＋</Text>
        </TouchableOpacity>
      </View>
      {portfolioMsg ? <Text style={{ color: '#dc2626', marginTop: 6 }}>{portfolioMsg}</Text> : null}

      <TouchableOpacity
        onPress={() => router.back()}
        style={{ backgroundColor: '#ec4899', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Salvar</Text>
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
