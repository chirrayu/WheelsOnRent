#!/bin/bash
# WheelsOnRent - EC2 Deployment Helper Script

echo "🚀 Starting WheelsOnRent Deployment..."

# 1. Environment Check
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env not found!"
    echo "Please copy backend/.env.example to backend/.env and fill in your production credentials."
    exit 1
fi

# 2. Start Full Stack with Docker Compose
echo "📦 Building and Starting Stack with Docker Compose..."
docker compose build --no-cache
docker compose up -d

# 3. Deployment Instructions
echo ""
echo "✅ Preparation Complete!"
echo "--------------------------------------------------"
echo "Next Steps for EC2 Backend Deployment:"
echo "1. Status Check: docker compose ps"
echo "2. Logs: docker compose logs -f backend"
echo "3. Security: Open port 5000 (API) in EC2 Security Group."
echo "4. Frontend: Ensure your external frontend (e.g. Vercel) can reach http://your-ec2-ip:5000"
echo "5. CORS: Set FRONTEND_URL in backend/.env to your frontend's domain."
echo "--------------------------------------------------"
