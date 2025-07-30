# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Vite app for production
RUN npm run build

# Stage 2: Serve the application
FROM node:20-alpine

# Install serve to run the production build
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]