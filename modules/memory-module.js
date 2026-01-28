/**
 * XCircle Digital COO - Corporate Memory & Multi-Channel Module
 * 
 * Module for:
 * - Supermemory integration for institutional knowledge
 * - Document and decision storage
 * - Multi-channel message handling (Telegram, WhatsApp)
 * - Knowledge base search and retrieval
 */

const axios = require('axios');
const { Telegraf } = require('telegraf');
const { Client, LocalAuth } = require('whatsapp-web.js');
const Anthropic = require('@anthropic-ai/sdk');

class MemoryModule {
    constructor(config) {
        this.config = config;
        this.anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
        this.supermemoryApiKey = config.SUPERMEMORY_API_KEY;
        this.supermemoryWorkspaceId = config.SUPERMEMORY_WORKSPACE_ID;

        // Initialize Telegram bot
        this.telegramBot = new Telegraf(config.TELEGRAM_BOT_TOKEN);
        this.setupTelegramHandlers();

        // Initialize WhatsApp client (Baileys)
        this.whatsappClient = null;
        this.initializeWhatsApp();

        // Memory store for session data
        this.memoryStore = new Map();
    }

    /**
     * Initialize WhatsApp client with Baileys
     */
    async initializeWhatsApp() {
        try {
            this.whatsappClient = new Client({
                authStrategy: new LocalAuth({
                    clientId: this.config.WHATSAPP_SESSION_ID || 'xcircle-bot'
                }),
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox']
                }
            });

            this.whatsappClient.on('ready', () => {
                console.log('WhatsApp client is ready');
            });

            this.whatsappClient.on('message', async (message) => {
                await this.handleWhatsAppMessage(message);
            });

            this.whatsappClient.on('auth_failure', (msg) => {
                console.error('WhatsApp authentication failure:', msg);
            });

            this.whatsappClient.on('disconnected', (reason) => {
                console.log('WhatsApp client disconnected:', reason);
            });

            await this.whatsappClient.initialize();

        } catch (error) {
            console.error('WhatsApp initialization error:', error);
        }
    }

    /**
     * Setup Telegram command handlers
     */
    setupTelegramHandlers() {
        this.telegramBot.command('memory', async (ctx) => {
            await ctx.reply('💾 Memory Module Active\n\nAvailable commands:\n/save - Save to memory\n/search - Search memory\n/recall - Recall information');
        });

        this.telegramBot.command('save', async (ctx) => {
            const args = ctx.message.text.split(' ').slice(1).join(' ');
            if (!args) {
                return ctx.reply('Usage: /save <document_title> <content>');
            }
            await this.saveToMemory(args, 'telegram', ctx.from.id);
            ctx.reply('✓ Document saved to corporate memory');
        });

        this.telegramBot.command('search', async (ctx) => {
            const query = ctx.message.text.split(' ').slice(1).join(' ');
            if (!query) {
                return ctx.reply('Usage: /search <query>');
            }
            const results = await this.searchMemory(query);
            ctx.reply(results);
        });

        this.telegramBot.command('recall', async (ctx) => {
            const documentId = ctx.message.text.split(' ')[1];
            if (!documentId) {
                return ctx.reply('Usage: /recall <document_id>');
            }
            const document = await this.retrieveDocument(documentId);
            ctx.reply(document);
        });
    }

    /**
     * Handle WhatsApp messages
     */
    async handleWhatsAppMessage(message) {
        try {
            const chat = await message.getChat();
            
            // Only respond to founder
            if (!this.isAuthorizedUser(message.from)) {
                return;
            }

            const text = message.body;

            // Command routing
            if (text.startsWith('/save')) {
                const content = text.replace('/save', '').trim();
                await this.saveToMemory(content, 'whatsapp', message.from);
                await message.reply('✓ Document saved to corporate memory');
            } else if (text.startsWith('/search')) {
                const query = text.replace('/search', '').trim();
                const results = await this.searchMemory(query);
                await message.reply(results);
            } else if (text.startsWith('/recall')) {
                const docId = text.replace('/recall', '').trim();
                const document = await this.retrieveDocument(docId);
                await message.reply(document);
            }

        } catch (error) {
            console.error('WhatsApp message handling error:', error);
        }
    }

    /**
     * Check if user is authorized
     */
    isAuthorizedUser(userId) {
        // Add WhatsApp user ID check here
        return true; // Placeholder
    }

    /**
     * Save document to Supermemory
     * @param {string} content - Document content
     * @param {string} source - Source (telegram, whatsapp, email)
     * @param {string} userId - User ID
     * @returns {Promise<string>} - Document ID
     */
    async saveToMemory(content, source = 'manual', userId = null) {
        try {
            // First, generate a title and summary using Claude
            const titleAndSummary = await this.generateDocumentMetadata(content);

            // Prepare document for Supermemory
            const document = {
                title: titleAndSummary.title,
                content: content,
                summary: titleAndSummary.summary,
                tags: titleAndSummary.tags,
                source: source,
                userId: userId,
                timestamp: new Date().toISOString(),
                type: titleAndSummary.type
            };

            // Save to Supermemory
            const response = await axios.post(
                `https://api.supermemory.ai/v1/workspaces/${this.supermemoryWorkspaceId}/documents`,
                document,
                {
                    headers: {
                        'Authorization': `Bearer ${this.supermemoryApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`Document saved to Supermemory: ${response.data.id}`);
            return response.data.id;

        } catch (error) {
            console.error('Save to memory error:', error);
            throw error;
        }
    }

    /**
     * Generate document metadata using Claude
     */
    async generateDocumentMetadata(content) {
        try {
            const prompt = `
                Analyze the following document and provide:
                1. A concise title (max 10 words)
                2. A brief summary (max 50 words)
                3. Relevant tags (5-10 tags)
                4. Document type (e.g., meeting_notes, decision, report, research, etc.)
                
                Document:
                ${content}
                
                Return as JSON with keys: title, summary, tags (array), type
            `;

            const message = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 500,
                messages: [{ role: 'user', content: prompt }]
            });

            const responseText = message.content[0].text;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return {
                title: 'Untitled Document',
                summary: content.substring(0, 50),
                tags: ['general'],
                type: 'document'
            };

        } catch (error) {
            console.error('Metadata generation error:', error);
            return {
                title: 'Untitled Document',
                summary: content.substring(0, 50),
                tags: ['general'],
                type: 'document'
            };
        }
    }

    /**
     * Search corporate memory
     * @param {string} query - Search query
     * @returns {Promise<string>} - Search results formatted for display
     */
    async searchMemory(query) {
        try {
            const response = await axios.get(
                `https://api.supermemory.ai/v1/workspaces/${this.supermemoryWorkspaceId}/search`,
                {
                    params: { q: query, limit: 10 },
                    headers: {
                        'Authorization': `Bearer ${this.supermemoryApiKey}`
                    }
                }
            );

            const results = response.data.results || [];

            if (results.length === 0) {
                return '❌ No documents found matching your query.';
            }

            let resultText = `📚 Found ${results.length} documents:\n\n`;
            results.forEach((doc, index) => {
                resultText += `${index + 1}. **${doc.title}**\n`;
                resultText += `   📌 ${doc.summary}\n`;
                resultText += `   🏷️ Tags: ${doc.tags.join(', ')}\n`;
                resultText += `   📅 ${new Date(doc.timestamp).toLocaleDateString()}\n\n`;
            });

            return resultText;

        } catch (error) {
            console.error('Search memory error:', error);
            return '❌ Error searching memory. Please try again.';
        }
    }

    /**
     * Retrieve full document from memory
     * @param {string} documentId - Document ID
     * @returns {Promise<string>} - Full document content
     */
    async retrieveDocument(documentId) {
        try {
            const response = await axios.get(
                `https://api.supermemory.ai/v1/workspaces/${this.supermemoryWorkspaceId}/documents/${documentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.supermemoryApiKey}`
                    }
                }
            );

            const doc = response.data;

            let resultText = `📄 **${doc.title}**\n\n`;
            resultText += `${doc.content}\n\n`;
            resultText += `---\n`;
            resultText += `📅 Created: ${new Date(doc.timestamp).toLocaleString()}\n`;
            resultText += `🏷️ Tags: ${doc.tags.join(', ')}\n`;
            resultText += `📌 Type: ${doc.type}\n`;

            return resultText;

        } catch (error) {
            console.error('Retrieve document error:', error);
            return '❌ Document not found.';
        }
    }

    /**
     * Save financial report to memory
     * @param {Object} reportData - Financial report data
     * @returns {Promise<string>} - Document ID
     */
    async saveFinancialReport(reportData) {
        try {
            const content = `
            Financial Report
            ================
            Period: ${reportData.period}
            Revenue: SAR ${reportData.revenue}
            Expenses: SAR ${reportData.expenses}
            Profit: SAR ${reportData.profit}
            
            Details:
            ${reportData.details || ''}
            `;

            return await this.saveToMemory(content, 'financial_report');

        } catch (error) {
            console.error('Save financial report error:', error);
            throw error;
        }
    }

    /**
     * Save meeting notes to memory
     * @param {Object} meetingData - Meeting information
     * @returns {Promise<string>} - Document ID
     */
    async saveMeetingNotes(meetingData) {
        try {
            const content = `
            Meeting Notes
            =============
            Date: ${meetingData.date}
            Attendees: ${meetingData.attendees.join(', ')}
            Topic: ${meetingData.topic}
            
            Agenda:
            ${meetingData.agenda || ''}
            
            Decisions:
            ${meetingData.decisions || ''}
            
            Action Items:
            ${meetingData.actionItems || ''}
            
            Next Steps:
            ${meetingData.nextSteps || ''}
            `;

            return await this.saveToMemory(content, 'meeting_notes');

        } catch (error) {
            console.error('Save meeting notes error:', error);
            throw error;
        }
    }

    /**
     * Save strategic decision to memory
     * @param {Object} decisionData - Decision information
     * @returns {Promise<string>} - Document ID
     */
    async saveStrategicDecision(decisionData) {
        try {
            const content = `
            Strategic Decision
            ==================
            Date: ${decisionData.date}
            Decision: ${decisionData.decision}
            
            Rationale:
            ${decisionData.rationale}
            
            Expected Impact:
            ${decisionData.expectedImpact}
            
            Implementation Timeline:
            ${decisionData.timeline}
            
            Owner: ${decisionData.owner}
            `;

            return await this.saveToMemory(content, 'strategic_decision');

        } catch (error) {
            console.error('Save strategic decision error:', error);
            throw error;
        }
    }

    /**
     * Get memory statistics
     * @returns {Promise<Object>} - Memory usage stats
     */
    async getMemoryStats() {
        try {
            const response = await axios.get(
                `https://api.supermemory.ai/v1/workspaces/${this.supermemoryWorkspaceId}/stats`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.supermemoryApiKey}`
                    }
                }
            );

            return response.data;

        } catch (error) {
            console.error('Get memory stats error:', error);
            return null;
        }
    }

    /**
     * Generate knowledge base summary
     * @returns {Promise<string>} - Knowledge base summary
     */
    async generateKnowledgeBaseSummary() {
        try {
            const response = await axios.get(
                `https://api.supermemory.ai/v1/workspaces/${this.supermemoryWorkspaceId}/documents`,
                {
                    params: { limit: 100 },
                    headers: {
                        'Authorization': `Bearer ${this.supermemoryApiKey}`
                    }
                }
            );

            const documents = response.data.documents || [];

            // Group by type
            const byType = {};
            documents.forEach(doc => {
                if (!byType[doc.type]) {
                    byType[doc.type] = [];
                }
                byType[doc.type].push(doc);
            });

            let summary = '📚 **Corporate Knowledge Base Summary**\n\n';
            summary += `Total Documents: ${documents.length}\n\n`;

            for (const [type, docs] of Object.entries(byType)) {
                summary += `**${type.replace(/_/g, ' ').toUpperCase()}**: ${docs.length} documents\n`;
            }

            return summary;

        } catch (error) {
            console.error('Generate knowledge base summary error:', error);
            return '❌ Error generating summary.';
        }
    }

    /**
     * Launch Telegram bot
     */
    async launchTelegramBot() {
        try {
            await this.telegramBot.launch();
            console.log('Telegram bot launched');
        } catch (error) {
            console.error('Telegram bot launch error:', error);
        }
    }

    /**
     * Stop Telegram bot
     */
    stopTelegramBot() {
        this.telegramBot.stop();
        console.log('Telegram bot stopped');
    }

    /**
     * Stop WhatsApp client
     */
    async stopWhatsAppClient() {
        if (this.whatsappClient) {
            await this.whatsappClient.destroy();
            console.log('WhatsApp client stopped');
        }
    }
}

module.exports = MemoryModule;
