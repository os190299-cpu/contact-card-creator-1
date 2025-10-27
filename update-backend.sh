#!/bin/bash
set -e

echo "🚀 Updating backend services on server..."

SERVER="217.156.65.145"
USER="root"

# Copy backend files to server
echo "📦 Copying backend files..."
scp -r backend/ ${USER}@${SERVER}:/root/contacts-app/

# Restart services on server
echo "🔄 Restarting services..."
ssh ${USER}@${SERVER} << 'EOF'
cd /root/contacts-app
sudo systemctl restart contacts-api auth-api settings-api
sudo systemctl status contacts-api auth-api settings-api --no-pager
EOF

echo "✅ Backend services updated successfully!"
