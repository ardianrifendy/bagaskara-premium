#!/bin/bash
# Auto-deploy script for Bagaskara Digital Store

echo "🚀 Memulai Auto-Deployment Bagaskara Digital Store..."

# 1. Pull update dari repository
echo "📥 [1/3] Git Pulling latest updates..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Git pull gagal! Proses dibatalkan."
    exit 1
fi

# 2. Build aplikasi Next.js
echo "🏗️ [2/3] Building production bundle (npm run build)..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ ERROR: npm run build gagal! PM2 tidak di-restart untuk mencegah server down."
    exit 1
fi

# 3. Restart PM2 Process
echo "🔄 [3/3] Restarting PM2 process..."
if pm2 list | grep -q "bagaskara"; then
    pm2 restart bagaskara
else
    pm2 restart all
fi

echo "🎉 DEPLOYMENT BERHASIL & APLIKASI BERHASIL DI-RESTART!"
