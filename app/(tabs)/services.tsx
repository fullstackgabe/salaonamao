import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Pressable, Image } from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { fetchServices, fetchProfessionals } from '@/lib/repo'
import { Professional, Service } from '@/types'

const formatBRL = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`

export default function ServicesTab() {
  const [allServices, setAllServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const listRef = useRef<FlatList>(null)

  useFocusEffect(
    useCallback(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false })
      return () => setSelectedService(null)
    }, [])
  )

  useEffect(() => {
    Promise.all([fetchServices(), fetchProfessionals()]).then(([s, p]) => {
      setAllServices(s as any)
      setProfessionals(p as any)
      setLoading(false)
    })
  }, [])

  const services = [...allServices].sort((a, b) => a.name.localeCompare(b.name))

  const matchingProfessionals = selectedService
    ? professionals.filter((p) => (p.specialties || []).includes(selectedService.name))
    : []

  const goToProfile = (id: string) => {
    setSelectedService(null)
    router.push({ pathname: '/professionals/[id]', params: { id } })
  }

  const goToBooking = (id: string) => {
    setSelectedService(null)
    router.push({ pathname: '/agenda', params: { professionalId: id } })
  }

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
        data={services}
        keyExtractor={(s) => String(s.id)}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f3f4f6', marginLeft: 28, marginRight: 20 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedService(item)}
            style={{ paddingVertical: 14, paddingLeft: 28, paddingRight: 20, flexDirection: 'row', alignItems: 'center' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'nowrap' }}>
              <Text style={{ fontSize: 14, fontWeight: '500', flexShrink: 1, marginRight: 8 }} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
              <View style={{ backgroundColor: '#fde7f3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9999 }}>
                <Text style={{ color: '#ec4899', fontSize: 12 }}>{Math.round(item.duration_min)} min</Text>
              </View>
            </View>
            <View style={{ marginLeft: 8, backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
              <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '700' }}>{formatBRL(item.price_cents)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {selectedService && (
        <Pressable
          onPress={() => setSelectedService(null)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: '80%', backgroundColor: '#ffffff', borderRadius: 12, padding: 18 }}>
            <Text style={{ fontWeight: '700', fontSize: 17, color: '#111827', marginBottom: 10 }}>{selectedService.name}</Text>

            {matchingProfessionals.length === 0 ? (
              <Text style={{ color: '#9ca3af', marginBottom: 16 }}>Nenhum profissional oferece esse serviço ainda.</Text>

            ) : (
              <>
              <Text style={{ color: '#6b7280', marginBottom: 14 }}>Profissionais que fazem esse procedimento</Text>
              <FlatList
                data={matchingProfessionals}
                keyExtractor={(p) => String(p.id)}
                style={{ maxHeight: 320 }}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f3f4f6' }} />}
                renderItem={({ item }) => (
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
                    <TouchableOpacity onPress={() => goToProfile(String(item.id))} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {item.avatar_url ? (
                        <Image source={typeof item.avatar_url === 'number' ? item.avatar_url : { uri: item.avatar_url }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
                      ) : (
                        <View style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: '#e5e7eb' }} />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                        <Text style={{ color: '#ec4899', fontSize: 12 }}>★ {(item.rating ?? 0).toFixed(1)}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => goToBooking(String(item.id))}
                      style={{ backgroundColor: '#ec4899', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 8 }}
                    >
                      <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>Agendar agora</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
              </>
            )}

            <TouchableOpacity
              onPress={() => setSelectedService(null)}
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 14 }}
            >
              <Text style={{ color: '#6b7280', fontWeight: '700' }}>Fechar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      )}
    </View>
  )
}
