FROM node:18-alpine

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy prisma folder (contains schema.prisma)
COPY prisma ./prisma

COPY tsconfig.json ./

# Copy source code and generated folder before generating Prisma client
COPY src ./src
COPY generated ./generated
COPY .env .env

# Generate Prisma client (will output to generated/prisma)
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

EXPOSE 4000

CMD ["node", "dist/index.js"]
