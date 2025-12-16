/**
 * HMAC Security Module
 * 
 * Validates HMAC-SHA256 signatures for webhook authentication
 * and provides replay attack protection via timestamp validation
 */

const crypto = require('crypto');
const { Logger } = require('../../logger');

class HmacSecurity {
    constructor(secret, options = {}) {
        this.secret = secret;
        this.timestampToleranceMs = options.timestampToleranceMs || 5 * 60 * 1000; // 5 minutes
        this.securityLogsChannelId = options.securityLogsChannelId || null;
        this.discordClient = options.discordClient || null;
    }

    /**
     * Generate HMAC-SHA256 signature
     * @param {string} body - Request body
     * @param {number} timestamp - Unix timestamp
     * @returns {string} HMAC signature
     */
    generateSignature(body, timestamp) {
        const message = `${timestamp}.${body}`;
        return crypto.createHmac('sha256', this.secret).update(message).digest('hex');
    }

    /**
     * Verify HMAC signature from request
     * @param {string} body - Request body
     * @param {string} signature - Provided signature
     * @param {string|number} timestamp - Provided timestamp
     * @returns {{ valid: boolean, error?: string }}
     */
    verifySignature(body, signature, timestamp) {
        // Validate timestamp first (replay protection)
        const timestampMs = parseInt(timestamp, 10) * 1000;
        const now = Date.now();

        if (isNaN(timestampMs)) {
            return { valid: false, error: 'Invalid timestamp format' };
        }

        if (Math.abs(now - timestampMs) > this.timestampToleranceMs) {
            return { valid: false, error: 'Timestamp expired (replay attack protection)' };
        }

        // Validate signature
        const expectedSignature = this.generateSignature(body, timestamp);

        try {
            const isValid = crypto.timingSafeEqual(
                Buffer.from(signature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            );

            if (!isValid) {
                return { valid: false, error: 'Invalid signature' };
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: 'Signature comparison failed' };
        }
    }

    /**
     * Express middleware for HMAC validation
     * @returns {Function} Express middleware
     */
    middleware() {
        return (req, res, next) => {
            const signature = req.headers['x-signature'];
            const timestamp = req.headers['x-timestamp'];
            const authHeader = req.headers.authorization;

            // Also accept Bearer token as alternative
            if (authHeader === `Bearer ${this.secret}`) {
                // Simple Bearer auth passed, still need timestamp for replay protection
                if (timestamp) {
                    const timestampMs = parseInt(timestamp, 10) * 1000;
                    if (Math.abs(Date.now() - timestampMs) > this.timestampToleranceMs) {
                        this.logSecurityEvent(req, 'Timestamp expired with Bearer auth');
                        return res.status(401).json({ error: 'Timestamp expired' });
                    }
                }
                return next();
            }

            // Require HMAC signature
            if (!signature || !timestamp) {
                this.logSecurityEvent(req, 'Missing signature or timestamp');
                return res.status(401).json({ error: 'Missing authentication headers' });
            }

            // Get raw body (requires express.raw() or similar)
            const body = typeof req.body === 'string'
                ? req.body
                : JSON.stringify(req.body);

            const result = this.verifySignature(body, signature, timestamp);

            if (!result.valid) {
                this.logSecurityEvent(req, result.error);
                return res.status(401).json({ error: result.error });
            }

            next();
        };
    }

    /**
     * Log security events to Discord channel
     */
    async logSecurityEvent(req, reason) {
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 12);

        Logger.warn(`🔒 Security event: ${reason} | IP hash: ${ipHash} | Path: ${req.path}`);

        if (this.discordClient && this.securityLogsChannelId) {
            try {
                const channel = await this.discordClient.channels.fetch(this.securityLogsChannelId);
                if (channel) {
                    await channel.send({
                        embeds: [{
                            title: '🔒 Security Alert',
                            color: 0xff0000,
                            fields: [
                                { name: 'Reason', value: reason, inline: true },
                                { name: 'IP Hash', value: `\`${ipHash}\``, inline: true },
                                { name: 'Path', value: `\`${req.path}\``, inline: true },
                                { name: 'Method', value: req.method, inline: true }
                            ],
                            timestamp: new Date().toISOString()
                        }]
                    });
                }
            } catch (error) {
                Logger.error('Failed to log security event to Discord:', error.message);
            }
        }
    }
}

/**
 * Create signature for outgoing requests to PHP
 */
function createOutgoingSignature(body, secret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${bodyStr}`).digest('hex');

    return { signature, timestamp };
}

module.exports = { HmacSecurity, createOutgoingSignature };
