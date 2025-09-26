import React, { useState } from 'react'
import { X, Plus, Trash2, TestTube, Check, AlertCircle } from 'lucide-react'
import { useApi } from '../contexts/ApiContext'
import { ApiConfig } from '../types'

interface SettingsModalProps {
  onClose: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { apiConfigs, addApiConfig, updateApiConfig, deleteApiConfig, setActiveConfig, testApiConfig } = useApi()
  const [activeTab, setActiveTab] = useState<'api' | 'general'>('api')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<string | null>(null)
  const [testingConfig, setTestingConfig] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    apiKey: '',
    headers: '',
    model: ''
  })

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      apiKey: '',
      headers: '',
      model: ''
    })
    setShowAddForm(false)
    setEditingConfig(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const headers = formData.headers ? JSON.parse(formData.headers) : undefined
      const configData = {
        name: formData.name,
        url: formData.url,
        apiKey: formData.apiKey,
        headers,
        model: formData.model || undefined,
        isActive: apiConfigs.length === 0 // 第一个配置自动设为活跃
      }

      if (editingConfig) {
        updateApiConfig(editingConfig, configData)
      } else {
        await addApiConfig(configData)
      }
      
      resetForm()
    } catch (error) {
      console.error('Failed to save API config:', error)
      alert('保存配置失败，请检查网络连接和配置格式')
    }
  }

  const handleEdit = (config: ApiConfig) => {
    setFormData({
      name: config.name,
      url: config.url,
      apiKey: config.apiKey,
      headers: config.headers ? JSON.stringify(config.headers, null, 2) : '',
      model: config.model || ''
    })
    setEditingConfig(config.id)
    setShowAddForm(true)
  }

  const handleTest = async (config: ApiConfig) => {
    setTestingConfig(config.id)
    try {
      const result = await testApiConfig({
        name: config.name,
        url: config.url,
        apiKey: config.apiKey,
        headers: config.headers,
        model: config.model
      })
      setTestResults(prev => ({ ...prev, [config.id]: result }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, [config.id]: false }))
    } finally {
      setTestingConfig(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">设置</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('api')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'api'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            API配置
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            通用设置
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'api' && (
            <div>
              {/* API配置列表 */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">API配置管理</h3>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  添加API
                </button>
              </div>

              {/* 配置列表 */}
              <div className="space-y-4 mb-6">
                {apiConfigs.map((config) => (
                  <div
                    key={config.id}
                    className={`p-4 border rounded-lg ${
                      config.isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium">{config.name}</h4>
                          {config.isActive && (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                              当前使用
                            </span>
                          )}
                          {testResults[config.id] !== undefined && (
                            <div className="flex items-center">
                              {testResults[config.id] ? (
                                <Check size={16} className="text-green-500" />
                              ) : (
                                <AlertCircle size={16} className="text-red-500" />
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{config.url}</p>
                        {config.model && (
                          <p className="text-sm text-gray-500">模型: {config.model}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTest(config)}
                          disabled={testingConfig === config.id}
                          className="p-2 text-gray-500 hover:text-blue-500 transition-colors disabled:opacity-50"
                          title="测试连接"
                        >
                          {testingConfig === config.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                          ) : (
                            <TestTube size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(config)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          编辑
                        </button>
                        {!config.isActive && (
                          <button
                            onClick={() => setActiveConfig(config)}
                            className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            设为默认
                          </button>
                        )}
                        <button
                          onClick={() => deleteApiConfig(config.id)}
                          className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 添加/编辑表单 */}
              {showAddForm && (
                <div className="border rounded-lg p-6 bg-gray-50">
                  <h4 className="text-lg font-medium mb-4">
                    {editingConfig ? '编辑API配置' : '添加新的API配置'}
                  </h4>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          配置名称 *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例如: 通义万象"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API地址 *
                        </label>
                        <input
                          type="url"
                          required
                          value={formData.url}
                          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://api.example.com/v1/generate"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API密钥 *
                      </label>
                      <input
                        type="password"
                        required
                        value={formData.apiKey}
                        onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="输入API密钥"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        模型名称 (可选)
                      </label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={
                          formData.url.includes('dashscope') || formData.url.includes('aliyuncs') 
                            ? "例如: wanx-v1" 
                            : "例如: doubao-seedream-4-0-250828"
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        自定义请求头 (可选, JSON格式)
                      </label>
                      <textarea
                        value={formData.headers}
                        onChange={(e) => setFormData(prev => ({ ...prev, headers: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        {editingConfig ? '更新' : '添加'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'general' && (
            <div>
              <h3 className="text-lg font-medium mb-6">通用设置</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">界面设置</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="ml-2 text-sm">深色模式</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                      <span className="ml-2 text-sm">显示生成参数</span>
                    </label>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">默认参数</h4>
                  <p className="text-sm text-gray-500">设置新对话的默认生成参数</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsModal