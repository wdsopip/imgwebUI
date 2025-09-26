import React, { useState, useRef, useEffect } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { useChat } from '../contexts/ChatContext'
import { useApi } from '../contexts/ApiContext'
import MessageBubble from './MessageBubble'
import ModernResolutionControl from './ModernResolutionControl'
import QuantitySelector from './QuantitySelector'
import GenerationModeSelector from './GenerationModeSelector'
import AdvancedSettings from './AdvancedSettings'
import ModelSelector from './ModelSelector'
import Toggle from './Toggle'
import { GenerationParameters } from '../types'

interface ChatAreaProps {
  onImageClick: (imageUrl: string) => void
  isSidebarCollapsed: boolean
  modifyImageUrl: string | null
  onClearModifyImage: () => void
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  onImageClick, 
  isSidebarCollapsed: _isSidebarCollapsed,
  modifyImageUrl,
  onClearModifyImage
}) => {
  const { messages, isGenerating, generateImage } = useChat()
  const { activeConfig } = useApi()
  
  const [prompt, setPrompt] = useState('')
  const [generationType, setGenerationType] = useState('text_to_image')
  const [inputImages, setInputImages] = useState<string[]>([])

  const [isStreaming, setIsStreaming] = useState(false)
  
  const [parameters, setParameters] = useState<GenerationParameters>({
    width: 1024,
    height: 1024,
    steps: 20,
    cfg_scale: 7,
    seed: -1,
    sampler: 'DPM++ 2M Karras',
    negative_prompt: '',
    batch_size: 1,
    quality: 'standard',
    style: undefined,
    watermark: true
  })

  // 当batch_size改变时，自动调整生成模式
  useEffect(() => {
    const batchSize = parameters.batch_size || 1
    if (inputImages.length === 1) {
      if (batchSize > 1) {
        setGenerationType('image_to_batch')
      } else {
        setGenerationType('image_to_image')
      }
    } else if (inputImages.length > 1) {
      if (batchSize > 1) {
        setGenerationType('multi_reference_batch')
      } else {
        setGenerationType('multi_image_fusion')
      }
    } else {
      // 无图片输入
      if (batchSize > 1) {
        setGenerationType('text_to_batch')
      } else {
        setGenerationType('text_to_image')
      }
    }
  }, [parameters.batch_size, inputImages.length])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 处理修改图片
  useEffect(() => {
    if (modifyImageUrl) {
      setGenerationType('image_to_image')
      setInputImages([modifyImageUrl])
    }
  }, [modifyImageUrl])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setInputImages(prev => {
          const newImages = [...prev, result]
          // 根据图片数量和生成数量自动选择模式
          const batchSize = parameters.batch_size || 1
          if (newImages.length === 1) {
            // 单图输入：根据生成数量选择模式
            if (batchSize > 1) {
              setGenerationType('image_to_batch')
            } else {
              setGenerationType('image_to_image')
            }
          } else if (newImages.length > 1) {
            // 多图输入：根据生成数量选择模式
            if (batchSize > 1) {
              setGenerationType('multi_reference_batch')
            } else {
              setGenerationType('multi_image_fusion')
            }
          }
          return newImages
        })
      }
      reader.readAsDataURL(file)
    })
    
    // 清空input的value，允许重复选择同一文件
    e.target.value = ''
  }

  // 移除输入图片
  const removeInputImage = (index: number) => {
    setInputImages(prev => {
      const newImages = prev.filter((_, i) => i !== index)
      // 根据剩余图片数量调整模式
      if (newImages.length === 0) {
        setGenerationType('text_to_image')
      } else if (newImages.length === 1 && generationType === 'multi_image_fusion') {
        setGenerationType('image_to_image')
      }
      return newImages
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isGenerating || !activeConfig) return

    const currentPrompt = prompt
    
    // 清除修改图片状态
    if (modifyImageUrl) {
      onClearModifyImage()
    }

    try {
      await generateImage(currentPrompt, {
        ...parameters,
        generation_type: generationType as any,
        input_images: inputImages.length > 0 ? inputImages : undefined
      }, activeConfig.id)
      
      // 只有在成功生成后才清空输入
      setPrompt('')
      setInputImages([])
    } catch (error) {
      console.error('生成失败:', error)
      // 生成失败时不清空输入，让用户可以重试
    }
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50/50">
      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-neutral-500 max-w-md mx-auto">
              <div className="text-6xl mb-6">🎨</div>
              <h2 className="text-2xl font-semibold mb-3 text-neutral-700">开始创作你的AI艺术</h2>
              <p className="text-lg text-neutral-600 leading-relaxed">输入描述，让AI为你生成精美的图片</p>
              <div className="mt-6 text-sm text-neutral-400">
                支持文字生图、图生图、多图融合等多种创作模式
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onImageClick={onImageClick}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 - 固定在底部 */}
      <div className="flex-shrink-0 p-6 bg-gradient-to-t from-neutral-100/50 via-white/80 to-transparent backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            {/* 输入图片预览区域 */}
            {inputImages.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4 p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-neutral-200/60 shadow-soft">
                {inputImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Input ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-xl border-2 border-primary-200 shadow-soft"
                    />
                    <button
                      type="button"
                      onClick={() => removeInputImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-error-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-soft hover:bg-error-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 主输入区域 - 现代化设计 */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-soft-lg border border-neutral-200/60 p-6 space-y-5">
              {/* 输入框区域 */}
              <div className="flex items-start space-x-4">
                {/* 图片上传按钮 */}
                <div className="flex-shrink-0">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="w-12 h-12 bg-neutral-50 hover:bg-primary-50 border-2 border-dashed border-neutral-300 hover:border-primary-400 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200 group"
                    title="上传图片"
                  >
                    <ImageIcon size={20} className="text-neutral-400 group-hover:text-primary-500 transition-colors" />
                  </label>
                </div>

                {/* 文本输入框 */}
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="描述你想要生成的图片..."
                    className="w-full px-0 py-3 bg-transparent border-0 resize-none focus:outline-none text-base placeholder-neutral-400 leading-relaxed text-neutral-700"
                    rows={3}
                    disabled={isGenerating}
                  />
                </div>

                {/* 发送按钮 */}
                <button
                  type="submit"
                  disabled={!prompt.trim() || isGenerating || !activeConfig}
                  className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-soft hover:shadow-soft-md disabled:shadow-none"
                  title="生成图片"
                >
                  {isGenerating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m5 12 7-7 7 7"/>
                      <path d="m12 19 0-14"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* 现代化参数控制栏 */}
              <div className="flex items-center justify-between pt-5 border-t border-neutral-200/50">
                {/* 左侧：基础参数（保持前三个按钮不变） */}
                <div className="flex items-center space-x-4">
                  {/* 生成模式 */}
                  <GenerationModeSelector
                    value={generationType}
                    onChange={setGenerationType}
                  />

                  {/* 现代化分辨率控制器 */}
                  <ModernResolutionControl
                    parameters={parameters}
                    onParametersChange={(newParams) => setParameters(prev => ({ ...prev, ...newParams }))}
                  />

                  {/* 数量选择器 - 支持批量生成 */}
                  <QuantitySelector
                    value={parameters.batch_size || 1}
                    onChange={(value) => {
                      setParameters(prev => ({ ...prev, batch_size: value }))
                      // 如果数量大于1，自动切换到批量模式
                      if (value > 1) {
                        if (generationType === 'text_to_image') {
                          setGenerationType('text_to_batch')
                        } else if (generationType === 'image_to_image') {
                          setGenerationType('image_to_batch')
                        } else if (generationType === 'multi_image_fusion') {
                          setGenerationType('multi_reference_batch')
                        }
                      }
                    }}
                  />
                </div>

                {/* 右侧：重新排序的按钮（移除流式输出按钮） */}
                <div className="flex items-center space-x-3">
                  <AdvancedSettings
                    parameters={parameters}
                    onParametersChange={setParameters}
                  />
                  <ModelSelector />
                  {/* 水印开关 */}
                  <Toggle
                    id="watermark"
                    checked={parameters.watermark !== false}
                    onChange={(checked) => setParameters(prev => ({ ...prev, watermark: checked }))}
                    label="AI水印"
                  />
                </div>
              </div>
            </div>


          </form>
        </div>
    </div>
  )
}

export default ChatArea