import React, { useState, useEffect } from 'react'
import { X, ChevronDown, Upload, Trash2 } from 'lucide-react'
import { GenerationParameters } from '../types'

interface ParameterPanelProps {
  parameters: GenerationParameters
  onParametersChange: (parameters: GenerationParameters) => void
  onClose: () => void
  onInputImagesChange?: (images: string[]) => void
  onGenerationTypeChange?: (type: 'text_to_image' | 'image_to_image' | 'multi_image_fusion' | 'image_variation') => void
  inputImages?: string[]
  generationType?: string
}

const ParameterPanel: React.FC<ParameterPanelProps> = ({
  parameters,
  onParametersChange,
  onClose,
  onInputImagesChange,
  onGenerationTypeChange,
  inputImages = [],
  generationType = 'text_to_image'
}) => {
  const [generationTypes, setGenerationTypes] = useState<any[]>([])
  // const [supportedSizes, setSupportedSizes] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  // 获取生成类型和尺寸
  useEffect(() => {
    const fetchGenerationTypes = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/generation-types')
        const data = await response.json()
        setGenerationTypes(data)
      } catch (error) {
        console.error('获取生成类型失败:', error)
      }
    }

    // const fetchSizes = async () => {
    //   try {
    //     const response = await fetch('http://localhost:8000/api/sizes')
    //     const data = await response.json()
    //     setSizes(data)
    //   } catch (error) {
    //     console.error('获取尺寸失败:', error)
    //   }
    // }

    fetchGenerationTypes()
    // fetchSizes()
  }, [])

  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !onInputImagesChange) return

    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('http://localhost:8000/api/upload-image', {
          method: 'POST',
          body: formData
        })
        const result = await response.json()
        return result.success ? result.image : null
      } catch (error) {
        console.error('Upload failed:', error)
        return null
      }
    })

    const uploadedImages = await Promise.all(uploadPromises)
    const validImages = uploadedImages.filter(img => img !== null)
    
    if (validImages.length > 0) {
      onInputImagesChange([...inputImages, ...validImages])
    }
  }

  const removeImage = (index: number) => {
    if (onInputImagesChange) {
      const newImages = inputImages.filter((_, i) => i !== index)
      onInputImagesChange(newImages)
    }
  }

  const updateParameter = (key: keyof GenerationParameters, value: any) => {
    onParametersChange({
      ...parameters,
      [key]: value
    })
  }

  const sizePresets = [
    { label: '1024×1024', width: 1024, height: 1024 },
    { label: '1152×896', width: 1152, height: 896 },
    { label: '896×1152', width: 896, height: 1152 },
    { label: '1344×768', width: 1344, height: 768 },
    { label: '768×1344', width: 768, height: 1344 },
    { label: '1280×720', width: 1280, height: 720 },
    { label: '720×1280', width: 720, height: 1280 },
    { label: '1600×576', width: 1600, height: 576 }
  ]

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

  const currentGenerationType = generationTypes.find(t => t.id === generationType)
  const requiresInputImage = currentGenerationType?.requires_input_image || false

  return (
    <div className="border-t bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">生成参数</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {/* 生成模式选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            生成模式
          </label>
          <select
            value={generationType}
            onChange={(e) => onGenerationTypeChange?.(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {generationTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} - {type.description}
              </option>
            ))}
          </select>
        </div>

        {/* 图片上传区域 */}
        {requiresInputImage && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              输入图片
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">点击上传</span> 或拖拽图片到此处
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG (最大 10MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              
              {/* 已上传的图片预览 */}
              {inputImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {inputImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={`data:image/jpeg;base64,${image}`}
                        alt={`Input ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 图片尺寸 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            图片尺寸
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {sizePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  updateParameter('width', preset.width)
                  updateParameter('height', preset.height)
                }}
                className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                  parameters.width === preset.width && parameters.height === preset.height
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">宽度</label>
              <input
                type="number"
                value={parameters.width}
                onChange={(e) => updateParameter('width', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="64"
                max="2048"
                step="64"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">高度</label>
              <input
                type="number"
                value={parameters.height}
                onChange={(e) => updateParameter('height', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="64"
                max="2048"
                step="64"
              />
            </div>
          </div>
        </div>

        {/* 生成数量 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            生成数量: {parameters.batch_size}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={parameters.batch_size}
            onChange={(e) => updateParameter('batch_size', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        {/* 质量设置 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            图片质量
          </label>
          <select
            value={parameters.quality || 'standard'}
            onChange={(e) => updateParameter('quality', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {qualityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 风格设置 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            生成风格
          </label>
          <select
            value={parameters.style || ''}
            onChange={(e) => updateParameter('style', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {styleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 高级参数 */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <span>高级参数</span>
            <ChevronDown
              size={16}
              className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
          </button>
          
          {showAdvanced && (
            <div className="mt-3 space-y-4 p-3 bg-white rounded-lg border">
              {/* CFG Scale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CFG Scale: {parameters.cfg_scale}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={parameters.cfg_scale}
                  onChange={(e) => updateParameter('cfg_scale', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>

              {/* 采样步数 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  采样步数: {parameters.steps}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={parameters.steps}
                  onChange={(e) => updateParameter('steps', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10</span>
                  <span>100</span>
                </div>
              </div>

              {/* 采样器 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  采样器
                </label>
                <select
                  value={parameters.sampler}
                  onChange={(e) => updateParameter('sampler', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {samplers.map((sampler) => (
                    <option key={sampler} value={sampler}>
                      {sampler}
                    </option>
                  ))}
                </select>
              </div>

              {/* 随机种子 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  随机种子 (可选)
                </label>
                <input
                  type="number"
                  value={parameters.seed || ''}
                  onChange={(e) => updateParameter('seed', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="留空为随机"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 图像强度 (仅在图生图模式下显示) */}
              {requiresInputImage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    图像强度: {parameters.strength || 0.8}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={parameters.strength || 0.8}
                    onChange={(e) => updateParameter('strength', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.1</span>
                    <span>1.0</span>
                  </div>
                </div>
              )}

              {/* 负面提示词 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  负面提示词
                </label>
                <textarea
                  value={parameters.negative_prompt || ''}
                  onChange={(e) => updateParameter('negative_prompt', e.target.value)}
                  placeholder="描述你不想在图片中出现的内容..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ParameterPanel