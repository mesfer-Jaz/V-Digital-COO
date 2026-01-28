# XCircle Digital COO - Executive Automation Platform

> **Transform Your Operations: AI-Powered Executive Automation for XCircle**

---

## 📋 Overview

The XCircle Digital COO is a comprehensive executive automation platform that transforms the existing CFO bot into a full-scale Chief Operating Officer. It integrates advanced AI engines, intelligent scheduling, recruitment capabilities, and persistent corporate memory into a single, unified platform accessible via Telegram and WhatsApp.

**Key Features:**
- ⚙️ **Intelligent Engine Selection:** Automatically switches between Claude 3.5 Sonnet (peak hours) and Groq Llama 3 (off-peak) based on Riyadh time
- 💰 **Financial Automation:** Invoice generation, quotation creation, and accounting sync
- 📅 **Smart Scheduling:** Full Google Calendar integration with conflict detection
- 👥 **Talent Acquisition:** AI-powered candidate search and ranking on LinkedIn
- 💾 **Corporate Memory:** Supermemory integration for persistent knowledge management
- 📱 **Multi-Channel:** Seamless operation across Telegram and WhatsApp

---

## 🚀 Quick Start

### Prerequisites

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **API Keys:** Groq, Anthropic, Google, Brave Search, Z.ai, Supermemory
- **Google Service Account:** For Calendar and Drive access
- **Telegram Bot Token:** From @BotFather

### Installation (5 minutes)

```bash
# Clone the repository
git clone https://github.com/xcircle/digital-coo.git
cd digital-coo

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys and credentials
nano .env

# Start the bot
npm start
```

### Deployment to Production

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

**Option 1: PM2 (Recommended)**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

**Option 2: Docker**
```bash
docker-compose up -d
```

---

## 📦 Project Structure

```
xcircle-digital-coo/
├── index-upgraded.js                 # Main application file
├── modules/
│   ├── financial-suite.js           # Invoice & correspondence
│   ├── scheduling-module.js         # Google Calendar integration
│   ├── recruitment-module.js        # Talent & market research
│   └── memory-module.js             # Supermemory integration
├── package.json                      # Dependencies
├── ecosystem.config.js               # PM2 configuration
├── Dockerfile                        # Docker image definition
├── docker-compose.yml                # Multi-service setup
├── .env.example                      # Environment template
├── xcircle_digital_coo_architecture.md  # System design
├── DEPLOYMENT_GUIDE.md               # Setup & deployment
├── XCircle_Digital_COO_Final_Report.md  # Project summary
└── README.md                         # This file
```

---

## 🔧 Configuration

All configuration is managed through the `.env` file. Copy `.env.example` to `.env` and fill in your credentials:

```bash
# AI Engines
GROQ_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here

# Search & Agentic Tools
BRAVE_API_KEY=your_key_here
ZAI_API_KEY=your_key_here

# Google Services
GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/service-account.json
GOOGLE_DRIVE_FOLDER_ID=your_folder_id

# Telegram
TELEGRAM_BOT_TOKEN=your_token_here
ALLOWED_TELEGRAM_USER_IDS=your_user_id

# Email
EMAIL_USER=info@xcircle.co
EMAIL_PASS=your_app_password

# Supermemory
SUPERMEMORY_API_KEY=your_key_here
SUPERMEMORY_WORKSPACE_ID=your_workspace_id
```

---

## 💡 Core Features

### 1. Financial & Documentation Suite

**Generate Professional Invoices:**
```
/invoice
→ Creates branded PDF invoices with automatic numbering
```

**Create Quotations (عروض أسعار):**
```
/quotation
→ Generates bilingual quotations with professional formatting
```

**Extract Invoice Data:**
- Automatically processes incoming invoices using OCR
- Syncs data to Google Drive
- Updates accounting records

### 2. Scheduling & Logistics

**Schedule Meetings:**
```
/schedule "Team Standup" tomorrow at 10:00 for 30 minutes
→ Creates Google Calendar event with attendees
```

**Check Availability:**
```
/availability 2024-02-01
→ Shows free time slots for the day
```

**Find Available Slots:**
```
/find_slots 2024-02-01 2024-02-07
→ Suggests optimal meeting times
```

### 3. Talent Acquisition & Market Intelligence

**Search for Candidates:**
```
/recruit "Software Engineer" "Node.js, React" "Saudi Arabia"
→ Finds and ranks candidates on LinkedIn
```

**Market Research:**
```
/market "Saudi fintech trends"
→ Provides deep-dive analysis with sources
```

**Competitor Analysis:**
```
/competitors "Competitor1" "Competitor2"
→ Generates competitive intelligence report
```

**Track VC Activity:**
```
/vc_activity
→ Analyzes MENA venture capital trends
```

### 4. Corporate Memory

**Save to Memory:**
```
/save "Important decision: Pivot to B2B market"
→ Stores in Supermemory with auto-tagging
```

