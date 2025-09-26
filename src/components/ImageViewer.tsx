import React, { useState, useEffect } from 'react'
import { X, Download, RotateCw, ZoomIn, ZoomOut, Move, Edit } from 'lucide-react'

interface ImageViewerProps {
  imageUrl: string
  onClose: () => void
  isOpen: boolean
  onModifyImage?: (imageUrl: string) => void
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, onClose, isOpen, onModifyImage }) => {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen, imageUrl])

  // ESC键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 5))
  const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.1))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `ai-image-${Date.now()}.png`
    link.click()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      {/* 工具栏 */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center space-x-2 bg-black bg-opacity-50 rounded-lg px-4 py-2">
          <button onClick={handleZoomOut} className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded" title="缩小">
            <ZoomOut size={18} />
          </button>
          <span className="text-white text-sm min-w-16 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded" title="放大">
            <ZoomIn size={18} />
          </button>
          <div className="w-px h-6 bg-white bg-opacity-30" />
          <button onClick={handleRotate} className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded" title="旋转">
            <RotateCw size={18} />
          </button>
          <button onClick={handleReset} className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded" title="重置">
            <Move size={18} />
          </button>
          <div className="w-px h-6 bg-white bg-opacity-30" />
          <button onClick={handleDownload} className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded" title="下载">
            <Download size={18} />
          </button>
          {onModifyImage && (
            <>
              <div className="w-px h-6 bg-white bg-opacity-30" />
              <button 
                onClick={() => {
                  onModifyImage(imageUrl)
                  onClose()
                }} 
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded" 
                title="在此图上修改"
              >
                <Edit size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 关闭按钮 */}
      <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full" title="关闭 (ESC)">
        <X size={24} />
      </button>

      {/* 图片容器 */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={imageUrl}
          alt="Full size view"
          className="max-w-none max-h-none select-none"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          draggable={false}
        />
      </div>

      {/* 操作提示 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2 text-white text-sm">
          <div className="flex items-center space-x-4 text-xs">
            <span>滚轮缩放</span>
            <span>拖拽移动</span>
            <span>ESC关闭</span>
          </div>
        </div>
      </div>

      {/* 背景点击关闭 */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  )
}

export default ImageViewer