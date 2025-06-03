# Use official Node.js base image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy source files
COPY . .

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
