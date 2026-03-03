# ============================================
# 1️⃣ Build Stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer caching)
COPY ui-portal/document-iq-platform-ui/package*.json ./

RUN npm install

# Copy full source
COPY ui-portal/document-iq-platform-ui .

# Build production bundle
RUN npm run build


# ============================================
# 2️⃣ Production Stage (Nginx)
# ============================================
FROM nginx:alpine

# Remove default nginx static config
RUN rm -rf /usr/share/nginx/html/*

# Copy build output
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]