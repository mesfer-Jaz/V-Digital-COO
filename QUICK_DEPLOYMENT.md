# XCircle Digital COO - Quick Deployment Guide

## 🚀 Fast Track Deployment (5 minutes)

### Prerequisites Checklist

- ✅ SSH access to server (72.60.178.47)
- ✅ PM2 installed on server
- ✅ Node.js v18+ installed
- ✅ All API keys ready (see below)

### Required API Keys

Before starting, gather these credentials:

| Service | Key | Where to Get |
|---------|-----|-------------|
| **Telegram** | `TELEGRAM_BOT_TOKEN` | @BotFather on Telegram |
| **Groq** | `GROQ_API_KEY` | https://console.groq.com |
| **Anthropic** | `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| **Google** | `GOOGLE_API_KEY` | https://console.cloud.google.com |
| **Brave Search** | `BRAVE_API_KEY` | https://api.search.brave.com |
| **Z.ai** | `ZAI_API_KEY` | https://z.ai/api |
| **Supermemory** | `SUPERMEMORY_API_KEY` | ✅ Already provided |

---

## 📋 Step-by-Step Deployment

### Step 1: SSH into Server

```bash
ssh ubuntu@72.60.178.47
```

### Step 2: Download Deployment Script

```bash
cd /tmp
wget https://your-repo/DEPLOYMENT_SCRIPT.sh
chmod +x DEPLOYMENT_SCRIPT.sh
```

Or if files are already on server:

```bash
cd /home/ubuntu
chmod +x DEPLOYMENT_SCRIPT.sh
```

### Step 3: Run Deployment Script

```bash
./DEPLOYMENT_SCRIPT.sh
```

This script will:
- ✅ Backup existing project
- ✅ Copy all files to ~/clawdbot/
- ✅ Install dependencies
- ✅ Start PM2 process
- ✅ Display status and next steps

### Step 4: Configure Environment

```bash
nano ~/clawdbot/.env
```

Add your API keys:

```bash
# Telegram
TELEGRAM_BOT_TOKEN=your_token_here
ALLOWED_TELEGRAM_USER_IDS=7956638331

# AI Engines
GROQ_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here

# Search Tools
BRAVE_API_KEY=your_key_here
ZAI_API_KEY=your_key_here

# Google Services
GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/service-account.json
GOOGLE_DRIVE_FOLDER_ID=your_folder_id

# Email
EMAIL_USER=info@xcircle.co
EMAIL_PASS=your_app_password

# Supermemory (Already configured)
SUPERMEMORY_API_KEY=Sm_8c8gEoVdprgBr8HMTqwptf_XqXyYBPYKXlhXbFFESxQfkTWFnlIJXjlvFpZOweYAtfsflWmNfQmUziNFfqdySIp
SUPERMEMORY_WORKSPACE_ID=default

# WhatsApp
FOUNDER_WHATSAPP_NUMBER=+966XXXXXXXXX
```

Save and exit (Ctrl+X, Y, Enter)

### Step 5: Restart Bot with New Configuration

```bash
pm2 restart XCircle-COO
```

### Step 6: Monitor WhatsApp Connection

```bash
pm2 logs XCircle-COO
```

You should see:
```
📱 WhatsApp QR Code - Scan with your phone:
[QR Code displayed]
```

**Scan the QR code with your phone's WhatsApp camera**

Once scanned, you'll see:
```
✅ WhatsApp client is ready!
```

---

## ✅ Verification Checklist

### Test Telegram Bot

1. Open Telegram
2. Search for your bot (created with @BotFather)
3. Send: `/start`
4. Expected response: Bot greeting with engine status

### Test WhatsApp

1. Open WhatsApp on your phone
2. Send a message to the bot's number
3. Expected response: Bot reply with current engine info

### Test Supermemory Integration

1. Send a message: "حفظ تقرير مهم: الربع الأول 2024"
2. Check logs: `pm2 logs XCircle-COO`
3. Should see: `✓ Saved to Supermemory: [document_id]`

### Check Time-Based Engine Selection

1. Check current Riyadh time
2. Send a complex question to bot
3. If peak hours (20:00-01:00): Should use Claude 3.5
4. If off-peak: Should use Groq Llama 3

---

## 🔧 Common Commands

### Monitor Bot

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs XCircle-COO

# View last 100 lines
pm2 logs XCircle-COO --lines 100

# View errors only
pm2 logs XCircle-COO --err
```

### Control Bot

```bash
# Restart
pm2 restart XCircle-COO

# Stop
pm2 stop XCircle-COO

# Start
pm2 start XCircle-COO

# Delete
pm2 delete XCircle-COO
```

### Update Bot

```bash
cd ~/clawdbot

# Pull latest code
git pull origin main

# Install updates
npm install

# Restart
pm2 restart XCircle-COO
```

---

## 🆘 Troubleshooting

### Bot Not Responding on Telegram

**Check logs:**
```bash
pm2 logs XCircle-COO --err
```

**Verify token:**
```bash
grep TELEGRAM_BOT_TOKEN ~/clawdbot/.env
```

**Restart:**
```bash
pm2 restart XCircle-COO
```

### WhatsApp QR Code Not Appearing

**Check logs:**
```bash
pm2 logs XCircle-COO | grep -i whatsapp
```

**Possible solutions:**
- Ensure Puppeteer dependencies are installed: `sudo apt-get install -y chromium-browser`
- Delete session and rescan: `rm -rf ~/.wwebjs_auth`
- Restart bot: `pm2 restart XCircle-COO`

### Supermemory Not Saving

**Verify API key:**
```bash
grep SUPERMEMORY_API_KEY ~/clawdbot/.env
```

**Check logs:**
```bash
pm2 logs XCircle-COO | grep -i supermemory
```

### High Memory Usage

**Check memory:**
```bash
pm2 info XCircle-COO
```

**Restart bot:**
```bash
pm2 restart XCircle-COO
```

**Increase limit in ecosystem.config.js:**
```javascript
max_memory_restart: '1G'
```

---

## 📊 Performance Monitoring

### Check System Resources

```bash
# CPU and Memory
top -p $(pgrep -f "node index-upgraded.js")

# Disk usage
du -sh ~/clawdbot/

# Log size
du -sh ~/clawdbot/logs/
```

### Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/xcircle-coo
```

Add:
```
/home/ubuntu/clawdbot/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
}
```

---

## 🔐 Security Best Practices

### Protect .env File

```bash
# Restrict permissions
chmod 600 ~/clawdbot/.env

# Verify
ls -la ~/clawdbot/.env
# Should show: -rw------- 1 ubuntu ubuntu
```

### Backup Credentials

```bash
# Create secure backup
tar -czf ~/clawdbot_backup.tar.gz ~/clawdbot/.env
chmod 600 ~/clawdbot_backup.tar.gz
```

### Rotate API Keys Regularly

- Update Telegram token monthly
- Rotate Supermemory key quarterly
- Monitor API usage for anomalies

---

## 📞 Support

If you encounter issues:

1. **Check logs:** `pm2 logs XCircle-COO`
2. **Verify configuration:** `cat ~/clawdbot/.env`
3. **Check system resources:** `free -h`
4. **Restart bot:** `pm2 restart XCircle-COO`
5. **Contact support:** support@xcircle.co

---

## 🎯 What's Next?

After successful deployment:

1. ✅ Test all modules (Financial, Scheduling, Recruitment)
2. ✅ Verify Supermemory sync
3. ✅ Monitor logs for 24 hours
4. ✅ Set up automated backups
5. ✅ Configure alerts for errors

---

**Deployment Status:** ✅ Ready for Production

**Version:** 1.0
**Last Updated:** January 28, 2024
