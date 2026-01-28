#!/bin/bash

# XCircle Digital COO - Deployment Script
# This script deploys all files to ~/clawdbot/ and configures PM2

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  XCircle Digital COO - Deployment to ~/clawdbot/          ║"
echo "╚════════════════════════════════════════════════════════════╝"

# ==================== CONFIGURATION ====================

PROJECT_DIR="$HOME/clawdbot"
BACKUP_DIR="$HOME/clawdbot_backup_$(date +%Y%m%d_%H%M%S)"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ==================== STEP 1: BACKUP EXISTING PROJECT ====================

echo ""
echo "📦 Step 1: Backing up existing project..."

if [ -d "$PROJECT_DIR" ]; then
    echo "   Creating backup at: $BACKUP_DIR"
    cp -r "$PROJECT_DIR" "$BACKUP_DIR"
    echo "   ✅ Backup created successfully"
else
    echo "   ℹ️  No existing project found, creating new directory"
fi

# Create project directory if it doesn't exist
mkdir -p "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR/modules"
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$PROJECT_DIR/.wwebjs_auth"

# ==================== STEP 2: COPY FILES ====================

echo ""
echo "📋 Step 2: Copying files to $PROJECT_DIR..."

# Copy main files
cp "$CURRENT_DIR/index-upgraded-whatsapp.js" "$PROJECT_DIR/index-upgraded.js"
echo "   ✅ Copied index-upgraded.js"

# Copy modules
if [ -d "$CURRENT_DIR/modules" ]; then
    cp "$CURRENT_DIR/modules"/*.js "$PROJECT_DIR/modules/"
    echo "   ✅ Copied all modules"
fi

# Copy configuration files
cp "$CURRENT_DIR/package-updated.json" "$PROJECT_DIR/package.json"
echo "   ✅ Copied package.json"

cp "$CURRENT_DIR/ecosystem.config.js" "$PROJECT_DIR/ecosystem.config.js"
echo "   ✅ Copied ecosystem.config.js"

cp "$CURRENT_DIR/.env.example" "$PROJECT_DIR/.env.example"
echo "   ✅ Copied .env.example"

# Copy documentation
cp "$CURRENT_DIR/README.md" "$PROJECT_DIR/README.md"
cp "$CURRENT_DIR/DEPLOYMENT_GUIDE.md" "$PROJECT_DIR/DEPLOYMENT_GUIDE.md"
cp "$CURRENT_DIR/xcircle_digital_coo_architecture.md" "$PROJECT_DIR/xcircle_digital_coo_architecture.md"
echo "   ✅ Copied documentation files"

# ==================== STEP 3: ENVIRONMENT SETUP ====================

echo ""
echo "⚙️  Step 3: Setting up environment..."

# Check if .env exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "   ⚠️  .env file not found. Creating from template..."
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    echo "   ⚠️  IMPORTANT: Edit $PROJECT_DIR/.env with your actual credentials"
    echo "   ⚠️  Required keys:"
    echo "      - TELEGRAM_BOT_TOKEN"
    echo "      - GROQ_API_KEY"
    echo "      - ANTHROPIC_API_KEY"
    echo "      - GOOGLE_API_KEY"
    echo "      - SUPERMEMORY_API_KEY (already set)"
else
    echo "   ✅ .env file exists"
fi

# ==================== STEP 4: INSTALL DEPENDENCIES ====================

echo ""
echo "📦 Step 4: Installing Node.js dependencies..."

cd "$PROJECT_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "   Installing npm packages..."
    npm install
    echo "   ✅ Dependencies installed"
else
    echo "   ✅ node_modules already exists"
    echo "   Running npm update..."
    npm update
fi

# ==================== STEP 5: VERIFY PM2 ====================

echo ""
echo "🔧 Step 5: Verifying PM2 installation..."

if command -v pm2 &> /dev/null; then
    echo "   ✅ PM2 is installed"
    PM2_VERSION=$(pm2 -v)
    echo "   Version: $PM2_VERSION"
else
    echo "   ⚠️  PM2 not found. Installing globally..."
    sudo npm install -g pm2
    echo "   ✅ PM2 installed"
fi

# ==================== STEP 6: STOP EXISTING PROCESS ====================

echo ""
echo "🛑 Step 6: Stopping existing processes..."

if pm2 list | grep -q "XCircle-COO"; then
    echo "   Stopping existing XCircle-COO process..."
    pm2 stop XCircle-COO
    pm2 delete XCircle-COO
    echo "   ✅ Existing process stopped"
else
    echo "   ℹ️  No existing XCircle-COO process found"
fi

# ==================== STEP 7: START NEW PROCESS ====================

echo ""
echo "🚀 Step 7: Starting XCircle Digital COO with PM2..."

cd "$PROJECT_DIR"

# Start with PM2
pm2 start index-upgraded.js --name "XCircle-COO" --env production

# Wait a moment for process to start
sleep 2

# Check if process is running
if pm2 list | grep -q "XCircle-COO"; then
    echo "   ✅ XCircle-COO process started successfully"
else
    echo "   ❌ Failed to start process. Check logs:"
    pm2 logs XCircle-COO --lines 50
    exit 1
fi

# ==================== STEP 8: SAVE PM2 CONFIGURATION ====================

echo ""
echo "💾 Step 8: Saving PM2 configuration..."

pm2 save
echo "   ✅ PM2 configuration saved"

# Setup auto-startup (optional)
if [ "$1" == "--startup" ]; then
    echo "   Setting up PM2 auto-startup on server reboot..."
    pm2 startup
    echo "   ✅ Auto-startup configured"
fi

# ==================== STEP 9: DISPLAY STATUS ====================

echo ""
echo "📊 Step 9: Current status..."
echo ""
pm2 list
echo ""

# ==================== STEP 10: DISPLAY NEXT STEPS ====================

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ DEPLOYMENT COMPLETED                       ║"
echo "╚════════════════════════════════════════════════════════════╝"

echo ""
echo "📝 NEXT STEPS:"
echo ""
echo "1️⃣  Configure Environment Variables:"
echo "    nano $PROJECT_DIR/.env"
echo "    (Add your API keys and credentials)"
echo ""
echo "2️⃣  Verify WhatsApp Connection:"
echo "    pm2 logs XCircle-COO"
echo "    (Scan the QR code with your phone)"
echo ""
echo "3️⃣  Monitor the Bot:"
echo "    pm2 monit"
echo ""
echo "4️⃣  View Logs:"
echo "    pm2 logs XCircle-COO"
echo ""
echo "5️⃣  Restart if needed:"
echo "    pm2 restart XCircle-COO"
echo ""
echo "6️⃣  Stop the bot:"
echo "    pm2 stop XCircle-COO"
echo ""
echo "📂 Project Location: $PROJECT_DIR"
echo "📂 Backup Location: $BACKUP_DIR"
echo ""
echo "🔗 Documentation:"
echo "   - README.md - Quick start guide"
echo "   - DEPLOYMENT_GUIDE.md - Detailed setup instructions"
echo "   - xcircle_digital_coo_architecture.md - System design"
echo ""
echo "🆘 Troubleshooting:"
echo "   If the bot doesn't respond, check:"
echo "   1. pm2 logs XCircle-COO"
echo "   2. Verify .env file has all required keys"
echo "   3. Check WhatsApp QR code in logs"
echo ""

echo "✨ XCircle Digital COO is now running!"
echo ""
