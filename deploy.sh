#!/bin/bash

echo "🚀 Deploying Contacts App to VPS..."

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Install Python dependencies for backend
echo "🐍 Installing Python dependencies..."
cd backend/contacts && pip3 install -r requirements.txt && cd ../..
cd backend/auth && pip3 install -r requirements.txt && cd ../..
cd backend/settings && pip3 install -r requirements.txt && cd ../..

# Setup database
echo "💾 Setting up database..."
sudo -u postgres psql contacts_db < db_migrations/V1__init_schema.sql

# Setup Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/contacts-app > /dev/null <<EOF
server {
    listen 80;
    server_name 217.156.65.145;
    
    # Frontend
    location / {
        root /var/www/contacts-app;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Backend API
    location /contacts {
        proxy_pass http://localhost:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    location /auth {
        proxy_pass http://localhost:8002;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    location /settings {
        proxy_pass http://localhost:8003;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/contacts-app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Copy frontend build
echo "📋 Copying frontend files..."
sudo mkdir -p /var/www/contacts-app
sudo cp -r dist/* /var/www/contacts-app/

# Setup systemd services for backend functions
echo "⚙️ Setting up backend services..."

# Contacts service
sudo tee /etc/systemd/system/contacts-api.service > /dev/null <<EOF
[Unit]
Description=Contacts API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/contacts-app/backend/contacts
Environment="DATABASE_URL=postgresql://contacts_user:SecurePass123!@localhost/contacts_db"
ExecStart=/usr/bin/python3 -m gunicorn --bind 0.0.0.0:8001 --workers 2 'index:handler'
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Auth service
sudo tee /etc/systemd/system/auth-api.service > /dev/null <<EOF
[Unit]
Description=Auth API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/contacts-app/backend/auth
Environment="DATABASE_URL=postgresql://contacts_user:SecurePass123!@localhost/contacts_db"
ExecStart=/usr/bin/python3 -m gunicorn --bind 0.0.0.0:8002 --workers 2 'index:handler'
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Settings service
sudo tee /etc/systemd/system/settings-api.service > /dev/null <<EOF
[Unit]
Description=Settings API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/contacts-app/backend/settings
Environment="DATABASE_URL=postgresql://contacts_user:SecurePass123!@localhost/contacts_db"
ExecStart=/usr/bin/python3 -m gunicorn --bind 0.0.0.0:8003 --workers 2 'index:handler'
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Install gunicorn
pip3 install gunicorn

# Start services
sudo systemctl daemon-reload
sudo systemctl enable contacts-api auth-api settings-api
sudo systemctl start contacts-api auth-api settings-api

echo "✅ Deployment complete!"
echo "🌐 Your site is available at: http://217.156.65.145"
