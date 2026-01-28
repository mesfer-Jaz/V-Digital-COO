/**
 * XCircle Digital COO - Scheduling & Logistics Module
 * 
 * Module for:
 * - Google Calendar integration
 * - Event creation and management
 * - Availability checking
 * - Meeting invite generation
 */

const { google } = require('googleapis');
const nodemailer = require('nodemailer');

class SchedulingModule {
    constructor(config) {
        this.config = config;

        // Initialize Google Calendar API
        this.auth = new google.auth.GoogleAuth({
            keyFile: config.GOOGLE_SERVICE_ACCOUNT_JSON,
            scopes: ['https://www.googleapis.com/auth/calendar']
        });

        this.calendar = null;
        this.initializeCalendar();

        // Email transporter for meeting invites
        this.emailTransporter = nodemailer.createTransport({
            host: config.EMAIL_HOST,
            port: parseInt(config.EMAIL_PORT),
            secure: true,
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASS.replace(/"/g, '')
            }
        });
    }

    async initializeCalendar() {
        const authClient = await this.auth.getClient();
        this.calendar = google.calendar({ version: 'v3', auth: authClient });
    }

    /**
     * Check availability for a given date/time range
     * @param {string} calendarId - Calendar ID (or 'primary' for main calendar)
     * @param {Date} startTime - Start time
     * @param {Date} endTime - End time
     * @returns {Promise<Object>} - Availability info
     */
    async checkAvailability(calendarId = 'primary', startTime, endTime) {
        try {
            if (!this.calendar) await this.initializeCalendar();

            const response = await this.calendar.freebusy.query({
                resource: {
                    timeMin: startTime.toISOString(),
                    timeMax: endTime.toISOString(),
                    items: [{ id: calendarId }]
                }
            });

            const busyTimes = response.data.calendars[calendarId].busy || [];
            const isFree = busyTimes.length === 0;

            return {
                isFree,
                busyTimes,
                timeSlot: {
                    start: startTime.toISOString(),
                    end: endTime.toISOString()
                },
                message: isFree 
                    ? `✓ Available from ${startTime.toLocaleTimeString()} to ${endTime.toLocaleTimeString()}`
                    : `✗ Busy during this time. Conflicts: ${busyTimes.length}`
            };

        } catch (error) {
            console.error('Availability check error:', error);
            throw error;
        }
    }

    /**
     * Create a calendar event
     * @param {Object} eventData - Event details
     * @returns {Promise<Object>} - Created event
     */
    async createEvent(eventData) {
        try {
            if (!this.calendar) await this.initializeCalendar();

            const {
                title,
                description = '',
                startTime,
                endTime,
                attendees = [],
                location = '',
                reminders = [
                    { method: 'email', minutes: 30 },
                    { method: 'popup', minutes: 15 }
                ],
                calendarId = 'primary',
                conferenceData = null
            } = eventData;

            // Validate inputs
            if (!title || !startTime || !endTime) {
                throw new Error('Missing required event fields: title, startTime, endTime');
            }

            const event = {
                summary: title,
                description: description,
                start: {
                    dateTime: new Date(startTime).toISOString(),
                    timeZone: 'Asia/Riyadh'
                },
                end: {
                    dateTime: new Date(endTime).toISOString(),
                    timeZone: 'Asia/Riyadh'
                },
                location: location,
                attendees: attendees.map(email => ({ email })),
                reminders: {
                    useDefault: false,
                    overrides: reminders
                },
                conferenceData: conferenceData
            };

            // Add conference data if requested (Google Meet)
            if (conferenceData === 'GOOGLE_MEET') {
                event.conferenceData = {
                    conferenceType: 'hangoutsMeet'
                };
            }

            const response = await this.calendar.events.insert({
                calendarId: calendarId,
                resource: event,
                conferenceDataVersion: conferenceData ? 1 : 0,
                sendNotifications: true
            });

            console.log(`Event created: ${response.data.id}`);

            return {
                eventId: response.data.id,
                eventLink: response.data.htmlLink,
                title: response.data.summary,
                startTime: response.data.start.dateTime,
                endTime: response.data.end.dateTime,
                attendees: response.data.attendees || [],
                message: `✓ Event "${title}" created successfully`
            };

        } catch (error) {
            console.error('Event creation error:', error);
            throw error;
        }
    }

