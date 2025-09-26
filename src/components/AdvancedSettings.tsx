import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { GenerationParameters } from '../types'

interface AdvancedSettingsProps {
  parameters: GenerationParameters
  onParametersChange: (parameters: GenerationParameters) => void
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
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
      const dropdownHeight = 400
      
      const spaceBelow = viewportHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top
      
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top')
      } else {
        setDropdownPosition('bottom')
      }
    }
  }, [isOpen])

  const updateParameter = (key: keyof GenerationParameters, value: any) => {
    onParametersChange({
      ...parameters,
      [key]: value
    })
  }

  const samplers = [
    'DPM++ 2M Karras',
    'DPM++ SDE Karras', 
    'Euler a',
    'Euler',
    'LMS',
    'Heun',
    'DPM2',
    'DPM2 a',
    'DPM++ 2S a',
    'DPM++ 2M',
    'DPM++ SDE',
    'DPM fast',
    'DPM adaptive',
    'LMS Karras',
    'DPM2 Karras',
    'DPM2 a Karras',
    'DPM++ 2S a Karras'
  ]

  const qualityOptions = [
    { value: 'standard', label: '标准质量' },
    { value: 'hd', label: '高清质量' }
  ]

  const styleOptions = [
    { value: '', label: '默认风格' },
    { value: 'vivid', label: '生动风格' },
    { value: 'natural', label: '自然风格' }
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-5 py-2 text-sm rounded-xl border transition-all duration-200 shadow-soft ${
          isOpen 
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white border-primary-500 shadow-soft-md' 
            : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200 hover:border-neutral-300'
        }`}
      >
        <span>高级设置</span>
        <ChevronDown 
          size={16} 
          className={`inline ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className={`absolute right-0 w-80 bg-white/95 backdrop-blur-sm border border-neutral-200/60 rounded-2xl shadow-soft-xl z-50 p-5 ${
          dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          {/* 头部 */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-neutral-800">高级参数</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              <X size={16} className="text-neutral-500" />
            </button>
          </div>

          <div className="space-y-5">
            {/* 采样器 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                采样器
              </label>
              <select
                value={parameters.sampler}
                onChange={(e) => updateParameter('sampler', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-sm bg-neutral-50 shadow-inner"
              >
                {samplers.map((sampler) => (
                  <option key={sampler} value={sampler}>
                    {sampler}
                  </option>
                ))}
              </select>
            </div>

            {/* 采样步数 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                采样步数: <span className="text-primary-600 font-semibold">{parameters.steps}</span>
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={parameters.steps}
                onChange={(e) => updateParameter('steps', parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, rgb(249 115 22) 0%, rgb(249 115 22) ${((parameters.steps - 10) / 40) * 100}%, rgb(229 231 235) ${((parameters.steps - 10) / 40) * 100}%, rgb(229 231 235) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>10</span>
                <span>50</span>
              </div>
            </div>

            {/* CFG Scale */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                CFG Scale: <span className="text-primary-600 font-semibold">{parameters.cfg_scale}</span>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={parameters.cfg_scale}
                onChange={(e) => updateParameter('cfg_scale', parseFloat(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, rgb(249 115 22) 0%, rgb(249 115 22) ${((parameters.cfg_scale - 1) / 19) * 100}%, rgb(229 231 235) ${((parameters.cfg_scale - 1) / 19) * 100}%, rgb(229 231 235) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>1</span>
                <span>20</span>
              </div>
            </div>

            {/* 随机种子 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                随机种子
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={parameters.seed === -1 ? '' : parameters.seed}
                  onChange={(e) => updateParameter('seed', e.target.value ? parseInt(e.target.value) : -1)}
                  placeholder="随机"
                  className="flex-1 px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-sm bg-neutral-50 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => updateParameter('seed', -1)}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-sm transition-colors shadow-soft"
                >
                  随机
                </button>
              </div>
            </div>

            {/* 图片质量 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                图片质量
              </label>
              <select
                value={parameters.quality || 'standard'}
                onChange={(e) => updateParameter('quality', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-sm bg-neutral-50 shadow-inner"
              >
                {qualityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 图片风格 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                图片风格
              </label>
              <select
                value={parameters.style || ''}
                onChange={(e) => updateParameter('style', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-sm bg-neutral-50 shadow-inner"
              >
                {styleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 负面提示词 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                负面提示词
              </label>
              <textarea
                value={parameters.negative_prompt}
                onChange={(e) => updateParameter('negative_prompt', e.target.value)}
                placeholder="描述不想要的内容..."
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-sm resize-none bg-neutral-50 shadow-inner"
                rows={3}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedSettings