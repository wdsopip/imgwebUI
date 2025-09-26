export interface ApiConfig {
  id: string
  name: string
  url: string
  apiKey: string
  headers?: Record<string, string>
  model?: string
  isActive: boolean
}

export interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  images?: string[]
  timestamp: Date
  parameters?: GenerationParameters
}

export interface GenerationParameters {
  model?: string
  width?: number
  height?: number
  steps?: number
  cfg_scale?: number
  seed?: number
  sampler?: string
  negative_prompt?: string
  batch_size?: number
  style?: string
  quality?: 'draft' | 'standard' | 'hd'
  generation_type?: 'text_to_image' | 'image_to_image' | 'multi_image_fusion' | 'image_variation' | 'batch_generation' | 'text_to_batch' | 'image_to_batch' | 'multi_reference_batch'
  input_images?: string[]
  strength?: number
  guidance_scale?: number
  num_inference_steps?: number
  scheduler?: string
  watermark?: boolean
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface GenerationRequest {
  prompt: string
  parameters: GenerationParameters
  apiConfigId: string
}

export interface GenerationResponse {
  success: boolean
  images?: string[]
  error?: string
}

export interface ChatHistoryResponse {
  id: string
  prompt: string
  images: string[]
  parameters: GenerationParameters
  timestamp: string
}