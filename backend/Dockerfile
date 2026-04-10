# ========================================
# Dockerfile — API de Pagamentos
# Deploy no Google Cloud Run
# ========================================

# Usa imagem Node.js LTS slim (menor e mais segura)
FROM node:20-slim

# Cria diretório de trabalho
WORKDIR /app

# Copia apenas package.json primeiro (aproveita cache do Docker)
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm ci --omit=dev

# Copia o código fonte
COPY src/ ./src/

# Cloud Run injeta a porta na variável PORT
ENV PORT=8080
ENV NODE_ENV=production

# Expõe a porta (informativo)
EXPOSE 8080

# Comando para iniciar
CMD ["node", "src/app.js"]
