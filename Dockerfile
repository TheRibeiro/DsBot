# Dockerfile otimizado para Railway com suporte a @napi-rs/canvas
FROM node:18-slim

# Instalar dependências do sistema para canvas e fontes
RUN apt-get update && apt-get install -y \
    fonts-dejavu-core \
    fonts-liberation \
    fontconfig \
    && fc-cache -fv \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Expor porta (se necessário)
EXPOSE 3000

# Comando de inicialização
CMD ["npm", "start"]
