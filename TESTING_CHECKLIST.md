# XCircle Digital COO - Testing & Verification Checklist

## 🧪 Pre-Deployment Testing

Before deploying to production, verify all components are working correctly.

---

## ✅ Phase 1: Environment & Configuration

### 1.1 Node.js & Dependencies

- [ ] Node.js v18+ installed: `node --version`
- [ ] npm v9+ installed: `npm --version`
- [ ] All dependencies installed: `npm list`
- [ ] No critical vulnerabilities: `npm audit`
- [ ] Baileys installed: `npm list whatsapp-web.js`
- [ ] Telegraf installed: `npm list telegraf`

### 1.2 Environment Variables

- [ ] `.env` file exists: `ls -la ~/clawdbot/.env`
- [ ] `.env` has restricted permissions: `chmod 600 ~/.env`
- [ ] All required keys are set:
  - [ ] `TELEGRAM_BOT_TOKEN` - not empty
  - [ ] `GROQ_API_KEY` - not empty
  - [ ] `ANTHROPIC_API_KEY` - not empty
  - [ ] `GOOGLE_API_KEY` - not empty
  - [ ] `BRAVE_API_KEY` - not empty
  - [ ] `ZAI_API_KEY` - not empty
  - [ ] `SUPERMEMORY_API_KEY` - set to provided key
  - [ ] `EMAIL_USER` - valid email
  - [ ] `EMAIL_PASS` - app password (not regular password)

### 1.3 File Structure

- [ ] `index-upgraded.js` exists in `~/clawdbot/`
- [ ] `modules/` directory exists with all 4 modules:
  - [ ] `financial-suite.js`
  - [ ] `scheduling-module.js`
  - [ ] `recruitment-module.js`
  - [ ] `memory-module.js`
- [ ] `logs/` directory exists: `mkdir -p ~/clawdbot/logs`
- [ ] `.wwebjs_auth/` directory exists: `mkdir -p ~/.wwebjs_auth`

---

## ✅ Phase 2: PM2 Configuration

### 2.1 PM2 Installation

- [ ] PM2 installed globally: `pm2 -v`
- [ ] PM2 can be executed: `which pm2`
- [ ] PM2 daemon running: `pm2 status`

### 2.2 Ecosystem Configuration

- [ ] `ecosystem.config.js` exists in `~/clawdbot/`
- [ ] Configuration file is valid: `pm2 validate ecosystem.config.js`
- [ ] Process name is "XCircle-COO"
- [ ] Script path is correct: `./index-upgraded.js`

### 2.3 PM2 Process Setup

- [ ] No existing XCircle-COO process: `pm2 list | grep XCircle-COO` (should be empty)
- [ ] Can start process: `pm2 start ecosystem.config.js`
- [ ] Process shows as "online": `pm2 list`
- [ ] Process has PID assigned
- [ ] No errors in logs: `pm2 logs XCircle-COO --err`

---

## ✅ Phase 3: Telegram Bot Testing

### 3.1 Bot Connection

- [ ] Bot token is valid (test with curl):
  ```bash
  curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe"
  ```
- [ ] Response contains bot username
- [ ] Bot is not already running elsewhere

### 3.2 Telegram Commands

**Test /start command:**
- [ ] Send `/start` to bot
- [ ] Bot responds with greeting message
- [ ] Message includes engine status (CLAUDE/GROQ)
- [ ] Message includes time window (PEAK/OFF-PEAK)
- [ ] Message includes Supermemory status (✅)

**Test /help command:**
- [ ] Send `/help` to bot
- [ ] Bot displays all available commands
- [ ] Commands are properly formatted

**Test /invoice command:**
- [ ] Send `/invoice` to bot
- [ ] Bot responds with usage instructions

### 3.3 Message Handling

**Test regular message:**
- [ ] Send: "مرحباً، كيف حالك؟"
- [ ] Bot responds within 5 seconds
- [ ] Response is in Arabic
- [ ] Response is contextually appropriate

**Test financial query:**
- [ ] Send: "أنشئ فاتورة جديدة"
- [ ] Bot recognizes financial intent
- [ ] Bot responds appropriately

**Test market research query:**
- [ ] Send: "ما أحدث اتجاهات التكنولوجيا في السعودية؟"
- [ ] Bot recognizes market research intent
- [ ] Bot uses appropriate engine (Claude in peak hours)

