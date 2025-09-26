import React, { createContext, useContext, useState, useEffect } from 'react'
import { ApiConfig } from '../types'

interface ApiContextType {
  apiConfigs: ApiConfig[]
  activeConfig: ApiConfig | null
  addApiConfig: (config: Omit<ApiConfig, 'id'>) => Promise<void>
  updateApiConfig: (id: string, config: Partial<ApiConfig>) => void
  deleteApiConfig: (id: string) => void
  setActiveConfig: (config: ApiConfig) => void
  testApiConfig: (config: Omit<ApiConfig, 'id' | 'isActive'>) => Promise<boolean>
}

const ApiContext = createContext<ApiContextType | undefined>(undefined)

export const useApi = () => {
  const context = useContext(ApiContext)
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider')
  }
  return context
}

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([])
  const [activeConfig, setActiveConfigState] = useState<ApiConfig | null>(null)

  // 从后端加载配置
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const { apiConfigService } = await import('../utils/api')
        const response = await apiConfigService.getAll()
        console.log('API response:', response)
        
        // 后端返回的是 {configs: [...]} 格式
        const backendConfigs = Array.isArray(response) ? response : (response as any).configs || []
        console.log('Backend configs:', backendConfigs)
        
        // 转换后端格式到前端格式
        const configs: ApiConfig[] = (Array.isArray(backendConfigs) ? backendConfigs : []).map((config: any) => ({
          id: config.id,
          name: config.name,
          url: config.url,
          apiKey: config.apiKey || config.api_key, // 兼容两种格式
          headers: config.headers,
          model: config.model,
          isActive: config.isActive !== undefined ? config.isActive : config.is_active
        }))
        
        setApiConfigs(configs)
        
        // 如果没有配置，创建默认的API配置选项
        if (configs.length === 0) {
          // 创建默认配置
          const doubaoConfig = {
            id: 'doubao-default',
            name: 'AI绘图服务',
            url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
            apiKey: '', // 用户需要填写自己的API密钥
            headers: {},
            model: 'doubao-seedream-4-0-250828',
            isActive: true
          }
          
          // 创建阿里通义万象默认配置
          const qwenConfig = {
            id: 'qwen-default',
            name: '阿里通义万象',
            url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-image/image-synthesis',
            apiKey: '', // 用户需要填写自己的API密钥
            headers: {},
            model: 'wanx-v1',
            isActive: false
          }
          
          await addApiConfig(doubaoConfig)
          await addApiConfig(qwenConfig)
        } else {
          const active = configs.find((config: ApiConfig) => config.isActive)
          if (active) {
            setActiveConfigState(active)
          }
        }
      } catch (error) {
        console.error('Failed to load API configs:', error)
        // 如果后端不可用，回退到localStorage
        const savedConfigs = localStorage.getItem('apiConfigs')
        if (savedConfigs) {
          const configs = JSON.parse(savedConfigs)
          setApiConfigs(configs)
          const active = configs.find((config: ApiConfig) => config.isActive)
          if (active) {
            setActiveConfigState(active)
          }
        } else {
          // 创建默认配置
          const defaultConfig: ApiConfig = {
            id: Date.now().toString(),
            name: 'AI绘图服务',
            url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
            apiKey: '', // 用户需要填写自己的API密钥
            model: 'doubao-seedream-4-0-250828',
            isActive: true
          }
          setApiConfigs([defaultConfig])
          setActiveConfigState(defaultConfig)
          localStorage.setItem('apiConfigs', JSON.stringify([defaultConfig]))
        }
      }
    }
    loadConfigs()
  }, [])

  // 保存配置到localStorage
  const saveConfigs = (configs: ApiConfig[]) => {
    localStorage.setItem('apiConfigs', JSON.stringify(configs))
    setApiConfigs(configs)
  }

  const addApiConfig = async (config: Omit<ApiConfig, 'id'>) => {
    try {
      // 转换前端格式到后端格式
      const backendConfig = {
        name: config.name,
        url: config.url,
        apiKey: config.apiKey, // 后端现在使用camelCase
        headers: config.headers,
        model: config.model,
        isActive: config.isActive || apiConfigs.length === 0 // 第一个配置自动设为活跃
      }
      
      const { apiConfigService } = await import('../utils/api')
      const newConfig = await apiConfigService.create(backendConfig as any)
      
      // 转换后端格式到前端格式
      const frontendConfig: ApiConfig = {
        id: newConfig.id,
        name: newConfig.name,
        url: newConfig.url,
        apiKey: newConfig.apiKey || (newConfig as any).api_key, // 兼容两种格式
        headers: newConfig.headers,
        model: newConfig.model,
        isActive: newConfig.isActive || (newConfig as any).is_active
      }
      
      const newConfigs = [...apiConfigs, frontendConfig]
      setApiConfigs(newConfigs)
      
      // 如果是第一个配置或设置为活跃，设为活跃配置
      if (newConfigs.length === 1 || frontendConfig.isActive) {
        setActiveConfigState(frontendConfig)
      }
    } catch (error) {
      console.error('Failed to add API config:', error)
      // 回退到localStorage
      const newConfig: ApiConfig = {
        ...config,
        id: Date.now().toString(),
      }
      const newConfigs = [...apiConfigs, newConfig]
      saveConfigs(newConfigs)
      
      if (newConfigs.length === 1 || config.isActive) {
        setActiveConfigState(newConfig)
      }
    }
  }

  const updateApiConfig = (id: string, updates: Partial<ApiConfig>) => {
    const newConfigs = apiConfigs.map(config =>
      config.id === id ? { ...config, ...updates } : config
    )
    saveConfigs(newConfigs)
    
    // 如果更新的是活跃配置，也要更新activeConfig
    if (activeConfig?.id === id) {
      setActiveConfigState({ ...activeConfig, ...updates })
    }
  }

  const deleteApiConfig = (id: string) => {
    const newConfigs = apiConfigs.filter(config => config.id !== id)
    saveConfigs(newConfigs)
    
    // 如果删除的是活跃配置，选择第一个可用配置
    if (activeConfig?.id === id) {
      const newActive = newConfigs.find(config => config.isActive) || newConfigs[0] || null
      setActiveConfigState(newActive)
    }
  }

  const setActiveConfig = (config: ApiConfig) => {
    // 更新所有配置的isActive状态
    const newConfigs = apiConfigs.map(c => ({
      ...c,
      isActive: c.id === config.id
    }))
    saveConfigs(newConfigs)
    setActiveConfigState(config)
  }

  const testApiConfig = async (config: Omit<ApiConfig, 'id' | 'isActive'>): Promise<boolean> => {
    try {
      const { apiConfigService } = await import('../utils/api')
      return await apiConfigService.test(config)
    } catch (error) {
      console.error('API config test failed:', error)
      return false
    }
  }

  return (
    <ApiContext.Provider value={{
      apiConfigs,
      activeConfig,
      addApiConfig,
      updateApiConfig,
      deleteApiConfig,
      setActiveConfig,
      testApiConfig
    }}>
      {children}
    </ApiContext.Provider>
  )
}