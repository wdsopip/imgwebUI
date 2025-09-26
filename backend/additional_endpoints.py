"""
额外的API端点 - 流式生成和其他高级功能
这个文件包含了一些额外的端点，可以根据需要添加到main.py中
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
import json
import sqlite3
from .doubao_api import DoubaoAPIClient, DoubaoImageRequest, resize_image_for_api
import sqlite3
from pydantic import BaseModel
from typing import Optional, List

# 重新定义需要的类型，避免循环导入
class GenerationParameters(BaseModel):
    width: Optional[int] = 1024
    height: Optional[int] = 1024
    batch_size: Optional[int] = 1

class GenerationRequest(BaseModel):
    prompt: str
    parameters: GenerationParameters
    api_config_id: str

def get_db_connection():
    """获取数据库连接"""
    return sqlite3.connect("chat_history.db")

# 注意：这些端点需要添加到main.py的app实例中

def add_stream_endpoint(app: FastAPI):
    """添加流式生成端点到FastAPI应用"""
    
    @app.post("/api/stream-generate")
    async def stream_generate(request: GenerationRequest):
        """流式生成图片"""
        try:
            # 获取API配置
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM api_configs WHERE id = ?", (request.api_config_id,))
            config_row = cursor.fetchone()
            conn.close()
            
            if not config_row:
                raise HTTPException(status_code=404, detail="API配置不存在")
            
            api_key = config_row[3]
            api_url = config_row[2]
            model = config_row[5]
            
            # 创建豆包API客户端
            if "/api/v3" in api_url:
                base_url = api_url.split("/api/v3")[0] + "/api/v3"
            else:
                base_url = "https://ark.cn-beijing.volces.com/api/v3"
                
            client = DoubaoAPIClient(api_key, base_url)
            
            # 构建请求
            size = f"{request.parameters.width}x{request.parameters.height}"
            doubao_request = DoubaoImageRequest(
                model=model or "doubao-seedream-4-0-250828",
                prompt=request.prompt,
                size=size,
                n=request.parameters.batch_size or 1
            )
            
            # 流式生成
            async def generate_stream():
                try:
                    async for chunk in client.stream_generation(doubao_request):
                        yield f"data: {json.dumps(chunk)}\n\n"
                    yield "data: [DONE]\n\n"
                except Exception as e:
                    error_data = {"error": str(e)}
                    yield f"data: {json.dumps(error_data)}\n\n"
            
            return StreamingResponse(
                generate_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                }
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

def add_advanced_endpoints(app: FastAPI):
    """添加高级功能端点"""
    
    @app.post("/api/batch-upload")
    async def batch_upload_images(files: list[UploadFile] = File(...)):
        """批量上传图片"""
        try:
            results = []
            for file in files:
                if not file.content_type or not file.content_type.startswith('image/'):
                    results.append({
                        "filename": file.filename,
                        "success": False,
                        "error": "不支持的文件类型"
                    })
                    continue
                
                content = await file.read()
                base64_image = resize_image_for_api(content)
                
                results.append({
                    "filename": file.filename,
                    "success": True,
                    "image": base64_image,
                    "size": len(content)
                })
            
            return {"success": True, "results": results}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @app.get("/api/system-status")
    async def get_system_status():
        """获取系统状态"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # 统计API配置数量
            cursor.execute("SELECT COUNT(*) FROM api_configs")
            api_count = cursor.fetchone()[0]
            
            # 统计历史记录数量
            cursor.execute("SELECT COUNT(*) FROM chat_history")
            history_count = cursor.fetchone()[0]
            
            # 获取活跃的API配置
            cursor.execute("SELECT name FROM api_configs WHERE is_active = 1")
            active_api = cursor.fetchone()
            
            conn.close()
            
            return {
                "status": "running",
                "api_configs": api_count,
                "history_records": history_count,
                "active_api": active_api[0] if active_api else None,
                "supported_models": DoubaoAPIClient.get_supported_models(),
                "supported_sizes": DoubaoAPIClient.get_supported_sizes()
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

# 使用示例：
# 在main.py中添加以下代码来启用这些端点：
# from additional_endpoints import add_stream_endpoint, add_advanced_endpoints
# add_stream_endpoint(app)
# add_advanced_endpoints(app)