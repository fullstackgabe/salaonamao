import { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Dimensions, Image, TextInput, Animated, Easing } from 'react-native'
import { fetchProfessionals, fetchServices, fetchSlots, fetchBookings, bookSlot } from '@/lib/repo'
import { AvailabilitySlot, Professional, Service } from '@/types'
 

export default function AgendaTab() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selected, setSelected] = useState<Professional | null>(null)
  const [monthCursor, setMonthCursor] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [servicesMap, setServicesMap] = useState<Record<string, Service>>({})
  const [openSelector, setOpenSelector] = useState<boolean>(false)
  const [selectorH, setSelectorH] = useState<number>(0)
  const [bookingsBySlot, setBookingsBySlot] = useState<Record<string, any>>({})
  const [reserveError, setReserveError] = useState<string | null>(null)
  const [reserveBusy, setReserveBusy] = useState(false)
  const [pendingReserve, setPendingReserve] = useState<AvailabilitySlot | null>(null)
  const [reserveService, setReserveService] = useState<Service | null>(null)
  const [reserveName, setReserveName] = useState('')
  const [reserveEmail, setReserveEmail] = useState('')
  const [reservePhone, setReservePhone] = useState('')
  const [openServiceSelector, setOpenServiceSelector] = useState<boolean>(false)
  const modalAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (pendingReserve) {
      modalAnim.setValue(0)
      Animated.timing(modalAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
    }
  }, [pendingReserve])
  const closeModal = () => {
    setReserveError(null)
    setReserveBusy(false)
    Animated.timing(modalAnim, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setPendingReserve(null))
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
      if (!selected && rows.length > 0) setSelected(rows[0])
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
    if (!prof) { setSlots([]); setBookingsBySlot({}); return }
    const [sl, bk] = await Promise.all([
      fetchSlots(String(prof.id)),
      fetchBookings(String(prof.id)),
    ])
    setSlots(sl as AvailabilitySlot[])
    const map: Record<string, any> = {}
    ;(bk as any[]).forEach((b) => { if (b?.slot_id) map[String(b.slot_id)] = b })
    setBookingsBySlot(map)
  }

  useEffect(() => { loadAgenda(selected) }, [selected?.id])

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

  const eventsBusinessHours = useMemo(() => {
    return upcomingForSelectedDay.filter((ev) => {
      const h = new Date(ev.start_time).getHours()
      return h >= BUSINESS_START_HOUR && h < BUSINESS_END_HOUR
    })
  }, [upcomingForSelectedDay])

  const displayEvents = useMemo(() => {
    if (!selected) return []
    const blocks: AvailabilitySlot[] = []
    for (let h = BUSINESS_START_HOUR; h < BUSINESS_END_HOUR; h++) {
      const start = new Date(selectedDate); start.setHours(h, 0, 0, 0)
      const end = new Date(selectedDate); end.setHours(h + 1, 0, 0, 0)
      const slot = eventsBusinessHours.find((s) => {
        const d = new Date(s.start_time)
        return d.getFullYear() === selectedDate.getFullYear() && d.getMonth() === selectedDate.getMonth() && d.getDate() === selectedDate.getDate() && d.getHours() === h
      })
      if (slot) {
        blocks.push(slot)
      } else {
        blocks.push({
          id: `free-${selected.id}-${start.toISOString()}`,
          professional_id: selected.id,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          status: 'available',
        })
      }
    }
    return blocks
  }, [eventsBusinessHours, selected?.id, selectedDate])

  const visibleEvents = useMemo(() => {
    return [...displayEvents].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [displayEvents])

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, zIndex: 20 }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
            <TouchableOpacity onPress={() => { if (canGoPrev) setMonthCursor(new Date(year, monthCursor.getMonth() - 1, 1)) }}>
              <Text style={{ fontSize: 18, color: canGoPrev ? '#ec4899' : '#d1d5db' }}>{'‹'}</Text>
            </TouchableOpacity>
            <Text style={{ marginHorizontal: 12, fontSize: 16, fontWeight: '600', textTransform: 'capitalize' }}>{monthName} {year}</Text>
            <TouchableOpacity onPress={() => setMonthCursor(new Date(year, monthCursor.getMonth() + 1, 1))}>
              <Text style={{ fontSize: 18, color: '#ec4899' }}>{'›'}</Text>
            </TouchableOpacity>
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
                <TouchableOpacity
                  key={idx}
                  disabled={isDisabled}
                  style={{ width: '14.285%', height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: isSelected ? '#f9a8d4' : 'transparent' }}
                  onPress={() => setSelectedDate(new Date(year, monthCursor.getMonth(), day))}
                >
                  <Text style={{ color: isDisabled ? '#9ca3af' : '#111827' }}>{day}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
        <View style={{ flex: 1, marginTop: 16, paddingTop: 16, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#ffffff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: '#111827', fontWeight: '700', fontSize: 15 }}>Eventos</Text>
          </View>
          {(!selected) ? (
            <Text style={{ color: '#111827' }}>Nenhum evento para o dia selecionado</Text>
          ) : (
            (() => {
              if (visibleEvents.length === 0) {
                const isToday = new Date().toDateString() === selectedDate.toDateString()
                const onOpenQuickReserve = () => {
                  if (!selected) return
                  const start = new Date(selectedDate); start.setHours(12, 0, 0, 0)
                  const end = new Date(selectedDate); end.setHours(13, 0, 0, 0)
                  setPendingReserve({ id: `free-${selected.id}-${start.toISOString()}`, professional_id: selected.id, start_time: start.toISOString(), end_time: end.toISOString(), status: 'available' })
                  setReserveService(null); setReserveName(''); setReserveEmail(''); setReservePhone('')
                }
                return (
                  <View>
                    <Text style={{ color: '#6b7280' }}>{isToday ? 'Não temos nada agendado para hoje ainda.' : 'Não temos nada agendado ainda para o dia selecionado.'}</Text>
                    <TouchableOpacity onPress={onOpenQuickReserve} style={{ marginTop: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#ec4899', borderRadius: 8, alignSelf: 'flex-start' }}>
                      <Text style={{ color: '#ffffff', fontWeight: '600' }}>Agendar horário</Text>
                    </TouchableOpacity>
                  </View>
                )
              }
              return (
                <FlatList
                data={visibleEvents}
                keyExtractor={(ev) => String(ev.id)}
                renderItem={({ item: ev }) => {
                  const start = new Date(ev.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  const end = new Date(ev.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  const status = ev.status
                  const booking = bookingsBySlot[String(ev.id)]
                  const isFree = (!booking && status !== 'blocked' && status !== 'reserved')
                  const serviceName = booking
                    ? (servicesMap[String(booking.service_id)]?.name || 'Reservado')
                    : (status === 'blocked' ? 'Bloqueado' : (status === 'reserved' ? 'Ocupado' : 'Livre'))
                  const leftColor = status === 'blocked' ? '#991b1b' : '#111827'
                  const cardBg = status === 'blocked' ? '#fee2e2' : (isFree ? '#ffffff' : '#fde7f3')
                  const cardBorder = status === 'blocked' ? '#fca5a5' : (isFree ? '#e5e7eb' : '#fbcfe8')
                  const timeChipBg = isFree ? 'transparent' : '#fbcfe8'
                  const timeChipColor = isFree ? '#374151' : '#9d174d'
                  return (
                    <TouchableOpacity disabled={!isFree} activeOpacity={1} onPress={() => { setPendingReserve(ev); setReserveService(null); setReserveName(''); setReserveEmail(''); setReservePhone('') }} style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: leftColor, fontSize: 13, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">{serviceName}</Text>
                      </View>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: timeChipBg }}>
                        <Text style={{ color: timeChipColor, fontSize: 12 }}>{start} às {end}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                }}
                ListEmptyComponent={<Text style={{ color: '#111827' }}>Nenhum evento para o dia selecionado</Text>}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              />
              )
            })()
          )}
        </View>
      </View>
      {pendingReserve && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
          <Animated.View style={[{ width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 12, padding: 16, position: 'relative' }, modalAnimatedStyle]}>
              {pendingReserve && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 6 }}>Agendar horário</Text>
                  <Text style={{ color: '#6b7280' }}>das {new Date(pendingReserve.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {new Date(pendingReserve.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              )}
              <View style={{ marginBottom: 8 }}>
                <Text>Serviço</Text>
                <View style={{ marginTop: 6 }}>
                  <FlatList
                    data={availableServices}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => setReserveService(item)}
                        style={{ paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff' }}
                      >
                        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#ec4899', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                          {reserveService?.id === item.id && (
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ec4899' }} />
                          )}
                        </View>
                        <Text style={{ color: '#111827', flex: 1 }}>{item.name}</Text>
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
                const valid = Boolean(matched && reserveName.trim().length >= 3 && isEmailValid(reserveEmail) && reservePhone.replace(/\D/g, '').length >= 10)
                const isRealSlot = !!pendingReserve && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(pendingReserve.id))
                const onMark = async () => {
                  if (!pendingReserve || !matched || !selected || reserveBusy) return
                  setReserveError(null)
                  if (!isRealSlot) { closeModal(); return }
                  setReserveBusy(true)
                  const res = await bookSlot(String(pendingReserve.id), String(matched.id), reserveName.trim(), reserveEmail.trim(), reservePhone)
                  setReserveBusy(false)
                  if (res.error) {
                    setReserveError('Esse horário acabou de ser reservado. Escolha outro.')
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