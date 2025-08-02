# Usa a imagem oficial do Node.js
FROM node:18-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências globais necessárias para build
RUN npm install -g @nestjs/cli

# Instala TODAS as dependências (dev incluído para build)
RUN npm ci

# Copia o código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Remove dependências de desenvolvimento depois do build
RUN npm prune --production

# Expõe a porta
EXPOSE 3000

# Define variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar a aplicação
CMD ["npm", "run", "start:prod"]
