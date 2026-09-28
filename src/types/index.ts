export type Goal = "MUSCLE_GAIN" | "WEIGHT_LOSS" | "ENERGY" | "RECOVERY" | "GENERAL"

export interface ProductVariant {
  id: string
  name: string
  sku: string
  price: number
  compareAtPrice?: number
  costPrice?: number
  stock: number
  image?: string
  attributes: Record<string, string>
  isDefault: boolean
}

export interface Review {
  id: string
  userName: string
  rating: number
  comment: string
  createdAt: string
  approved?: boolean
}

export interface NutritionFacts {
  servingSize: string
  servings: string
  calories: number
  protein: string
  carbs: string
  fat: string
  sugar: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDesc?: string
  goal?: Goal
  brand: string
  images: string[]
  isFeatured: boolean
  isSubscription: boolean
  subscriptionDiscount: number
  rating: number
  reviewCount: number
  category: { id: string; name: string; slug: string }
  variants: ProductVariant[]
  reviews: Review[]
  nutrition?: NutritionFacts
  ingredients?: string
  usage?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  image?: string
}

export interface CartItem {
  productId: string
  variantId: string
  name: string
  variantName: string
  image: string
  price: number
  quantity: number
  isSubscription: boolean
}

export interface OrderItem {
  name: string
  variantName?: string
  price: number
  quantity: number
  variantId?: string
  isSubscription?: boolean
}

export interface ApiPromo {
  id: string
  code: string
  discount: number
  expiry: string
  active: boolean
  uses: number
}