    /**
     * Find available time slots for a meeting
     * @param {Object} options - Search options
     * @returns {Promise<Array>} - Available time slots
     */
    async findAvailableSlots(options) {
        try {
            if (!this.calendar) await this.initializeCalendar();

            const {
                calendarId = 'primary',
                startDate,
                endDate,
                duration = 60, // minutes
                workingHoursStart = 9, // 9 AM
                workingHoursEnd = 17 // 5 PM
            } = options;

            const availableSlots = [];
            const currentDate = new Date(startDate);
            const finalDate = new Date(endDate);

            while (currentDate <= finalDate) {
                // Skip weekends
                if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                    // Check each hour in working hours
                    for (let hour = workingHoursStart; hour < workingHoursEnd; hour++) {
                        const slotStart = new Date(currentDate);
                        slotStart.setHours(hour, 0, 0, 0);

                        const slotEnd = new Date(slotStart);
                        slotEnd.setMinutes(slotEnd.getMinutes() + duration);

                        try {
                            const availability = await this.checkAvailability(
                                calendarId,
                                slotStart,
                                slotEnd
                            );

                            if (availability.isFree) {
                                availableSlots.push({
                                    start: slotStart.toISOString(),
                                    end: slotEnd.toISOString(),
                                    display: `${slotStart.toLocaleDateString()} ${slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                });
                            }
                        } catch (error) {
                            console.error(`Error checking slot ${slotStart}:`, error);
                        }
                    }
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            return availableSlots;

        } catch (error) {
            console.error('Find available slots error:', error);
            throw error;
        }
    }

    /**
     * Update an existing event
     * @param {string} eventId - Event ID
     * @param {Object} updateData - Updated event data
     * @returns {Promise<Object>} - Updated event
     */
    async updateEvent(eventId, updateData) {
        try {
            if (!this.calendar) await this.initializeCalendar();

            const {
                title,
                description,
                startTime,
                endTime,
                attendees,
                location,
                calendarId = 'primary'
            } = updateData;

            // Get existing event
            const existingEvent = await this.calendar.events.get({
                calendarId: calendarId,
                eventId: eventId
            });

            // Prepare update
            const updatedEvent = {
                ...existingEvent.data,
                summary: title || existingEvent.data.summary,
                description: description || existingEvent.data.description,
                location: location || existingEvent.data.location
            };

            if (startTime) {
                updatedEvent.start = {
                    dateTime: new Date(startTime).toISOString(),
                    timeZone: 'Asia/Riyadh'
                };
            }

            if (endTime) {
                updatedEvent.end = {
                    dateTime: new Date(endTime).toISOString(),
                    timeZone: 'Asia/Riyadh'
                };
            }

            if (attendees) {
                updatedEvent.attendees = attendees.map(email => ({ email }));
            }

            const response = await this.calendar.events.update({
                calendarId: calendarId,
                eventId: eventId,
                resource: updatedEvent,
                sendNotifications: true
            });

            return {
                eventId: response.data.id,
                message: '✓ Event updated successfully'
            };

        } catch (error) {
            console.error('Event update error:', error);
            throw error;
        }
    }

    /**
     * Delete an event
     * @param {string} eventId - Event ID
     * @param {string} calendarId - Calendar ID
     * @returns {Promise<void>}
     */
    async deleteEvent(eventId, calendarId = 'primary') {
        try {
            if (!this.calendar) await this.initializeCalendar();

            await this.calendar.events.delete({
                calendarId: calendarId,
                eventId: eventId,
                sendNotifications: true
            });

            console.log(`Event ${eventId} deleted`);

        } catch (error) {
            console.error('Event deletion error:', error);
            throw error;
        }
    }

    /**
     * Get events for a date range
     * @param {Object} options - Query options
     * @returns {Promise<Array>} - List of events
     */
    async getEvents(options) {
        try {
            if (!this.calendar) await this.initializeCalendar();

            const {
                calendarId = 'primary',
                startTime,
                endTime,
                maxResults = 10
            } = options;

            const response = await this.calendar.events.list({
                calendarId: calendarId,
                timeMin: new Date(startTime).toISOString(),
                timeMax: new Date(endTime).toISOString(),
                maxResults: maxResults,
                singleEvents: true,
                orderBy: 'startTime'
            });

            return response.data.items || [];

        } catch (error) {
            console.error('Get events error:', error);
            throw error;
        }
    }

    /**
     * Send meeting invite email
     * @param {Object} meetingData - Meeting details
     * @returns {Promise<void>}
     */
    async sendMeetingInvite(meetingData) {
        try {
            const {
                title,
                description,
                startTime,
                endTime,
                attendees,
                organizer,
                location = '',
                meetingLink = ''
            } = meetingData;

            const startDate = new Date(startTime);
            const endDate = new Date(endTime);

            const emailBody = `
            <h2>${title}</h2>
            <p><strong>Date:</strong> ${startDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</p>
            <p><strong>Time:</strong> ${startDate.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            })} - ${endDate.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}</p>
            ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
            ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
            <p>${description || ''}</p>
            <p>---</p>
            <p>Organized by: ${organizer}</p>
            `;

            const mailOptions = {
                from: `"${this.config.EMAIL_FROM_NAME}" <${this.config.EMAIL_USER}>`,
                to: attendees.join(', '),
                subject: `Meeting Invitation: ${title}`,
                html: emailBody
            };

            await this.emailTransporter.sendMail(mailOptions);
            console.log('Meeting invite sent successfully');

        } catch (error) {
            console.error('Send meeting invite error:', error);
            throw error;
        }
    }

    /**
     * Create recurring event
     * @param {Object} eventData - Event details with recurrence
     * @returns {Promise<Object>} - Created recurring event
     */
    async createRecurringEvent(eventData) {
        try {
            if (!this.calendar) await this.initializeCalendar();

            const {
                title,
                description = '',
                startTime,
                endTime,
                recurrence = [], // e.g., ['RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR']
                attendees = [],
                location = '',
                calendarId = 'primary'
            } = eventData;

            const event = {
                summary: title,
                description: description,
                start: {
                    dateTime: new Date(startTime).toISOString(),
                    timeZone: 'Asia/Riyadh'
                },
                end: {
                    dateTime: new Date(endTime).toISOString(),
                    timeZone: 'Asia/Riyadh'
                },
                recurrence: recurrence,
                location: location,
                attendees: attendees.map(email => ({ email })),
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 30 },
                        { method: 'popup', minutes: 15 }
                    ]
                }
            };

            const response = await this.calendar.events.insert({
                calendarId: calendarId,
                resource: event,
                sendNotifications: true
            });

            return {
                eventId: response.data.id,
                eventLink: response.data.htmlLink,
                title: response.data.summary,
                recurrence: response.data.recurrence,
                message: `✓ Recurring event "${title}" created successfully`
            };

        } catch (error) {
            console.error('Recurring event creation error:', error);
            throw error;
        }
    }

    /**
     * Parse natural language command to create event
     * @param {string} command - Natural language command
     * @returns {Promise<Object>} - Parsed event data
     */
    async parseEventCommand(command) {
        try {
            // Simple parsing logic - can be enhanced with NLP
            // Examples:
            // "Schedule meeting Team Standup tomorrow at 10:00 for 30 minutes"
            // "Create event Project Review on 2024-02-02 at 14:00"

            const patterns = {
                meetingTitle: /(?:schedule|create|add)\s+(?:meeting|event)?\s+([^,]+?)(?:\s+(?:on|at|for|with))?/i,
                date: /(?:on|date:)\s+(\d{4}-\d{2}-\d{2}|tomorrow|today|next\s+\w+)/i,
                time: /(?:at|time:)\s+(\d{1,2}):(\d{2})\s*(?:am|pm)?/i,
                duration: /(?:for|duration:)\s+(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i,
                attendees: /(?:with|attendees?:)\s+([^,]+(?:,\s*[^,]+)*)/i
            };

            const parsed = {
                title: '',
                startTime: null,
                endTime: null,
                attendees: [],
                duration: 60
            };

            // Extract title
            const titleMatch = command.match(patterns.meetingTitle);
            if (titleMatch) {
                parsed.title = titleMatch[1].trim();
            }

            // Extract date
            const dateMatch = command.match(patterns.date);
            if (dateMatch) {
                const dateStr = dateMatch[1];
                if (dateStr === 'today') {
                    parsed.date = new Date();
                } else if (dateStr === 'tomorrow') {
                    parsed.date = new Date();
                    parsed.date.setDate(parsed.date.getDate() + 1);
                } else {
                    parsed.date = new Date(dateStr);
                }
            }

            // Extract time
            const timeMatch = command.match(patterns.time);
            if (timeMatch && parsed.date) {
                let hour = parseInt(timeMatch[1]);
                const minute = parseInt(timeMatch[2]);
                
                // Handle PM
                if (command.match(/pm/i) && hour !== 12) {
                    hour += 12;
                } else if (command.match(/am/i) && hour === 12) {
                    hour = 0;
                }

                parsed.startTime = new Date(parsed.date);
                parsed.startTime.setHours(hour, minute, 0, 0);
            }

            // Extract duration
            const durationMatch = command.match(patterns.duration);
            if (durationMatch) {
                let minutes = parseInt(durationMatch[1]);
                if (durationMatch[0].match(/hour/i)) {
                    minutes *= 60;
                }
                parsed.duration = minutes;
            }

            // Calculate end time
            if (parsed.startTime) {
                parsed.endTime = new Date(parsed.startTime);
                parsed.endTime.setMinutes(parsed.endTime.getMinutes() + parsed.duration);
            }

            // Extract attendees
            const attendeesMatch = command.match(patterns.attendees);
            if (attendeesMatch) {
                parsed.attendees = attendeesMatch[1]
                    .split(',')
                    .map(email => email.trim())
                    .filter(email => email.includes('@'));
            }

            return parsed;

        } catch (error) {
            console.error('Command parsing error:', error);
            throw error;
        }
    }
}

module.exports = SchedulingModule;
