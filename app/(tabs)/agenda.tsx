import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Dimensions, Image, TextInput, Animated, Easing, ActivityIndicator, ScrollView } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { fetchProfessionals, fetchServices, fetchSlots, fetchBookings, fetchDaysOff, bookSlotByTime } from '@/lib/repo'
import { AvailabilitySlot, Professional, Service } from '@/types'


export default function AgendaTab() {
  const params = useLocalSearchParams<{ professionalId?: string }>()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [professionalsLoading, setProfessionalsLoading] = useState(true)
  const [selected, setSelected] = useState<Professional | null>(null)
  const [monthCursor, setMonthCursor] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [servicesMap, setServicesMap] = useState<Record<string, Service>>({})
  const [openSelector, setOpenSelector] = useState<boolean>(false)
  const [selectorH, setSelectorH] = useState<number>(0)
  const [bookingsBySlot, setBookingsBySlot] = useState<Record<string, any>>({})
  const [daysOff, setDaysOff] = useState<Set<string>>(new Set())
  const [reserveError, setReserveError] = useState<string | null>(null)
  const [reserveBusy, setReserveBusy] = useState(false)
  const [reserveOpen, setReserveOpen] = useState(false)
  const [reserveTimeStr, setReserveTimeStr] = useState('')
  const [reserveService, setReserveService] = useState<Service | null>(null)
  const [reserveName, setReserveName] = useState('')
  const [reserveEmail, setReserveEmail] = useState('')
  const [reservePhone, setReservePhone] = useState('')
  const [openServiceSelector, setOpenServiceSelector] = useState<boolean>(false)
  const modalAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (reserveOpen) {
      modalAnim.setValue(0)
      Animated.timing(modalAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
    }
  }, [reserveOpen])
  const defaultTimeStr = () => {
    if (!isSelectedDateToday) return '10:00'
    const mins = Math.min(Math.max(minStartMinutesToday(), BUSINESS_START_HOUR * 60), BUSINESS_END_HOUR * 60)
    const hh = Math.floor(mins / 60)
    const mm = mins % 60
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  }
  const openReserveModal = () => {
    setReserveService(null); setReserveTimeStr(defaultTimeStr())
    setReserveName(''); setReserveEmail(''); setReservePhone('')
    setReserveOpen(true)
  }
  const closeModal = () => {
    setReserveError(null)
    setReserveBusy(false)
    Animated.timing(modalAnim, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setReserveOpen(false))
  }
  const modalAnimatedStyle = {
    transform: [{ translateY: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
    opacity: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })
  }
  
  const availableServices = useMemo(() => {
    const items = Object.values(servicesMap)
    const filtered = items.filter((s) => (selected?.specialties || []).includes(s.name))
    const list = filtered.length > 0 ? filtered : items
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [servicesMap, selected?.id, selected?.specialties])
  const formatCurrency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
  const promoPriceCents = (s: Service) => {
    const hasPromo = (s.tags || []).includes('promocao')
    const discount = hasPromo ? 0.2 : 0
    return Math.round(s.price_cents * (1 - discount))
  }
  
  
  const formatPhone = (input: string) => {
    const digits = input.replace(/\D/g, '')
    const d = digits.slice(0, 11)
    const part1 = d.slice(0, 2)
    const part2 = d.length > 6 ? d.slice(2, 7) : d.slice(2)
    const part3 = d.length > 6 ? d.slice(7) : ''
    return d.length <= 2 ? part1 : d.length <= 7 ? `(${part1}) ${part2}` : `(${part1}) ${part2}-${part3}`
  }
  const onPhoneChange = (t: string) => setReservePhone(formatPhone(t))
  const isEmailValid = (e: string) => /.+@.+\..+/.test(e)
  const BUSINESS_START_HOUR = 10
  const BUSINESS_END_HOUR = 20

  useEffect(() => {
    const load = async () => {
      const data: any = await fetchProfessionals()
      const rows = (data || []) as Professional[]
      rows.sort((a, b) => a.name.localeCompare(b.name))
      setProfessionals(rows)
      if (!selected && rows.length > 0) {
        const match = params.professionalId ? rows.find((p) => String(p.id) === String(params.professionalId)) : null
        setSelected(match || rows[0])
      }
      setProfessionalsLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    fetchServices().then((rows) => {
      const map: Record<string, Service> = {}
      ;(rows as any).forEach((s: any) => { map[String(s.id)] = s as Service })
      setServicesMap(map)
    })
  }, [])

  const loadAgenda = async (prof: Professional | null) => {
    if (!prof) { setSlots([]); setBookingsBySlot({}); setDaysOff(new Set()); return }
    const [sl, bk, off] = await Promise.all([
      fetchSlots(String(prof.id)),
      fetchBookings(String(prof.id)),
      fetchDaysOff(String(prof.id)),
    ])
    setSlots(sl as AvailabilitySlot[])
    const map: Record<string, any> = {}
    ;(bk as any[]).forEach((b) => { if (b?.slot_id) map[String(b.slot_id)] = b })
    setBookingsBySlot(map)
    setDaysOff(new Set(off))
  }

  useEffect(() => { loadAgenda(selected) }, [selected?.id])

  useFocusEffect(
    useCallback(() => {
      if (!params.professionalId || professionals.length === 0) return
      const match = professionals.find((p) => String(p.id) === String(params.professionalId))
      if (match) setSelected(match)
    }, [params.professionalId, professionals])
  )

  const monthName = useMemo(() => monthCursor.toLocaleString('pt-BR', { month: 'long' }), [monthCursor])
  const year = monthCursor.getFullYear()
  const firstDay = new Date(year, monthCursor.getMonth(), 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, monthCursor.getMonth() + 1, 0).getDate()
  const today = new Date(); today.setHours(0,0,0,0)
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDay = today.getDate()
  const isCurrentMonth = year === todayYear && monthCursor.getMonth() === todayMonth
  const canGoPrev = new Date(year, monthCursor.getMonth(), 1) > new Date(todayYear, todayMonth, 1)
  const daysArray = Array.from({ length: startWeekday + daysInMonth }, (_, i) => i < startWeekday ? null : i - startWeekday + 1)

  const upcomingForSelectedDay = useMemo(() => {
    return slots
      .filter((s) => new Date(s.start_time).toDateString() === selectedDate.toDateString())
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [slots, selectedDate])

  const bookedForSelectedDay = useMemo(() => {
    return upcomingForSelectedDay.filter((ev) => ev.status === 'reserved' || ev.status === 'blocked')
  }, [upcomingForSelectedDay])

  const reserveStart = useMemo(() => {
    if (!reserveTimeStr || !/^\d{2}:\d{2}$/.test(reserveTimeStr)) return null
    const [hh, mm] = reserveTimeStr.split(':').map(Number)
    const d = new Date(selectedDate)
    d.setHours(hh, mm, 0, 0)
    return d
  }, [reserveTimeStr, selectedDate])

  const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6
  const dayUnavailable = isWeekend || daysOff.has(dateKey(selectedDate))

  const isSelectedDateToday = selectedDate.toDateString() === new Date().toDateString()

  const minStartMinutesToday = () => {
    const now = new Date()
    return Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15
  }

  const minStartMinutes = BUSINESS_START_HOUR * 60

  const todayClosed = isSelectedDateToday && minStartMinutesToday() >= BUSINESS_END_HOUR * 60

  const dayFullyBooked = useMemo(() => {
    if (!reserveService || todayClosed) return false
    const durationMin = reserveService.duration_min
    for (let mins = minStartMinutes; mins + durationMin <= BUSINESS_END_HOUR * 60; mins += 15) {
      const start = new Date(selectedDate)
      start.setHours(0, 0, 0, 0)
      start.setMinutes(mins)
      const end = new Date(start.getTime() + durationMin * 60000)
      const overlaps = bookedForSelectedDay.some((ev) => {
        const evStart = new Date(ev.start_time)
        const evEnd = new Date(ev.end_time)
        return start < evEnd && end > evStart
      })
      if (!overlaps) return false
    }
    return true
  }, [reserveService, todayClosed, minStartMinutes, selectedDate, bookedForSelectedDay])

  useEffect(() => {
    if (!reserveStart) return
    const mins = reserveStart.getHours() * 60 + reserveStart.getMinutes()
    if (mins < minStartMinutes) {
      const hh = Math.floor(minStartMinutes / 60)
      const mm = minStartMinutes % 60
      setReserveTimeStr(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
    }
  }, [reserveStart, minStartMinutes])

  const timeAvailability = useMemo(() => {
    if (!reserveStart || !reserveService) return null
    const mins = reserveStart.getHours() * 60 + reserveStart.getMinutes()
    if (mins < BUSINESS_START_HOUR * 60) {
      return { ok: false }
    }
    if (mins + reserveService.duration_min > BUSINESS_END_HOUR * 60) {
      return { ok: false }
    }
    if (reserveStart < new Date()) {
      return { ok: false }
    }
    const end = new Date(reserveStart.getTime() + reserveService.duration_min * 60000)
    const overlaps = bookedForSelectedDay.some((ev) => {
      const evStart = new Date(ev.start_time)
      const evEnd = new Date(ev.end_time)
      return reserveStart < evEnd && end > evStart
    })
    if (overlaps) return { ok: false }
    return { ok: true }
  }, [reserveStart, reserveService, bookedForSelectedDay])

  const formatTimeInput = (input: string) => {
    const digits = input.replace(/\D/g, '').slice(0, 4)
    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}:${digits.slice(2)}`
  }

  const adjustReserveTime = (deltaMin: number) => {
    const base = reserveStart || (() => {
      const d = new Date(selectedDate)
      d.setHours(Math.floor(minStartMinutes / 60), minStartMinutes % 60, 0, 0)
      return d
    })()
    const next = new Date(base.getTime() + deltaMin * 60000)
    const mins = Math.min(Math.max(next.getHours() * 60 + next.getMinutes(), minStartMinutes), BUSINESS_END_HOUR * 60)
    const hh = Math.floor(mins / 60)
    const mm = mins % 60
    setReserveTimeStr(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
  }

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h${String(m).padStart(2, '0')}`
  }

  if (professionalsLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#ec4899" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, zIndex: 20 }}>
        <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Selecione uma profissional.</Text>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity onPress={() => setOpenSelector((v) => !v)} onLayout={(e) => setSelectorH(e.nativeEvent.layout.height)} style={{ paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb', borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: openSelector ? 0 : 8, borderBottomRightRadius: openSelector ? 0 : 8, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center' }}>
            {selected ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {selected.avatar_url ? (
                  <Image source={typeof selected.avatar_url === 'number' ? selected.avatar_url : { uri: selected.avatar_url }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
                ) : (
                  <View style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8, backgroundColor: '#e5e7eb' }} />
                )}
                <Text style={{ fontWeight: '600', color: '#111827', flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">{selected.name}</Text>
                <View style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fde7f3', borderRadius: 999 }}>
                  <Text style={{ color: '#ec4899', fontWeight: '600' }}>{(selected.rating ?? 0).toFixed(1)}</Text>
                </View>
              </View>
            ) : (
              <Text style={{ color: '#6b7280', flex: 1 }}>Selecione</Text>
            )}
            <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center', marginLeft: 6 }}>
              <Text style={{ color: '#ec4899', fontSize: 12, lineHeight: 14, textAlign: 'center' }}>{openSelector ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>
          {openSelector && (
            <View style={{ position: 'absolute', top: selectorH - 1, left: 0, right: 0, zIndex: 30, maxHeight: Math.min(300, Math.round(Dimensions.get('window').height * 0.45)), borderWidth: 1, borderColor: '#e5e7eb', borderTopWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, overflow: 'hidden', backgroundColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
              <FlatList
                data={professionals.filter((p) => String(p.id) !== String(selected?.id))}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                  const avatarSource = item.avatar_url
                    ? typeof item.avatar_url === 'number'
                      ? item.avatar_url
                      : { uri: item.avatar_url }
                    : undefined
                  return (
                    <TouchableOpacity
                      onPress={() => { setSelected(item); setOpenSelector(false) }}
                      style={{ paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff' }}
                    >
                      {avatarSource ? (
                        <Image source={avatarSource} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} />
                      ) : (
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', marginRight: 8 }} />
                      )}
                      <Text style={{ fontSize: 14, color: '#111827', flex: 1 }} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fde7f3', borderRadius: 999 }}>
                        <Text style={{ color: '#ec4899', fontWeight: '600' }}>★ {(item.rating ?? 0).toFixed(1)}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                }}
                initialNumToRender={12}
                windowSize={5}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </View>
      <View style={{ flex: 1, zIndex: 0 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => { if (canGoPrev) setMonthCursor(new Date(year, monthCursor.getMonth() - 1, 1)) }}>
                <Text style={{ fontSize: 18, color: canGoPrev ? '#ec4899' : '#d1d5db' }}>{'‹'}</Text>
              </TouchableOpacity>
              <Text style={{ marginHorizontal: 12, fontSize: 16, fontWeight: '600', textTransform: 'capitalize' }}>{monthName} {year}</Text>
              <TouchableOpacity onPress={() => setMonthCursor(new Date(year, monthCursor.getMonth() + 1, 1))}>
                <Text style={{ fontSize: 18, color: '#ec4899' }}>{'›'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#ec4899', fontSize: 12, fontWeight: '600' }}>Toque pra selecionar o dia.</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, idx) => (
              <Text key={`${d}-${idx}`} style={{ width: '14.285%', textAlign: 'center', color: '#6b7280' }}>{d}</Text>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {daysArray.map((day, idx) => {
              if (day === null) return (<View key={idx} style={{ width: '14.285%', height: 36 }} />)
              const isDisabled = isCurrentMonth && day < todayDay
              const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === monthCursor.getMonth()
              return (
                <View key={idx} style={{ width: '14.285%', height: 36, alignItems: 'center', justifyContent: 'center' }}>
                  <TouchableOpacity
                    disabled={isDisabled}
                    style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: isSelected ? '#f9a8d4' : 'transparent' }}
                    onPress={() => setSelectedDate(new Date(year, monthCursor.getMonth(), day))}
                  >
                    <Text style={{ color: isSelected ? '#ffffff' : isDisabled ? '#9ca3af' : '#111827', fontWeight: isSelected ? '700' : '500' }}>{day}</Text>
                  </TouchableOpacity>
                </View>
              )
            })}
          </View>
        </View>
        <View style={{ flex: 1, marginTop: 16, paddingTop: 16, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#ffffff' }}>
          {selected && dayUnavailable ? (
            <Text style={{ color: '#ec4899', fontSize: 14, fontWeight: '700', paddingVertical: 16 }}>
              Indisponível nesse dia.
            </Text>
          ) : (
            <>
          {selected && (
            <TouchableOpacity onPress={openReserveModal} style={{ backgroundColor: '#ec4899', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#ffffff', fontWeight: '700' }}>Agendar horário</Text>
            </TouchableOpacity>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: '#111827', fontWeight: '700', fontSize: 15 }}>Agendamentos</Text>
          </View>
          {selected && (
            <FlatList
              data={bookedForSelectedDay}
              keyExtractor={(ev) => String(ev.id)}
              renderItem={({ item: ev }) => {
                const start = new Date(ev.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                const end = new Date(ev.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                const status = ev.status
                const booking = bookingsBySlot[String(ev.id)]
                const serviceName = booking
                  ? (servicesMap[String(booking.service_id)]?.name || 'Reservado')
                  : (status === 'blocked' ? 'Bloqueado' : 'Ocupado')
                const leftColor = status === 'blocked' ? '#991b1b' : '#111827'
                const cardBg = status === 'blocked' ? '#fee2e2' : '#fde7f3'
                const cardBorder = status === 'blocked' ? '#fca5a5' : '#fbcfe8'
                return (
                  <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: leftColor, fontSize: 13, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">{serviceName}</Text>
                    </View>
                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: '#fbcfe8' }}>
                      <Text style={{ color: '#9d174d', fontSize: 12 }}>{start} às {end}</Text>
                    </View>
                  </View>
                )
              }}
              ListEmptyComponent={<Text style={{ color: '#6b7280' }}>Nenhum agendamento ainda.</Text>}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            />
          )}
            </>
          )}
        </View>
      </View>
      {reserveOpen && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
          <Animated.View style={[{ width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 12, padding: 16, position: 'relative' }, modalAnimatedStyle]}>
              <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 12 }}>Agendar horário</Text>
              <View style={{ marginBottom: 8 }}>
                <Text>Serviço</Text>
                <View style={{ marginTop: 6 }}>
                  <FlatList
                    data={availableServices}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => { setReserveService(item); setReserveTimeStr(defaultTimeStr()) }}
                        style={{ paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff' }}
                      >
                        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#ec4899', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                          {reserveService?.id === item.id && (
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ec4899' }} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#111827' }}>{item.name}</Text>
                          <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>{formatDuration(item.duration_min)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                          {((item.tags || []).includes('promocao')) ? (
                            <>
                              <View style={{ marginRight: 6, backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9999 }}>
                                <Text style={{ color: '#6b7280', fontSize: 12, textDecorationLine: 'line-through' }}>{formatCurrency(item.price_cents)}</Text>
                              </View>
                              <View style={{ backgroundColor: '#fde7f3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9999 }}>
                                <Text style={{ color: '#ec4899', fontSize: 12 }}>{formatCurrency(promoPriceCents(item))}</Text>
                              </View>
                            </>
                          ) : (
                            <View style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
                              <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '700' }}>{formatCurrency(item.price_cents)}</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                    style={{ maxHeight: 220 }}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
              {reserveService && (
              <View style={{ marginBottom: 8 }}>
                  {todayClosed ? (
                    <Text style={{ color: '#ec4899', fontSize: 14, fontWeight: '700', paddingVertical: 16 }}>
                      Hoje não temos mais horários disponíveis.
                    </Text>
                  ) : dayFullyBooked ? (
                    <Text style={{ color: '#ec4899', fontSize: 14, fontWeight: '700', paddingVertical: 16 }}>
                      Agenda lotada nesse dia.
                    </Text>
                  ) : (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text>Horário</Text>
                        {reserveTimeStr && timeAvailability && (
                          <Text style={{ color: timeAvailability.ok ? '#16a34a' : '#dc2626', fontSize: 13, fontWeight: '600' }}>
                            {timeAvailability.ok ? 'Disponível ✓' : 'Indisponível ✕'}
                          </Text>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                        <TouchableOpacity
                          onPress={() => adjustReserveTime(-15)}
                          style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#fce7f3', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
                        >
                          <Text style={{ fontSize: 16, color: '#ec4899', fontWeight: '700' }}>−</Text>
                        </TouchableOpacity>
                        <TextInput
                          value={reserveTimeStr}
                          onChangeText={(t) => setReserveTimeStr(formatTimeInput(t))}
                          placeholder="--:--"
                          keyboardType="number-pad"
                          maxLength={5}
                          style={{ flex: 1, height: 36, borderWidth: 1, borderColor: '#ec4899', borderRadius: 8, paddingHorizontal: 10, textAlign: 'center', fontSize: 15, color: '#111827' }}
                        />
                        <TouchableOpacity
                          onPress={() => adjustReserveTime(15)}
                          style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#fce7f3', alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}
                        >
                          <Text style={{ fontSize: 16, color: '#ec4899', fontWeight: '700' }}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
              </View>
              )}
              <View style={{ marginBottom: 8 }}>
                <Text>Nome completo</Text>
                <TextInput value={reserveName} onChangeText={setReserveName} style={{ height: 36, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10 }} />
              </View>
              <View style={{ marginBottom: 8 }}>
                <Text>Email</Text>
                <TextInput value={reserveEmail} onChangeText={setReserveEmail} keyboardType="email-address" autoCapitalize="none" style={{ height: 36, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10 }} />
              </View>
              <View style={{ marginBottom: 8 }}>
                <Text>Telefone</Text>
                <TextInput value={reservePhone} onChangeText={onPhoneChange} keyboardType="phone-pad" style={{ height: 36, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10 }} />
              </View>
              {(() => {
                const matched = reserveService
                const valid = Boolean(matched && reserveStart && timeAvailability?.ok && reserveName.trim().length >= 3 && isEmailValid(reserveEmail) && reservePhone.replace(/\D/g, '').length >= 10)
                const onMark = async () => {
                  if (!matched || !reserveStart || !timeAvailability?.ok || !selected || reserveBusy) return
                  setReserveError(null)
                  setReserveBusy(true)
                  const end = new Date(reserveStart.getTime() + matched.duration_min * 60000)
                  const res = await bookSlotByTime(String(selected.id), reserveStart.toISOString(), end.toISOString(), String(matched.id), reserveName.trim(), reserveEmail.trim(), reservePhone)
                  setReserveBusy(false)
                  if (res.error) {
                    setReserveError('Esse horário acabou de ser reservado. Escolha outro.')
                    setReserveTimeStr('')
                    await loadAgenda(selected)
                    return
                  }
                  await loadAgenda(selected)
                  closeModal()
                }
                return (
                  <View>
                    {reserveError ? <Text style={{ color: '#dc2626', marginTop: 8, textAlign: 'center' }}>{reserveError}</Text> : null}
                    <TouchableOpacity disabled={!valid || reserveBusy} onPress={onMark} style={{ marginTop: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: (valid && !reserveBusy) ? '#ec4899' : '#fde7f3', borderRadius: 10 }}>
                      <Text style={{ color: (valid && !reserveBusy) ? '#ffffff' : '#ec4899', fontWeight: '600', textAlign: 'center' }}>{reserveBusy ? 'Reservando…' : 'Agendar'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={closeModal} style={{ marginTop: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f3f4f6', borderRadius: 10 }}>
                      <Text style={{ color: '#111827', textAlign: 'center' }}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                )
              })()}
          </Animated.View>
        </View>
      )}
    </View>
  )
}