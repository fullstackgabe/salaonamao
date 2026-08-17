import { View, ImageBackground, Text } from 'react-native'

export default function Home() {
  return (
    <ImageBackground source={require('../../imgs/main.jpg')} style={{ flex: 1 }} resizeMode="cover">
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Text style={{ color: '#f472b6', fontSize: 26, fontWeight: '800', textAlign: 'center' }}>Seu salão na palma da mão</Text>
        <Text style={{ color: '#ffffff', fontSize: 18, lineHeight: 28, marginTop: 12, textAlign: 'center' }}>Veja a agenda do seu profissional e agende um horário rapidamente.</Text>
      </View>
    </ImageBackground>
  )
}
