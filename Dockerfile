FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && npm ci --only=production
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "src/index.js"]
