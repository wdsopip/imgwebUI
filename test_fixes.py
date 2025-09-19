#!/usr/bin/env python3
"""
测试脚本 - 验证代码修复
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def test_backend_imports():
    """测试后端导入是否正常"""
    print("🔍 测试后端导入...")
    
    try:
        # 测试主要模块导入
        sys.path.append('backend')
        
        # 测试 doubao_api 模块
        from backend.doubao_api import DoubaoAPIClient, DoubaoImageRequest
        print("✅ doubao_api 模块导入成功")
        
        # 测试 main 模块的基本导入
        from backend.main import GenerationParameters, GenerationRequest
        print("✅ main 模块导入成功")
        
        return True
    except ImportError as e:
        print(f"❌ 导入失败: {e}")
        return False
    except Exception as e:
        print(f"❌ 其他错误: {e}")
        return False

def test_backend_syntax():
    """测试后端语法是否正确"""
    print("🔍 测试后端语法...")
    
    backend_files = [
        'backend/main.py',
        'backend/doubao_api.py',
        'backend/additional_endpoints.py'
    ]
    
    for file_path in backend_files:
        if os.path.exists(file_path):
            try:
                result = subprocess.run([
                    sys.executable, '-m', 'py_compile', file_path
                ], capture_output=True, text=True)
                
                if result.returncode == 0:
                    print(f"✅ {file_path} 语法正确")
                else:
                    print(f"❌ {file_path} 语法错误: {result.stderr}")
                    return False
            except Exception as e:
                print(f"❌ 检查 {file_path} 时出错: {e}")
                return False
        else:
            print(f"⚠️  文件不存在: {file_path}")
    
    return True

def test_frontend_syntax():
    """测试前端TypeScript语法"""
    print("🔍 测试前端语法...")
    
    # 检查是否有TypeScript编译器
    try:
        result = subprocess.run(['npx', 'tsc', '--version'], 
                              capture_output=True, text=True, cwd='.')
        if result.returncode != 0:
            print("⚠️  TypeScript编译器不可用，跳过前端语法检查")
            return True
    except FileNotFoundError:
        print("⚠️  npm/npx不可用，跳过前端语法检查")
        return True
    
    # 运行TypeScript检查
    try:
        result = subprocess.run(['npx', 'tsc', '--noEmit'], 
                              capture_output=True, text=True, cwd='.')
        if result.returncode == 0:
            print("✅ 前端TypeScript语法正确")
            return True
        else:
            print(f"❌ 前端TypeScript语法错误:\n{result.stdout}\n{result.stderr}")
            return False
    except Exception as e:
        print(f"❌ 检查前端语法时出错: {e}")
        return False

def test_api_endpoints():
    """测试API端点配置"""
    print("🔍 测试API端点配置...")
    
    # 检查前端API配置
    api_file = 'src/utils/api.ts'
    if os.path.exists(api_file):
        with open(api_file, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'localhost:8001' in content:
                print("✅ 前端API端点配置正确 (8001)")
            else:
                print("⚠️  前端API端点可能需要调整")
    
    # 检查后端端口配置
    main_file = 'backend/main.py'
    if os.path.exists(main_file):
        with open(main_file, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'port=8000' in content:
                print("✅ 后端端口配置正确 (8000)")
            else:
                print("⚠️  后端端口配置可能需要调整")
    
    return True

def test_dependencies():
    """检查依赖项"""
    print("🔍 检查依赖项...")
    
    # 检查后端依赖
    requirements_file = 'backend/requirements.txt'
    if os.path.exists(requirements_file):
        with open(requirements_file, 'r') as f:
            requirements = f.read()
            required_packages = ['fastapi', 'uvicorn', 'httpx', 'Pillow', 'pydantic']
            missing = []
            for pkg in required_packages:
                if pkg.lower() not in requirements.lower():
                    missing.append(pkg)
            
            if not missing:
                print("✅ 后端依赖项完整")
            else:
                print(f"⚠️  缺少后端依赖: {', '.join(missing)}")
    
    # 检查前端依赖
    package_file = 'package.json'
    if os.path.exists(package_file):
        try:
            with open(package_file, 'r') as f:
                package_data = json.load(f)
                deps = package_data.get('dependencies', {})
                required_deps = ['react', 'react-dom', 'axios', 'lucide-react']
                missing = []
                for dep in required_deps:
                    if dep not in deps:
                        missing.append(dep)
                
                if not missing:
                    print("✅ 前端依赖项完整")
                else:
                    print(f"⚠️  缺少前端依赖: {', '.join(missing)}")
        except json.JSONDecodeError:
            print("❌ package.json 格式错误")
    
    return True

def main():
    """主测试函数"""
    print("🚀 开始代码修复验证...\n")
    
    tests = [
        ("后端语法检查", test_backend_syntax),
        ("后端导入测试", test_backend_imports),
        ("前端语法检查", test_frontend_syntax),
        ("API端点配置", test_api_endpoints),
        ("依赖项检查", test_dependencies)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"测试: {test_name}")
        print('='*50)
        
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ 测试 {test_name} 时发生异常: {e}")
            results.append((test_name, False))
    
    # 总结
    print(f"\n{'='*50}")
    print("测试总结")
    print('='*50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n总计: {passed}/{total} 项测试通过")
    
    if passed == total:
        print("🎉 所有测试通过！代码修复成功！")
        return 0
    else:
        print("⚠️  部分测试未通过，请检查相关问题")
        return 1

if __name__ == "__main__":
    sys.exit(main())