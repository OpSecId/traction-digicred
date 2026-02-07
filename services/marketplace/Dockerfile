FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package-lock.json frontend/

# Install all dependencies (including dev for build)
RUN npm ci
RUN cd frontend && npm ci

# Copy source and config
COPY . .

# Embed demo config and build frontend
RUN node scripts/embed-demo.js && cd frontend && npm run build

# Compile backend
RUN npx tsc

# Runtime stage
FROM node:22-alpine
WORKDIR /usr/src/app

# Copy package files and install production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built backend and frontend from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/frontend/dist ./frontend/dist

# Copy config (used at runtime)
COPY config ./config

# Expose marketplace server port
EXPOSE 5174

# Health check - verify server responds
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -q -O - http://localhost:5174/api/config/demo > /dev/null || exit 1

# Run the Express server (serves API + static frontend from frontend/dist)
CMD ["node", "dist/server.js"]
