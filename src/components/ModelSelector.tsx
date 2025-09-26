import React, { useState, useRef, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';
import { ApiConfig } from '../types';

const ModelSelector: React.FC = () => {
  const { apiConfigs, activeConfig, setActiveConfig } = useApi();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 关闭下拉菜单时的处理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 检查下拉菜单是否应该在上方显示
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      
      // 如果下方空间不足且上方空间更充足，则在上方显示
      if (spaceBelow < 300 && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [isOpen]);

  // 获取当前选中的模型名称
  const getCurrentModelName = () => {
    if (activeConfig) {
      // 显示具体的模型名称，如果不存在则显示API名称
      return activeConfig.model || activeConfig.name;
    }
    return '选择模型';
  };

  // 处理模型选择
  const handleSelectModel = (config: ApiConfig) => {
    setActiveConfig(config);
    setIsOpen(false);
  };

  // 打开设置模态框
  const handleOpenSettings = () => {
    setIsOpen(false);
    // 触发自定义事件来打开设置模态框
    window.dispatchEvent(new CustomEvent('openSettingsModal'));
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span className="max-w-[120px] truncate">{getCurrentModelName()}</span>
        <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className={`absolute right-0 w-60 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 ${
            dropdownPosition === 'bottom' 
              ? 'mt-2 origin-top-right' 
              : 'mb-2 origin-bottom-right bottom-full'
          }`}
        >
          <div className="py-1 max-h-60 overflow-y-auto">
            {apiConfigs.map((config) => (
              <button
                key={config.id}
                onClick={() => handleSelectModel(config)}
                className={`block px-4 py-2 text-sm text-left w-full ${
                  activeConfig?.id === config.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium truncate">{config.model || config.name}</div>
                <div className="text-xs text-gray-500 truncate">{config.name}</div>
              </button>
            ))}
            <div className="border-t border-gray-200 my-1"></div>
            <button
              onClick={handleOpenSettings}
              className="block px-4 py-2 text-sm text-left w-full text-gray-700 hover:bg-gray-100"
            >
              <div className="flex items-center">
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                添加模型API
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;