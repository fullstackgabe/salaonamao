import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, Animated } from 'react-native'
import { useEffect, useState } from 'react'
import { fetchPortfolios, fetchReviews, fetchServices, addReview } from '@/lib/repo'
import { Professional, PortfolioItem, Review, Service } from '@/types'

type Props = { professional: Professional }

export default function ProfessionalProfile({ professional }: Props) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false)
  const [modalOpacity] = useState(new Animated.Value(0))
  const [modalScale] = useState(new Animated.Value(0.96))
  
  const [newRating, setNewRating] = useState<number>(0)
  const [newComment, setNewComment] = useState<string>('')
  useEffect(() => {
    fetchPortfolios(String(professional.id)).then((pf) => setPortfolio(pf as any))
    fetchReviews(String(professional.id)).then((rv) => setReviews(rv as any))
    fetchServices().then((all) => {
      const filtered = (all as Service[]).filter((s) => (professional.specialties || []).includes(s.name))
      setServices(filtered)
    })
  }, [professional.id])
  
  useEffect(() => {
    if (reviewModalOpen) {
      Animated.parallel([
        Animated.timing(modalOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(modalScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(modalOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(modalScale, { toValue: 0.96, duration: 200, useNativeDriver: true }),
      ]).start()
    }
  }, [reviewModalOpen])
  const iconFor = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('corte')) return '✂️'
    if (n.includes('escova')) return '💨'
    if (n.includes('chapinha')) return '🔥'
    if (n.includes('progressiva')) return '💁‍♀️'
    if (n.includes('hidrat')) return '💧'
    if (n.includes('reconstr')) return '🧪'
    if (n.includes('color')) return '🎨'
    if (n.includes('mecha') || n.includes('luzes')) return '✨'
    if (n.includes('tonal')) return '🌈'
    if (n.includes('babyliss')) return '🌀'
    if (n.includes('penteado')) return '👱‍♀️'
    if (n.includes('maqui')) return '💄'
    if (n.includes('manicure') || n.includes('pedicure')) return '💅'
    if (n.includes('sobrancelha')) return '👁️'
    if (n.includes('depila')) return '🧴'
    return '⭐'
  }
  const publishReview = async () => {
    if (!newRating || !newComment.trim()) return
    const res = await addReview(String(professional.id), newRating, newComment.trim())
    if (res.error) return
    const rv = await fetchReviews(String(professional.id))
    setReviews(rv as any)
    setNewRating(0); setNewComment('')
  }
  const publishEnabled = !!newRating && newComment.trim().length >= 12
  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        {professional.avatar_url ? (
          <Image source={typeof professional.avatar_url === 'number' ? professional.avatar_url : { uri: professional.avatar_url }} style={{ width: 96, height: 96, borderRadius: 48 }} />
        ) : (
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#e5e7eb' }} />
        )}
        <Text style={{ fontSize: 24, fontWeight: '600', marginTop: 12 }}>{professional.name}</Text>
        <Text style={{ color: professional.bio ? '#374151' : '#9ca3af', marginTop: 4 }}>{professional.bio || 'Este profissional ainda não adicionou uma descrição.'}</Text>
        <View style={{ marginTop: 28 }}>
          <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 8 }}>Especialidades</Text>
          {services.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {services.map((item) => (
                <View key={String(item.id)} style={{ width: 120, marginRight: 12, padding: 12, backgroundColor: '#fdf2f8', borderRadius: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fce7f3', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 20 }}>{iconFor(item.name)}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600' }} numberOfLines={2}>{item.name}</Text>
                  <Text style={{ color: '#6b7280', marginTop: 4 }}>{Math.round(item.duration_min)} min</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={{ color: '#9ca3af' }}>Nenhuma especialidade cadastrada ainda.</Text>
          )}
        </View>
      </View>

      

      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 8 }}>Portfólio</Text>
        {portfolio.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {portfolio.map((item) => (
              <View key={String(item.id)} style={{ width: 180, marginRight: 12 }}>
                <Image source={typeof item.image_url === 'number' ? item.image_url : { uri: item.image_url }} style={{ width: 180, height: 160, borderRadius: 12 }} />
                <Text style={{ marginTop: 6, fontSize: 13 }} numberOfLines={2}>{item.description || 'Trabalho realizado com cuidado e atenção.'}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={{ color: '#9ca3af' }}>Nenhuma imagem no portfólio ainda.</Text>
        )}
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 8 }}>Avaliações</Text>
        <View style={{ marginTop: 12 }}>
          {reviews.length === 0 && (
            <Text style={{ color: '#9ca3af', marginBottom: 12 }}>Ainda não há avaliações.</Text>
          )}
          {reviews.map((item) => (
            <View key={String(item.id)} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                {[0,1,2,3,4].map((i) => (
                  <Text key={i} style={{ fontSize: 16, marginRight: 2, color: i < item.rating ? '#f59e0b' : '#9ca3af' }}>★</Text>
                ))}
              </View>
              <Text style={{ color: '#374151' }}>{item.comment}</Text>
            </View>
          ))}
          <TouchableOpacity onPress={() => setReviewModalOpen(true)} style={{ marginTop: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ec4899', borderRadius: 10 }}>
            <Text style={{ color: '#ffffff', fontWeight: '600', textAlign: 'center' }}>Publicar avaliação</Text>
          </TouchableOpacity>
        </View>
      </View>

      </ScrollView>
      {reviewModalOpen && (
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, opacity: modalOpacity }}>
          <Animated.View style={{ width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 12, padding: 16, transform: [{ scale: modalScale }] }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Publicar avaliação</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              {[1,2,3,4,5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setNewRating(n)}>
                  <Text style={{ fontSize: 22, marginRight: 6, color: newRating >= n ? '#f59e0b' : '#9ca3af' }}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Escreva sua avaliação"
              multiline
              style={{ minHeight: 80, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity onPress={() => { setReviewModalOpen(false); setNewRating(0); setNewComment('') }} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginRight: 8, backgroundColor: '#f3f4f6' }}>
                <Text style={{ color: '#111827', fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { if (publishEnabled) { publishReview(); setReviewModalOpen(false) } }} disabled={!publishEnabled} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: publishEnabled ? '#ec4899' : '#fde7f3' }}>
                <Text style={{ color: publishEnabled ? '#ffffff' : '#ec4899', fontWeight: '600' }}>Publicar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  )
}