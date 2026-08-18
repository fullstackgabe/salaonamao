import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/lib/auth'
import ProfessionalEditor from '@/components/ProfessionalEditor'

export default function EditarPerfil() {
  const { session } = useAuth()
  const professionalId = session?.user?.app_metadata?.professional_id

  return (
    <ScrollView contentContainerStyle={{ padding: 24, backgroundColor: '#fff', flexGrow: 1 }}>
      {professionalId ? (
        <ProfessionalEditor professionalId={String(professionalId)} />
      ) : (
        <Text style={{ color: '#6b7280', textAlign: 'center', marginVertical: 16 }}>Sua conta ainda não está vinculada a um perfil.</Text>
      )}

      <TouchableOpacity
        onPress={() => router.back()}
        style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10 }}
      >
        <Text style={{ color: '#6b7280', fontWeight: '700', fontSize: 15 }}>Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
