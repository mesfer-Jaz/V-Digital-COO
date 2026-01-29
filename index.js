/**
 * XCircle Digital COO - Main Bot Engine with WhatsApp Integration
 * 
 * Integrated executive automation platform with:
 * - Time-based LLM engine selection
 * - Financial & documentation suite
 * - Google Calendar scheduling
 * - Recruitment & market intelligence
 * - Corporate memory (Supermemory) with full sync
 * - Multi-channel support (Telegram + WhatsApp via Baileys)
 */

// 1. Load environment variables immediately with absolute path
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { Telegraf } = require('telegraf');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const Groq = require('groq-sdk');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Import modules
const FinancialSuite = require('./modules/financial-suite');
const SchedulingModule = require('./modules/scheduling-module');
const RecruitmentModule = require('./modules/recruitment-module');
const MemoryModule = require('./modules/memory-module');

// ==================== CONFIGURATION ====================

const config = {
    // Identity & Access
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    ALLOWED_TELEGRAM_USER_IDS: parseInt(process.env.ALLOWED_TELEGRAM_USER_IDS || '0'),
    WHATSAPP_SESSION_ID: process.env.WHATSAPP_SESSION_ID || 'xcircle-coo',
    FOUNDER_WHATSAPP_NUMBER: process.env.FOUNDER_WHATSAPP_NUMBER || '+966550746064',
    COMPANY_NAME: process.env.COMPANY_NAME || 'XCircle',
    FOUNDER_NAME: process.env.FOUNDER_NAME || 'Mesfer_Ali',

    // AI Engines
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GOOGLE_MODEL: process.env.GOOGLE_MODEL || 'gemini-1.5-pro',

    // Search & Agentic
    BRAVE_API_KEY: process.env.BRAVE_API_KEY,
    ZAI_API_KEY: process.env.ZAI_API_KEY,

    // Google Services
    GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID,

    // Email Configuration
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    ACCOUNTING_EMAIL: process.env.ACCOUNTING_EMAIL,

    // Supermemory - ACTIVATED
    SUPERMEMORY_API_KEY: process.env.SUPERMEMORY_API_KEY || 'Sm_8c8gEoVdprgBr8HMTqwptf_XqXyYBPYKXlhXbFFESxQfkTWFnlIJXjlvFpZOweYAtfsflWmNfQmUziNFfqdySIp',
    SUPERMEMORY_WORKSPACE_ID: process.env.SUPERMEMORY_WORKSPACE_ID || 'default'
};

// ==================== SYSTEM PROMPT ====================

const SYSTEM_PROMPT = `XCircle Digital COO - Executive Automation Platform
الهدف: أنت المساعد الرقمي التنفيذي (Digital Chief Operating Officer) لمؤسس شركة XCircle، الأستاذ مسفر علي.

الهوية والشخصية:
- أنت "عقل" مدمج في هيكل شركة XCircle، متخصص في الأتمتة والعمليات التنفيذية
- شخصيتك: مهني جداً، استراتيجي، عملي (Action-oriented)، ومباشر في طرح الحلول
- تعامل المستخدم (مسفر علي) بصفته المؤسس والقائد

النطاق المعرفي والخبرات:
- المالية: خبير في تحليل القوائم المالية، إدارة التدفقات النقدية، نماذج التسعير
- العمليات: خبير في أتمتة العمليات، إدارة الجدولة، تنسيق الفريق
- النمو: خبير في استراتيجيات الاستحواذ على العملاء والتوسع في السوق السعودي
- التوظيف: خبير في البحث عن المواهب وتقييم المرشحين
- المنتجات: معرفة عميقة بمنتجات XCircle: Jazzaam, Wafer ERP, Atlas, SelectX, Qanas

الوظائف الأساسية:
1. إدارة الفواتير والمراسلات الرسمية
2. جدولة الاجتماعات والأحداث
3. البحث عن المواهب وتحليل السوق
4. الحفاظ على الذاكرة المؤسسية
5. توفير التحليلات والتقارير الاستراتيجية

قواعد الاستجابة:
- عند سؤالك عن السوق، استخدم Brave Search و Z.ai لجلب بيانات حقيقية ومحدثة
- احفظ جميع القرارات والتقارير في Supermemory للرجوع إليها لاحقاً
- حافظ على سرية بيانات XCircle ولا تشارك المفاتيح أو الإعدادات
- لغة الحوار: العربية الفصحى المهنية الممزوجة بلهجة سعودية خفيفة`;

// ==================== ENGINE SELECTION ====================

