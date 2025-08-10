# Stage 1: Build the TypeScript code
FROM node:20-alpine AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ .
RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine
WORKDIR /usr/src/app
COPY server/package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist

# Copy seed directory from root context
COPY seed /usr/src/seed

# Expose the port the app runs on
EXPOSE 3000

# Run the app
CMD [ "node", "dist/index.js" ]