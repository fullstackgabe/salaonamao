export type Service = {
  id: string
  name: string
  duration_min: number
  price_cents: number
  tags?: string[]
}

export type Professional = {
  id: string
  name: string
  bio: string
  specialties: string[]
  avatar_url?: string | number
  rating?: number
}

export type PortfolioItem = {
  id: string
  professional_id: string
  image_url: string | number
  description?: string
}

export type Review = {
  id: string
  professional_id: string
  customer_id: string
  rating: number
  comment?: string
}

export type AvailabilitySlot = {
  id: string
  professional_id: string
  start_time: string
  end_time: string
  status: 'available' | 'reserved' | 'blocked'
}

export type Booking = {
  id: string
  customer_id: string
  professional_id: string
  service_id: string
  slot_id: string
  status: 'confirmed' | 'cancelled'
}

export type Preference = {
  id: string
  customer_id: string
  preferred_services: string[]
  preferred_professionals: string[]
}