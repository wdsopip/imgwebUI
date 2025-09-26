import React, { useState } from 'react'
import { Monitor, Smartphone, Square, Maximize } from 'lucide-react'

interface ResolutionControlProps {
  parameters: {
    width?: number
    height?: number
  }
  onParametersChange: (params: any) => void
}

const ResolutionControl: React.FC<ResolutionControlProps> = ({
  parameters,
  onParametersChange
}) => {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')

  // 预设分辨率
  const presets = [
    { name: '正方形', width: 1024, height: 1024, icon: Square, ratio: '1:1' },
    { name: '横屏', width: 1344, height: 768, icon: Monitor, ratio: '16:9' },
    { name: '竖屏', width: 768, height: 1344, icon: Smartphone, ratio: '9:16' },
    { name: '宽屏', width: 1536, height: 640, icon: Maximize, ratio: '21:9' },
    { name: 'HD', width: 1280, height: 720, icon: Monitor, ratio: '16:9' },
    { name: 'Full HD', width: 1920, height: 1080, icon: Monitor, ratio: '16:9' },
    { name: '4K', width: 3840, height: 2160, icon: Monitor, ratio: '16:9' },
    { name: '超宽', width: 2048, height: 512, icon: Maximize, ratio: '4:1' }
  ]

  const currentPreset = presets.find(p => p.width === parameters.width && p.height === parameters.height)

  const handlePresetSelect = (preset: typeof presets[0]) => {
    onParametersChange({
      width: preset.width,
      height: preset.height
    })
  }

  const handleCustomChange = (field: 'width' | 'height', value: string) => {
    const numValue = parseInt(value) || 512
    const clampedValue = Math.max(256, Math.min(4096, numValue)) // 限制范围
    
    onParametersChange({
      [field]: clampedValue
    })
  }

  return (
    <div className="space-y-4">
      {/* 模式切换 */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setMode('preset')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            mode === 'preset'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          预设分辨率
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            mode === 'custom'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          自定义尺寸
        </button>
      </div>

      {mode === 'preset' ? (
        /* 预设分辨率网格 */
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => {
            const Icon = preset.icon
            const isSelected = currentPreset?.name === preset.name
            
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Icon size={16} className={isSelected ? 'text-blue-500' : 'text-gray-400'} />
                  <span className="font-medium text-sm">{preset.name}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {preset.width} × {preset.height}
                </div>
                <div className="text-xs text-gray-400">
                  {preset.ratio}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        /* 自定义尺寸输入 */
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                宽度 (px)
              </label>
              <input
                type="number"
                min="256"
                max="4096"
                step="64"
                value={parameters.width || 1024}
                onChange={(e) => handleCustomChange('width', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                高度 (px)
              </label>
              <input
                type="number"
                min="256"
                max="4096"
                step="64"
                value={parameters.height || 1024}
                onChange={(e) => handleCustomChange('height', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* 快速比例按钮 */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: '1:1', action: () => onParametersChange({ width: 1024, height: 1024 }) },
              { label: '4:3', action: () => onParametersChange({ width: 1024, height: 768 }) },
              { label: '3:4', action: () => onParametersChange({ width: 768, height: 1024 }) },
              { label: '16:9', action: () => onParametersChange({ width: 1344, height: 768 }) },
              { label: '9:16', action: () => onParametersChange({ width: 768, height: 1344 }) }
            ].map((ratio) => (
              <button
                key={ratio.label}
                type="button"
                onClick={ratio.action}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
              >
                {ratio.label}
              </button>
            ))}
          </div>
          
          {/* 当前分辨率信息 */}
          <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
            当前分辨率: {parameters.width || 1024} × {parameters.height || 1024} 
            ({((parameters.width || 1024) * (parameters.height || 1024) / 1000000).toFixed(1)}MP)
          </div>
        </div>
      )}
    </div>
  )
}

export default ResolutionControl