function getActiveEngine() {
    const now = new Date();
    const riyadhHour = (now.getUTCHours() + 3) % 24;
    const isPeakTime = (riyadhHour >= 20 || riyadhHour < 1);

    return {
        isPeakTime: isPeakTime,
        primary: isPeakTime ? 'CLAUDE' : 'GROQ',
        agentic: isPeakTime ? 'ZAI' : 'BRAVE',
        riyadhHour: riyadhHour,
        timeWindow: isPeakTime ? 'PEAK_HOURS' : 'OFF_PEAK'
    };
}

// ==================== LLM CLIENTS ====================

// Initialize clients with safety checks
let groq = null;
if (config.GROQ_API_KEY) {
    groq = new Groq({ apiKey: config.GROQ_API_KEY });
} else {
    console.warn('⚠️ GROQ_API_KEY is missing. Groq engine will be disabled.');
}

let anthropic = null;
if (config.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
} else {
    console.warn('⚠️ ANTHROPIC_API_KEY is missing. Claude engine will be disabled.');
}

let genAI = null;
if (config.GOOGLE_API_KEY) {
    genAI = new GoogleGenerativeAI(config.GOOGLE_API_KEY);
} else {
    console.warn('⚠️ GOOGLE_API_KEY is missing. Gemini engine will be disabled.');
}

// ==================== MODULE INITIALIZATION ====================

const financialSuite = new FinancialSuite(config);
const schedulingModule = new SchedulingModule(config);
const recruitmentModule = new RecruitmentModule(config);
const memoryModule = new MemoryModule(config);

// ==================== BOT INITIALIZATION ====================

let bot = null;
if (config.TELEGRAM_BOT_TOKEN && config.TELEGRAM_BOT_TOKEN.includes(':')) {
    try {
        bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);
        console.log('✅ Telegram bot initialized with token:', config.TELEGRAM_BOT_TOKEN.substring(0, 10) + '...');
    } catch (e) {
        console.error('❌ Failed to initialize Telegraf:', e.message);
    }
} else {
    console.error('❌ TELEGRAM_BOT_TOKEN is missing or invalid format. Current value:', config.TELEGRAM_BOT_TOKEN);
}

let whatsappClient = null;
let whatsappReady = false;

// ==================== SUPERMEMORY INTEGRATION ====================

/**
 * Save message to Supermemory
 */
