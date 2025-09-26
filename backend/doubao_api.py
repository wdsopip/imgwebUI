"""
字节跳动豆包API集成模块
基于官方文档: https://www.volcengine.com/docs/82379/1824121
"""

import httpx
import json
import base64
import io
from typing import Any, Optional, Union
from pydantic import BaseModel
from PIL import Image

class DoubaoImageRequest(BaseModel):
    """豆包图像生成请求模型"""
    model: str = "doubao-seedream-4-0-250828"
    prompt: str
    negative_prompt: Optional[str] = None
    size: Optional[str] = "1024x1024"  # 支持多种尺寸
    n: Optional[int] = 1  # 生成图片数量
    quality: Optional[str] = "standard"  # standard, hd
    style: Optional[str] = None  # vivid, natural
    response_format: Optional[str] = "url"  # url, b64_json
    seed: Optional[int] = None
    steps: Optional[int] = None
    cfg_scale: Optional[float] = None
    sampler: Optional[str] = None
    # 图像输入相关
    image: Optional[str] = None  # base64编码的图像
    image_url: Optional[str] = None  # 图像URL
    images: Optional[list[str]] = None  # 多图输入
    # 控制参数
    strength: Optional[float] = None  # 图像强度
    mask: Optional[str] = None  # 遮罩图像
    watermark: Optional[bool] = True  # 是否添加AI水印
    watermark: Optional[bool] = True  # 是否添加AI水印

