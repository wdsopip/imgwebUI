import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { GenerationParameters } from '../types'

interface ResolutionSelectorProps {
  parameters: GenerationParameters
  onParametersChange: (parameters: GenerationParameters) => void
}

const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({
  parameters,
  onParametersChange
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 智能计算弹窗位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = 400 // 预估弹窗高度
      
      // 检查下方空间是否足够
      const spaceBelow = viewportHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top
      
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top')
      } else {
        setDropdownPosition('bottom')
      }
    }
  }, [isOpen])

  // 获取当前分辨率标签
  const getResolutionLabel = () => {
    const { width = 1024, height = 1024 } = parameters
    
    // 判断分辨率等级 - 基于像素总数
    const totalPixels = width * height
    let resolutionLevel = ''
    if (totalPixels >= 16000000) { // 4K级别 (4096*4096 ≈ 16M)
      resolutionLevel = '4K'
    } else if (totalPixels >= 4000000) { // 2K级别 (2048*2048 ≈ 4M)
      resolutionLevel = '2K'
    } else {
      resolutionLevel = '1K'
    }

    // 判断比例
    const ratio = width / height
    let aspectRatio = ''
    
    if (Math.abs(ratio - 1) < 0.05) aspectRatio = '1:1'
    else if (Math.abs(ratio - 3/4) < 0.05) aspectRatio = '3:4'
    else if (Math.abs(ratio - 4/3) < 0.05) aspectRatio = '4:3'
    else if (Math.abs(ratio - 16/9) < 0.05) aspectRatio = '16:9'
    else if (Math.abs(ratio - 9/16) < 0.05) aspectRatio = '9:16'
    else if (Math.abs(ratio - 2/3) < 0.05) aspectRatio = '2:3'
    else if (Math.abs(ratio - 3/2) < 0.05) aspectRatio = '3:2'
    else if (Math.abs(ratio - 21/9) < 0.05) aspectRatio = '21:9'
    else aspectRatio = 'Custom'

    return `${resolutionLevel} ${aspectRatio}`
  }

  // 获取比例图标
  const getAspectRatioIcon = (width: number, height: number) => {
    const ratio = width / height
    const iconWidth = ratio > 1 ? 20 : Math.round(20 * ratio)
    const iconHeight = ratio > 1 ? Math.round(20 / ratio) : 20
    
    return (
      <div 
        className="border-2 border-current rounded-sm"
        style={{ 
          width: `${iconWidth}px`, 
          height: `${iconHeight}px`,
          minWidth: '8px',
          minHeight: '8px'
        }}
      />
    )
  }

  // 计算指定分辨率等级和比例的尺寸
  const calculateDimensions = (resolutionLevel: '1K' | '2K' | '4K', aspectRatio: number) => {
    let baseSize: number
    
    switch (resolutionLevel) {
      case '1K':
        baseSize = 1024
        break
      case '2K':
        baseSize = 2048
        break
      case '4K':
        baseSize = 4096
        break
    }
    
    let width: number, height: number
    
    if (aspectRatio >= 1) {
      // 横向或正方形
      width = baseSize
      height = Math.round(baseSize / aspectRatio)
    } else {
      // 纵向
      height = baseSize
      width = Math.round(baseSize * aspectRatio)
    }
    
    // 确保尺寸是64的倍数
    width = Math.round(width / 64) * 64
    height = Math.round(height / 64) * 64
    
    return { width, height }
  }

  const resolutionOptions = [
    { label: '1K', value: '1K' as const },
    { label: '2K', value: '2K' as const },
    { label: '4K', value: '4K' as const }
  ]

  const aspectRatios = [
    { label: '1:1', ratio: 1 },
    { label: '3:4', ratio: 3/4 },
    { label: '4:3', ratio: 4/3 },
    { label: '16:9', ratio: 16/9 },
    { label: '9:16', ratio: 9/16 },
    { label: '2:3', ratio: 2/3 },
    { label: '3:2', ratio: 3/2 },
    { label: '21:9', ratio: 21/9 }
  ]

  // 获取当前分辨率等级
  const getCurrentResolutionLevel = (): '1K' | '2K' | '4K' => {
    const width = parameters.width || 1024
    const height = parameters.height || 1024
    const totalPixels = width * height
    if (totalPixels >= 16000000) return '4K'
    if (totalPixels >= 4000000) return '2K'
    return '1K'
  }

  // 获取当前比例
  const getCurrentAspectRatio = () => {
    const width = parameters.width || 1024
    const height = parameters.height || 1024
    return width / height
  }

  const handleResolutionChange = (width: number, height: number) => {
    onParametersChange({
      ...parameters,
      width,
      height
    })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 触发按钮 */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 text-sm font-medium"
      >
        <span>{getResolutionLabel()}</span>
        {getAspectRatioIcon(parameters.width || 1024, parameters.height || 1024)}
        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* 下拉面板 */}
      {isOpen && (
        <div className={`absolute left-0 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-4 ${
          dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
          {/* 分辨率选择 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">分辨率</h4>
            <div className="grid grid-cols-3 gap-2">
              {resolutionOptions.map((option) => {
                const isSelected = getCurrentResolutionLevel() === option.value
                
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => {
                      const currentRatio = getCurrentAspectRatio()
                      const { width, height } = calculateDimensions(option.value, currentRatio)
                      handleResolutionChange(width, height)
                    }}
                    className={`py-4 text-center rounded-lg border-2 transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg font-bold">{option.label}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 图片比例选择 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">图片比例</h4>
            <div className="grid grid-cols-4 gap-2">
              {aspectRatios.map((ratio) => {
                const currentRatio = getCurrentAspectRatio()
                const isSelected = Math.abs(currentRatio - ratio.ratio) < 0.05
                
                return (
                  <button
                    key={ratio.label}
                    type="button"
                    onClick={() => {
                      const currentLevel = getCurrentResolutionLevel()
                      const { width, height } = calculateDimensions(currentLevel, ratio.ratio)
                      handleResolutionChange(width, height)
                    }}
                    className={`flex flex-col items-center p-2 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className={`mb-1 border-2 rounded-sm ${
                      isSelected ? 'border-blue-500' : 'border-gray-400'
                    }`} style={{
                      width: ratio.ratio >= 1 ? '20px' : `${20 * ratio.ratio}px`,
                      height: ratio.ratio >= 1 ? `${20 / ratio.ratio}px` : '15px'
                    }} />
                    <span className="text-xs font-medium">{ratio.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 自定义尺寸 */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">自定义尺寸</h4>
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={parameters.width || 1024}
                  onChange={(e) => handleResolutionChange(parseInt(e.target.value) || 1024, parameters.height || 1024)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="512"
                  max="4096"
                  step="64"
                  placeholder="宽度"
                />
              </div>
              <span className="text-gray-400 text-sm">×</span>
              <div className="flex-1">
                <input
                  type="number"
                  value={parameters.height || 1024}
                  onChange={(e) => handleResolutionChange(parameters.width || 1024, parseInt(e.target.value) || 1024)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="512"
                  max="4096"
                  step="64"
                  placeholder="高度"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResolutionSelector