# Dockerfile otimizado para Railway com suporte a Puppeteer + Chrome
FROM node:18-slim

# Instalar dependências para Puppeteer e Chrome
RUN apt-get update && apt-get install -y \
    # Puppeteer dependencies
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    # Fontes
    fonts-dejavu-core \
    fonts-noto-color-emoji \
    fontconfig \
    && fc-cache -fv \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências (incluindo Puppeteer)
RUN npm ci --only=production

# Baixar Chromium para Puppeteer (se não foi baixado automaticamente)
RUN npx puppeteer browsers install chrome

# Copiar código fonte
COPY . .

# Criar variável de ambiente para Puppeteer usar Chrome instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/root/.cache/puppeteer/chrome/linux-*/chrome-linux*/chrome

# Expor porta (se necessário)
EXPOSE 3000

# Comando de inicialização
CMD ["npm", "start"]
