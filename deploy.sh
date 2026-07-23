#!/bin/bash
# =============================================================
# deploy.sh — Run this on your EC2 instance to deploy the app
# Usage: bash deploy.sh
# =============================================================
set -e

EC2_IP="54.158.241.8"
APP_DIR="/home/ubuntu/app"
REPO_URL="https://github.com/Nandha-kumar07/EXPANCE-TRACKER.git"

echo "======================================"
echo "  Expense Tracker — EC2 Deployment"
echo "======================================"

# ── 1. Check Docker is running ─────────────────────────────
echo ""
echo "[1/5] Checking Docker..."
if ! systemctl is-active --quiet docker; then
  echo "  Docker not running — starting it..."
  sudo systemctl start docker
  sudo systemctl enable docker
fi
echo "  ✓ Docker is running"

# Make sure current user is in docker group
if ! groups | grep -q docker; then
  sudo usermod -aG docker ubuntu
  echo "  ✓ Added ubuntu to docker group (re-login may be needed)"
fi

# ── 2. Install Docker Compose if missing ───────────────────
echo ""
echo "[2/5] Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
  echo "  Installing Docker Compose..."
  sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi
echo "  ✓ Docker Compose: $(docker-compose --version)"

# ── 3. Clone or update repo ────────────────────────────────
echo ""
echo "=== Cloning repository ==="
if [ -d "$APP_DIR/.git" ]; then
  echo "  Repo already exists — pulling latest changes..."
  cd "$APP_DIR"
  git pull origin main
else
  echo "  Directory exists but is not a git repo — removing and cloning fresh..."
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi
echo "  Repo ready at $APP_DIR"

# ── 4. Write backend .env ──────────────────────────────────
echo ""
echo "[4/5] Setting up backend .env..."
ENV_FILE="$APP_DIR/backend/.env"

# Only write if it doesn't exist yet (don't overwrite user edits)
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" << ENVEOF
DATABASE_URL=postgresql://postgres.vxsdmovhbmkpbdfykkqf:Nandhakumar%4007@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres
JWT_SECRET=expense_tracker_secret_key_2024
PORT=5000
GEMINI_API_KEY=REPLACE_WITH_YOUR_GEMINI_API_KEY
EMAIL_USER=REPLACE_WITH_YOUR_EMAIL
EMAIL_PASS=REPLACE_WITH_YOUR_APP_PASSWORD
ENVEOF
  echo "  ✓ .env written — IMPORTANT: edit $ENV_FILE with real API keys!"
else
  echo "  ✓ .env already exists — skipping (edit manually if needed)"
fi

# ── 5. Build and start containers ─────────────────────────
echo ""
echo "[5/5] Building and starting containers..."
cd "$APP_DIR"

# Stop any running containers first
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Build and start fresh
docker-compose -f docker-compose.prod.yml up -d --build

echo ""
echo "======================================"
echo "  Deployment complete!"
echo "======================================"
echo ""
echo "  Frontend:  http://$EC2_IP"
echo "  Backend:   http://$EC2_IP:5000"
echo "  API check: http://$EC2_IP:5000/"
echo ""
echo "  View logs:    docker-compose -f docker-compose.prod.yml logs -f"
echo "  Container status: docker ps"
echo ""

# ── Quick health check ─────────────────────────────────────
echo "Waiting 10 seconds for containers to start..."
sleep 10
echo ""
echo "Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Testing API..."
if curl -s --max-time 5 "http://localhost:5000/" | grep -q "running"; then
  echo "  ✓ Backend API is responding!"
else
  echo "  ⚠ Backend may still be starting. Run: docker-compose -f docker-compose.prod.yml logs backend"
fi
