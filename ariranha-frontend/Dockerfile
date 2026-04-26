# ==========================================
# ESTÁGIO 1: BUILD (Ambiente Node)
# ==========================================
FROM node:22-alpine AS build

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependência e instala (aproveitando o cache do Docker)
COPY package*.json ./
RUN npm install

# Copia o resto do código da aplicação
COPY . .

# Roda o comando do Vite para gerar os arquivos estáticos na pasta /dist
RUN npm run build

# ==========================================
# ESTÁGIO 2: PRODUÇÃO (Servidor Nginx)
# ==========================================
FROM nginx:alpine

# Copia a configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia OS ARQUIVOS COMPILADOS do estágio anterior para a pasta pública do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expõe a porta 80 (padrão web)
EXPOSE 80

# Inicia o servidor em primeiro plano
CMD ["nginx", "-g", "daemon off;"]