### 3.4 Supermemory Integration

**Test message saving:**
- [ ] Send: "حفظ: قرار استراتيجي جديد"
- [ ] Check logs: `pm2 logs XCircle-COO | grep -i supermemory`
- [ ] Should see: `✓ Saved to Supermemory: [document_id]`
- [ ] Document appears in Supermemory dashboard

---

## ✅ Phase 4: WhatsApp Integration (Baileys)

### 4.1 WhatsApp Connection

- [ ] Baileys library installed: `npm list whatsapp-web.js`
- [ ] Start bot: `pm2 start ecosystem.config.js`
- [ ] Check logs for QR code: `pm2 logs XCircle-COO | grep -i "QR Code"`
- [ ] QR code appears in terminal output

### 4.2 QR Code Scanning

- [ ] QR code is visible and scannable
- [ ] Scan with WhatsApp camera on phone
- [ ] Wait for connection (30-60 seconds)
- [ ] Check logs for: `✅ WhatsApp client is ready!`

### 4.3 WhatsApp Message Handling

**Test regular message:**
- [ ] Send message from WhatsApp: "مرحباً"
- [ ] Bot responds within 5 seconds
- [ ] Response is in Arabic

**Test save command:**
- [ ] Send: "حفظ: ملاحظة مهمة"
- [ ] Check logs for Supermemory save confirmation
- [ ] Message appears in Supermemory

### 4.4 Session Persistence

- [ ] Close bot: `pm2 stop XCircle-COO`
- [ ] Restart bot: `pm2 start ecosystem.config.js`
- [ ] WhatsApp should reconnect without QR code
- [ ] Check logs: `✅ WhatsApp client is ready!`

---

## ✅ Phase 5: Time-Based Engine Selection

### 5.1 Peak Hours Testing (20:00 - 01:00 Riyadh Time)

**If current time is in peak hours:**
- [ ] Send complex query to bot
- [ ] Check logs for: `PRIMARY: CLAUDE`
- [ ] Response should use Claude 3.5 Sonnet
- [ ] Response quality should be high

**If current time is off-peak:**
- [ ] Manually test by checking code logic
- [ ] Verify `getActiveEngine()` returns correct engine

### 5.2 Off-Peak Hours Testing (01:00 - 20:00 Riyadh Time)

**If current time is off-peak:**
- [ ] Send query to bot
- [ ] Check logs for: `PRIMARY: GROQ`
- [ ] Response should use Groq Llama 3.3
- [ ] Response should be fast

### 5.3 Time Conversion Verification

- [ ] Check current UTC time
- [ ] Verify Riyadh time calculation: `(UTC + 3) % 24`
- [ ] Confirm correct engine is selected

---

## ✅ Phase 6: API Keys & External Services

### 6.1 Groq API

- [ ] Test Groq connection:
  ```bash
  curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
    -H "Authorization: Bearer $GROQ_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": "Hello"}]}'
  ```
- [ ] Response should be successful
- [ ] Check logs for successful API calls

### 6.2 Anthropic API

- [ ] Test Claude connection by sending message during peak hours
- [ ] Verify response comes from Claude
- [ ] Check response quality

### 6.3 Google APIs

- [ ] Test Google API key validity
- [ ] Verify Gemini model is accessible
- [ ] Test with image analysis query

### 6.4 Supermemory API

- [ ] Test Supermemory connection:
  ```bash
  curl -X GET "https://api.supermemory.ai/v1/documents" \
    -H "Authorization: Bearer $SUPERMEMORY_API_KEY"
  ```
- [ ] Response should list documents
- [ ] Verify API key is working

---

## ✅ Phase 7: Performance & Resource Usage

### 7.1 Memory Usage

- [ ] Check initial memory: `pm2 info XCircle-COO`
- [ ] Memory should be < 200MB initially
- [ ] After 1 hour of operation: < 300MB
- [ ] After 24 hours: < 400MB
- [ ] If exceeds 512MB, process auto-restarts

### 7.2 CPU Usage

- [ ] CPU usage should be < 10% at idle
- [ ] CPU usage during message processing: < 50%
- [ ] CPU should return to idle after processing

### 7.3 Disk Space

