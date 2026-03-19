#!/bin/bash
# WheelsOnRent - EC2 Deployment Helper Script

echo "🚀 Starting WheelsOnRent Deployment..."

# 1. Environment Check
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env not found!"
    echo "Please copy backend/.env.example to backend/.env and fill in your production credentials."
    exit 1
fi

# 2. Build Backend Docker Image
echo "📦 Building Backend Docker Image..."
cd backend
docker build -t wheelsonrent-backend .
cd ..

# 3. Build Frontend
echo "🏗️  Building Frontend Production Bundle..."
cd frontend
npm install
npm run build
cd ..

# 4. Deployment Instructions
echo ""
echo "✅ Preparation Complete!"
echo "--------------------------------------------------"
echo "Next Steps for EC2:"
echo "1. Start Backend: docker run -d -p 5000:5000 --env-file backend/.env wheelsonrent-backend"
echo "2. Serve Frontend: Use Nginx to serve the 'frontend/dist' folder."
echo "3. Security: Open ports 80 (HTTP), 443 (HTTPS), and 5000 (API) in EC2 Security Group."
echo "4. Domain: Update FRONTEND_URL in backend/.env to your domain name."
echo "--------------------------------------------------"
