FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for optimal Docker layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
