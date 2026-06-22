#!/bin/bash
set -e
cd "$(dirname "$0")"
export PATH="/home/jash/.local/bin:/home/jash/.hermes/node/bin:$PATH"
npm install
git add .
git commit -m "feat: initial backend implementation"
git push origin dev
