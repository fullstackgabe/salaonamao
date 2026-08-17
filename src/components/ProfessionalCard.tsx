import { Link } from 'expo-router'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { Professional } from '@/types'

type Props = { professional: Professional, onPress?: () => void }

function CardBody({ professional }: { professional: Professional }) {
  return (
    <>
      {professional.avatar_url ? (
        <Image source={typeof professional.avatar_url === 'number' ? professional.avatar_url : { uri: professional.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
      ) : (
        <View style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#e5e7eb' }} />
      )}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, fontWeight: '500' }} numberOfLines={1} ellipsizeMode="tail">{professional.name}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#fde7f3', borderRadius: 6 }}>
          <Text style={{ color: '#ec4899', fontSize: 12 }}>★ {(professional.rating ?? 0)}</Text>
        </View>
      </View>
    </>
  )
}

export default function ProfessionalCard({ professional, onPress }: Props) {
  const rowStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }
  return (
    onPress ? (
      <TouchableOpacity onPress={onPress} style={rowStyle}>
        <CardBody professional={professional} />
      </TouchableOpacity>
    ) : (
      <Link href={{ pathname: 'professionals/[id]', params: { id: String(professional.id) } }} asChild>
        <TouchableOpacity style={rowStyle}>
          <CardBody professional={professional} />
        </TouchableOpacity>
      </Link>
    )
  )
}
