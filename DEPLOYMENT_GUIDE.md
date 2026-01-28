# XCircle Digital COO - Deployment & Setup Guide

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Deployment Setup](#pre-deployment-setup)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Configuration](#configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [API Documentation](#api-documentation)

---

## System Requirements

### Hardware Requirements

- **CPU:** 2+ cores (4+ recommended for production)
- **RAM:** 2GB minimum (4GB+ recommended)
- **Storage:** 20GB+ (for logs, invoices, documents)
- **Network:** Stable internet connection with static IP (recommended)

### Software Requirements

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Docker:** v20.0+ (for containerized deployment)
- **Docker Compose:** v1.29+ (for multi-service setup)
- **PM2:** v5.0+ (for process management)
- **Git:** v2.0+ (for version control)

### Operating System

- **Linux:** Ubuntu 20.04 LTS or higher (recommended)
- **macOS:** 10.15 or higher (for development)
- **Windows:** WSL2 with Ubuntu (for development)

---

## Pre-Deployment Setup

### 1. Obtain API Keys

Before deployment, gather all required API keys:

#### AI Engines
- **Groq API Key:** https://console.groq.com
- **Anthropic API Key:** https://console.anthropic.com
- **Google API Key:** https://console.cloud.google.com

#### Search & Agentic Tools
- **Brave Search API:** https://api.search.brave.com
- **Z.ai API Key:** https://z.ai/api

#### Google Services
- **Service Account JSON:** Create in Google Cloud Console
  - Enable Calendar API
  - Enable Drive API
  - Enable Sheets API
  - Download service account key as JSON

#### Email Configuration
- **Gmail App Password:** Generate in Google Account settings
  - Enable 2FA
  - Create app-specific password

#### Supermemory
- **Supermemory API Key:** https://supermemory.ai
- **Workspace ID:** From Supermemory dashboard

#### Telegram
- **Bot Token:** Create via @BotFather on Telegram
- **Allowed User IDs:** Your Telegram user ID (get from @userinfobot)

### 2. Prepare Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Clone Repository

```bash
# Clone the repository
git clone https://github.com/xcircle/digital-coo.git
cd digital-coo

# Install dependencies
npm install
```

---

## Local Development Setup

### 1. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your API keys
nano .env
```

### 2. Start Development Server

```bash
# Install dev dependencies
npm install --save-dev nodemon

# Start with auto-reload
npm run dev

# Or start normally
npm start
```

### 3. Test Telegram Bot

```bash
# In Telegram, send a message to your bot
# The bot should respond with the active engine info
```

### 4. View Logs

```bash
# In another terminal
tail -f logs/out.log
tail -f logs/error.log
```

---

## Production Deployment

### Option 1: PM2 Deployment (Recommended)

#### Step 1: Install PM2

```bash
sudo npm install -g pm2
pm2 install pm2-auto-pull  # Auto-update from git
```

#### Step 2: Configure Ecosystem

```bash
# Copy ecosystem config
cp ecosystem.config.js ecosystem.config.js

# Edit if needed
nano ecosystem.config.js
```

#### Step 3: Start Application

```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup auto-startup on server reboot
pm2 startup
# Follow the command output to complete setup

# Verify it's running
pm2 list
pm2 info xcircle-coo
```

#### Step 4: Monitor Application

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs xcircle-coo

# View last 100 lines
pm2 logs xcircle-coo --lines 100

# Clear logs
pm2 flush
```

#### Step 5: Update Application

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart application
pm2 restart xcircle-coo

# Or reload with zero-downtime
pm2 reload xcircle-coo
```

### Option 2: Docker Deployment

#### Step 1: Build Docker Image

```bash
# Build the image
docker build -t xcircle-coo:latest .

# Or use docker-compose
docker-compose build
```

#### Step 2: Create .env File

```bash
# Copy and configure .env
cp .env.example .env
nano .env
```

#### Step 3: Start Services

```bash
# Start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f xcircle-coo

# Check status
docker-compose ps
```

#### Step 4: Manage Services

```bash
# Stop services
docker-compose down

# Restart services
docker-compose restart

# View specific service logs
docker-compose logs -f xcircle-coo

# Execute command in container
docker-compose exec xcircle-coo npm run test
```

### Option 3: Systemd Service

#### Step 1: Create Systemd Service File

```bash
sudo nano /etc/systemd/system/xcircle-coo.service
```

#### Step 2: Add Service Configuration

```ini
[Unit]
Description=XCircle Digital COO Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/xcircle-coo
ExecStart=/usr/bin/node /home/ubuntu/xcircle-coo/index-upgraded.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/xcircle-coo/out.log
StandardError=append:/var/log/xcircle-coo/error.log
EnvironmentFile=/home/ubuntu/xcircle-coo/.env

[Install]
WantedBy=multi-user.target
```

#### Step 3: Enable and Start Service

```bash
# Create log directory
sudo mkdir -p /var/log/xcircle-coo
sudo chown ubuntu:ubuntu /var/log/xcircle-coo

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable xcircle-coo

# Start service
sudo systemctl start xcircle-coo

# Check status
sudo systemctl status xcircle-coo

# View logs
sudo journalctl -u xcircle-coo -f
```

---

## Configuration

### Environment Variables

All configuration is done through the `.env` file. See `.env.example` for all available options.

### Key Configurations

#### Time-Based Engine Selection

The bot automatically selects engines based on Riyadh time:

- **Peak Hours (20:00 - 01:00):**
  - Primary: Claude 3.5 Sonnet
  - Agentic: Z.ai

- **Off-Peak Hours (01:00 - 20:00):**
  - Primary: Groq Llama 3.3
  - Agentic: Brave Search

#### Google Calendar Setup

1. Create a Google Cloud project
2. Enable Calendar API and Drive API
3. Create a service account
4. Download the JSON key
5. Share calendars with the service account email
6. Set `GOOGLE_SERVICE_ACCOUNT_JSON` to the path of the JSON file

#### Telegram Bot Setup

1. Create a bot via @BotFather
2. Get your user ID from @userinfobot
3. Set `TELEGRAM_BOT_TOKEN` and `ALLOWED_TELEGRAM_USER_IDS`

#### Email Configuration

1. Enable 2FA on Gmail
2. Create an app-specific password
3. Set `EMAIL_USER` and `EMAIL_PASS`

---

## Monitoring & Maintenance

### Health Checks

```bash
# PM2 health check
pm2 info xcircle-coo

# Docker health check
docker-compose ps

# Manual health check
curl http://localhost:3000/health
```

### Performance Monitoring

```bash
# PM2 monitoring
pm2 monit

# System resources
top -p $(pgrep -f "node index-upgraded.js")

# Memory usage
ps aux | grep "node index-upgraded.js"
```

### Log Rotation

```bash
# Configure logrotate
sudo nano /etc/logrotate.d/xcircle-coo
```

```
/var/log/xcircle-coo/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        systemctl reload xcircle-coo > /dev/null 2>&1 || true
    endscript
}
```

### Database Backups

```bash
# Backup Supermemory documents
curl -X GET "https://api.supermemory.ai/v1/workspaces/{WORKSPACE_ID}/documents" \
  -H "Authorization: Bearer {API_KEY}" > backup-$(date +%Y%m%d).json