- [ ] Check available disk: `df -h`
- [ ] At least 5GB free space
- [ ] Logs directory: `du -sh ~/clawdbot/logs/`
- [ ] Should be < 100MB initially

### 7.4 Response Time

- [ ] Telegram message response: < 5 seconds
- [ ] WhatsApp message response: < 5 seconds
- [ ] Financial document generation: < 10 seconds
- [ ] Market research query: < 15 seconds

---

## ✅ Phase 8: Error Handling & Recovery

### 8.1 Graceful Shutdown

- [ ] Stop bot: `pm2 stop XCircle-COO`
- [ ] Verify process is stopped: `pm2 list`
- [ ] No error messages in logs

### 8.2 Auto-Restart on Crash

- [ ] Simulate crash: `pm2 kill` (kills daemon)
- [ ] Restart: `pm2 start ecosystem.config.js`
- [ ] Process should restart automatically
- [ ] Check: `pm2 list`

### 8.3 Error Logging

- [ ] Send invalid request to bot
- [ ] Check error logs: `pm2 logs XCircle-COO --err`
- [ ] Errors should be logged with timestamp
- [ ] Bot should continue running

### 8.4 Network Failure Recovery

- [ ] Simulate network issue (disconnect internet)
- [ ] Wait 30 seconds
- [ ] Reconnect internet
- [ ] Bot should reconnect automatically
- [ ] Check logs for reconnection message

---

## ✅ Phase 9: Security Verification

### 9.1 Credential Protection

- [ ] `.env` file permissions: `ls -la ~/.env` (should be -rw-------)
- [ ] No API keys in logs: `pm2 logs XCircle-COO | grep -i "api_key"`
- [ ] No credentials in code files
- [ ] `.env` is in `.gitignore`

### 9.2 Access Control

- [ ] Only authorized Telegram user can access bot
- [ ] Send message from unauthorized user
- [ ] Bot should reject with: "الوصول مقتصر على المستخدم المصرح له فقط"

### 9.3 Data Encryption

- [ ] All API calls use HTTPS
- [ ] Verify with: `curl -v` (should show SSL/TLS)
- [ ] Supermemory documents are encrypted in transit

---

## ✅ Phase 10: Documentation & Logs

### 10.1 Log Files

- [ ] `~/clawdbot/logs/out.log` exists
- [ ] `~/clawdbot/logs/error.log` exists
- [ ] Logs contain timestamps
- [ ] Logs are readable and informative

### 10.2 Documentation

- [ ] README.md is present and accurate
- [ ] DEPLOYMENT_GUIDE.md is complete
- [ ] QUICK_DEPLOYMENT.md is helpful
- [ ] PM2_SETUP_GUIDE.md is comprehensive

---

## 📋 Final Verification Checklist

| Component | Status | Notes |
|-----------|--------|-------|
| Node.js & Dependencies | ✅ | |
| Environment Variables | ✅ | |
| File Structure | ✅ | |
| PM2 Configuration | ✅ | |
| Telegram Bot | ✅ | |
| WhatsApp Integration | ✅ | |
| Time-Based Engine Selection | ✅ | |
| API Keys & Services | ✅ | |
| Performance & Resources | ✅ | |
| Error Handling | ✅ | |
| Security | ✅ | |
| Documentation | ✅ | |

---

## 🚀 Deployment Sign-Off

**Pre-Deployment Checklist Complete:** ✅

**Ready for Production Deployment:** YES / NO

**Tested By:** _______________

**Date:** _______________

**Notes:** 
```
[Add any notes or issues found during testing]
```

---

## 📞 Post-Deployment Monitoring

After deployment, monitor for:

1. **First 24 hours:**
   - [ ] Check logs every 2 hours
   - [ ] Monitor memory usage
   - [ ] Verify both Telegram and WhatsApp are connected
   - [ ] Test each module at least once

2. **First week:**
   - [ ] Daily log review
   - [ ] Weekly performance report
   - [ ] User feedback collection
   - [ ] Bug fixes if needed

3. **Ongoing:**
   - [ ] Weekly monitoring
   - [ ] Monthly performance review
   - [ ] Quarterly security audit
   - [ ] Continuous improvement

---

**Testing Status:** ✅ Ready for Deployment

**Last Updated:** January 28, 2024
