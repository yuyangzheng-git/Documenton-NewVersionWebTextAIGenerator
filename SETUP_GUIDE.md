# Separated Docker + Python Setup Guide

This guide shows how to deploy the application with Docker for Node.js and `uv` for Python package management.

## Prerequisites

- Docker & Docker Compose installed
- `uv` Python package manager installed on host

## Step 1: Install Docker Part First

### 1.1 Build and Start Docker Containers

```bash
# Use the separated docker-compose configuration
docker-compose -f docker-compose.separated.yml up -d redis redis-commander

# Verify Redis is running
docker-compose -f docker-compose.separated.yml ps
```

This will start:
- Redis on port 6379
- Redis Commander on port 8081 (optional, for monitoring)

### 1.2 Verify Redis Connection

```bash
# Test Redis connection
docker exec ai-doc-redis redis-cli ping
# Should return: PONG
```

## Step 2: Configure Python Part with uv

### 2.1 Install uv (if not already installed)

```bash
# On macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or using pip
pip install uv
```

### 2.2 Create Python Virtual Environment with uv

```bash
# Navigate to project directory
cd /path/to/Documenton-NewVersionWebTextAIGenerator

# Create virtual environment using uv
uv venv .venv

# Activate the virtual environment
# On Linux/macOS:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate
```

### 2.3 Install Python Dependencies with uv

```bash
# Install from pyproject.toml (recommended)
uv pip install -e .

# Or install from requirements.txt
uv pip install -r requirements.txt

# Verify installation
python -c "import pypandoc; print('pypandoc installed successfully')"
```

### 2.4 Verify Pandoc Access

```bash
# Check if pandoc is accessible
which pandoc
pandoc --version
```

## Step 3: Build and Start the Node.js Application

### 3.1 Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your settings
nano .env.local
```

Required variables:
```env
# AI Platform
AI_PLATFORM=dify  # or openai, claude, etc.

# Platform-specific API keys
NEXT_PUBLIC_DIFY_OUTLINE_API_KEY=your-key
NEXT_PUBLIC_DIFY_CHAPTER_API_KEY=your-key
NEXT_PUBLIC_DIFY_CHAT_API_KEY=your-key

# Redis (already configured)
REDIS_URL=redis://localhost:6379
CACHE_ENABLED=1
```

### 3.2 Build and Start the Application

```bash
# Build the Docker image
docker-compose -f docker-compose.separated.yml build app

# Start the application
docker-compose -f docker-compose.separated.yml up -d app

# Check logs
docker-compose -f docker-compose.separated.yml logs -f app
```

### 3.3 Access the Application

Open your browser and navigate to:
- **Application**: http://localhost:3001
- **Redis Commander**: http://localhost:8081

## Step 4: Verify the Setup

### 4.1 Test Python Integration

```bash
# Test the CLI directly with your uv environment
source .venv/bin/activate
python cli.py --help
```

### 4.2 Test Document Export

1. Open the application at http://localhost:3001
2. Create a document
3. Try exporting to Word format
4. Check if the export works correctly

## Alternative: Run Without Docker

If you prefer to run everything locally without Docker:

### Install Node.js Dependencies

```bash
npm install
```

### Install System Dependencies

```bash
# macOS
brew install pandoc

# Ubuntu/Debian
sudo apt-get install pandoc

# CentOS/RHEL
sudo yum install pandoc
```

### Setup Python with uv

```bash
uv venv .venv
source .venv/bin/activate
uv pip install -e .
```

### Start Development Server

```bash
npm run dev
```

Application will be available at http://localhost:3000

## Troubleshooting

### Issue: Python not found in container

**Solution**: Make sure the Python virtual environment volume is correctly mounted:

```bash
# Check volume mounting
docker volume ls | grep python

# Inspect the volume
docker volume inspect documenton-newversionwebtextaigenerator_python-venv
```

### Issue: Pandoc command not found

**Solution**:
1. Install Pandoc on host system
2. Or use it from the Docker container (already installed)

### Issue: Redis connection failed

**Solution**:
```bash
# Restart Redis
docker-compose -f docker-compose.separated.yml restart redis

# Check Redis logs
docker-compose -f docker-compose.separated.yml logs redis
```

### Issue: Port already in use

**Solution**: Change ports in `docker-compose.separated.yml`:

```yaml
services:
  app:
    ports:
      - "3002:3000"  # Change 3001 to another port
```

## Production Deployment

### 1. Use Environment-Specific Configs

```bash
# Create production environment file
cp .env.local .env.production

# Edit production settings
nano .env.production
```

### 2. Build for Production

```bash
# Build with production environment
docker-compose -f docker-compose.separated.yml build --no-cache

# Start in production mode
docker-compose -f docker-compose.separated.yml up -d
```

### 3. Setup Monitoring

```bash
# View container stats
docker stats ai-document-generator ai-doc-redis

# Setup health checks
watch -n 5 'docker-compose -f docker-compose.separated.yml ps'
```

### 4. Backup Strategy

```bash
# Backup Redis data
docker run --rm -v documenton-newversionwebtextaigenerator_redis-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/redis-backup-$(date +%Y%m%d).tar.gz -C /data .

# Backup application data
tar czf store-backup-$(date +%Y%m%d).tar.gz store/
```

## Maintenance Commands

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.separated.yml up -d --build
```

### Update Python Dependencies

```bash
source .venv/bin/activate
uv pip install --upgrade pypandoc
```

### Clean Up

```bash
# Stop all services
docker-compose -f docker-compose.separated.yml down

# Remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.separated.yml down -v

# Clean up Docker images
docker image prune -a
```

## Performance Optimization

### 1. Redis Memory Tuning

Edit `docker-compose.separated.yml`:

```yaml
redis:
  command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### 2. Node.js Memory Limits

```yaml
app:
  environment:
    - NODE_OPTIONS=--max-old-space-size=2048
```

### 3. Enable Gzip Compression

Add to `next.config.ts`:

```typescript
module.exports = {
  compress: true,
}
```

## Security Recommendations

1. **Don't expose Redis to public internet** - Keep port 6379 internal
2. **Use environment variables** - Never commit `.env.local` to git
3. **Regular updates** - Keep Docker images and Python packages updated
4. **Enable HTTPS** - Use reverse proxy (Nginx/Caddy) in production
5. **Rate limiting** - Implement API rate limits for AI endpoints

## Support

If you encounter issues:
1. Check logs: `docker-compose -f docker-compose.separated.yml logs -f`
2. Verify environment variables are set correctly
3. Ensure Python virtual environment is activated
4. Check Redis connection: `redis-cli ping`
5. Review system resources: `docker stats`

For more help, open an issue on GitHub.
