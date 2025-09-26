import React, { useState, useRef, useEffect } from 'react'
import { useApi } from '../contexts/ApiContext'
import { ChevronDown, Wifi, WifiOff, Settings, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const ApiStatusIndicator: React.FC = () => {
  const { activeConfig, setActiveConfig, apiConfigs, testApiConfig } = useApi()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing' | 'unknown'>('unknown')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 测试当前API连接
  const testConnection = async () => {
    if (!activeConfig) return
    
    setIsTesting(true)
    setConnectionStatus('testing')
    
    try {
      const isConnected = await testApiConfig({
        name: activeConfig.name,
        url: activeConfig.url,
        apiKey: activeConfig.apiKey,
        headers: activeConfig.headers,
        model: activeConfig.model
      })
      
      setConnectionStatus(isConnected ? 'connected' : 'disconnected')
    } catch (error) {
      setConnectionStatus('disconnected')
    } finally {
      setIsTesting(false)
    }
  }

  // 切换API配置
  const handleConfigChange = (config: typeof activeConfig) => {
    if (config) {
      setActiveConfig(config)
      setConnectionStatus('unknown')
      setIsDropdownOpen(false)
    }
  }

  // 获取状态图标和颜色
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle size={16} className="text-green-500" />
      case 'disconnected':
        return <XCircle size={16} className="text-red-500" />
      case 'testing':
        return <AlertCircle size={16} className="text-yellow-500 animate-pulse" />
      default:
        return <Wifi size={16} className="text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '已连接'
      case 'disconnected':
        return '连接失败'
      case 'testing':
        return '测试中...'
      default:
        return '未知状态'
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'border-green-200 bg-green-50'
      case 'disconnected':
        return 'border-red-200 bg-red-50'
      case 'testing':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  if (!activeConfig) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
        <WifiOff size={16} className="text-red-500" />
        <span className="text-sm text-red-700">未配置API</span>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex items-center space-x-2 px-3 py-2 border rounded-lg hover:shadow-sm transition-all duration-200 ${getStatusColor()}`}
      >
        {getStatusIcon()}
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">
            {activeConfig.name}
          </span>
          <span className="text-xs text-gray-500">
            {activeConfig.model || '默认模型'}
          </span>
        </div>
        <ChevronDown 
          size={14} 
          className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2">
          {/* 当前配置状态 */}
          <div className="p-3 bg-gray-50 rounded-lg mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">当前配置</span>
              <button
                onClick={testConnection}
                disabled={isTesting}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <Zap size={12} />
                <span>{isTesting ? '测试中...' : '测试连接'}</span>
              </button>
            </div>
            
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>状态:</span>
                <div className="flex items-center space-x-1">
                  {getStatusIcon()}
                  <span>{getStatusText()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>模型:</span>
                <span className="font-mono">{activeConfig.model || '默认'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>端点:</span>
                <span className="font-mono truncate max-w-32" title={activeConfig.url}>
                  {activeConfig.url}
                </span>
              </div>
              {activeConfig.url.includes('dashscope') || activeConfig.url.includes('aliyuncs') ? (
                <div className="flex items-center justify-between">
                  <span>提供商:</span>
                  <span className="font-medium text-blue-600">阿里通义万象</span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span>提供商:</span>
                  <span className="font-medium text-purple-600">AI服务</span>
                </div>
              )}
            </div>
          </div>

          {/* 支持的功能列表 */}
          <div className="p-3 bg-blue-50 rounded-lg mb-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">支持的功能</h4>
            <div className="grid grid-cols-2 gap-1 text-xs text-blue-700">
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} />
                <span>文生图</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} />
                <span>图文生图</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} />
                <span>多图融合</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} />
                <span>组图输出</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} />
                <span>文生组图</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} />
                <span>图生组图</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} />
                <span>多参考图生组图</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} />
                <span>流式输出</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} />
                <span>尺寸控制</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} />
                <span>分辨率指定</span>
              </div>
            </div>
          </div>

          {/* 快速切换配置 */}
          {apiConfigs.length > 1 && (
            <div className="border-t pt-2">
              <h4 className="text-sm font-medium text-gray-700 mb-2 px-1">切换配置</h4>
              <div className="space-y-1">
                {apiConfigs.map((config) => (
                  <button
                    key={config.id}
                    onClick={() => handleConfigChange(config)}
                    className={`w-full text-left p-2 rounded-lg transition-colors text-sm ${
                      config.id === activeConfig.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{config.name}</div>
                        <div className="text-xs text-gray-500">{config.model}</div>
                      </div>
                      {config.isActive && (
                        <CheckCircle size={14} className="text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 设置按钮 */}
          <div className="border-t pt-2 mt-2">
            <button
              onClick={() => {
                setIsDropdownOpen(false)
                // 这里可以触发打开设置模态框
                window.dispatchEvent(new CustomEvent('openSettings'))
              }}
              className="w-full flex items-center space-x-2 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Settings size={14} />
              <span>API设置</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiStatusIndicator