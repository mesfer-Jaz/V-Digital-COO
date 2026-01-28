# PM2 Setup & Configuration Guide

## 🎯 Overview

PM2 is a production process manager for Node.js applications. It handles process management, auto-restart, log management, and zero-downtime reloads. This guide covers setting up PM2 for XCircle Digital COO on the production server.

---

## ✅ Prerequisites

- PM2 installed globally: `npm install -g pm2`
- Node.js v18+ installed
- Project files in `~/clawdbot/`
- `.env` file configured with API keys

---

## 🚀 Quick Setup (3 steps)

### Step 1: Copy Ecosystem Config

```bash
cp ~/ecosystem-clawdbot.config.js ~/clawdbot/ecosystem.config.js
```

### Step 2: Start Application

```bash
cd ~/clawdbot
pm2 start ecosystem.config.js
```

### Step 3: Save Configuration

```bash
pm2 save
pm2 startup
```

---

## 📋 Detailed Configuration

### Ecosystem Configuration File

The `ecosystem.config.js` file contains all PM2 settings:

```javascript
module.exports = {
  apps: [
    {
      name: 'XCircle-COO',              // Process name
      script: './index-upgraded.js',    // Main file
      instances: 1,                     // Number of instances
      exec_mode: 'fork',                // Execution mode
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // Logging
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      
      // Resource limits
      max_memory_restart: '512M',
      
      // Restart policy
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

### Key Configuration Options

| Option | Value | Purpose |
|--------|-------|---------|
| `name` | `XCircle-COO` | Process identifier |
| `script` | `./index-upgraded.js` | Main application file |
| `instances` | `1` | Number of worker processes |
| `exec_mode` | `fork` | Single process (not cluster) |
| `max_memory_restart` | `512M` | Auto-restart if exceeds 512MB |
| `max_restarts` | `10` | Max restart attempts |
| `min_uptime` | `10s` | Minimum uptime before counting restart |

---

## 🔧 Common PM2 Commands

### Start Application

```bash
# Start with config file
pm2 start ecosystem.config.js

# Start with environment
pm2 start ecosystem.config.js --env production

# Start specific app
pm2 start index-upgraded.js --name "XCircle-COO"
```

### Monitor Application

```bash
# Real-time monitoring dashboard
pm2 monit

# List all processes
pm2 list

# Show detailed info
pm2 info XCircle-COO

# View logs
pm2 logs XCircle-COO

# View last 100 lines
pm2 logs XCircle-COO --lines 100

# View errors only
pm2 logs XCircle-COO --err

# Follow logs in real-time
pm2 logs XCircle-COO --follow
```

### Control Application

```bash
# Stop process
pm2 stop XCircle-COO

# Restart process
pm2 restart XCircle-COO

# Reload with zero-downtime
pm2 reload XCircle-COO

# Delete process
pm2 delete XCircle-COO

# Stop all processes
pm2 stop all

# Restart all processes
pm2 restart all
```

### Persistence

```bash
# Save current process list
pm2 save

# Setup auto-startup on server reboot
pm2 startup

# Resurrect saved processes
pm2 resurrect

# Flush all logs
pm2 flush

# Kill PM2 daemon
pm2 kill
```

---

## 📊 Monitoring & Maintenance

### Real-Time Monitoring

```bash
pm2 monit
```

This displays:
- CPU usage
- Memory usage
- Process status
- Restart count
- Uptime

### Performance Metrics

```bash
# Get detailed metrics
pm2 info XCircle-COO

# Expected output:
# ┌─ XCircle-COO
# ├─ status: online
# ├─ instances: 1
# ├─ restarts: 0
# ├─ uptime: 2h
# ├─ memory: 85.2 MB
# └─ cpu: 0%
```

### Log Management

```bash
# View current logs
pm2 logs XCircle-COO

# View with timestamps
pm2 logs XCircle-COO --timestamps

# View last 50 lines
pm2 logs XCircle-COO --lines 50

# Clear logs
pm2 flush
```

---

## 🔄 Update & Deployment

### Update Application Code

```bash
# Navigate to project
cd ~/clawdbot

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Restart with zero-downtime
pm2 reload XCircle-COO
```

### Reload Without Downtime

```bash
# Graceful reload
pm2 reload XCircle-COO

# Reload all apps
pm2 reload all
```

### Hard Restart

```bash
# Full restart (brief downtime)
pm2 restart XCircle-COO

# Restart all
pm2 restart all
```

---

## 🆘 Troubleshooting

### Process Not Starting

**Check logs:**
```bash
pm2 logs XCircle-COO --err
```

**Verify configuration:**
```bash
cat ~/clawdbot/.env | grep -E "TELEGRAM|GROQ|ANTHROPIC"
```

**Check Node.js:**
```bash
node --version
npm --version
```

**Verify dependencies:**
```bash
cd ~/clawdbot
npm list
```

### High Memory Usage

**Check memory:**
```bash
pm2 info XCircle-COO
```

**Restart process:**
```bash
pm2 restart XCircle-COO
```

**Increase memory limit in ecosystem.config.js:**
```javascript
max_memory_restart: '1G'  // Increase from 512M to 1G
```

### Process Keeps Restarting

**Check error logs:**
```bash
pm2 logs XCircle-COO --err --lines 100
```

**Common causes:**
- Missing API keys in `.env`
- Network connectivity issues
- Insufficient system resources
- Syntax errors in code

### WhatsApp QR Code Not Appearing

**Check logs:**
```bash
pm2 logs XCircle-COO | grep -i whatsapp
```

**Install Chromium dependencies:**
```bash
sudo apt-get install -y chromium-browser
```

**Clear WhatsApp session:**
```bash
rm -rf ~/.wwebjs_auth
pm2 restart XCircle-COO
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

### Secure PM2 Configuration

```bash
# Protect ecosystem config
chmod 600 ~/clawdbot/ecosystem.config.js

# Don't commit .env to git
echo ".env" >> ~/clawdbot/.gitignore
```

### Monitor for Errors

```bash
# Watch for errors
pm2 logs XCircle-COO --err --follow

# Set up alerts (optional)
pm2 web  # Access at http://localhost:9615
```

---

## 📈 Performance Tuning

### Optimize Memory

```javascript
// In ecosystem.config.js
max_memory_restart: '512M',  // Restart if exceeds 512MB
```

### Optimize CPU

```javascript
// For multi-core systems
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'  // Cluster mode
```

### Optimize Logging

```javascript
// Reduce log verbosity
env: {
  LOG_LEVEL: 'warn'  // Only warnings and errors
}
```

---

## 🔄 Backup & Recovery

### Backup PM2 Configuration

```bash
# Save current process list
pm2 save

# Backup ecosystem config
cp ~/clawdbot/ecosystem.config.js ~/ecosystem.config.js.backup

# Backup logs
tar -czf ~/pm2_logs_backup.tar.gz ~/.pm2/logs/
```

### Restore from Backup

```bash
# Restore processes
pm2 resurrect

# Or manually start
pm2 start ecosystem.config.js
```

---

## 📊 Advanced Monitoring

### Web Dashboard

```bash
# Start web dashboard
pm2 web

# Access at http://localhost:9615
```

### Email Alerts

```bash
# Install pm2-auto-pull for auto-updates
pm2 install pm2-auto-pull

# Install pm2-logrotate for log rotation
pm2 install pm2-logrotate
```

### Custom Monitoring

```bash
# Create monitoring script
pm2 start monitoring-script.js --name "monitor"

# Monitor specific metrics
pm2 info XCircle-COO
```

---

## 🎯 Production Checklist

- [ ] PM2 installed globally
- [ ] Application starts without errors
- [ ] `.env` file is properly configured
- [ ] Logs are being written correctly
- [ ] Memory usage is within limits
- [ ] Process auto-restarts on failure
- [ ] PM2 is configured for auto-startup
- [ ] Backups are scheduled
- [ ] Monitoring is active
- [ ] Error alerts are configured

---

## 📞 Support

For PM2 issues:

1. **Check logs:** `pm2 logs XCircle-COO`
2. **Check status:** `pm2 info XCircle-COO`
3. **Check system:** `free -h` and `df -h`
4. **Restart:** `pm2 restart XCircle-COO`
5. **Contact:** support@xcircle.co

---

## 🔗 Useful Links

- **PM2 Documentation:** https://pm2.keymetrics.io/docs/usage/quick-start/
- **PM2 CLI Reference:** https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/
- **PM2 Ecosystem File:** https://pm2.keymetrics.io/docs/usage/application-declaration/

---

**Status:** ✅ PM2 Configuration Ready
**Version:** 1.0
**Last Updated:** January 28, 2024
