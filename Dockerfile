# 1. Base Image
FROM node:20-slim

# 2. Set working directory
WORKDIR /app

# 3. Copy package.json and package-lock.json
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the application source code
COPY . .

# 6. Build the application (Next.js and Genkit)
# This will use the "build" script from package.json
RUN npm run build

# 7. Expose the port Next.js runs on
EXPOSE 3000

# The CMD will be provided by the docker-compose.yml
