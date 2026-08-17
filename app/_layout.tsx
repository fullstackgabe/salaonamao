import { Stack } from 'expo-router'
import { Platform, SafeAreaView } from 'react-native'
import { AuthProvider } from '@/lib/auth'
import StackHeader from '@/components/StackHeader'

if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('web-frame')) {
  const s = document.createElement('style')
  s.id = 'web-frame'
  s.textContent = `
    html,body{margin:0}
    input:focus, textarea:focus, select:focus { outline: 2px solid #ec4899 !important; outline-offset: 0 !important; }
    @media (min-width:720px){
      body{background:linear-gradient(135deg,#fbcfe8,#f5d0fe);min-height:100vh}
      #root{width:460px;max-width:100%;height:min(860px, calc(100vh - 48px));margin:24px auto;background:#fff;border-radius:36px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,.22)}
    }`
  document.head.appendChild(s)
}

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AuthProvider>
        <Stack screenOptions={{
          header: ({ options, navigation, back }) => (
            <StackHeader
              title={typeof options.title === 'string' ? options.title : ''}
              canGoBack={!!back}
              onBack={() => navigation.goBack()}
            />
          ),
        }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="professionals/[id]" options={{ title: 'Profissional', headerBackTitle: 'Voltar', headerBackTitleVisible: true }} />
          <Stack.Screen name="reserve/index" options={{ title: 'Reserva', headerBackTitle: 'Voltar', headerBackTitleVisible: true }} />
          <Stack.Screen name="login" options={{ title: 'Área do profissional', headerBackTitle: 'Voltar', headerBackTitleVisible: true }} />
        </Stack>
      </AuthProvider>
    </SafeAreaView>
  )
}