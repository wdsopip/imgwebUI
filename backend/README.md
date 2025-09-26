# Web Image UI 后端服务

这是 Web Image UI 项目的后端服务，基于 Python 和 FastAPI 构建，提供 API 接口支持前端图像生成功能。

## 功能特性

- **多模型支持** - 支持豆包和通义千问等多种AI图像生成模型
- **API代理** - 安全地代理前端请求到各AI服务提供商
- **历史记录** - 保存和管理图像生成历史记录
- **配置管理** - 管理多个API配置
- **跨域支持** - 支持前端跨域请求

## API 端点

### 图像生成相关

- `POST /api/generate` - 生成图像
- `GET /api/history` - 获取历史记录
- `DELETE /api/history/{id}` - 删除历史记录
- `DELETE /api/history` - 清空历史记录

### 配置管理相关

- `GET /api/config` - 获取API配置列表
- `POST /api/config` - 添加新的API配置
- `PUT /api/config/{id}` - 更新API配置
- `DELETE /api/config/{id}` - 删除API配置
- `POST /api/config/test` - 测试API配置

### 系统状态相关

- `GET /api/status` - 获取系统状态
- `GET /health` - 健康检查

## 环境变量配置

后端服务通过环境变量进行配置，配置项如下：

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

## 数据库结构

后端使用 SQLite 数据库存储历史记录，主要表结构如下：

### configurations 表
存储API配置信息：
- id: 配置ID
- name: 配置名称
- provider: AI服务提供商
- api_key: API密钥
- model: 使用的模型
- is_active: 是否为活动配置

### chat_history 表
存储图像生成历史记录：
- id: 记录ID
- prompt: 生成提示词
- image_urls: 生成的图像URL列表
- timestamp: 生成时间
- model: 使用的模型
- parameters: 生成参数

## 部署说明

### 本地开发部署

1. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

2. 配置环境变量：
   ```bash
   cp .env.example .env
   # 编辑 .env 文件填写配置信息
   ```

3. 启动服务：
   ```bash
   python main.py
   ```

### 生产环境部署

推荐使用以下方式部署：

1. 使用 Gunicorn：
   ```bash
   gunicorn -w 4 -b 0.0.0.0:8000 main:app
   ```

2. 使用 Docker：
   ```bash
   docker build -t webimgui-backend .
   docker run -p 8000:8000 webimgui-backend
   ```

## 安全说明

- 请确保 SECRET_KEY 的安全性，不要使用默认值
- 不要在代码中硬编码 API 密钥
- 生产环境应使用 HTTPS
- 建议在反向代理层面添加访问控制

## 故障排除

### 常见问题

1. **API 请求失败**
   - 检查 API 密钥是否正确配置
   - 确认网络连接是否正常
   - 查看后端日志获取详细错误信息

2. **数据库连接错误**
   - 检查 DATABASE_URL 配置是否正确
   - 确认 SQLite 文件权限是否正确

3. **跨域问题**
   - 检查前端 URL 是否已添加到 CORS 配置中

### 日志查看

后端服务会输出详细日志，可以通过以下方式查看：

```bash
# 查看实时日志
tail -f backend.log

# 查看错误日志
grep "ERROR" backend.log
```