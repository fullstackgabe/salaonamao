import { useEffect, useState } from 'react'
import { View, FlatList } from 'react-native'
import { fetchProfessionals } from '@/lib/repo'
import ProfessionalCard from '@/components/ProfessionalCard'
import { Professional } from '@/types'

export default function Profiles() {
  const [data, setData] = useState<Professional[]>([])
  useEffect(() => {
    fetchProfessionals().then((rows) => setData(rows as any))
  }, [])
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ProfessionalCard professional={item} />}
      />
    </View>
  )
}