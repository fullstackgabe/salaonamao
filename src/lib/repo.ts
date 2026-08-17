import { supabase } from '@/lib/supabase'

export async function fetchProfessionals(): Promise<any[]> {
  const { data, error } = await supabase.from('professionals').select('*').order('rating', { ascending: false })
  if (error || !data) return []
  return data as any[]
}

export async function fetchProfessionalById(id: string): Promise<any | null> {
  const { data, error } = await supabase.from('professionals').select('*').eq('id', id).single()
  if (error || !data) return null
  return data as any
}

export async function updateProfessional(
  id: string,
  fields: { name?: string; bio?: string; specialties?: string[]; avatar_url?: string },
): Promise<{ error?: string }> {
  const { error } = await supabase.from('professionals').update(fields).eq('id', id)
  return error ? { error: error.message || 'Não foi possível salvar.' } : {}
}

export async function fetchServices(): Promise<any[]> {
  const { data, error } = await supabase.from('services').select('*').order('name')
  if (error || !data) return []
  return data as any[]
}

export async function fetchPortfolios(professionalId: string): Promise<any[]> {
  const { data, error } = await supabase.from('portfolios').select('*').eq('professional_id', professionalId)
  if (error || !data) return []
  return data as any[]
}

export async function fetchReviews(professionalId: string): Promise<any[]> {
  const { data, error } = await supabase.from('reviews').select('*').eq('professional_id', professionalId).order('created_at', { ascending: false })
  if (error || !data) return []
  return data as any[]
}

export async function addReview(
  professionalId: string,
  rating: number,
  comment: string,
): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({ professional_id: professionalId, rating, comment })
    .select('id')
    .single()
  if (error) return { error: error.message || 'Não foi possível publicar a avaliação.' }
  return { id: (data as any)?.id }
}

export async function uploadAvatarImage(
  professionalId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${professionalId}/avatar-${Date.now()}.${ext}`
  const up = await supabase.storage.from('portfolios').upload(path, file, { contentType: file.type || 'image/jpeg', upsert: true })
  if (up.error) return { error: up.error.message || 'Falha no upload da foto.' }
  const { data: pub } = supabase.storage.from('portfolios').getPublicUrl(path)
  return { url: pub.publicUrl }
}

export async function uploadPortfolioImage(
  professionalId: string,
  file: File,
  description?: string,
): Promise<{ id?: string; image_url?: string; error?: string }> {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${professionalId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`
  const up = await supabase.storage.from('portfolios').upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false })
  if (up.error) return { error: up.error.message || 'Falha no upload da imagem.' }
  const { data: pub } = supabase.storage.from('portfolios').getPublicUrl(path)
  const image_url = pub.publicUrl
  const { data, error } = await supabase
    .from('portfolios')
    .insert({ professional_id: professionalId, image_url, description: description || null })
    .select('id')
    .single()
  if (error) {
    await supabase.storage.from('portfolios').remove([path])
    return { error: error.message || 'Não foi possível salvar a imagem.' }
  }
  return { id: (data as any)?.id, image_url }
}

export async function deletePortfolioItem(id: string, imageUrl: string): Promise<{ error?: string }> {
  const marker = '/object/public/portfolios/'
  const i = imageUrl.indexOf(marker)
  const path = i >= 0 ? decodeURIComponent(imageUrl.slice(i + marker.length)) : null
  const { error } = await supabase.from('portfolios').delete().eq('id', id)
  if (error) return { error: error.message || 'Não foi possível remover.' }
  if (path) await supabase.storage.from('portfolios').remove([path])
  return {}
}

export async function fetchSlots(professionalId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('availability_slots')
    .select('*')
    .eq('professional_id', professionalId)
    .gte('start_time', new Date().toISOString())
    .order('start_time')
  if (error || !data) return []
  return data as any[]
}

export async function fetchBookings(professionalId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('professional_id', professionalId)
  if (error || !data) return []
  return data as any[]
}

export async function bookSlot(
  slotId: string,
  serviceId: string,
  name: string,
  email: string,
  phone: string,
): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase.rpc('book_slot', {
    p_slot_id: slotId,
    p_service_id: serviceId,
    p_name: name,
    p_email: email,
    p_phone: phone,
  })
  if (error) return { error: error.message || 'Não foi possível reservar.' }
  return { id: data as string }
}
