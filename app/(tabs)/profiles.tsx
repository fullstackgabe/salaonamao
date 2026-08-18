import { useCallback, useEffect, useRef, useState } from 'react'
import { View, FlatList, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { fetchProfessionals } from '@/lib/repo'
import ProfessionalCard from '@/components/ProfessionalCard'
import { Professional } from '@/types'

export default function Profiles() {
  const [data, setData] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const listRef = useRef<FlatList>(null)
  useEffect(() => {
    fetchProfessionals().then((rows) => { setData(rows as any); setLoading(false) })
  }, [])
  useFocusEffect(
    useCallback(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false })
    }, [])
  )
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#ec4899" />
      </View>
    )
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <FlatList
        ref={listRef}
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