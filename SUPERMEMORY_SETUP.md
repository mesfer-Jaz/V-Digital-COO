# Supermemory Integration Guide

## 🧠 Overview

Supermemory is the "corporate brain" of XCircle Digital COO. Every conversation, decision, and document is automatically archived for permanent recall and strategic analysis.

**API Key Status:** ✅ **ACTIVATED**
```
Sm_8c8gEoVdprgBr8HMTqwptf_XqXyYBPYKXlhXbFFESxQfkTWFnlIJXjlvFpZOweYAtfsflWmNfQmUziNFfqdySIp
```

---

## 📋 What Gets Saved to Supermemory?

| Event | Type | Frequency |
|-------|------|-----------|
| Telegram messages | `telegram_message` | Every message |
| Telegram responses | `telegram_response` | Every response |
| WhatsApp messages | `whatsapp_message` | Every message |
| WhatsApp responses | `whatsapp_response` | Every response |
| Financial documents | `invoice`, `quotation` | On generation |
| Meeting notes | `meeting_note` | On scheduling |
| Market research | `market_research` | On completion |
| Candidate profiles | `candidate_profile` | On search |
| Strategic decisions | `decision` | On user save |
| Bot events | `bot_start`, `bot_error` | On occurrence |

---

## 🔧 Configuration

### Environment Variables

The following variables are already configured in `.env`:

```bash
# Supermemory API Key (Already set)
SUPERMEMORY_API_KEY=Sm_8c8gEoVdprgBr8HMTqwptf_XqXyYBPYKXlhXbFFESxQfkTWFnlIJXjlvFpZOweYAtfsflWmNfQmUziNFfqdySIp

# Workspace ID (Uses default workspace)
SUPERMEMORY_WORKSPACE_ID=default
```

### Automatic Sync

The bot automatically syncs to Supermemory:
- ✅ Every Telegram message and response
- ✅ Every WhatsApp message and response
- ✅ All financial documents
- ✅ All scheduling decisions
- ✅ All recruitment activities
- ✅ All strategic decisions

---

## 📤 How Supermemory Sync Works

### 1. Message Capture

When a user sends a message:

```javascript
// Telegram
await saveToSupermemory(
    `Telegram: ${text}`,
    'telegram',
    ctx.from.id,
    'telegram_message'
);

// WhatsApp
await saveToSupermemory(
    `WhatsApp: ${text}`,
    'whatsapp',
    message.from,
    'whatsapp_message'
);
```

### 2. Response Generation

After generating a response:

```javascript
await saveToSupermemory(
    `Response: ${response}`,
    'telegram',
    ctx.from.id,
    'telegram_response'
);
```

### 3. Document Archival

When creating documents:

```javascript
// Invoice
await saveToSupermemory(
    `Invoice #${invoiceId}: ${JSON.stringify(invoiceData)}`,
    'telegram',
    userId,
    'invoice'
);

// Meeting
await saveToSupermemory(
    `Meeting: ${eventTitle} on ${eventDate}`,
    'telegram',
    userId,
    'meeting_note'
);
```

---

## 🔍 Retrieving Information from Supermemory

### API Endpoint

```bash
GET https://api.supermemory.ai/v1/documents/search
Authorization: Bearer Sm_8c8gEoVdprgBr8HMTqwptf_XqXyYBPYKXlhXbFFESxQfkTWFnlIJXjlvFpZOweYAtfsflWmNfQmUziNFfqdySIp
```

### Search Examples

**Search for all invoices:**
```bash
curl -X GET "https://api.supermemory.ai/v1/documents/search?q=invoice&type=invoice" \
  -H "Authorization: Bearer Sm_8c8gEoVdprgBr8HMTqwptf_XqXyYBPYKXlhXbFFESxQfkTWFnlIJXjlvFpZOweYAtfsflWmNfQmUziNFfqdySIp"
```

**Search for market research:**
```bash
curl -X GET "https://api.supermemory.ai/v1/documents/search?q=Saudi tech trends&type=market_research" \
  -H "Authorization: Bearer Sm_8c8gEoVdprgBr8HMTqwptf_XqXyYBPYKXlhXbFFESxQfkTWFnlIJXjlvFpZOweYAtfsflWmNfQmUziNFfqdySIp"
```

**Search for decisions:**
```bash
curl -X GET "https://api.supermemory.ai/v1/documents/search?q=decision&type=decision" \
  -H "Authorization: Bearer Sm_8c8gEoVdprgBr8HMTqwptf_XqXyYBPYKXlhXbFFESxQfkTWFnlIJXjlvFpZOweYAtfsflWmNfQmUziNFfqdySIp"
