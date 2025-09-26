"""
阿里Qwen API客户端
支持阿里通义万象图像生成API
"""

import base64
import mimetypes
import os
from typing import Optional, List, Dict, Any
from http import HTTPStatus
from dashscope import ImageSynthesis
from pydantic import BaseModel

class QwenImageRequest(BaseModel):
    """Qwen图像生成请求模型"""
    model: str = "wanx-v1"  # 默认使用wanx-v1模型
    prompt: str
    negative_prompt: Optional[str] = None
    n: int = 1  # 生成图片数量
    size: str = "1024*1024"  # 图片尺寸
    style: Optional[str] = None  # 图片风格
    seed: Optional[int] = None  # 随机种子
    ref_image_url: Optional[str] = None  # 参考图片URL

class QwenAPIClient:
    """阿里Qwen API客户端"""
    
    def __init__(self, api_key: str, base_url: Optional[str] = None):
        """
        初始化Qwen API客户端
        
        Args:
            api_key: 阿里云API密钥
            base_url: API基础URL（可选）
        """
        self.api_key = api_key
        # 设置API密钥
        import dashscope
        dashscope.api_key = api_key
        
        # 支持的模型列表
        self.supported_models = [
            "wanx-v1",
            "wanx2.1-imageedit",
            "qwen-image"
        ]
        
        # 支持的尺寸列表
        self.supported_sizes = [
            "512*512",
            "720*1280",
            "1024*1024",
            "1280*720",
            "1280*1920",
            "1920*1280"
        ]
    
    @staticmethod
    def get_supported_models() -> List[str]:
        """获取支持的模型列表"""
        return [
            "wanx-v1",
            "wanx2.1-imageedit",
            "qwen-image"
        ]
    
    @staticmethod
    def get_supported_sizes() -> List[str]:
        """获取支持的尺寸列表"""
        return [
            "512*512",
            "720*1280",
            "1024*1024",
            "1280*720",
            "1280*1920",
            "1920*1280"
        ]
    
    def _make_request(self, request: QwenImageRequest) -> Dict[str, Any]:
        """
        发送图像生成请求
        
        Args:
            request: Qwen图像生成请求对象
            
        Returns:
            API响应结果
        """
        try:
            # 构建请求参数
            kwargs = {
                "model": request.model,
                "prompt": request.prompt,
                "n": request.n,
                "size": request.size
            }
            
            # 添加可选参数
            if request.negative_prompt:
                kwargs["negative_prompt"] = request.negative_prompt
            
            if request.style:
                kwargs["style"] = request.style
                
            if request.seed is not None:
                kwargs["seed"] = request.seed
                
            if request.ref_image_url:
                kwargs["ref_image_url"] = request.ref_image_url
            
            # 发送请求
            response = ImageSynthesis.call(**kwargs)
            
            return {
                "status_code": response.status_code,
                "output": response.output if hasattr(response, 'output') else None,
                "usage": response.usage if hasattr(response, 'usage') else None,
                "request_id": response.request_id if hasattr(response, 'request_id') else None,
                "code": response.code if hasattr(response, 'code') else None,
                "message": response.message if hasattr(response, 'message') else None
            }
            
        except Exception as e:
            return {
                "status_code": 500,
                "error": str(e),
                "message": f"请求发送失败: {str(e)}"
            }
    
    def text_to_image(self, request: QwenImageRequest) -> List[str]:
        """
        文本生成图像
        
        Args:
            request: Qwen图像生成请求对象
            
        Returns:
            生成的图像URL列表
        """
        response = self._make_request(request)
        
        if response["status_code"] == HTTPStatus.OK:
            # 提取图像URL
            urls = []
            if response.get("output") and hasattr(response["output"], "results"):
                for result in response["output"].results:
                    if hasattr(result, "url"):
                        urls.append(result.url)
            return urls
        else:
            raise Exception(f"图像生成失败: {response.get('message', '未知错误')}")
    
    def image_to_image(self, request: QwenImageRequest, input_image_path: str) -> List[str]:
        """
        图像生成图像（图像编辑）
        
        Args:
            request: Qwen图像生成请求对象
            input_image_path: 输入图像路径
            
        Returns:
            生成的图像URL列表
        """
        # 将本地图片转换为base64格式
        ref_image_url = self._encode_file(input_image_path)
        request.ref_image_url = ref_image_url
        
        # 使用wanx2.1-imageedit模型进行图像编辑
        request.model = "wanx2.1-imageedit"
        
        response = self._make_request(request)
        
        if response["status_code"] == HTTPStatus.OK:
            # 提取图像URL
            urls = []
            if response.get("output") and hasattr(response["output"], "results"):
                for result in response["output"].results:
                    if hasattr(result, "url"):
                        urls.append(result.url)
            return urls
        else:
            raise Exception(f"图像编辑失败: {response.get('message', '未知错误')}")
    
    def _encode_file(self, file_path: str) -> str:
        """
        将本地文件编码为base64格式
        
        Args:
            file_path: 文件路径
            
        Returns:
            base64编码的文件数据URL
        """
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type or not mime_type.startswith("image/"):
            raise ValueError("不支持或无法识别的图像格式")
        
        with open(file_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
        return f"data:{mime_type};base64,{encoded_string}"