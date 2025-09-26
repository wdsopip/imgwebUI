import React, { createContext, useContext, useState, useEffect } from 'react'
import { Message, ChatSession, GenerationParameters } from '../types'
import { useApi } from './ApiContext'

interface ChatContextType {
  currentSession: ChatSession | null
  sessions: ChatSession[]
  messages: Message[]
  isGenerating: boolean
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  generateImage: (prompt: string, parameters: GenerationParameters, apiConfigId?: string) => Promise<void>
  createNewSession: () => void
  loadSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeConfig } = useApi()
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // 调试：监控messages状态变化
  useEffect(() => {
    console.log('Messages state changed:', messages.length, 'messages')
    console.log('Current session ID:', currentSession?.id)
  }, [messages, currentSession?.id])

  // 从localStorage加载会话
  useEffect(() => {
    const savedSessions = localStorage.getItem('chatSessions')
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions)
        if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
          setSessions(parsedSessions)
          // 加载最新的会话
          const latestSession = parsedSessions[0]
          setCurrentSession(latestSession)
          setMessages(latestSession.messages || [])
          return
        }
      } catch (error) {
        console.error('Failed to parse saved sessions:', error)
        localStorage.removeItem('chatSessions')
      }
    }
    
    // 如果没有保存的会话或解析失败，创建默认会话
    const defaultSession: ChatSession = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const defaultSessions = [defaultSession]
    localStorage.setItem('chatSessions', JSON.stringify(defaultSessions))
    setSessions(defaultSessions)
    setCurrentSession(defaultSession)
    setMessages([])
  }, [])

  // 保存会话到localStorage
  const saveSessions = (newSessions: ChatSession[]) => {
    try {
      console.log('Saving sessions to localStorage, total sessions:', newSessions.length)
      localStorage.setItem('chatSessions', JSON.stringify(newSessions))
      setSessions(newSessions)
    } catch (error) {
      console.error('Failed to save sessions:', error)
    }
  }

  const createNewSession = () => {
    console.log('Creating new session')
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const newSessions = [newSession, ...sessions]
    saveSessions(newSessions)
    setCurrentSession(newSession)
    setMessages([])
  }

  const loadSession = (sessionId: string) => {
    console.log('Loading session:', sessionId)
    console.log('Available sessions:', sessions.map(s => s.id))
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      console.log('Found session with', session.messages?.length || 0, 'messages')
      setCurrentSession(session)
      setMessages(session.messages || [])
    } else {
      console.warn(`Session ${sessionId} not found`)
    }
  }

  const deleteSession = (sessionId: string) => {
    const newSessions = sessions.filter(s => s.id !== sessionId)
    saveSessions(newSessions)
    
    if (currentSession?.id === sessionId) {
      if (newSessions.length > 0) {
        loadSession(newSessions[0].id)
      } else {
        createNewSession()
      }
    }
  }

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    console.log('Adding message:', message)
    
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }

    // 使用函数式状态更新，确保获取最新的messages状态
    setMessages(prevMessages => {
      console.log('Current messages count:', prevMessages.length)
      const updatedMessages = [...prevMessages, newMessage]
      console.log('Updated messages count:', updatedMessages.length)
      console.log('Messages before update:', prevMessages.map(m => `${m.type}: ${m.content.slice(0, 20)}`))
      
      // 同时更新会话
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          messages: updatedMessages,
          updatedAt: new Date(),
          title: message.type === 'user' && currentSession.messages.length === 0 
            ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
            : currentSession.title
        }
        
        const updatedSessions = sessions.map(s => 
          s.id === currentSession.id ? updatedSession : s
        )
        console.log('Saving updated session with', updatedSession.messages.length, 'messages')
        saveSessions(updatedSessions)
        setCurrentSession(updatedSession)
      } else {
        console.warn('No current session when adding message')
      }
      
      return updatedMessages
    })
  }

  const generateImage = async (prompt: string, parameters: GenerationParameters, apiConfigId?: string) => {
    setIsGenerating(true)
    
    // 立即添加用户消息，确保显示
    addMessage({
      type: 'user',
      content: prompt,
      parameters
    })

    try {
      // 使用ApiContext中的activeConfig
      if (!activeConfig && !apiConfigId) {
        throw new Error('API配置不存在')
      }

      console.log('Using active config:', activeConfig)
      console.log('API config ID:', apiConfigId)
      console.log('Generation parameters:', parameters)

      const { generationService } = await import('../utils/api')
      const response = await generationService.generate({
        prompt,
        parameters,
        apiConfigId: apiConfigId || activeConfig?.id,
        generation_type: parameters.generation_type || 'text_to_image',
        input_images: parameters.input_images
      })

      if (response.success && response.images) {
        addMessage({
          type: 'assistant',
          content: '图片生成完成',
          images: response.images
        })
      } else {
        throw new Error(response.error || '图片生成失败')
      }
    } catch (error) {
      console.error('Image generation failed:', error)
      addMessage({
        type: 'assistant',
        content: `图片生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      })
      throw error // 重新抛出错误，让调用方知道生成失败
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <ChatContext.Provider value={{
      currentSession,
      sessions,
      messages,
      isGenerating,
      addMessage,
      generateImage,
      createNewSession,
      loadSession,
      deleteSession
    }}>
      {children}
    </ChatContext.Provider>
  )
}