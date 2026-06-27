# Use the official Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies (including devDependencies needed for build)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the application (React frontend + Express backend CJS bundle)
RUN npm run build

# Expose port (Hugging Face Spaces expects 7860 by default)
ENV PORT=7860
EXPOSE 7860

# Start the application
CMD ["npm", "start"]
