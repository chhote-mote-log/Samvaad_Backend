# Use Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build TypeScript -> JavaScript in dist/
RUN npm run build

# Expose port
EXPOSE 4005

# Start app
CMD ["node", "dist/index.js"]
