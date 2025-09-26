import React from 'react'
import { User, Settings, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useChat } from '../contexts/ChatContext'

interface SidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  onOpenSettings: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onOpenSettings
}) => {
  const { sessions, currentSession, createNewSession, loadSession, deleteSession } = useChat()

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return new Date(date).toLocaleDateString('zh-CN')
  }

  return (
    <div className="bg-neutral-800 text-neutral-100 flex flex-col h-full w-full shadow-inner-soft">
      {/* 顶部区域 - 用户信息或展开按钮 */}
      <div className="p-4 border-b border-neutral-700/50">
        {isCollapsed ? (
          <div className="flex flex-col items-center space-y-3">
            <button
              onClick={onToggleCollapse}
              className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-xl flex items-center justify-center transition-all duration-200 shadow-soft hover:shadow-soft-md"
              title="展开侧边栏"
            >
              <ChevronRight size={18} className="text-white" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-soft">
                <User size={18} className="text-white" />
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-neutral-100">用户</div>
                <div className="text-xs text-neutral-400">AI绘画助手</div>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-2.5 hover:bg-neutral-700/50 rounded-xl transition-all duration-200 text-neutral-300 hover:text-neutral-100"
              title="收起侧边栏"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        )}
      </div>

      {/* 新建对话按钮 */}
      <div className="p-4 border-b border-neutral-700/50">
        <button
          onClick={createNewSession}
          className={`w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-xl transition-all duration-200 shadow-soft hover:shadow-soft-md text-white font-medium ${
            isCollapsed ? 'px-2' : ''
          }`}
          title={isCollapsed ? "新建对话" : ""}
        >
          <Plus size={16} />
          {!isCollapsed && <span className="ml-2 text-sm">新建对话</span>}
        </button>
      </div>

      {/* 历史记录区域 */}
      <div className="flex-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="p-4">
            <div className="text-xs text-neutral-400 mb-3 font-medium uppercase tracking-wider">历史记录</div>
            <div className="space-y-1.5">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                    currentSession?.id === session.id
                      ? 'bg-neutral-700/70 shadow-inner-soft'
                      : 'hover:bg-neutral-700/50'
                  }`}
                  onClick={() => loadSession(session.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-neutral-100">
                        {session.title}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">
                        {formatDate(session.updatedAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSession(session.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-error-500 transition-all duration-200 ml-2 w-5 h-5 flex items-center justify-center rounded-md hover:bg-error-500/10"
                    >
                      ×
                    </button>
                  </div>
                  {session.messages.length > 0 && (
                    <div className="text-xs text-neutral-500 mt-2 truncate">
                      {session.messages[session.messages.length - 1]?.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部设置区域 */}
      <div className="p-4 border-t border-neutral-700/50">
        {isCollapsed ? (
          <div className="flex flex-col items-center space-y-3">
            <button
              onClick={onOpenSettings}
              className="w-10 h-10 hover:bg-neutral-700/50 rounded-xl transition-all duration-200 flex items-center justify-center text-neutral-300 hover:text-neutral-100"
              title="设置"
            >
              <Settings size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <button
              onClick={onOpenSettings}
              className="p-2.5 hover:bg-neutral-700/50 rounded-xl transition-all duration-200 text-neutral-300 hover:text-neutral-100"
              title="设置"
            >
              <Settings size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar