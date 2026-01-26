FROM python:3.11-slim

# 安装 Pandoc (必需，因为 pypandoc 需要调用 Pandoc 二进制文件)
RUN apt-get update && apt-get install -y \
    pandoc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制依赖文件并安装
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口（如果需要）
EXPOSE 8000

# 启动命令
CMD ["python", "main.py"]
