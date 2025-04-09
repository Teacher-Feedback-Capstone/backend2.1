# Dockerfile.app
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package.json + package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the entire codebase into the container
COPY . .

# If your Express server uses port 3000 (typical):
EXPOSE 3000

# Command to run the server
CMD ["node", "src/app.js"]
