# Quick Start Guide - Separated Docker + Python Setup

## 🎯 Overview

This setup separates Docker (for Node.js + Redis) and Python (using `uv` for package management).

## 📋 Prerequisites

- Docker & Docker Compose
- `uv` (will be installed automatically if missing)
- Pandoc installed on host system

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Setup Python Environment (First!)

```bash
# Run the automated setup script
./setup-python-uv.sh
```

This will:
- ✅ Install `uv` if not present
- ✅ Check for Pandoc
- ✅ Create Python virtual environment
- ✅ Install pypandoc and dependencies

### Step 2: Start Docker Containers

```bash
# Start Redis and optional monitoring
docker-compose -f docker-compose.separated.yml up -d redis redis-commander

# Verify Redis is running
docker exec ai-doc-redis redis-cli ping
# Should return: PONG
```

### Step 3: Configure and Start Application

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your AI API keys
nano .env.local

# Build and start the app
docker-compose -f docker-compose.separated.yml build app
docker-compose -f docker-compose.separated.yml up -d app
```

---

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Application** | http://localhost:3001 | Main document generator |
| **Redis Commander** | http://localhost:8081 | Redis monitoring (optional) |
| **Redis** | localhost:6379 | Redis cache (internal) |

---

## 🔧 Manual Setup

If you prefer manual setup:

### 1. Install uv

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Install Pandoc

```bash
# macOS
brew install pandoc

# Ubuntu/Debian
sudo apt-get install pandoc

# CentOS/RHEL
sudo yum install pandoc
```

### 3. Create Python Environment

```bash
# Create virtual environment
uv venv .venv

# Activate it
source .venv/bin/activate

# Install dependencies
uv pip install -e .
```

### 4. Start Services

```bash
# Start Redis first
docker-compose -f docker-compose.separated.yml up -d redis

# Then start the app
docker-compose -f docker-compose.separated.yml up -d app
```

---

## 📝 Environment Variables (.env.local)

Required configuration:

```env
# AI Platform Selection
AI_PLATFORM=dify  # Options: dify | openai | claude | gemini | etc.

# Dify Configuration
NEXT_PUBLIC_DIFY_OUTLINE_API_KEY=app-your-outline-key
NEXT_PUBLIC_DIFY_CHAPTER_API_KEY=app-your-chapter-key
NEXT_PUBLIC_DIFY_CHAT_API_KEY=app-your-chat-key

# OpenAI (if using OpenAI instead)
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4-turbo

# Redis (already configured, no changes needed)
REDIS_URL=redis://redis:6379
CACHE_ENABLED=1
```

---

## 🧪 Testing the Setup

### Test Python Environment

```bash
# Activate virtual environment
source .venv/bin/activate

# Test pypandoc
python -c "import pypandoc; print('pypandoc OK')"

# Test CLI
python cli.py --help
```

### Test Redis Connection

```bash
docker exec ai-doc-redis redis-cli ping
# Should return: PONG

# Check Redis info
docker exec ai-doc-redis redis-cli INFO | grep version
```

### Test Application

1. Open http://localhost:3001
2. Enter a document topic
3. Generate outline
4. Generate content
5. Export to Word (tests Python integration)

---

## 🐛 Troubleshooting

### Issue: uv command not found

```bash
# Install uv manually
curl -LsSf https://astral.sh/uv/install.sh | sh

# Add to PATH
export PATH="$HOME/.cargo/bin:$PATH"
```

### Issue: Pandoc not found

```bash
# Check if installed
which pandoc

# Install if missing (macOS)
brew install pandoc

# Or use Docker's pandoc
docker exec ai-document-generator pandoc --version
```

### Issue: Redis connection failed

```bash
# Check Redis status
docker-compose -f docker-compose.separated.yml ps

# Restart Redis
docker-compose -f docker-compose.separated.yml restart redis

# Check logs
docker-compose -f docker-compose.separated.yml logs redis
```

### Issue: Port 3001 already in use

Edit `docker-compose.separated.yml`:

```yaml
app:
  ports:
    - "3002:3000"  # Change port here
```

### Issue: Python module not found

```bash
# Ensure virtual environment is activated
source .venv/bin/activate

# Reinstall dependencies
uv pip install -e .

# Verify installation
uv pip list
```

---

## 📦 What Files Were Created

```
Documenton-NewVersionWebTextAIGenerator/
├── Dockerfile.node-only           # Docker without Python deps
├── docker-compose.separated.yml   # Separated service config
├── pyproject.toml                 # Python project config for uv
├── setup-python-uv.sh            # Automated Python setup script
├── SETUP_GUIDE.md                 # Detailed setup guide
└── QUICKSTART_SEPARATED.md        # This file
```

---

## 🔄 Updating

### Update Python Dependencies

```bash
source .venv/bin/activate
uv pip install --upgrade pypandoc
```

### Update Docker Containers

```bash
docker-compose -f docker-compose.separated.yml pull
docker-compose -f docker-compose.separated.yml up -d --build
```

### Update Application Code

```bash
git pull
npm install
docker-compose -f docker-compose.separated.yml up -d --build
```

---

## 🛑 Stopping Services

```bash
# Stop all services
docker-compose -f docker-compose.separated.yml down

# Stop and remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.separated.yml down -v
```

---

## 📚 Additional Resources

- **Full Setup Guide**: See `SETUP_GUIDE.md` for detailed documentation
- **Original README**: See `README.md` for project features
- **Docker Documentation**: https://docs.docker.com/
- **uv Documentation**: https://github.com/astral-sh/uv

---

## ✅ Success Checklist

- [ ] uv installed and working
- [ ] Pandoc installed and accessible
- [ ] Python virtual environment created
- [ ] pypandoc installed successfully
- [ ] Redis container running
- [ ] Application container running
- [ ] Can access http://localhost:3001
- [ ] Can generate document outline
- [ ] Can export to Word format

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.
