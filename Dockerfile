# ----------------------------
# Stage 1: Build Frontend
# ----------------------------
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Build the Vue app
COPY frontend ./
RUN npm run build


# ----------------------------
# Stage 2: Final Image (Backend + Caddy)
# ----------------------------
FROM node:20-alpine

# Install Caddy (using Alpine package manager)
RUN apk add --no-cache caddy

# Set up working directory
WORKDIR /app

# --- Setup Backend ---
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci

# Copy backend source code
COPY backend ./

# Generate Prisma Client (Required for Prisma to work)
RUN npx prisma generate

# --- Setup Frontend ---
# Copy built assets from Stage 1 to a folder Caddy can serve
COPY --from=frontend-build /app/frontend/dist /var/www/html

# --- Setup Configs ---
WORKDIR /app
COPY Caddyfile /etc/caddy/Caddyfile
COPY entrypoint.sh ./

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Expose Caddy's port
EXPOSE 80

ENV PORT=3000

# Define volume for SQLite persistence (Optional but recommended)
VOLUME ["/app/backend/prisma"]

# Start the application
CMD ["./entrypoint.sh"]