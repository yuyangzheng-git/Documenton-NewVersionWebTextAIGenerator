# Multi-stage build for AI Document Generator
# 使用国内镜像源加速构建

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# 使用阿里云镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# Install system dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# 配置 npm 使用淘宝镜像
RUN npm config set registry https://registry.npmmirror.com

# 升级 npm 到最新版本（支持 lockfileVersion 3）
RUN npm install -g npm@latest

# Copy package files
COPY package.json ./
COPY package-lock.json ./

# Install dependencies (使用 install 而不是 ci，更宽容)
RUN npm install --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Set Dify configuration (embedded at build time)
ENV NEXT_PUBLIC_DIFY_BASE_URL=http://your-server-ip/v1
ENV NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-YOUR_OUTLINE_KEY_HERE
ENV NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-YOUR_CHAPTER_KEY_HERE
ENV NEXT_PUBLIC_DIFY_LLM_KEY=app-YOUR_LLM_KEY_HERE

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# 使用阿里云镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# Install Pandoc, Python3, and Redis (redis-cli 包含在 redis 包中)
RUN apk add --no-cache pandoc python3 redis

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Python CLI for Pandoc export
COPY --from=builder /app/cli.py ./cli.py

# Create directories for user uploads and templates
RUN mkdir -p /app/store/templates && chown -R nextjs:nodejs /app/store

# Set ownership to nextjs user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
