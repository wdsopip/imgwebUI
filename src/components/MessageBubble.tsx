import React from 'react'
import { User, Bot, Download } from 'lucide-react'
import { Message } from '../types'

interface MessageBubbleProps {
  message: Message
  onImageClick: (imageUrl: string) => void
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onImageClick }) => {
  const isUser = message.type === 'user'

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-4xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* 头像 */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-4' : 'mr-4'}`}>
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-soft ${
            isUser ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 'bg-gradient-to-br from-neutral-600 to-neutral-700'
          }`}>
            {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
          </div>
        </div>

        {/* 消息内容 */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* 文本内容 */}
          {message.content && (
            <div className={`px-5 py-3.5 rounded-2xl max-w-md shadow-soft ${
              isUser 
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white' 
                : 'bg-white border border-neutral-200/60 text-neutral-800'
            }`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
          )}

          {/* 图片内容 */}
          {message.images && message.images.length > 0 && (
            <div className={`mt-3 ${message.content ? 'mt-4' : ''}`}>
              <div className={`grid gap-3 ${
                message.images.length === 1 ? 'grid-cols-1 max-w-sm' :
                message.images.length === 2 ? 'grid-cols-2 max-w-md' :
                message.images.length === 3 ? 'grid-cols-3 max-w-lg' :
                'grid-cols-4 max-w-3xl'
              }`}>
                {message.images.map((imageUrl, index) => (
                  <div key={index} className="relative group inline-block">
                    <div 
                      className="relative rounded-2xl shadow-soft cursor-pointer overflow-hidden border border-neutral-200/50"
                      onClick={() => onImageClick(imageUrl)}
                    >
                      <img
                        src={imageUrl}
                        alt={`Generated image ${index + 1}`}
                        className="max-w-full max-h-48 object-contain hover:scale-105 transition-transform duration-300 block"
                      />
                      
                      {/* 图片操作按钮 */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-2xl">
                        <div className="absolute top-2 right-2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const link = document.createElement('a')
                              link.href = imageUrl
                              link.download = `ai-image-${Date.now()}-${index + 1}.png`
                              link.click()
                            }}
                            className="p-2 bg-white/95 hover:bg-white rounded-xl transition-all shadow-soft hover:shadow-soft-md z-10"
                            title="下载图片"
                          >
                            <Download size={14} className="text-neutral-700" />
                          </button>
                        </div>
                        
                        {/* 点击提示 */}
                        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span className="text-xs text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                            点击查看
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 图片信息 */}
              {message.images.length > 1 && (
                <div className="mt-3 text-xs text-neutral-500 font-medium">
                  共 {message.images.length} 张图片
                </div>
              )}
            </div>
          )}

          {/* 时间戳 */}
          <div className="mt-2 text-xs text-neutral-400">
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageBubble