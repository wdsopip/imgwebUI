import axios from 'axios'
import { ApiConfig, GenerationResponse, ChatHistoryResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// API配置相关
export const apiConfigService = {
  // 创建API配置
  create: async (config: Omit<ApiConfig, 'id'>): Promise<ApiConfig> => {
    const response = await api.post('/api/api-configs', config)
    return response.data
  },

  // 获取所有API配置
  getAll: async (): Promise<ApiConfig[]> => {
    try {
      const response = await api.get('/api/api-configs')
      console.log('Raw API response:', response.data)
      
      // 处理后端返回的数据格式
      if (response.data && response.data.configs) {
        return response.data.configs
      } else if (Array.isArray(response.data)) {
        return response.data
      } else {
        console.error('Unexpected API response format:', response.data)
        return []
      }
    } catch (error) {
      console.error('Failed to fetch API configs:', error)
      return []
    }
  },

  // 更新API配置
  update: async (id: string, updates: Partial<ApiConfig>): Promise<void> => {
    await api.put(`/api/api-configs/${id}`, updates)
  },

  // 删除API配置
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/api-configs/${id}`)
  },

  // 测试API配置
  test: async (config: Omit<ApiConfig, 'id' | 'isActive'>): Promise<boolean> => {
    try {
      const response = await api.post('/api/api-configs/test', config)
      return response.data.success
    } catch (error) {
      console.error('API test failed:', error)
      return false
    }
  },
}

// 图片生成相关
export const generationService = {
  // 生成图片
  generate: async (request: any): Promise<GenerationResponse> => {
    console.log('Sending generation request:', request)
    console.log('Watermark parameter:', request.parameters?.watermark)
    const response = await api.post('/api/generate', request)
    console.log('Generation response:', response.data)
    return response.data
  },
}

// 聊天历史相关
export const historyService = {
  // 获取聊天历史
  getHistory: async (limit = 20, offset = 0): Promise<ChatHistoryResponse[]> => {
    const response = await api.get(`/api/chat-history?limit=${limit}&offset=${offset}`)
    return response.data
  },

  // 删除历史记录
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/chat-history/${id}`)
  },
}

export default api