export interface User {
  id: number
  email: string
  full_name: string | null
  preferences: Record<string, unknown> | null
  is_active: boolean
  created_at: string
}

export interface ClothingItem {
  id: number
  owner_id: number
  name: string | null
  category: string
  subcategory: string | null
  dominant_color: string | null
  secondary_colors: string[] | null
  fabric: string | null
  pattern: string | null
  styles: string[] | null
  seasons: string[] | null
  min_temp: number | null
  max_temp: number | null
  image_front: string | null
  image_back: string | null
  image_label: string | null
  image_clean: string | null
  ai_tags: Record<string, unknown> | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LookItem {
  id: number
  clothing_item: ClothingItem
  position: number
}

export interface Look {
  id: number
  title: string | null
  occasion: string | null
  temperature: number | null
  weather_condition: string | null
  rationale: string | null
  items: LookItem[]
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}