**Search Memory:**
```
/search "previous decisions on pricing"
→ Retrieves relevant documents
```

**Recall Document:**
```
/recall document_id
→ Displays full document content
```

---

## ⏰ Time-Based Engine Selection

The bot intelligently selects AI engines based on Riyadh time:

| Time Window | Primary Engine | Agentic Tool | Use Case |
| :--- | :--- | :--- | :--- |
| **20:00 - 01:00** | Claude 3.5 Sonnet | Z.ai | Strategic decisions, complex analysis |
| **01:00 - 20:00** | Groq Llama 3.3 | Brave Search | Quick responses, routine queries |

---

## 📊 API Documentation

### Telegram Commands

| Command | Usage | Description |
| :--- | :--- | :--- |
| `/start` | `/start` | Initialize bot |
| `/help` | `/help` | Show all commands |
| `/invoice` | `/invoice` | Create invoice |
| `/quotation` | `/quotation` | Create quotation |
| `/schedule` | `/schedule <details>` | Schedule meeting |
| `/availability` | `/availability <date>` | Check availability |
| `/recruit` | `/recruit <role> <skills>` | Search candidates |
| `/market` | `/market <query>` | Market research |
| `/competitors` | `/competitors <names>` | Competitor analysis |
| `/save` | `/save <content>` | Save to memory |
| `/search` | `/search <query>` | Search memory |
| `/recall` | `/recall <doc_id>` | Retrieve document |

### Module APIs

Each module exports a class with methods for programmatic access:

```javascript
// Financial Suite
const financialSuite = new FinancialSuite(config);
await financialSuite.generateInvoice(invoiceData);
await financialSuite.extractInvoiceData(filePath);
await financialSuite.generateQuotation(quotationData);

// Scheduling
const scheduling = new SchedulingModule(config);
await scheduling.createEvent(eventData);
await scheduling.checkAvailability(calendarId, start, end);
await scheduling.findAvailableSlots(options);

// Recruitment
const recruitment = new RecruitmentModule(config);
await recruitment.searchLinkedInCandidates(criteria);
await recruitment.getSaudiTechTrends();
await recruitment.analyzeCompetitors(competitors);

// Memory
const memory = new MemoryModule(config);
await memory.saveToMemory(content, source);
await memory.searchMemory(query);
await memory.retrieveDocument(docId);
```

---

## 🔒 Security

- **Credential Management:** All secrets stored in `.env`, never in code
- **Access Control:** Telegram access restricted to authorized user ID
- **Data Protection:** Secure API communication with HTTPS
- **Audit Trail:** All operations logged for compliance

---

## 📈 Monitoring

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs xcircle-coo

# System info
pm2 info xcircle-coo
```

### Docker Monitoring

```bash
# View logs
docker-compose logs -f xcircle-coo

# Check status
docker-compose ps

# Resource usage
docker stats xcircle-coo
```

---

## 🛠️ Troubleshooting

### Bot Not Responding

```bash
# Check if running
pm2 list

# View errors
pm2 logs xcircle-coo --err

# Restart
pm2 restart xcircle-coo
```

### API Key Errors

- Verify `.env` file exists and is properly formatted
- Check for special characters that need escaping
- Ensure all required keys are present

### Google Calendar Issues

- Verify service account JSON path
- Confirm Calendar API is enabled in Google Cloud Console
- Check that calendars are shared with service account email

---

## 📚 Documentation

- **[System Architecture](./xcircle_digital_coo_architecture.md)** - Detailed technical design
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Complete setup instructions
- **[Project Report](./XCircle_Digital_COO_Final_Report.md)** - Executive summary

---

## 🤝 Support

For issues, questions, or feature requests:

- **Email:** support@xcircle.co
- **Telegram:** @xcircle_support
- **GitHub Issues:** [Report a bug](https://github.com/xcircle/digital-coo/issues)

---

## 📝 License

© 2024 XCircle. All rights reserved.

---

## 🎯 Roadmap

**v1.1 (Q1 2024)**
- Slack integration
- Advanced analytics dashboard
- Custom report generation

**v1.2 (Q2 2024)**
- Microsoft Teams integration
- Salesforce CRM sync
- Automated expense categorization

**v2.0 (Q3 2024)**
- Fine-tuned LLM models
- Multi-language support
- Kubernetes deployment

---

**Version:** 1.0  
**Last Updated:** January 28, 2024  
**Status:** Production Ready

---

## 🙏 Acknowledgments

Built with ❤️ for XCircle by Manus AI.

Powered by:
- [Groq](https://groq.com) - High-speed AI inference
- [Anthropic](https://anthropic.com) - Claude AI
- [Google AI](https://ai.google.dev) - Gemini
- [Telegraf](https://telegraf.js.org) - Telegram bot framework
- [Google APIs](https://developers.google.com/apis-explorer) - Calendar & Drive

