import { Tabs, router } from 'expo-router'
import { View, Image, Pressable, Text } from 'react-native'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'left',
        headerStyle: { backgroundColor: '#ffffff', height: 52 },
        headerShadowVisible: true,
        headerTitleStyle: { fontSize: 20, fontWeight: '600', color: '#111827' },
        headerTitleContainerStyle: { paddingLeft: 20 },
        headerLeftContainerStyle: { paddingLeft: 20 },
        headerRightContainerStyle: { paddingRight: 20 },
        headerTintColor: '#111827',
        tabBarActiveTintColor: '#ec4899',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Início',
          headerTitle: () => null,
          headerLeft: () => (
            <Image source={require('../../imgs/logo.png')} style={{ height: 40, width: 100, resizeMode: 'contain' }} />
          ),
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/login')}
              hitSlop={12}
              style={{ backgroundColor: '#fce7f3', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#ec4899' }}>Login</Text>
            </Pressable>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: focused ? '#f9a8d4' : '#fce7f3' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="profiles"
        options={{
          headerShown: true,
          title: 'Profissionais',
          tabBarIcon: ({ focused }) => (
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: focused ? '#f9a8d4' : '#fce7f3' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          headerShown: true,
          title: 'Serviços',
          tabBarIcon: ({ focused }) => (
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: focused ? '#f9a8d4' : '#fce7f3' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          headerShown: true,
          title: 'Agenda',
          tabBarIcon: ({ focused }) => (
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: focused ? '#f9a8d4' : '#fce7f3' }} />
          ),
        }}
      />
    </Tabs>
  )
}