import React, { useState, useEffect, useRef } from 'react'

interface ModernResolutionControlProps {
  parameters: {
    width?: number
    height?: number
  }
  onParametersChange: (params: any) => void
}

const ModernResolutionControl: React.FC<ModernResolutionControlProps> = ({
  parameters,
  onParametersChange
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedResolution, setSelectedResolution] = useState('2K')
  const [selectedRatio, setSelectedRatio] = useState('1:1')
  const [customWidth, setCustomWidth] = useState(1024)
  const [customHeight, setCustomHeight] = useState(1024)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // 分辨率定义
  const resolutions = {
    '1K': 1024,
    '2K': 2048,
    '4K': 4096
  }

  // 宽高比定义 - 使用统一尺寸的矩形边框图标，保持美观
  const aspectRatios = [
    { 
      label: '1:1', 
      ratio: [1, 1], 
      icon: (
        <div className="w-4 h-4 border border-current rounded-sm"></div>
      )
    },
    { 
      label: '3:4', 
      ratio: [3, 4], 
      icon: (
        <div className="w-3 h-4 border border-current rounded-sm"></div>
      )
    },
    { 
      label: '4:3', 
      ratio: [4, 3], 
      icon: (
        <div className="w-4 h-3 border border-current rounded-sm"></div>
      )
    },
    { 
      label: '16:9', 
      ratio: [16, 9], 
      icon: (
        <div className="w-5 h-3 border border-current rounded-sm"></div>
      )
    },
    { 
      label: '9:16', 
      ratio: [9, 16], 
      icon: (
        <div className="w-3 h-5 border border-current rounded-sm"></div>
      )
    },
    { 
      label: '2:3', 
      ratio: [2, 3], 
      icon: (
        <div className="w-3 h-4 border border-current rounded-sm"></div>
      )
    },
    { 
      label: '3:2', 
      ratio: [3, 2], 
      icon: (
        <div className="w-4 h-3 border border-current rounded-sm"></div>
      )
    },
    { 
      label: '21:9', 
      ratio: [21, 9], 
      icon: (
        <div className="w-5 h-2 border border-current rounded-sm"></div>
      )
    }
  ]

  // 计算实际尺寸
  const calculateDimensions = (resolution: string, ratio: string) => {
    const baseSize = resolutions[resolution as keyof typeof resolutions]
    const aspectRatio = aspectRatios.find(ar => ar.label === ratio)
    
    if (!aspectRatio) return { width: baseSize, height: baseSize }
    
    const [w, h] = aspectRatio.ratio
    const scale = Math.sqrt((baseSize * baseSize) / (w * h))
    
    return {
      width: Math.round(w * scale),
      height: Math.round(h * scale)
    }
  }

  // 智能定位面板
  const getOptimalPosition = (): React.CSSProperties => {
    if (!buttonRef.current) return { top: '100%', left: '0' }
    
    const buttonRect = buttonRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const panelWidth = 384 // w-96 = 384px
    const panelHeight = 400 // 估算面板高度
    
    let position: React.CSSProperties = {
      top: '100%',
      left: '0',
      transform: 'translateY(8px)'
    }
    
    // 检查右侧空间
    if (buttonRect.left + panelWidth > viewportWidth) {
      position.left = 'auto'
      position.right = '0'
    }
    
    // 检查下方空间，如果不够则显示在上方
    if (buttonRect.bottom + panelHeight > viewportHeight) {
      position.top = 'auto'
      position.bottom = '100%'
      position.transform = 'translateY(-8px)'
    }
    
    return position
  }

  // 根据当前参数确定选中状态
  useEffect(() => {
    const currentWidth = parameters.width || 1024
    const currentHeight = parameters.height || 1024
    
    setCustomWidth(currentWidth)
    setCustomHeight(currentHeight)
    
    // 确定分辨率
    const totalPixels = currentWidth * currentHeight
    if (totalPixels <= 1024 * 1024) {
      setSelectedResolution('1K')
    } else if (totalPixels <= 2048 * 2048) {
      setSelectedResolution('2K')
    } else {
      setSelectedResolution('4K')
    }
    
    // 确定宽高比
    const ratio = currentWidth / currentHeight
    const closestRatio = aspectRatios.reduce((closest, ar) => {
      const arRatio = ar.ratio[0] / ar.ratio[1]
      const closestRatio = closest.ratio[0] / closest.ratio[1]
      return Math.abs(ratio - arRatio) < Math.abs(ratio - closestRatio) ? ar : closest
    })
    setSelectedRatio(closestRatio.label)
  }, [parameters.width, parameters.height])

  // 处理预设选择
  const handlePresetSelection = (resolution: string, ratio: string) => {
    const dimensions = calculateDimensions(resolution, ratio)
    setSelectedResolution(resolution)
    setSelectedRatio(ratio)
    setCustomWidth(dimensions.width)
    setCustomHeight(dimensions.height)
    onParametersChange(dimensions)
  }

  // 处理自定义尺寸输入
  const handleCustomSize = (width: number, height: number) => {
    setCustomWidth(width)
    setCustomHeight(height)
    onParametersChange({ width, height })
  }

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])



  return (
    <div className="relative">
      {/* 主按钮 - 显示分辨率和比例文字 */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-20 px-3 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl hover:border-neutral-300 transition-all duration-200 text-sm font-medium shadow-soft"
      >
        <div className="flex items-center space-x-1">
          <span className="font-medium text-neutral-700">{selectedResolution}</span>
          <span className="text-neutral-400">|</span>
          <span className="text-neutral-600">{selectedRatio}</span>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 text-neutral-500 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 弹出面板 */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute w-96 bg-white/95 backdrop-blur-sm border border-neutral-200/60 rounded-2xl shadow-soft-xl z-50 p-6"
          style={getOptimalPosition()}
        >
          {/* 分辨率选择 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">分辨率</h3>
            <div className="flex space-x-2">
              {Object.keys(resolutions).map((res) => (
                <button
                  key={res}
                  onClick={() => handlePresetSelection(res, selectedRatio)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-soft ${
                    selectedResolution === res
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-soft-md'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* 图片比例选择 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">图片比例</h3>
            <div className="grid grid-cols-4 gap-2">
              {aspectRatios.map((ar) => (
                <button
                  key={ar.label}
                  onClick={() => handlePresetSelection(selectedResolution, ar.label)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl text-sm transition-all duration-200 min-h-[60px] shadow-soft ${
                    selectedRatio === ar.label
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-soft-md'
                      : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <div className="mb-1">
                    {ar.icon}
                  </div>
                  <span className="text-xs font-medium">{ar.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 自定义图片尺寸 */}
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-3">图片尺寸</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 p-3 bg-neutral-50 rounded-xl shadow-inner">
                  <span className="text-sm text-neutral-500 w-4 font-medium">W</span>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => handleCustomSize(parseInt(e.target.value) || 0, customHeight)}
                    className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-neutral-700"
                    min="64"
                    max="8192"
                  />
                </div>
              </div>
              <div className="text-neutral-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7"/>
                  <path d="M17 17H7V7"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 p-3 bg-neutral-50 rounded-xl shadow-inner">
                  <span className="text-sm text-neutral-500 w-4 font-medium">H</span>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => handleCustomSize(customWidth, parseInt(e.target.value) || 0)}
                    className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-neutral-700"
                    min="64"
                    max="8192"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModernResolutionControl