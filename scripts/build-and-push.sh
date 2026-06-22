#!/usr/bin/env bash
set -euo pipefail

# 在 build-x86-server 上执行：构建并推送 Docker 镜像到 Docker Hub
# 用法: bash scripts/build-and-push.sh

NAMESPACE="coder-hub"
REPOS=("coder-backend" "coder-frontend")

echo "=== Pull latest code (dev) ==="
for repo in "${REPOS[@]}"; do
  echo "--- $repo ---"
  cd ~/projects/"$repo"
  git checkout dev
  git pull --ff-only origin dev
done

echo "=== Build & Push ==="
for repo in "${REPOS[@]}"; do
  echo "--- Build $repo ---"
  cd ~/projects/"$repo"
  docker build -t "$NAMESPACE/$repo:latest" .
  echo "--- Push $repo ---"
  docker push "$NAMESPACE/$repo:latest"
done

echo "=== Done ==="
