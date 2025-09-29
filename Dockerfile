# Dockerfile

# 1. Dependências (instalação de pacotes)
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# 2. Builder (compilação da aplicação)
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Usa o script específico de build do Next.js
RUN npm run build:next

# 3. Production image (imagem final e otimizada)
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copia os artefatos de build da fase 'builder'
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expõe a porta e inicia a aplicação
EXPOSE 3000
CMD ["npm", "start"]
