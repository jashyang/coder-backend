#!/usr/bin/env bash
set -euo pipefail

# 在目标服务器上执行：拉取最新镜像并部署
# 用法: bash scripts/deploy.sh

NAMESPACE="coder-hub"
DEPLOY_DIR="$HOME/coder"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.yml"

echo "=== Pull latest images ==="
docker pull "$NAMESPACE/coder-backend:latest"
docker pull "$NAMESPACE/coder-frontend:latest"

echo "=== Ensure deploy dir ==="
mkdir -p "$DEPLOY_DIR"

echo "=== Write docker-compose.yml ==="
cat > "$COMPOSE_FILE" << 'YAMLEOF'
version: '3.8'

services:
  backend:
    image: coder-hub/coder-backend:latest
    container_name: coder-backend
    restart: unless-stopped
    environment:
      - MODEL_URL=${MODEL_URL:?MODEL_URL not set}
      - MODEL_API_KEY=${MODEL_API_KEY:?MODEL_API_KEY not set}
      - MODEL_NAME=${MODEL_NAME:?MODEL_NAME not set}
      - PORT=3000
      - CORS_ORIGIN=http://localhost:5173
    networks:
      - coder-net

  frontend:
    image: coder-hub/coder-frontend:latest
    container_name: coder-frontend
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - coder-net

networks:
  coder-net:
    driver: bridge
YAMLEOF

echo "=== Start services ==="
cd "$DEPLOY_DIR"
docker compose pull
docker compose up -d

echo "=== Verify ==="
echo "Backend health:"
docker compose exec backend wget -qO- http://localhost:3000/api/health || echo "(health check endpoint TBD)"
echo "=== Done ==="