# Backup Google Drive documents
# Use Google Drive API or manual backup
```

### Security Updates

```bash
# Check for vulnerable dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Restart application
pm2 restart xcircle-coo
```

---

## Troubleshooting

### Common Issues

#### Bot not responding

```bash
# Check if bot is running
pm2 list

# View error logs
pm2 logs xcircle-coo --err

# Restart bot
pm2 restart xcircle-coo

# Check Telegram token
echo $TELEGRAM_BOT_TOKEN
```

#### API key errors

```bash
# Verify .env file
cat .env | grep API_KEY

# Check for special characters
# Ensure quotes are properly escaped
```

#### Memory issues

```bash
# Check memory usage
pm2 info xcircle-coo

# Increase memory limit in ecosystem.config.js
# max_memory_restart: '1G'

# Restart
pm2 restart xcircle-coo
```

#### Google Calendar not working

```bash
# Verify service account JSON path
ls -la $GOOGLE_SERVICE_ACCOUNT_JSON

# Check if Calendar API is enabled
# Go to Google Cloud Console > APIs & Services

# Verify calendar is shared with service account email
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
pm2 restart xcircle-coo

# Or in .env
LOG_LEVEL=debug
```

---

## API Documentation

### Telegram Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `/start` | `/start` | Initialize bot |
| `/help` | `/help` | Show all commands |
| `/invoice` | `/invoice` | Create invoice |
| `/schedule` | `/schedule` | Schedule meeting |
| `/recruit` | `/recruit` | Search candidates |
| `/market` | `/market` | Market research |
| `/save` | `/save <content>` | Save to memory |
| `/search` | `/search <query>` | Search memory |

### Module APIs

#### Financial Suite

```javascript
// Generate invoice
const invoiceId = await financialSuite.generateInvoice({
    invoiceNumber: '001',
    date: new Date(),
    customer: { name: 'Client Name' },
    items: [{ description: 'Service', quantity: 1, unitPrice: 1000 }]
});

// Extract invoice data
const data = await financialSuite.extractInvoiceData('/path/to/invoice.pdf');

// Generate quotation
const quotationId = await financialSuite.generateQuotation({
    quotationNumber: 'Q001',
    customer: { name: 'Client Name' },
    items: [...]
});
```

#### Scheduling Module

```javascript
// Check availability
const availability = await schedulingModule.checkAvailability(
    'primary',
    startTime,
    endTime
);

// Create event
const event = await schedulingModule.createEvent({
    title: 'Meeting',
    startTime: '2024-02-01T10:00:00',
    endTime: '2024-02-01T11:00:00',
    attendees: ['email@example.com']
});

// Find available slots
const slots = await schedulingModule.findAvailableSlots({
    startDate: '2024-02-01',
    endDate: '2024-02-07',
    duration: 60
});
```

#### Recruitment Module

```javascript
// Search candidates
const candidates = await recruitmentModule.searchLinkedInCandidates({
    jobTitle: 'Software Engineer',
    skills: ['Node.js', 'React'],
    location: 'Saudi Arabia'
});

// Get market trends
const trends = await recruitmentModule.getSaudiTechTrends();

// Analyze competitors
const analysis = await recruitmentModule.analyzeCompetitors([
    'Competitor1',
    'Competitor2'
]);
```

#### Memory Module

```javascript
// Save to memory
const docId = await memoryModule.saveToMemory(
    'Document content',
    'source_type'
);

// Search memory
const results = await memoryModule.searchMemory('search query');

// Retrieve document
const doc = await memoryModule.retrieveDocument(docId);
```

---

## Support & Contact

For issues or questions:

- **Email:** support@xcircle.co
- **Telegram:** @xcircle_support
- **Documentation:** https://docs.xcircle.co
- **GitHub Issues:** https://github.com/xcircle/digital-coo/issues

---

## Version History

- **v1.0.0** (2024-01-28) - Initial release with all core modules

---

**Last Updated:** January 28, 2024
**Status:** Production Ready
