import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import ServiceSelector from '@/components/ServiceSelector'
import { Service } from '@/types'

export default function ReserveScreen() {
  const params = useLocalSearchParams() as any
  const [service, setService] = useState<Service | null>(null)
  const [openSelector, setOpenSelector] = useState<boolean>(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const startLabel = params.start ? new Date(params.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
  const endLabel = params.end ? new Date(params.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
  const formatPhone = (input: string) => {
    const digits = input.replace(/\D/g, '')
    const d = digits.slice(0, 11)
    const part1 = d.slice(0, 2)
    const part2 = d.length > 6 ? d.slice(2, 7) : d.slice(2)
    const part3 = d.length > 6 ? d.slice(7) : ''
    return d.length <= 2 ? part1 : d.length <= 7 ? `(${part1}) ${part2}` : `(${part1}) ${part2}-${part3}`
  }
  const onPhoneChange = (t: string) => setPhone(formatPhone(t))
  const isEmailValid = (e: string) => /.+@.+\..+/.test(e)
  const isValid = Boolean(service && name.trim().length >= 3 && isEmailValid(email) && phone.replace(/\D/g, '').length >= 10)
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Reserva</Text>
      <Text style={{ color: '#6b7280', marginBottom: 12 }}>das {startLabel} às {endLabel}</Text>
      <View style={{ marginBottom: 8 }}>
        <Text>Serviço</Text>
        <TouchableOpacity onPress={() => setOpenSelector(true)} style={{ height: 36, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, justifyContent: 'center' }}>
          <Text style={{ color: service ? '#111827' : '#9ca3af' }}>{service ? service.name : 'Selecionar serviço'}</Text>
        </TouchableOpacity>
      </View>
      {openSelector && (
        <View style={{ marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: '#ffffff' }}>
          <ServiceSelector value={service} onChange={(s) => { setService(s); setOpenSelector(false) }} />
        </View>
      )}
      <View style={{ marginBottom: 8 }}>
        <Text>Nome completo</Text>
        <TextInput value={name} onChangeText={setName} style={{ height: 36, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10 }} />
      </View>
      <View style={{ marginBottom: 8 }}>
        <Text>Email</Text>
        <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={{ height: 36, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10 }} />
      </View>
      <View style={{ marginBottom: 8 }}>
        <Text>Telefone</Text>
        <TextInput value={phone} onChangeText={onPhoneChange} keyboardType="phone-pad" style={{ height: 36, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10 }} />
      </View>
      <TouchableOpacity disabled={!isValid} style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: isValid ? '#ec4899' : '#fde7f3', borderRadius: 10 }}>
        <Text style={{ color: isValid ? '#ffffff' : '#ec4899', fontWeight: '600', textAlign: 'center' }}>Reservar</Text>
      </TouchableOpacity>
    </View>
  )
}