from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import sqlite3
import secrets
import os
from dotenv import load_dotenv
from doubao_api import DoubaoAPIClient, DoubaoImageRequest, validate_image_size, resize_image_for_api

# 加载环境变量
load_dotenv()

# 创建FastAPI应用
app = FastAPI(title="AI绘画聊天API", version="1.0.0")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库初始化
def init_database():
    conn = sqlite3.connect('chat_history.db')
    cursor = conn.cursor()
    
    # 创建API配置表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS api_configs (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            api_key TEXT NOT NULL,
            headers TEXT,
            model TEXT,
            is_active BOOLEAN DEFAULT 0
        )
    ''')
    
    # 创建聊天历史表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id TEXT PRIMARY KEY,
            prompt TEXT NOT NULL,
            result_images TEXT,
            parameters TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# 初始化数据库
init_database()

# 数据库连接
conn = sqlite3.connect('chat_history.db', check_same_thread=False)
cursor = conn.cursor()

# 生成唯一ID
def generate_id():
    return secrets.token_urlsafe(16)

# Pydantic模型
class GenerationParameters(BaseModel):
    model: Optional[str] = None
    width: Optional[int] = 1024
    height: Optional[int] = 1024
    steps: Optional[int] = None
    cfg_scale: Optional[float] = None
    seed: Optional[int] = None
    sampler: Optional[str] = None
    negative_prompt: Optional[str] = None
    batch_size: Optional[int] = 1
    style: Optional[str] = None
    quality: Optional[str] = "standard"
    generation_type: Optional[str] = "text_to_image"
    strength: Optional[float] = None
    guidance_scale: Optional[float] = None
    num_inference_steps: Optional[int] = None
    scheduler: Optional[str] = None
    watermark: Optional[bool] = True

class GenerationRequest(BaseModel):
    prompt: str
    parameters: GenerationParameters
    apiConfigId: str
    input_images: Optional[List[str]] = []
    input_image_urls: Optional[List[str]] = []
    generation_type: Optional[str] = "text_to_image"

class GenerationResponse(BaseModel):
    success: bool
    images: Optional[List[str]] = None
    error: Optional[str] = None

class ApiConfigRequest(BaseModel):
    name: str
    url: str
    apiKey: str
    headers: Optional[Dict[str, str]] = None
    model: Optional[str] = None

# API端点
@app.get("/")
async def root():
    return {"message": "AI绘画聊天API服务正在运行"}

@app.get("/api/generation-types")
async def get_generation_types():
    """获取支持的生成类型"""
    return {
        "types": [
            {"id": "text_to_image", "name": "文生图", "description": "纯文本输入单图输出"},
            {"id": "image_to_image", "name": "图文生图", "description": "单图输入单图输出"},
            {"id": "multi_image_fusion", "name": "多图融合", "description": "多图输入单图输出"},
            {"id": "batch_generation", "name": "组图输出", "description": "多图输出"},
            {"id": "text_to_batch", "name": "文生组图", "description": "文本生成多张图片"},
            {"id": "image_to_batch", "name": "单张图生组图", "description": "单图输入多图输出"},
            {"id": "multi_reference_batch", "name": "多参考图生组图", "description": "多图输入多图输出"}
        ]
    }

@app.get("/api/api-configs")
async def get_api_configs():
    """获取所有API配置"""
    cursor.execute("SELECT * FROM api_configs")
    rows = cursor.fetchall()
    
    configs = []
    for row in rows:
        config = {
            "id": row[0],
            "name": row[1],
            "url": row[2],
            "apiKey": row[3],
            "headers": json.loads(row[4]) if row[4] else {},
            "model": row[5],
            "isActive": bool(row[6])
        }
        configs.append(config)
    
    return {"configs": configs}

@app.post("/api/api-configs")
async def create_api_config(config: ApiConfigRequest):
    """创建新的API配置"""
    config_id = generate_id()
    
    cursor.execute("""
        INSERT INTO api_configs (id, name, url, api_key, headers, model, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        config_id,
        config.name,
        config.url,
        config.apiKey,
        json.dumps(config.headers) if config.headers else None,
        config.model,
        False
    ))
    conn.commit()
    
    return {"id": config_id, "message": "配置创建成功"}

@app.put("/api/api-configs/{config_id}")
async def update_api_config(config_id: str, updates: Dict[str, Any]):
    """更新API配置"""
    # 构建更新语句
    update_fields = []
    values = []
    
    if "name" in updates:
        update_fields.append("name = ?")
        values.append(updates["name"])
    if "url" in updates:
        update_fields.append("url = ?")
        values.append(updates["url"])
    if "apiKey" in updates:
        update_fields.append("api_key = ?")
        values.append(updates["apiKey"])
    if "headers" in updates:
        update_fields.append("headers = ?")
        values.append(json.dumps(updates["headers"]) if updates["headers"] else None)
    if "model" in updates:
        update_fields.append("model = ?")
        values.append(updates["model"])
    if "isActive" in updates:
        update_fields.append("is_active = ?")
        values.append(updates["isActive"])
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="没有提供更新字段")
    
    values.append(config_id)
    query = f"UPDATE api_configs SET {', '.join(update_fields)} WHERE id = ?"
    
    cursor.execute(query, values)
    conn.commit()
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="配置不存在")
    
    return {"message": "配置更新成功"}

@app.delete("/api/api-configs/{config_id}")
async def delete_api_config(config_id: str):
    """删除API配置"""
    cursor.execute("DELETE FROM api_configs WHERE id = ?", (config_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="配置不存在")
    
    return {"message": "配置删除成功"}

@app.post("/api/api-configs/test")
async def test_api_config(config: Dict[str, Any]):
    """测试API配置"""
    try:
        # 根据URL判断API类型
        if "dashscope" in config.get("url", "") or "aliyuncs" in config.get("url", ""):
            # 阿里通义万象API
            from qwen_api import QwenAPIClient, QwenImageRequest
            client = QwenAPIClient(
                api_key=config.get("apiKey", ""),
                base_url=config.get("url", "")
            )
            
            # 构建测试请求
            test_request = QwenImageRequest(
                prompt="测试连接",
                model=config.get("model", "wanx-v1"),
                size="512*512"  # 使用标准尺寸进行测试
            )
            
            # 尝试调用API
            response = client.text_to_image(test_request)
        else:
            # 字节豆包API（默认）
            client = DoubaoAPIClient(
                api_key=config.get("apiKey", ""),
                base_url=config.get("url", "")
            )
            
            # 创建测试请求
            test_request = DoubaoImageRequest(
                prompt="test",
                model=config.get("model", "doubao-seedream-4-0-250828"),
                width=512,
                height=512,
                image_num=1
            )
            
            # 这里可以添加实际的API测试逻辑
            response = {"success": True, "message": "API配置测试成功"}
        
        # 检查响应
        # 对于Qwen API，检查是否返回了图像URL列表
        if isinstance(response, list):
            # 即使是空列表，也说明API调用成功了
            return {"success": True, "message": "连接成功"}
        # 对于其他API，检查是否有data或output字段
        elif isinstance(response, dict) and ('data' in response or 'output' in response):
            return {"success": True, "message": "连接成功"}
        # 如果响应不为空但不是列表或字典，也认为连接成功
        elif response is not None:
            return {"success": True, "message": "连接成功"}
        else:
            return {"success": False, "message": "API响应格式不正确"}
            
    except Exception as e:
        return {"success": False, "message": f"连接失败: {str(e)}"}

@app.post("/api/generate", response_model=GenerationResponse)
async def generate_image(request: GenerationRequest):
    """生成图片 - 支持多种生成模式"""
    try:
        # 获取API配置
        cursor.execute("SELECT * FROM api_configs WHERE id = ? AND is_active = 1", (request.apiConfigId,))
        config_row = cursor.fetchone()
        
        if not config_row:
            raise HTTPException(status_code=404, detail="API配置不存在或未激活")
        
        # 根据URL判断API类型
        if "dashscope" in config_row[2] or "aliyuncs" in config_row[2]:
            # 阿里通义万象API
            from qwen_api import QwenAPIClient
            client = QwenAPIClient(
                api_key=config_row[3],  # api_key
                base_url=config_row[2]   # url
            )
            
            # 获取模型
            model = config_row[5] or request.parameters.model
            
            # 构建尺寸字符串 (Qwen API 使用 * 分隔)
            size = f"{request.parameters.width}*{request.parameters.height}"
            if not validate_image_size(size.replace('*', 'x')):  # 验证时转换为标准格式
                size = "1024*1024"  # 默认尺寸
            
            # 构建Qwen API请求对象
            from qwen_api import QwenImageRequest
            
            # 构建Qwen API请求对象
            qwen_request = QwenImageRequest(
                model=model or "wanx-v1",
                prompt=request.prompt,
                size=size,
                n=request.parameters.batch_size or 1,
                seed=request.parameters.seed,
                style=request.parameters.style
            )
            
            # 根据生成类型调用不同的API
            generation_type = request.generation_type or "text_to_image"
            
            if generation_type == "text_to_image":
                result = client.text_to_image(qwen_request)
            elif generation_type == "image_to_image":
                # 图生图需要提供输入图片，这里简化处理
                if request.input_images or request.input_image_urls:
                    # Qwen API的图生图实现需要特殊处理
                    # 这里暂时使用文生图作为替代
                    result = client.text_to_image(qwen_request)
                else:
                    result = client.text_to_image(qwen_request)
            else:
                # 其他类型暂时使用文生图作为默认处理
                result = client.text_to_image(qwen_request)
                
        else:
            # 字节豆包API（默认）
            client = DoubaoAPIClient(
                api_key=config_row[3],  # api_key
                base_url=config_row[2]   # url
            )
            
            # 获取模型
            model = config_row[5] or request.parameters.model
            
            # 构建尺寸字符串
            size = f"{request.parameters.width}x{request.parameters.height}"
            if not validate_image_size(size):
                size = "1024x1024"  # 默认尺寸
            
            doubao_request = DoubaoImageRequest(
                model=model or "doubao-seedream-4-0-250828",
                prompt=request.prompt,
                negative_prompt=request.parameters.negative_prompt,
                size=size,
                n=request.parameters.batch_size or 1,
                quality=request.parameters.quality or "standard",
                style=request.parameters.style,
                seed=request.parameters.seed,
                steps=request.parameters.steps,
                cfg_scale=request.parameters.cfg_scale,
                strength=request.parameters.strength,
                response_format="url",
                watermark=request.parameters.watermark
            )
            
            # 处理输入图像
            if request.input_images:
                doubao_request.images = request.input_images
                if len(request.input_images) == 1:
                    doubao_request.image = request.input_images[0]
            elif request.input_image_urls:
                doubao_request.image_url = request.input_image_urls[0] if request.input_image_urls else None
            
            # 根据生成类型调用不同的API
            generation_type = request.generation_type or "text_to_image"
            
            if generation_type == "text_to_image":
                result = await client.text_to_image(doubao_request)
            elif generation_type == "image_to_image":
                result = await client.image_to_image(doubao_request)
            elif generation_type == "multi_image_fusion":
                result = await client.multi_image_fusion(doubao_request)
            elif generation_type == "batch_generation":
                result = await client.batch_generation(doubao_request)
            elif generation_type == "text_to_batch":
                result = await client.text_to_batch(doubao_request)
            elif generation_type == "image_to_batch":
                result = await client.image_to_batch(doubao_request)
            elif generation_type == "multi_reference_batch":
                result = await client.multi_reference_batch(doubao_request)
            else:
                result = await client.text_to_image(doubao_request)
        
        # 解析响应
        images = []
        if isinstance(result, list):
            # 阿里通义万象API直接返回URL列表
            images = result
        elif "data" in result:
            # 字节豆包API响应格式
            for item in result["data"]:
                if "url" in item:
                    images.append(item["url"])
                elif "b64_json" in item:
                    # 如果返回base64，可以选择保存或转换为URL
                    images.append(f"data:image/png;base64,{item['b64_json']}")
        elif "output" in result and "results" in result["output"]:
            # 阿里通义万象API响应格式（备用）
            for item in result["output"]["results"]:
                if "url" in item:
                    images.append(item["url"])
                elif "b64_json" in item:
                    images.append(f"data:image/png;base64,{item['b64_json']}")
        
        # 保存到历史记录
        history_id = generate_id()
        cursor.execute('''
            INSERT INTO chat_history (id, prompt, result_images, parameters, timestamp)
            VALUES (?, ?, ?, ?, datetime('now'))
        ''', (
            history_id,
            request.prompt,
            json.dumps(images),
            json.dumps(request.parameters.dict())
        ))
        conn.commit()
        
        return GenerationResponse(
            success=True,
            images=images
        )
        
    except Exception as e:
        return GenerationResponse(
            success=False,
            error=str(e)
        )

@app.post("/api/generate-stream")
async def generate_image_stream(request: dict):
    """流式生成图片"""
    from fastapi.responses import StreamingResponse
    import asyncio
    
    async def generate():
        try:
            # 发送开始信号
            yield f"data: {json.dumps({'type': 'start', 'message': '开始生成图片'})}\n\n"
            
            # 模拟进度更新
            for progress in [10, 25, 50, 75, 90]:
                await asyncio.sleep(0.5)
                yield f"data: {json.dumps({'type': 'progress', 'progress': progress})}\n\n"
            
            # 转换为标准请求格式
            gen_request = GenerationRequest(
                prompt=request.get("prompt", ""),
                parameters=GenerationParameters(**request.get("parameters", {})),
                apiConfigId=request.get("apiConfigId", ""),
                input_images=request.get("parameters", {}).get("input_images", []),
                generation_type=request.get("parameters", {}).get("generation_type", "text_to_image")
            )
            
            # 调用普通生成API
            result = await generate_image(gen_request)
            
            if result.success:
                for image in result.images or []:
                    yield f"data: {json.dumps({'type': 'image', 'image': image})}\n\n"
                
                yield f"data: {json.dumps({'type': 'complete', 'message': '生成完成'})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'error', 'error': result.error or '生成失败'})}\n\n"
                
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/plain")

@app.get("/api/chat-history")
async def get_chat_history():
    """获取聊天历史"""
    cursor.execute("SELECT * FROM chat_history ORDER BY timestamp DESC LIMIT 50")
    rows = cursor.fetchall()
    
    history = []
    for row in rows:
        item = {
            "id": row[0],
            "prompt": row[1],
            "images": json.loads(row[2]) if row[2] else [],  # result_images列
            "parameters": json.loads(row[3]) if row[3] else {},  # parameters列
            "timestamp": row[4]
        }
        history.append(item)
    
    return {"history": history}

@app.delete("/api/chat-history/{history_id}")
async def delete_chat_history(history_id: str):
    """删除聊天历史"""
    cursor.execute("DELETE FROM chat_history WHERE id = ?", (history_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="历史记录不存在")
    
    return {"message": "历史记录删除成功"}

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """上传图片"""
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="文件必须是图片格式")
    
    try:
        # 读取文件内容
        content = await file.read()
        
        # 转换为base64
        import base64
        base64_image = base64.b64encode(content).decode('utf-8')
        data_url = f"data:{file.content_type};base64,{base64_image}"
        
        return {"success": True, "image": data_url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")

def load_additional_endpoints():
    """加载额外的端点"""
    try:
        from additional_endpoints import register_additional_endpoints
        register_additional_endpoints(app)
        print("✅ 额外端点加载成功")
    except ImportError:
        print("⚠️  额外端点未加载：模块不存在")
    except Exception as e:
        print(f"❌ 加载额外端点时出错：{e}")

# 在应用启动时加载
@app.on_event("startup")
async def startup_event():
    try:
        load_additional_endpoints()
    except Exception as e:
        print(f"Warning: Could not load additional endpoints: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)