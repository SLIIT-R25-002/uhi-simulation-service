# Use Node.js 18 LTS as base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for MATLAB Runtime
# Note: This is a basic setup. For full MATLAB support, you may need MATLAB Runtime
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install Node.js dependencies
# Use npm install to handle package-lock.json sync issues
RUN npm install

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads results

# Expose port
EXPOSE 4200

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:4200/health || exit 1

# Run the application
CMD ["npm", "start"]
