# 1. Base Image
FROM node:20-slim

# 2. Set working directory
WORKDIR /app

# 3. Copy package.json and lock file
COPY package*.json ./

# 4. Install all dependencies
RUN npm install

# 5. Copy all source code
COPY . .

# 6. Build the application (Next.js only for this container)
# This will use a specific "build:next" script from package.json
RUN npm run build:next

# 7. Expose the port Next.js runs on
EXPOSE 3000

# 8. Command to run the application
# This will use the "start" script from package.json
CMD ["npm", "start"]
