# Use official Node.js LTS image

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application source code
COPY . .

# Hugging Face requires service on port 7860
ENV PORT=7860
EXPOSE 7860

# Start Express server
CMD ["npm", "start"]