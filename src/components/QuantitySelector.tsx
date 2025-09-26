import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [customValue, setCustomValue] = useState(value.toString())
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
      const dropdownHeight = 200
      
      const spaceBelow = viewportHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top
      
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top')
      } else {
        setDropdownPosition('bottom')
      }
    }
  }, [isOpen])

  useEffect(() => {
    setCustomValue(value.toString())
  }, [value])

  const presetOptions = [1, 2, 3, 4, 5, 6, 8, 10]

  const handlePresetClick = (preset: number) => {
    onChange(preset)
    setIsOpen(false)
  }

  const handleCustomSubmit = () => {
    const numValue = parseInt(customValue)
    if (numValue >= 1 && numValue <= 15) {
      onChange(numValue)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl hover:border-neutral-300 transition-all duration-200 text-sm font-medium shadow-soft"
      >
        <span className="text-neutral-700">{value}张</span>
        <ChevronDown 
          size={16} 
          className={`text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className={`absolute left-0 w-48 bg-white/95 backdrop-blur-sm border border-neutral-200/60 rounded-2xl shadow-soft-xl z-50 p-4 ${
          dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          <div className="mb-4">
            <h4 className="text-sm font-medium text-neutral-700 mb-3">快速选择</h4>
            <div className="grid grid-cols-4 gap-2">
              {presetOptions.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`py-2 text-center rounded-xl border-2 transition-all duration-200 text-sm font-medium shadow-soft ${
                    value === preset
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-3">自定义数量</h4>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 shadow-inner bg-neutral-50"
                min="1"
                max="15"
                placeholder="1-15"
              />
              <button
                type="button"
                onClick={handleCustomSubmit}
                className="px-3 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl text-sm transition-all duration-200 shadow-soft hover:shadow-soft-md"
              >
                确定
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">支持1-15张图片</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuantitySelector