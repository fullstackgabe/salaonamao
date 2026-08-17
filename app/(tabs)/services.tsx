import { useEffect, useState } from 'react'
import { View, Text, FlatList } from 'react-native'
import { fetchServices } from '@/lib/repo'
import { Service } from '@/types'

const formatBRL = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`

export default function ServicesTab() {
  const [allServices, setAllServices] = useState<Service[]>([])
  useEffect(() => {
    fetchServices().then((rows) => setAllServices(rows as any))
  }, [])

  const services = [...allServices].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <FlatList
        data={services}
        keyExtractor={(s) => String(s.id)}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f3f4f6', marginLeft: 28, marginRight: 20 }} />}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 14, paddingLeft: 28, paddingRight: 20, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'nowrap' }}>
              <Text style={{ fontSize: 14, fontWeight: '500', flexShrink: 1, marginRight: 8 }} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
              <View style={{ backgroundColor: '#fde7f3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9999 }}>
                <Text style={{ color: '#ec4899', fontSize: 12 }}>{Math.round(item.duration_min)} min</Text>
              </View>
            </View>
            <View style={{ marginLeft: 8, backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
              <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '700' }}>{formatBRL(item.price_cents)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  )
}
