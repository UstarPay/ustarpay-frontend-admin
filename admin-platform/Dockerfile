FROM node:20-alpine AS builder

# 启用 corepack 支持 pnpm
RUN corepack enable

WORKDIR /app

# 1. 拷贝共享目录 (保持同级结构)
COPY shared /app/shared

# 2. 拷贝 admin-platform 依赖并安装
WORKDIR /app/admin-platform
COPY admin-platform/package.json ./
COPY admin-platform/pnpm-lock.yam* ./

RUN pnpm install

# 3. 拷贝 admin-platform 源码并构建
COPY admin-platform/ .
RUN pnpm run build

# 生产环境使用 Nginx 托管静态文件
FROM nginx:alpine
ENV TZ=Asia/Shanghai

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
