# ============================================================
# React Frontend Dockerfile
# ============================================================

# Stage 1: Build the Vite application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for caching
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000
EXPOSE 3000

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
