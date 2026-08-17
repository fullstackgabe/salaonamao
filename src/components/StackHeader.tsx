import { View, Text, Pressable } from 'react-native'

type Props = { title: string; canGoBack: boolean; onBack: () => void }

export default function StackHeader({ title, canGoBack, onBack }: Props) {
  return (
    <View style={{ height: 52, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
      {canGoBack && (
        <Pressable onPress={onBack} hitSlop={12} style={{ marginRight: 6 }}>
          <Text style={{ fontSize: 26, lineHeight: 26, color: '#ec4899' }}>‹</Text>
        </Pressable>
      )}
      <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827' }} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
    </View>
  )
}
