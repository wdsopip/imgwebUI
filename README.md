# Web Image UI

这是一个基于Web的图像生成用户界面，支持多种AI图像生成模型，包括豆包和通义千问等。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Python](https://img.shields.io/badge/Python-3.8+-green.svg)

## 功能特点

### 核心功能
- **多模型支持** - 支持豆包、通义千问等多种AI图像生成模型
- **多种生成模式** - 支持文字生图、图生图、多图融合等多种创作模式
- **实时预览** - 即时查看生成结果
- **批量生成** - 一次生成多张图片
- **历史记录** - 自动保存生成历史

### 界面设计
- **现代化UI** - 参考Claude设计风格的温暖配色
- **响应式布局** - 完美适配桌面和移动设备
- **流畅动画** - 精心设计的交互动效
- **直观操作** - 简洁易用的用户界面

### 高级功能
- **参数调节** - 支持分辨率、步数、引导系数等参数调节
- **多配置管理** - 支持多个API配置切换
- **图片下载** - 一键下载生成的图片
- **水印控制** - 可选择是否添加AI水印

## 技术栈

### 前端
- **React 18** - 现代化前端框架
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 实用优先的CSS框架
- **Vite** - 快速的构建工具
- **Lucide React** - 精美的图标库

### 后端
- **Python 3.8+** - 后端开发语言
- **FastAPI** - 高性能Web框架
- **SQLite** - 轻量级数据库
- **Axios** - HTTP客户端

## 安装与运行

### 环境要求
- Node.js 16.x 或更高版本
- Python 3.8 或更高版本

### 1. 克隆项目
```bash
git clone <repository-url>
cd webimgui
```

### 2. 前端设置
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 3. 后端设置
```bash
# 进入后端目录
cd backend

# 安装Python依赖
pip install -r requirements.txt

# 复制环境变量模板
cp .env.example .env

# 启动后端服务
python main.py
```

### 4. 访问应用
打开浏览器访问 `http://localhost:5173`

## 配置说明

### API密钥配置
为了使用AI图像生成功能，您需要配置相应的API密钥：

1. 豆包API：
   - 注册并登录[豆包平台](https://www.doubao.com/)
   - 获取API密钥
   - 在应用设置中填写密钥

2. 通义千问API：
   - 注册并登录[阿里云](https://www.aliyun.com/)
   - 开通通义千问服务
   - 获取API密钥
   - 在应用设置中填写密钥

### 环境变量
创建 `.env` 文件并添加以下配置：

```bash
# API基础URL
VITE_API_BASE_URL=http://localhost:8000
```

后端环境变量配置在 `backend/.env` 文件中：

```bash
# Flask密钥，用于会话加密
SECRET_KEY=your-secret-key-here

# 豆包API密钥 (可选，用户可在前端配置)
DOUBAO_API_KEY=

# 通义千问API密钥 (可选，用户可在前端配置)
QWEN_API_KEY=

# 数据库配置
DATABASE_URL=sqlite:///chat_history.db

# API端点配置
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3/
QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1/
```

## 使用指南

### 基础使用
1. **配置API** - 在设置中添加API配置
2. **输入描述** - 在输入框中描述你想要的图片
3. **选择参数** - 调整分辨率、数量等参数
4. **生成图片** - 点击生成按钮开始创作
5. **查看结果** - 在聊天区域查看生成的图片

### 高级功能
- **图生图模式** - 上传参考图片进行图像转换
- **批量生成** - 设置数量生成多张图片
- **参数调节** - 在高级设置中调整生成参数
- **历史管理** - 在侧边栏查看和管理历史记录

## 安全说明

- 请妥善保管您的API密钥，不要将其提交到代码仓库
- 本项目默认不包含任何API密钥
- 生产环境部署时，请确保使用安全的密钥管理方案

## 项目结构

```
.
├── src/                    # 前端源代码
│   ├── components/         # React组件
│   ├── contexts/           # React上下文
│   ├── hooks/              # 自定义Hooks
│   ├── types/              # TypeScript类型定义
│   └── utils/              # 工具函数
├── backend/                # 后端源代码
│   ├── doubao_api.py       # 豆包API接口
│   ├── qwen_api.py         # 通义千问API接口
│   └── main.py             # 主应用文件
├── public/                 # 静态资源文件
└── README.md               # 项目说明文件
```

## 贡献

我们欢迎所有形式的贡献！

### 如何贡献
1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 代码规范
- 编写清晰的提交信息
- 添加必要的测试用例

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如果你在使用过程中遇到问题，可以：

- 查看 [Issues](https://github.com/your-username/webimgui/issues)
- 创建新的 Issue 报告问题
- 参与 Discussions 讨论