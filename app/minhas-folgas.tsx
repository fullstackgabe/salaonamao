import { useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useAuth } from '@/lib/auth'
import { fetchDaysOff, addDayOff, removeDayOff } from '@/lib/repo'

const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function BloquearDias() {
  const { session } = useAuth()
  const professionalId = session?.user?.app_metadata?.professional_id

  const [loading, setLoading] = useState(true)
  const [daysOff, setDaysOff] = useState<Set<string>>(new Set())
  const [monthCursor, setMonthCursor] = useState<Date>(new Date())
  const [togglingDay, setTogglingDay] = useState<string | null>(null)

  useEffect(() => {
    if (!professionalId) return
    setLoading(true)
    fetchDaysOff(String(professionalId)).then((off) => {
      setDaysOff(new Set(off))
      setLoading(false)
    })
  }, [professionalId])

  const toggleDay = async (key: string) => {
    if (!professionalId || togglingDay) return
    setTogglingDay(key)
    const isOff = daysOff.has(key)
    if (isOff) await removeDayOff(String(professionalId), key)
    else await addDayOff(String(professionalId), key)
    setDaysOff((prev) => {
      const next = new Set(prev)
      if (isOff) next.delete(key)
      else next.add(key)
      return next
    })
    setTogglingDay(null)
  }

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const year = monthCursor.getFullYear()
  const month = monthCursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysArray = Array.from({ length: startWeekday + daysInMonth }, (_, i) => (i < startWeekday ? null : i - startWeekday + 1))
  const canGoPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1)
  const monthName = monthCursor.toLocaleString('pt-BR', { month: 'long' })

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#ec4899" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => { if (canGoPrev) setMonthCursor(new Date(year, month - 1, 1)) }}>
            <Text style={{ fontSize: 20, color: canGoPrev ? '#ec4899' : '#d1d5db' }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ marginHorizontal: 14, fontSize: 15, fontWeight: '600', textTransform: 'capitalize' }}>{monthName} {year}</Text>
          <TouchableOpacity onPress={() => setMonthCursor(new Date(year, month + 1, 1))}>
            <Text style={{ fontSize: 20, color: '#ec4899' }}>›</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: '#ec4899', fontSize: 12, fontWeight: '600' }}>Toque para marcar/desmarcar</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, idx) => (
          <Text key={`${d}-${idx}`} style={{ width: '14.285%', textAlign: 'center', color: '#6b7280', fontSize: 12 }}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {daysArray.map((day, idx) => {
          if (day === null) return <View key={idx} style={{ width: '14.285%', height: 40 }} />
          const d = new Date(year, month, day)
          const key = dateKey(d)
          const isPast = d < today
          const isWeekend = d.getDay() === 0 || d.getDay() === 6
          const isOff = daysOff.has(key)
          const disabled = isPast || isWeekend
          return (
            <View key={idx} style={{ width: '14.285%', height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <TouchableOpacity
                disabled={disabled || togglingDay === key}
                onPress={() => toggleDay(key)}
                style={{
                  width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16,
                  backgroundColor: isOff ? '#ec4899' : 'transparent',
                  borderWidth: disabled ? 0 : 1,
                  borderColor: isOff ? '#ec4899' : '#f9a8d4',
                }}
              >
                <Text style={{ color: isOff ? '#ffffff' : disabled ? '#d1d5db' : '#111827', fontWeight: isOff ? '700' : '500', fontSize: 13 }}>{day}</Text>
              </TouchableOpacity>
            </View>
          )
        })}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#f9a8d4', marginRight: 6 }} />
        <Text style={{ color: '#6b7280', fontSize: 12, marginRight: 16 }}>Disponível</Text>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#ec4899', marginRight: 6 }} />
        <Text style={{ color: '#6b7280', fontSize: 12 }}>Bloqueado</Text>
      </View>
    </View>
  )
}
