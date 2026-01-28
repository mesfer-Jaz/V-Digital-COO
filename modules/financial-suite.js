/**
 * XCircle Digital COO - Financial & Documentation Suite
 * 
 * Module for:
 * - Invoice generation (PDF)
 * - Invoice data extraction
 * - Official correspondence (letterheads, quotations)
 * - Accounting sync and email forwarding
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class FinancialSuite {
    constructor(config) {
        this.config = config;
        this.anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
        this.genAI = new GoogleGenerativeAI(config.GOOGLE_API_KEY);
        this.drive = google.drive('v3');
        this.sheets = google.sheets('v4');
        
        // Initialize email transporter
        this.emailTransporter = nodemailer.createTransport({
            host: config.EMAIL_HOST,
            port: parseInt(config.EMAIL_PORT),
            secure: true,
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASS.replace(/"/g, '')
            }
        });

        // Google Auth
        this.auth = new google.auth.GoogleAuth({
            keyFile: config.GOOGLE_SERVICE_ACCOUNT_JSON,
            scopes: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/spreadsheets'
            ]
        });

        this.invoiceDir = path.join(process.cwd(), 'invoices');
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.invoiceDir)) {
            fs.mkdirSync(this.invoiceDir, { recursive: true });
        }
    }

    /**
     * Generate professional invoice as PDF
     * @param {Object} invoiceData - Invoice details
     * @returns {Promise<string>} - Path to generated PDF
     */
    async generateInvoice(invoiceData) {
        try {
            const {
                invoiceNumber,
                date,
                dueDate,
                customer,
                items,
                taxRate = 0.15,
                notes = '',
                currency = 'SAR'
            } = invoiceData;

            // Validate required fields
            if (!invoiceNumber || !customer || !items || items.length === 0) {
                throw new Error('Missing required invoice fields');
            }

            // Generate invoice content using Claude
            const invoiceContent = await this.generateInvoiceContent(invoiceData);

            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            const filename = `invoice_${invoiceNumber}_${Date.now()}.pdf`;
            const filepath = path.join(this.invoiceDir, filename);
            const stream = fs.createWriteStream(filepath);

            doc.pipe(stream);

            // Header with XCircle branding
            this.addInvoiceHeader(doc);

            // Invoice details
            doc.fontSize(14).font('Helvetica-Bold').text('INVOICE', 50, 100);
            doc.fontSize(10).font('Helvetica').text(`Invoice #: ${invoiceNumber}`, 50, 130);
            doc.text(`Date: ${new Date(date).toLocaleDateString('en-US')}`, 50, 145);
            doc.text(`Due Date: ${new Date(dueDate).toLocaleDateString('en-US')}`, 50, 160);

            // Customer information
            doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 200);
            doc.fontSize(10).font('Helvetica').text(customer.name, 50, 220);
            if (customer.email) doc.text(customer.email, 50, 235);
            if (customer.phone) doc.text(customer.phone, 50, 250);
            if (customer.address) doc.text(customer.address, 50, 265);

            // Items table
            const tableTop = 320;
            const itemHeight = 25;
            const col1 = 50;
            const col2 = 280;
            const col3 = 380;
            const col4 = 480;

            // Table header
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Description', col1, tableTop);
            doc.text('Quantity', col2, tableTop);
            doc.text('Unit Price', col3, tableTop);
            doc.text('Amount', col4, tableTop);

            // Table separator
            doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            // Table rows
            let currentY = tableTop + 25;
            let subtotal = 0;

            doc.font('Helvetica');
            items.forEach((item, index) => {
                const amount = item.quantity * item.unitPrice;
                subtotal += amount;

                doc.fontSize(9).text(item.description, col1, currentY, { width: 200 });
                doc.text(item.quantity.toString(), col2, currentY);
                doc.text(`${currency} ${item.unitPrice.toFixed(2)}`, col3, currentY);
                doc.text(`${currency} ${amount.toFixed(2)}`, col4, currentY);

                currentY += itemHeight;
            });

            // Totals section
            const taxAmount = subtotal * taxRate;
            const total = subtotal + taxAmount;

            currentY += 10;
            doc.moveTo(col1, currentY).lineTo(550, currentY).stroke();
            currentY += 15;

            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Subtotal:', col3, currentY);
            doc.text(`${currency} ${subtotal.toFixed(2)}`, col4, currentY);

            currentY += 20;
            doc.text(`Tax (${(taxRate * 100).toFixed(0)}%):`, col3, currentY);
            doc.text(`${currency} ${taxAmount.toFixed(2)}`, col4, currentY);

            currentY += 20;
            doc.fontSize(12).text('TOTAL:', col3, currentY);
            doc.text(`${currency} ${total.toFixed(2)}`, col4, currentY);

            // Notes
            if (notes) {
                currentY += 40;
                doc.fontSize(10).font('Helvetica-Bold').text('Notes:', 50, currentY);
                currentY += 20;
                doc.fontSize(9).font('Helvetica').text(notes, 50, currentY, { width: 500 });
            }

            // Footer
            doc.fontSize(8).text(
                'Thank you for your business!',
                50,
                750,
                { align: 'center' }
            );

            doc.end();

            return new Promise((resolve, reject) => {
                stream.on('finish', () => resolve(filepath));
                stream.on('error', reject);
            });

        } catch (error) {
            console.error('Invoice generation error:', error);
            throw error;
        }
    }

    /**
     * Generate invoice content using Claude
     */
    async generateInvoiceContent(invoiceData) {
        const prompt = `Generate a professional invoice summary for the following details:
        Invoice Number: ${invoiceData.invoiceNumber}
        Customer: ${invoiceData.customer.name}
        Items: ${JSON.stringify(invoiceData.items)}
        
        Provide a brief professional summary suitable for an invoice.`;

        const message = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }]
        });

        return message.content[0].text;
    }

    /**
     * Add XCircle branding to invoice header
     */
    addInvoiceHeader(doc) {
        // Company name
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#1B3A7A').text('XCircle', 50, 30);
        doc.fontSize(10).font('Helvetica').fillColor('#000000').text('Digital Solutions', 50, 55);

        // Contact info
        doc.fontSize(8).text('info@xcircle.co | +966-XX-XXXX-XXXX', 50, 70);
    }

    /**
     * Extract data from incoming invoice (PDF or image)
     * @param {string} filePath - Path to invoice file
     * @returns {Promise<Object>} - Extracted invoice data
     */
    async extractInvoiceData(filePath) {
        try {
            // Read file and convert to base64
            const fileData = fs.readFileSync(filePath);
            const base64Data = fileData.toString('base64');

            // Determine MIME type
            const ext = path.extname(filePath).toLowerCase();
            let mimeType = 'application/pdf';
            if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
            if (ext === '.png') mimeType = 'image/png';

            // Use Gemini for OCR and extraction
            const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

            const prompt = `Extract the following information from this invoice image/document:
            1. Invoice number
            2. Invoice date
            3. Due date
            4. Vendor/Supplier name
            5. Vendor email and phone
            6. Line items (description, quantity, unit price, amount)
            7. Subtotal
            8. Tax amount and rate
            9. Total amount
            10. Currency
            
            Return the data in JSON format.`;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                }
            ]);

            const responseText = result.response.text();
            
            // Parse JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Could not extract JSON from response');
            }

            const extractedData = JSON.parse(jsonMatch[0]);
            return extractedData;

        } catch (error) {
            console.error('Invoice extraction error:', error);
            throw error;
        }
    }

    /**
     * Upload invoice to Google Drive
     * @param {string} filePath - Path to invoice file
     * @param {string} folderId - Google Drive folder ID
     * @returns {Promise<string>} - File ID in Google Drive
     */
    async uploadToGoogleDrive(filePath, folderId) {
        try {
            const authClient = await this.auth.getClient();
            const drive = google.drive({ version: 'v3', auth: authClient });

            const fileMetadata = {
                name: path.basename(filePath),
                parents: [folderId]
            };

            const media = {
                mimeType: 'application/pdf',
                body: fs.createReadStream(filePath)
            };

            const file = await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id'
            });

            console.log(`File uploaded to Google Drive: ${file.data.id}`);
            return file.data.id;

        } catch (error) {
            console.error('Google Drive upload error:', error);
            throw error;
        }
    }

    /**
     * Generate official letterhead
     * @param {Object} letterData - Letter content
     * @returns {Promise<string>} - Path to generated PDF
     */
    async generateLetterhead(letterData) {
        try {
            const {
                recipientName,
                recipientTitle,
                recipientCompany,
                subject,
                body,
                signature = 'Mesfer Ali\nFounder & CEO, XCircle'
            } = letterData;

            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            const filename = `letterhead_${Date.now()}.pdf`;
            const filepath = path.join(this.invoiceDir, filename);
            const stream = fs.createWriteStream(filepath);

            doc.pipe(stream);

            // Header
            this.addInvoiceHeader(doc);

            // Date
            doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString('en-US')}`, 50, 120);

            // Recipient
            doc.fontSize(10).text(recipientName, 50, 160);
            if (recipientTitle) doc.text(recipientTitle, 50, 175);
            if (recipientCompany) doc.text(recipientCompany, 50, 190);

            // Greeting
            doc.fontSize(11).text('Dear ' + recipientName + ',', 50, 230);

            // Subject
            if (subject) {
                doc.fontSize(11).font('Helvetica-Bold').text(`Subject: ${subject}`, 50, 260);
            }

            // Body
            doc.fontSize(10).font('Helvetica').text(body, 50, 290, {
                width: 500,
                align: 'left'
            });

            // Signature
            doc.fontSize(10).text('\n\nBest regards,\n\n', 50, 600);
            doc.text(signature, 50, 660);

            doc.end();

            return new Promise((resolve, reject) => {
                stream.on('finish', () => resolve(filepath));
                stream.on('error', reject);
            });

        } catch (error) {
            console.error('Letterhead generation error:', error);
            throw error;
        }
    }

    /**
     * Generate quotation (عروض أسعار)
     * @param {Object} quotationData - Quotation details
     * @returns {Promise<string>} - Path to generated PDF
     */
    async generateQuotation(quotationData) {
        try {
            const {
                quotationNumber,
                date,
                validUntil,
                customer,
                items,
                taxRate = 0.15,
                currency = 'SAR',
                notes = ''
            } = quotationData;

            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            const filename = `quotation_${quotationNumber}_${Date.now()}.pdf`;
            const filepath = path.join(this.invoiceDir, filename);
            const stream = fs.createWriteStream(filepath);

            doc.pipe(stream);

            // Header
            this.addInvoiceHeader(doc);

            // Title
            doc.fontSize(16).font('Helvetica-Bold').text('عرض سعر', 50, 100);
            doc.fontSize(10).font('Helvetica').text(`Quotation #: ${quotationNumber}`, 50, 130);
            doc.text(`Date: ${new Date(date).toLocaleDateString('en-US')}`, 50, 145);
            doc.text(`Valid Until: ${new Date(validUntil).toLocaleDateString('en-US')}`, 50, 160);

            // Customer information
            doc.fontSize(11).font('Helvetica-Bold').text('Bill To:', 50, 200);
            doc.fontSize(10).font('Helvetica').text(customer.name, 50, 220);
            if (customer.email) doc.text(customer.email, 50, 235);
            if (customer.phone) doc.text(customer.phone, 50, 250);

            // Items table (similar to invoice)
            const tableTop = 300;
            const col1 = 50;
            const col2 = 280;
            const col3 = 380;
            const col4 = 480;

            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Description', col1, tableTop);
            doc.text('Quantity', col2, tableTop);
            doc.text('Unit Price', col3, tableTop);
            doc.text('Amount', col4, tableTop);

            doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            let currentY = tableTop + 25;
            let subtotal = 0;

            doc.font('Helvetica');
            items.forEach((item) => {
                const amount = item.quantity * item.unitPrice;
                subtotal += amount;

                doc.fontSize(9).text(item.description, col1, currentY, { width: 200 });
                doc.text(item.quantity.toString(), col2, currentY);
                doc.text(`${currency} ${item.unitPrice.toFixed(2)}`, col3, currentY);
                doc.text(`${currency} ${amount.toFixed(2)}`, col4, currentY);

                currentY += 25;
            });

            // Totals
            const taxAmount = subtotal * taxRate;
            const total = subtotal + taxAmount;

            currentY += 10;
            doc.moveTo(col1, currentY).lineTo(550, currentY).stroke();
            currentY += 15;

            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Subtotal:', col3, currentY);
            doc.text(`${currency} ${subtotal.toFixed(2)}`, col4, currentY);

            currentY += 20;
            doc.text(`Tax (${(taxRate * 100).toFixed(0)}%):`, col3, currentY);
            doc.text(`${currency} ${taxAmount.toFixed(2)}`, col4, currentY);

            currentY += 20;
            doc.fontSize(12).text('TOTAL:', col3, currentY);
            doc.text(`${currency} ${total.toFixed(2)}`, col4, currentY);

            // Notes
            if (notes) {
                currentY += 40;
                doc.fontSize(10).font('Helvetica-Bold').text('ملاحظات / Notes:', 50, currentY);
                currentY += 20;
                doc.fontSize(9).font('Helvetica').text(notes, 50, currentY, { width: 500 });
            }

            doc.end();

            return new Promise((resolve, reject) => {
                stream.on('finish', () => resolve(filepath));
                stream.on('error', reject);
            });

        } catch (error) {
            console.error('Quotation generation error:', error);
            throw error;
        }
    }

    /**
     * Send accounting summary email
     * @param {Object} summaryData - Financial summary
     * @returns {Promise<void>}
     */
    async sendAccountingSummary(summaryData) {
        try {
            const {
                period,
                revenue,
                expenses,
                profit,
                attachments = []
            } = summaryData;

            const emailBody = `
            <h2>Financial Summary - ${period}</h2>
            <p><strong>Revenue:</strong> SAR ${revenue.toFixed(2)}</p>
            <p><strong>Expenses:</strong> SAR ${expenses.toFixed(2)}</p>
            <p><strong>Profit:</strong> SAR ${profit.toFixed(2)}</p>
            <p>This is an automated financial summary from XCircle Digital COO.</p>
            `;

            const mailOptions = {
                from: `"${this.config.EMAIL_FROM_NAME}" <${this.config.EMAIL_USER}>`,
                to: this.config.ACCOUNTING_EMAIL,
                subject: `Financial Summary - ${period}`,
                html: emailBody,
                attachments: attachments
            };

            await this.emailTransporter.sendMail(mailOptions);
            console.log('Accounting summary sent successfully');

        } catch (error) {
            console.error('Email sending error:', error);
            throw error;
        }
    }

    /**
     * Sync extracted invoice data to Google Sheets
     * @param {Object} invoiceData - Extracted invoice data
     * @param {string} spreadsheetId - Google Sheets ID
     * @returns {Promise<void>}
     */
    async syncToGoogleSheets(invoiceData, spreadsheetId) {
        try {
            const authClient = await this.auth.getClient();
            const sheets = google.sheets({ version: 'v4', auth: authClient });

            const values = [
                [
                    invoiceData.invoiceNumber || '',
                    invoiceData.invoiceDate || '',
                    invoiceData.vendor || '',
                    invoiceData.totalAmount || '',
                    invoiceData.currency || 'SAR',
                    new Date().toISOString()
                ]
            ];

            await sheets.spreadsheets.values.append({
                spreadsheetId: spreadsheetId,
                range: 'Sheet1!A:F',
                valueInputOption: 'USER_ENTERED',
                resource: { values }
            });

            console.log('Invoice data synced to Google Sheets');

        } catch (error) {
            console.error('Google Sheets sync error:', error);
            throw error;
        }
    }
}

module.exports = FinancialSuite;
