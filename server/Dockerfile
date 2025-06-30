FROM node:20-alpine


WORKDIR /usr/src/app/server

ENV NODE_ENV production

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the source files into the image
COPY . .

# Build the application
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]