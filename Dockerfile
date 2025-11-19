# Use an official Node.js image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for better caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy the rest of the app files
COPY . .

# Set the port your app will use
ENV PORT=3000

# Expose that port from the container
EXPOSE 3000

# Command to start your app
CMD ["npm", "start"]
