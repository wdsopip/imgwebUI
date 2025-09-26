import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import SettingsModal from './components/SettingsModal'
import ImageViewer from './components/ImageViewer'
import { ApiProvider } from './contexts/ApiContext'
import { ChatProvider } from './contexts/ChatContext'

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [modifyImageUrl, setModifyImageUrl] = useState<string | null>(null)

  const handleModifyImage = (imageUrl: string) => {
    setModifyImageUrl(imageUrl)
    // 这里可以触发参数面板打开，并设置为图生图模式
    // 暂时先存储图片URL，后续可以传递给ChatArea
  }

  // 监听打开设置模态框的事件
  useEffect(() => {
    const handleOpenSettingsModal = () => {
      setIsSettingsOpen(true)
    };

    window.addEventListener('openSettingsModal', handleOpenSettingsModal);

    return () => {
      window.removeEventListener('openSettingsModal', handleOpenSettingsModal);
    };
  }, []);

  return (
    <ApiProvider>
      <ChatProvider>
        <div className="flex h-screen bg-gray-50">
          <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
            <Sidebar 
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>
          <div className="flex-1">
            <ChatArea 
              onImageClick={setSelectedImage}
              isSidebarCollapsed={isSidebarCollapsed}
              modifyImageUrl={modifyImageUrl}
              onClearModifyImage={() => setModifyImageUrl(null)}
            />
          </div>
          
          {isSettingsOpen && (
            <SettingsModal onClose={() => setIsSettingsOpen(false)} />
          )}
          
          <ImageViewer 
            imageUrl={selectedImage || ''}
            isOpen={!!selectedImage}
            onClose={() => setSelectedImage(null)}
            onModifyImage={handleModifyImage}
          />
        </div>
      </ChatProvider>
    </ApiProvider>
  )
}

export default App