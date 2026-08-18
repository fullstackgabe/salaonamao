import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Linking, ActivityIndicator } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useNavigation } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { fetchBookingsDetailed, cancelBooking } from '@/lib/repo'

function TrashIcon({ size = 17, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M9 3h6M4 7h16M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13M10 11v6M14 11v6"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

const waLink = (phone: string) => {
  const digits = (phone || '').replace(/\D/g, '')
  const withCountry = digits.length <= 11 ? `55${digits}` : digits
  return `https://wa.me/${withCountry}`
}

export default function MinhaAgenda() {
  const { session } = useAuth()
  const navigation = useNavigation()
  const professionalId = session?.user?.app_metadata?.professional_id

  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  const load = async () => {
    if (!professionalId) return
    setLoading(true)
    const rows = await fetchBookingsDetailed(String(professionalId))
    setBookings(rows)
    setLoading(false)
  }

  useEffect(() => { load() }, [professionalId])

  useEffect(() => {
    navigation.setOptions({
      headerRight: bookings.length > 0
        ? () => (
          <TouchableOpacity
            onPress={() => setConfirmDeleteAll(true)}
            style={{ width: 33, height: 33, borderRadius: 999, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' }}
          >
            <TrashIcon size={16} />
          </TouchableOpacity>
        )
        : undefined,
    })
  }, [bookings.length])

  const confirmDeleteNow = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    await cancelBooking(String(confirmDelete.id))
    setDeleting(false)
    setConfirmDelete(null)
    setSelected(null)
    load()
  }

  const confirmDeleteAllNow = async () => {
    setDeletingAll(true)
    await Promise.all(bookings.map((b) => cancelBooking(String(b.id))))
    setDeletingAll(false)
    setConfirmDeleteAll(false)
    setSelected(null)
    load()
  }

  const dateLabel = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#ec4899" />
        </View>
      ) : bookings.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#6b7280', textAlign: 'center' }}>Nenhum agendamento por aqui ainda.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: b }) => (
            <TouchableOpacity
              onPress={() => setSelected(b)}
              activeOpacity={0.8}
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: '#fff' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontWeight: '700', color: '#111827', fontSize: 15 }}>{b.customer_name || 'Cliente'}</Text>
                  <Text style={{ color: '#6b7280', marginTop: 2, fontSize: 13 }}>{b.service?.name || 'Serviço'}</Text>
                  <Text style={{ color: '#ec4899', marginTop: 4, fontSize: 12, fontWeight: '600' }}>{dateLabel(b.slot?.start_time)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setConfirmDelete(b)}
                  hitSlop={10}
                  style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#6b7280', fontWeight: '700', fontSize: 13 }}>✕</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {selected && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 12, padding: 18 }}>
            <Text style={{ fontWeight: '700', fontSize: 17, color: '#111827', marginBottom: 4 }}>{selected.customer_name || 'Cliente'}</Text>
            <Text style={{ color: '#6b7280', marginBottom: 12 }}>{selected.service?.name || 'Serviço'} — {dateLabel(selected.slot?.start_time)}</Text>

            <Text style={{ color: '#9ca3af', fontSize: 12 }}>E-mail</Text>
            <Text style={{ color: '#111827', marginBottom: 8 }}>{selected.customer_email || '—'}</Text>

            <Text style={{ color: '#9ca3af', fontSize: 12 }}>Telefone</Text>
            <Text style={{ color: '#111827', marginBottom: 16 }}>{selected.customer_phone || '—'}</Text>

            {selected.customer_phone ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(waLink(selected.customer_phone))}
                style={{ backgroundColor: '#25D366', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 8 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Chamar no WhatsApp</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={() => setSelected(null)}
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#6b7280', fontWeight: '700' }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {confirmDelete && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
          <View style={{ width: '100%', maxWidth: 380, backgroundColor: '#ffffff', borderRadius: 12, padding: 18 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#111827', marginBottom: 6 }}>Excluir agendamento?</Text>
            <Text style={{ color: '#6b7280', marginBottom: 16 }}>
              {confirmDelete.customer_name || 'Cliente'} — {dateLabel(confirmDelete.slot?.start_time)}.{'\n'}Essa ação não pode ser desfeita.
            </Text>
            <TouchableOpacity
              disabled={deleting}
              onPress={confirmDeleteNow}
              style={{ backgroundColor: '#dc2626', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 8, opacity: deleting ? 0.6 : 1 }}
            >
              {deleting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Excluir</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              disabled={deleting}
              onPress={() => setConfirmDelete(null)}
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#6b7280', fontWeight: '700' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {confirmDeleteAll && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
          <View style={{ width: '100%', maxWidth: 380, backgroundColor: '#ffffff', borderRadius: 12, padding: 18 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#111827', marginBottom: 6 }}>Excluir todos os agendamentos?</Text>
            <Text style={{ color: '#6b7280', marginBottom: 16 }}>
              Isso vai apagar os {bookings.length} agendamentos da lista.{'\n'}Essa ação não pode ser desfeita.
            </Text>
            <TouchableOpacity
              disabled={deletingAll}
              onPress={confirmDeleteAllNow}
              style={{ backgroundColor: '#dc2626', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 8, opacity: deletingAll ? 0.6 : 1 }}
            >
              {deletingAll ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Excluir todos</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              disabled={deletingAll}
              onPress={() => setConfirmDeleteAll(false)}
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#6b7280', fontWeight: '700' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}