class DoubaoAPIClient:
    """豆包API客户端"""
    
    def __init__(self, api_key: str, base_url: str = "https://ark.cn-beijing.volces.com/api/v3"):
        self.api_key = api_key
        # 确保base_url不以/结尾，避免重复路径
        self.base_url = base_url.rstrip('/')
        # 如果base_url已经包含完整路径，就直接使用
        if "/images/generations" in base_url:
            self.base_url = base_url.replace("/images/generations", "")
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def text_to_image(self, request: DoubaoImageRequest) -> dict[str, Any]:
        """文生图 - 纯文本输入单图输出"""
        endpoint = f"{self.base_url}/images/generations"
        
        payload = {
            "model": request.model,
            "prompt": request.prompt,
            "size": request.size,
            "n": request.n,
            "quality": request.quality,
            "response_format": request.response_format
        }
        
        # 添加可选参数
        if request.negative_prompt:
            payload["negative_prompt"] = request.negative_prompt
        if request.seed is not None:
            payload["seed"] = request.seed
        if request.steps is not None:
            payload["steps"] = request.steps
        if request.cfg_scale is not None:
            payload["cfg_scale"] = str(request.cfg_scale)
        if request.style:
            payload["style"] = request.style
        if request.watermark is not None:
            payload["watermark"] = request.watermark
        
        return await self._make_request(endpoint, payload)
    
    async def image_to_image(self, request: DoubaoImageRequest) -> dict[str, Any]:
        """图文生图 - 单图输入单图输出"""
        endpoint = f"{self.base_url}/images/generations"
        
        payload = {
            "model": request.model,
            "prompt": request.prompt,
            "size": request.size,
            "n": request.n,
            "response_format": request.response_format
        }
        
        # 添加图像输入
        if request.image:
            payload["image"] = request.image
        elif request.image_url:
            # 如果是URL，需要下载并转换为base64
            image_b64 = await self._url_to_base64(request.image_url)
            payload["image"] = image_b64
        
        # 添加可选参数
        if request.negative_prompt:
            payload["negative_prompt"] = request.negative_prompt
        if request.strength is not None:
            payload["strength"] = int(request.strength * 100)  # 转换为整数百分比
        if request.seed is not None:
            payload["seed"] = request.seed
        if request.watermark is not None:
            payload["watermark"] = request.watermark
        
        return await self._make_request(endpoint, payload)
    
    async def multi_image_fusion(self, request: DoubaoImageRequest) -> dict[str, Any]:
        """多图融合 - 多图输入单图输出"""
        endpoint = f"{self.base_url}/images/generations"
        
        payload = {
            "model": request.model,
            "prompt": request.prompt,
            "images": request.images or [],
            "size": request.size,
            "response_format": request.response_format
        }
        
        if request.negative_prompt:
            payload["negative_prompt"] = request.negative_prompt
        if request.seed is not None:
            payload["seed"] = request.seed
        if request.watermark is not None:
            payload["watermark"] = request.watermark
        
        return await self._make_request(endpoint, payload)
    
    async def batch_generation(self, request: DoubaoImageRequest) -> dict[str, Any]:
        """组图输出 - 多图输出"""
        endpoint = f"{self.base_url}/images/generations"
        
        # 设置更大的生成数量
        payload = {
            "model": request.model,
            "prompt": request.prompt,
            "size": request.size,
            "n": min(request.n or 4, 10),  # 限制最大数量
            "quality": request.quality,
            "response_format": request.response_format
        }
        
        if request.negative_prompt:
            payload["negative_prompt"] = request.negative_prompt
        if request.seed is not None:
            payload["seed"] = request.seed
        
        return await self._make_request(endpoint, payload)
    
    async def text_to_batch(self, request: DoubaoImageRequest) -> dict[str, Any]:
        """文生组图"""
        return await self.batch_generation(request)
    
    async def image_to_batch(self, request: DoubaoImageRequest) -> dict[str, Any]:
        """单张图生组图"""
        endpoint = f"{self.base_url}/images/generations"
        
        payload = {
            "model": request.model,
            "prompt": request.prompt,
            "size": request.size,
            "n": min(request.n or 4, 10),
            "response_format": request.response_format
        }
        
        # 添加图像输入
        if request.image:
            payload["image"] = request.image
        elif request.image_url:
            # 如果是URL，需要下载并转换为base64
            image_b64 = await self._url_to_base64(request.image_url)
            payload["image"] = image_b64
        
        # 添加可选参数
        if request.negative_prompt:
            payload["negative_prompt"] = request.negative_prompt
        if request.strength is not None:
            payload["strength"] = int(request.strength * 100)
        if request.seed is not None:
            payload["seed"] = request.seed
        if request.watermark is not None:
            payload["watermark"] = request.watermark
        
        return await self._make_request(endpoint, payload)
    
    async def multi_reference_batch(self, request: DoubaoImageRequest) -> dict[str, Any]:
        """多参考图生组图"""
        endpoint = f"{self.base_url}/images/generations"
        
        payload = {
            "model": request.model,
            "prompt": request.prompt,
            "images": request.images or [],
            "size": request.size,
            "n": min(request.n or 4, 10),
            "response_format": request.response_format
        }
        
        # 添加可选参数
        if request.negative_prompt:
            payload["negative_prompt"] = request.negative_prompt
        if request.seed is not None:
            payload["seed"] = request.seed
        if request.watermark is not None:
            payload["watermark"] = request.watermark
        
        return await self._make_request(endpoint, payload)
    
    async def stream_generation(self, request: DoubaoImageRequest):
        """流式输出"""
        endpoint = f"{self.base_url}/images/generations"
        
        payload = {
            "model": request.model,
            "prompt": request.prompt,
            "size": request.size,
            "n": request.n,
            "stream": True,
            "response_format": request.response_format
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", endpoint, json=payload, headers=self.headers) as response:
                if response.status_code == 200:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]  # 移除 "data: " 前缀
                            if data.strip() == "[DONE]":
                                break
                            try:
                                yield json.loads(data)
                            except json.JSONDecodeError:
                                continue
                else:
                    raise Exception(f"API调用失败: {response.status_code} - {response.text}")
    
    async def _make_request(self, endpoint: str, payload: dict[str, Any]) -> dict[str, Any]:
        """发送API请求"""
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(endpoint, json=payload, headers=self.headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"API调用失败: {response.status_code} - {response.text}")
    
    async def _url_to_base64(self, image_url: str) -> str:
        """将图片URL转换为base64"""
        async with httpx.AsyncClient() as client:
            response = await client.get(image_url)
            if response.status_code == 200:
                return base64.b64encode(response.content).decode('utf-8')
            else:
                raise Exception(f"无法下载图片: {image_url}")
    
    @staticmethod
    def get_supported_sizes() -> list[str]:
        """获取支持的图片尺寸 - 字节豆包要求至少921600像素"""
        return [
            "1024x1024",  # 1,048,576 像素
            "1152x896",   # 1,032,192 像素  
            "896x1152",   # 1,032,192 像素
            "1344x768",   # 1,032,192 像素
            "768x1344",   # 1,032,192 像素
            "1536x640",   # 983,040 像素
            "640x1536",   # 983,040 像素
            "1280x720",   # 921,600 像素 (最小)
            "720x1280",   # 921,600 像素 (最小)
            "1600x576",   # 921,600 像素
            "576x1600"    # 921,600 像素
        ]
    
    @staticmethod
    def get_supported_models() -> list[str]:
        """获取支持的模型"""
        return [
            "doubao-seedream-4-0-250828",
            "doubao-pro-32k-240515",
            "doubao-lite-4k-240515"
        ]

# 工具函数
def validate_image_size(size: str) -> bool:
    """验证图片尺寸格式 - 字节豆包要求至少921600像素"""
    try:
        width, height = map(int, size.split('x'))
        # 检查尺寸是否在支持列表中
        supported_sizes = DoubaoAPIClient.get_supported_sizes()
        if size in supported_sizes:
            return True
        # 检查像素数是否满足最小要求
        return width * height >= 921600 and width <= 2048 and height <= 2048
    except:
        return False

def calculate_aspect_ratio(width: int, height: int) -> str:
    """计算宽高比"""
    from math import gcd
    g = gcd(width, height)
    return f"{width//g}:{height//g}"

def resize_image_for_api(image_data: bytes, max_size: int = 1024) -> str:
    """调整图片大小并转换为base64"""
    image = Image.open(io.BytesIO(image_data))
    
    # 保持宽高比调整大小
    image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    
    # 转换为RGB（如果是RGBA）
    if image.mode in ('RGBA', 'LA'):
        background = Image.new('RGB', image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
        image = background
    
    # 转换为base64
    buffer = io.BytesIO()
    image.save(buffer, format='JPEG', quality=85)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')