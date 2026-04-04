# syntax=docker/dockerfile:1
# Combined Nginx + Frontend Dockerfile
# Stage 1: Build Angular
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm i

# Copy source code
COPY frontend/ .

# Build for production
RUN npm run build:prod

# Stage 2: Nginx with Angular assets
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built Angular assets from builder stage
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
