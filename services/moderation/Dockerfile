# Step 1: Base image
FROM node:18-alpine


# Step 2: Set working directory
WORKDIR /app

# Step 3: Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Step 4: Copy source code
COPY . .

# Step 5: Build TypeScript code
RUN npm run build

# Step 6: Run production server
CMD ["node", "dist/index.js"]
