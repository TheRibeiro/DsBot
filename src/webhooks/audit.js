/**
 * Audit Log Poller
 * 
 * Polls PHP API for new audit logs and posts to Discord channel
 */

const { Logger } = require('../../logger');
const { formatAuditLogEmbed, formatBatchSummary, shouldLogEvent } = require('../formatters/audit');
const { getInstance: getState } = require('../storage/state');

class AuditPoller {
    constructor(client, options = {}) {
        this.client = client;
        this.apiUrl = options.apiUrl;
        this.apiToken = options.apiToken;
        this.logsChannelId = options.logsChannelId;
        this.pollIntervalMs = options.pollIntervalMs || 30000; // 30 seconds
        this.batchThreshold = options.batchThreshold || 10; // Aggregate if > 10 logs
        this.running = false;
        this.intervalId = null;
        this.state = getState();
    }

    /**
     * Start polling
     */
    start() {
        if (this.running) {
            Logger.warn('Audit poller already running');
            return;
        }

        if (!this.apiUrl || !this.apiToken) {
            Logger.warn('Audit poller not configured (missing API URL or token)');
            return;
        }

        this.running = true;
        Logger.info(`📊 Audit poller started (interval: ${this.pollIntervalMs}ms)`);

        // Run immediately
        this.poll();

        // Then run on interval
        this.intervalId = setInterval(() => this.poll(), this.pollIntervalMs);
    }

    /**
     * Stop polling
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.running = false;
        Logger.info('📊 Audit poller stopped');
    }

    /**
     * Poll for new logs
     */
    async poll() {
        try {
            const lastId = this.state.getLastAuditId();
            const logs = await this.fetchLogs(lastId);

            if (!logs || logs.length === 0) {
                return;
            }

            Logger.info(`📊 Fetched ${logs.length} new audit logs`);

            // Filter logs that should be sent
            const filteredLogs = logs.filter(log => shouldLogEvent(log.event_type));

            if (filteredLogs.length === 0) {
                // Still update last ID even if nothing to post
                const maxId = Math.max(...logs.map(l => l.id));
                this.state.setLastAuditId(maxId);
                return;
            }

            // Post to Discord
            await this.postToDiscord(filteredLogs);

            // Update last synced ID
            const maxId = Math.max(...logs.map(l => l.id));
            this.state.setLastAuditId(maxId);

        } catch (error) {
            Logger.error('Audit poll error:', error.message);
        }
    }

    /**
     * Fetch logs from PHP API
     */
    async fetchLogs(sinceId = 0, limit = 50) {
        const url = `${this.apiUrl}/api/discord/audit_logs.php?since_id=${sinceId}&limit=${limit}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'API error');
            }

            return data.logs;

        } catch (error) {
            Logger.error(`Failed to fetch audit logs: ${error.message}`);
            return null;
        }
    }

    /**
     * Post logs to Discord channel
     */
    async postToDiscord(logs) {
        try {
            const channel = await this.client.channels.fetch(this.logsChannelId);

            if (!channel) {
                Logger.error(`Logs channel ${this.logsChannelId} not found`);
                return;
            }

            // If too many logs, send summary instead
            if (logs.length > this.batchThreshold) {
                const summary = formatBatchSummary(logs, Math.ceil(this.pollIntervalMs / 60000));
                if (summary) {
                    await channel.send({ embeds: [summary] });
                }

                // Still send critical events individually
                const criticalLogs = logs.filter(l => l.severity === 'critical');
                for (const log of criticalLogs.slice(0, 5)) {
                    const embed = formatAuditLogEmbed(log);
                    await channel.send({ embeds: [embed] });
                    await this.delay(500); // Rate limit protection
                }
            } else {
                // Send each log as individual embed
                for (const log of logs) {
                    const embed = formatAuditLogEmbed(log);
                    await channel.send({ embeds: [embed] });
                    await this.delay(300);
                }
            }

            Logger.info(`📊 Posted ${logs.length} logs to #logs-inhouse`);

        } catch (error) {
            Logger.error(`Failed to post to Discord: ${error.message}`);
        }
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Report Poller (for polling mode)
 * 
 * Polls for pending reports that don't have Discord tickets yet
 */
class ReportPoller {
    constructor(ticketManager, options = {}) {
        this.ticketManager = ticketManager;
        this.apiUrl = options.apiUrl;
        this.apiToken = options.apiToken;
        this.pollIntervalMs = options.pollIntervalMs || 30000;
        this.running = false;
        this.intervalId = null;
    }

    start() {
        if (this.running) return;

        if (!this.apiUrl || !this.apiToken) {
            Logger.warn('Report poller not configured');
            return;
        }

        this.running = true;
        Logger.info(`📢 Report poller started (interval: ${this.pollIntervalMs}ms)`);

        this.poll();
        this.intervalId = setInterval(() => this.poll(), this.pollIntervalMs);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.running = false;
        Logger.info('📢 Report poller stopped');
    }

    async poll() {
        try {
            const response = await fetch(`${this.apiUrl}/api/discord/pending_reports.php?limit=5`, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.success || !data.reports || data.reports.length === 0) {
                return;
            }

            Logger.info(`📢 Found ${data.reports.length} pending reports`);

            for (const report of data.reports) {
                try {
                    await this.ticketManager.createTicketChannel(report);
                    await this.delay(1000); // Rate limit
                } catch (error) {
                    Logger.error(`Failed to create ticket for report #${report.report_id}:`, error.message);
                }
            }

        } catch (error) {
            Logger.error('Report poll error:', error.message);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { AuditPoller, ReportPoller };
