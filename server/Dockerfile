FROM node:20-alpine


WORKDIR /usr/src/app/server

ENV NODE_ENV=production

# Install dependencies (including dev dependencies for build)
COPY package*.json ./
RUN npm ci --include=dev

# Copy the rest of the source files into the image
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --omit=dev

EXPOSE 3000

CMD ["npm", "start"]