```

---

## 📊 Supermemory Dashboard

### Access Your Workspace

1. Go to https://supermemory.ai
2. Log in with your account
3. Navigate to workspace: `default`
4. View all archived documents

### Key Features

- **Full-Text Search:** Search across all saved documents
- **Tagging:** Automatically tagged with source and type
- **Timeline View:** See all documents in chronological order
- **Export:** Download documents as JSON or PDF
- **Analytics:** View usage patterns and trends

---

## 🧪 Testing Supermemory Integration

### Test 1: Manual Save

**Send to Telegram bot:**
```
/save "تقرير مهم: نتائج الربع الأول 2024"
```

**Expected in logs:**
```
✓ Saved to Supermemory: doc_12345678
```

### Test 2: Automatic Message Sync

**Send any message to bot:**
```
مرحباً، ما هي أفضل استراتيجية للنمو؟
```

**Expected in logs:**
```
✓ Saved to Supermemory: doc_87654321
```

### Test 3: Verify in Dashboard

1. Go to https://supermemory.ai
2. Search for your message
3. Should appear in results with timestamp

### Test 4: WhatsApp Sync

**Send message via WhatsApp:**
```
حفظ: قرار استراتيجي بشأن التوسع الإقليمي
```

**Expected in logs:**
```
✓ Saved to Supermemory: doc_11223344
```

---

## 🔐 Security & Privacy

### Data Protection

- ✅ All documents encrypted in transit (HTTPS)
- ✅ API key stored securely in `.env`
- ✅ No sensitive data logged
- ✅ Access restricted to authorized users only

### Best Practices

1. **Never share API key** in code or logs
2. **Rotate key quarterly** for security
3. **Monitor access** in Supermemory dashboard
4. **Backup documents** regularly
5. **Review saved content** for sensitive information

---

## 📈 Supermemory Analytics

### Usage Metrics

Track in Supermemory dashboard:
- Total documents saved
- Documents by type
- Search frequency
- Most accessed documents
- Storage usage

### Example Queries

**Most recent decisions:**
```
type:decision sort:date_desc limit:10
```

**All invoices from January:**
```
type:invoice date:2024-01-* sort:date_desc
```

**Market research on Saudi tech:**
```
type:market_research "Saudi" "tech" sort:date_desc
```

---

## 🚨 Troubleshooting

### Documents Not Saving

**Check logs:**
```bash
pm2 logs XCircle-COO | grep -i supermemory
```

**Verify API key:**
```bash
grep SUPERMEMORY_API_KEY ~/clawdbot/.env
```

**Test API directly:**
```bash
curl -X POST "https://api.supermemory.ai/v1/documents" \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Document",
    "content": "This is a test",
    "tags": ["test"]
  }'
```

### Search Not Working

1. Verify documents are saved (check dashboard)
2. Wait 30 seconds for indexing
3. Try simpler search queries
4. Check workspace ID is correct

### Storage Limit Exceeded

1. Check storage usage in dashboard
2. Archive old documents
3. Delete unnecessary documents
4. Upgrade plan if needed

---

## 🔄 Backup & Recovery

### Export All Documents

```bash
curl -X GET "https://api.supermemory.ai/v1/documents/export" \
  -H "Authorization: Bearer YOUR_KEY" \
  > supermemory_backup.json
```

### Scheduled Backups

Add to crontab:
```bash
0 2 * * * curl -X GET "https://api.supermemory.ai/v1/documents/export" \
  -H "Authorization: Bearer YOUR_KEY" \
  > ~/backups/supermemory_$(date +\%Y\%m\%d).json
```

---

## 📚 Advanced Features

### Custom Tags

Add custom tags to documents:
```javascript
const document = {
    title: "Strategic Decision",
    content: "...",
    tags: ['xcircle-coo', 'strategic', 'Q1-2024', 'priority-high']
};
```

### Document Relationships

Link related documents:
```javascript
const document = {
    title: "Invoice #001",
    content: "...",
    relatedDocuments: ['meeting_note_123', 'decision_456']
};
```

### Custom Metadata

Add metadata for better organization:
```javascript
const document = {
    title: "...",
    content: "...",
    metadata: {
        client: "XCircle",
        project: "Digital COO",
        priority: "high",
        dueDate: "2024-02-01"
    }
};
```

---

## 📞 Support

For Supermemory issues:

1. **Check logs:** `pm2 logs XCircle-COO | grep -i supermemory`
2. **Verify API key:** `grep SUPERMEMORY_API_KEY ~/.env`
3. **Test API:** Use curl commands above
4. **Contact Supermemory:** support@supermemory.ai

---

## ✅ Verification Checklist

- [ ] API key is set in `.env`
- [ ] Bot is running: `pm2 list`
- [ ] Logs show "Saved to Supermemory" messages
- [ ] Documents appear in dashboard
- [ ] Search functionality works
- [ ] Backup process is scheduled
- [ ] Security practices are followed

---

**Status:** ✅ Supermemory Integration Active
**API Key:** ✅ Configured
**Sync Status:** ✅ Automatic

**Last Updated:** January 28, 2024
