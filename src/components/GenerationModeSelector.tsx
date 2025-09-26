import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface GenerationModeSelectorProps {
  value: string
  onChange: (value: string) => void
}

const GenerationModeSelector: React.FC<GenerationModeSelectorProps> = ({
  value,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [generationTypes, setGenerationTypes] = useState<any[]>([])

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

  const [options, setOptions] = useState([
    { value: 'text_to_image', label: '文生图', description: '纯文本输入单图输出' },
    { value: 'image_to_image', label: '图文生图', description: '单图输入单图输出' },
    { value: 'multi_image_fusion', label: '多图融合', description: '多图输入单图输出' },
    { value: 'batch_generation', label: '组图输出', description: '多图输出' },
    { value: 'text_to_batch', label: '文生组图', description: '文本生成多张图片' },
    { value: 'image_to_batch', label: '单张图生组图', description: '单图输入多图输出' },
    { value: 'multi_reference_batch', label: '多参考图生组图', description: '多图输入多图输出' }
  ])

  // 从后端加载生成类型
  useEffect(() => {
    const fetchGenerationTypes = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/generation-types')
        const data = await response.json()
        setGenerationTypes(data)
        
        // 如果后端返回了生成类型数据，则更新选项
        if (data && data.length > 0) {
          const newOptions = data.map((type: any) => ({
            value: type.id,
            label: type.name,
            description: type.description
          }))
          setOptions(newOptions)
        }
      } catch (error) {
        console.error('获取生成类型失败:', error)
      }
    }

    fetchGenerationTypes()
  }, [])

  const currentOption = options.find(opt => opt.value === value) || options[0]

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl hover:border-neutral-300 transition-all duration-200 text-sm font-medium shadow-soft"
      >
        <span className="text-neutral-700">{currentOption.label}</span>
        <ChevronDown 
          size={16} 
          className={`text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className={`absolute left-0 w-64 bg-white/95 backdrop-blur-sm border border-neutral-200/60 rounded-2xl shadow-soft-xl z-50 p-3 ${
          dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.value)}
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                value === option.value
                  ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-soft'
                  : 'hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-neutral-500 mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default GenerationModeSelector