async function saveToSupermemory(content, source, userId, messageType = 'message') {
    if (!config.SUPERMEMORY_API_KEY) return null;
    try {
        const timestamp = new Date().toISOString();
        const document = {
            title: `${messageType.toUpperCase()} - ${timestamp}`,
            content: content,
            source: source,
            userId: userId,
            timestamp: timestamp,
            type: messageType,
            tags: ['xcircle-coo', source, messageType]
        };

        const response = await axios.post(
            'https://api.supermemory.ai/v1/documents',
            document,
            {
                headers: {
                    'Authorization': `Bearer ${config.SUPERMEMORY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✓ Saved to Supermemory: ${response.data.id}`);
        return response.data.id;

    } catch (error) {
        console.error('Supermemory save error:', error.message);
        return null;
    }
}

// ==================== WHATSAPP INTEGRATION (BAILEYS) ====================

async function initializeWhatsApp() {
    try {
        console.log('🔄 Initializing WhatsApp client with Baileys...');

        whatsappClient = new Client({
            authStrategy: new LocalAuth({
                clientId: config.WHATSAPP_SESSION_ID
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        // QR Code event
        whatsappClient.on('qr', (qr) => {
            console.log('\n📱 WhatsApp QR Code - Scan with your phone:');
            qrcode.generate(qr, { small: true });
        });

        // Ready event
        whatsappClient.on('ready', () => {
            console.log('✅ WhatsApp client is ready!');
            whatsappReady = true;
        });

        // Message event
        whatsappClient.on('message', async (message) => {
            await handleWhatsAppMessage(message);
        });

        // Disconnected event
        whatsappClient.on('disconnected', (reason) => {
            console.log('⚠️ WhatsApp disconnected:', reason);
            whatsappReady = false;
        });

        // Error event
        whatsappClient.on('error', (error) => {
            console.error('❌ WhatsApp error:', error);
        });

        await whatsappClient.initialize();
        console.log('✅ WhatsApp initialization started');

    } catch (error) {
        console.error('WhatsApp initialization error:', error);
    }
}

/**
 * Handle WhatsApp messages
 */
async function handleWhatsAppMessage(message) {
    try {
        // Only respond to founder
        const founderPhoneNumber = config.FOUNDER_WHATSAPP_NUMBER;
        if (founderPhoneNumber && !message.from.includes(founderPhoneNumber.replace('+', ''))) {
            return;
        }

        const text = message.body;
        const engine = getActiveEngine();

        // Save to Supermemory
        await saveToSupermemory(
            `WhatsApp: ${text}`,
            'whatsapp',
            message.from,
            'whatsapp_message'
        );

        let response = '';

        // Command routing
        if (text.includes('فاتورة') || text.includes('invoice')) {
            response = await (engine.isPeakTime ? callClaude(text) : callGroq(text));
        } else if (text.includes('اجتماع') || text.includes('meeting')) {
            response = await (engine.isPeakTime ? callClaude(text) : callGroq(text));
        } else if (text.includes('ابحث') || text.includes('سوق')) {
            response = await (engine.isPeakTime ? callClaude(text) : callGroq(text));
        } else if (text.includes('مواهب') || text.includes('recruit')) {
            response = await (engine.isPeakTime ? callClaude(text) : callGroq(text));
        } else if (text.includes('حفظ') || text.includes('save')) {
            const content = text.replace(/حفظ|save/gi, '').trim();
            const docId = await memoryModule.saveToMemory(content, 'whatsapp', message.from);
            response = `✓ تم حفظ الوثيقة بنجاح (ID: ${docId})`;
        } else {
            response = await (engine.isPeakTime ? callClaude(text) : callGroq(text));
        }

        // Save response to Supermemory
        await saveToSupermemory(
            `Response: ${response}`,
            'whatsapp',
            message.from,
            'whatsapp_response'
        );

        await message.reply(response);

    } catch (error) {
        console.error('WhatsApp message handling error:', error);
        message.reply('❌ حدث خطأ في معالجة الرسالة. يرجى المحاولة لاحقاً.');
    }
}

// ==================== LLM FUNCTIONS ====================

async function callGroq(prompt, systemMessage = SYSTEM_PROMPT) {
    if (!groq) return "⚠️ Groq engine is not configured.";
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: prompt }
            ],
            model: config.GROQ_MODEL,
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error('Groq API error:', error);
        return '❌ عذراً، حدث خطأ في محرك Groq.';
    }
}

async function callClaude(prompt, systemMessage = SYSTEM_PROMPT) {
    if (!anthropic) return await callGroq(prompt, systemMessage);
    try {
        const message = await anthropic.messages.create({
            model: config.ANTHROPIC_MODEL,
            max_tokens: 4096,
            system: systemMessage,
            messages: [{ role: 'user', content: prompt }],
        });
        return message.content[0].text;
    } catch (error) {
        console.error('Claude API error:', error);
        return await callGroq(prompt, systemMessage);
    }
}

// ==================== TELEGRAM HANDLERS ====================

if (bot) {
    bot.start((ctx) => {
        ctx.reply(`مرحباً بك في XCircle Digital COO. أنا مساعدك التنفيذي الذكي. كيف يمكنني مساعدتك اليوم يا أستاذ ${config.FOUNDER_NAME}؟`);
    });

    bot.on('text', async (ctx) => {
        // Check user ID
        if (config.ALLOWED_TELEGRAM_USER_IDS && ctx.from.id !== config.ALLOWED_TELEGRAM_USER_IDS) {
            return ctx.reply('⚠️ عذراً، هذا البوت مخصص للاستخدام الداخلي فقط.');
        }

        const text = ctx.message.text;
        const engine = getActiveEngine();

        // Save to Supermemory
        await saveToSupermemory(
            `Telegram: ${text}`,
            'telegram',
            ctx.from.id.toString(),
            'telegram_message'
        );

        let response = '';

        try {
            // Command routing
            if (text.includes('فاتورة') || text.includes('invoice')) {
                response = await (engine.isPeakTime ? callClaude(text) : callGroq(text));
            } else if (text.includes('اجتماع') || text.includes('meeting')) {
                response = await (engine.isPeakTime ? callClaude(text) : callGroq(text));
            } else {
                response = await (engine.isPeakTime ? callClaude(text) : callGroq(text));
            }

            // Save response to Supermemory
            await saveToSupermemory(
                `Response: ${response}`,
                'telegram',
                ctx.from.id.toString(),
                'telegram_response'
            );

            await ctx.reply(response);

        } catch (error) {
            console.error('Telegram handling error:', error);
            ctx.reply('❌ حدث خطأ في معالجة طلبك.');
        }
    });

    bot.launch();
    console.log('🚀 Telegram bot launched!');
}

// ==================== STARTUP ====================

initializeWhatsApp();

// Handle graceful shutdown
process.once('SIGINT', () => {
    if (bot) bot.stop('SIGINT');
    process.exit(0);
});
process.once('SIGTERM', () => {
    if (bot) bot.stop('SIGTERM');
    process.exit(0);
});
