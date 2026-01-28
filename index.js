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

require('dotenv').config();
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
    ALLOWED_TELEGRAM_USER_IDS: parseInt(process.env.ALLOWED_TELEGRAM_USER_IDS),
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

const groq = new Groq({ apiKey: config.GROQ_API_KEY });
const anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
const genAI = new GoogleGenerativeAI(config.GOOGLE_API_KEY);

// ==================== MODULE INITIALIZATION ====================

const financialSuite = new FinancialSuite(config);
const schedulingModule = new SchedulingModule(config);
const recruitmentModule = new RecruitmentModule(config);
const memoryModule = new MemoryModule(config);

// ==================== BOT INITIALIZATION ====================

const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);
let whatsappClient = null;
let whatsappReady = false;

// ==================== SUPERMEMORY INTEGRATION ====================

/**
 * Save message to Supermemory
 */
async function saveToSupermemory(content, source, userId, messageType = 'message') {
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
        const founderPhoneNumber = process.env.FOUNDER_WHATSAPP_NUMBER;
        if (founderPhoneNumber && !message.from.includes(founderPhoneNumber)) {
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
        console.error('Groq error:', error);
        throw error;
    }
}

async function callClaude(prompt, systemMessage = SYSTEM_PROMPT) {
    try {
        const msg = await anthropic.messages.create({
            model: config.ANTHROPIC_MODEL,
            max_tokens: 4096,
            system: systemMessage,
            messages: [{ role: 'user', content: prompt }],
        });
        return msg.content[0].text;
    } catch (error) {
        console.error('Claude error:', error);
        throw error;
    }
}

async function callGemini(prompt, fileData = null) {
    try {
        const model = genAI.getGenerativeModel({ model: config.GOOGLE_MODEL });
        const fullPrompt = `${SYSTEM_PROMPT}\n\nالسؤال: ${prompt}`;
        
        if (fileData) {
            const result = await model.generateContent([fullPrompt, fileData]);
            return result.response.text();
        }
        
        const result = await model.generateContent(fullPrompt);
        return result.response.text();
    } catch (error) {
        console.error('Gemini error:', error);
        throw error;
    }
}

// ==================== MIDDLEWARE ====================

bot.use(async (ctx, next) => {
    if (ctx.from && ctx.from.id !== config.ALLOWED_TELEGRAM_USER_IDS) {
        return ctx.reply('عذراً، الوصول مقتصر على المستخدم المصرح له فقط.');
    }
    return next();
});

// ==================== COMMAND HANDLERS ====================

bot.start((ctx) => {
    const engine = getActiveEngine();
    ctx.reply(`مرحباً مسفر، الموظف الرقمي التنفيذي (Digital COO) لاكس سيركل جاهز للخدمة.
    
🕐 الوقت الحالي (الرياض): ${engine.riyadhHour}:00
⚙️ المحرك النشط: ${engine.primary}
🔍 أداة البحث: ${engine.agentic}
💾 Supermemory: ✅ مفعل
📱 WhatsApp: ${whatsappReady ? '✅ متصل' : '⏳ جاري الاتصال'}

الأوامر المتاحة:
/help - عرض جميع الأوامر
/invoice - إنشاء فاتورة
/schedule - جدولة اجتماع
/search - البحث في السوق
/recruit - البحث عن مواهب
/memory - إدارة الذاكرة المؤسسية
/report - إنشاء تقرير
    `);

    // Save to Supermemory
    saveToSupermemory(
        `Bot started by ${ctx.from.first_name}`,
        'telegram',
        ctx.from.id,
        'bot_start'
    );
});

bot.command('help', (ctx) => {
    ctx.reply(`📋 قائمة الأوامر المتاحة:

💰 **الوحدة المالية:**
/invoice - إنشاء فاتورة
/quotation - إنشاء عرض سعر
/letterhead - إنشاء رسالة رسمية
/accounting - إرسال ملخص محاسبي

📅 **وحدة الجدولة:**
/schedule - جدولة اجتماع
/availability - التحقق من التوفر
/events - عرض الأحداث

👥 **وحدة التوظيف:**
/recruit - البحث عن مواهب
/market - تحليل السوق
/competitors - تحليل المنافسين
/vc - تتبع نشاط رأس المال الجريء

💾 **وحدة الذاكرة:**
/save - حفظ في الذاكرة
/search - البحث في الذاكرة
/recall - استرجاع وثيقة

📊 **التقارير:**
/report - إنشاء تقرير
/summary - ملخص تنفيذي
/stats - إحصائيات النظام
    `);
});

// ==================== TEXT MESSAGE HANDLER ====================

bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const engine = getActiveEngine();

    try {
        await ctx.sendChatAction('typing');

        // Save to Supermemory
        await saveToSupermemory(
            `Telegram: ${text}`,
            'telegram',
            ctx.from.id,
            'telegram_message'
        );

        let response;

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
            const docId = await memoryModule.saveToMemory(content, 'telegram', ctx.from.id);
            response = `✓ تم حفظ الوثيقة بنجاح (ID: ${docId})`;
        } else if (text.toLowerCase().includes('code') || text.includes('برمج')) {
            response = await callClaude(text);
        } else if (text.length > 500 || text.includes('تحليل')) {
            response = await callGemini(text);
        } else {
            response = engine.isPeakTime ? await callClaude(text) : await callGroq(text);
        }

        // Save response to Supermemory
        await saveToSupermemory(
            `Response: ${response}`,
            'telegram',
            ctx.from.id,
            'telegram_response'
        );

        await ctx.reply(response);

    } catch (error) {
        console.error('Text handler error:', error);
        ctx.reply('❌ عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة لاحقاً.');
    }
});

// ==================== ERROR HANDLING ====================

bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('❌ حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.');
});

// ==================== GRACEFUL SHUTDOWN ====================

process.once('SIGINT', async () => {
    console.log('\n⏹️ Shutting down bot...');
    await bot.stop('SIGINT');
    if (whatsappClient) {
        await whatsappClient.destroy();
    }
    process.exit(0);
});

process.once('SIGTERM', async () => {
    console.log('\n⏹️ Shutting down bot...');
    await bot.stop('SIGTERM');
    if (whatsappClient) {
        await whatsappClient.destroy();
    }
    process.exit(0);
});

// ==================== BOT LAUNCH ====================

async function startBot() {
    try {
        // Launch Telegram bot
        await bot.launch({ dropPendingUpdates: true });
        console.log('✅ Telegram bot launched successfully');

        // Initialize WhatsApp
        await initializeWhatsApp();

        // Log active configuration
        const engine = getActiveEngine();
        console.log(`
╔════════════════════════════════════════╗
║   XCircle Digital COO - Active Config  ║
╠════════════════════════════════════════╣
║ Company: ${config.COMPANY_NAME}
║ Founder: ${config.FOUNDER_NAME}
║ Primary Engine: ${engine.primary}
║ Agentic Tool: ${engine.agentic}
║ Time Window: ${engine.timeWindow}
║ Riyadh Hour: ${engine.riyadhHour}:00
║ Supermemory: ✅ ACTIVATED
║ WhatsApp: 🔄 INITIALIZING
╚════════════════════════════════════════╝
        `);

    } catch (error) {
        console.error('Bot startup error:', error);
        process.exit(1);
    }
}

// ==================== START ====================

startBot().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

module.exports = {
    bot,
    whatsappClient,
    getActiveEngine,
    financialSuite,
    schedulingModule,
    recruitmentModule,
    memoryModule,
    saveToSupermemory
};
