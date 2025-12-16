/**
 * Reports Webhook Handler
 * 
 * Receives webhook from PHP when a report is created
 * Creates ticket channel in Discord
 */

const { Router } = require('express');
const { Logger } = require('../../logger');

/**
 * Create Express router for report webhooks
 */
function createReportsRouter(ticketManager, hmacSecurity) {
    const router = Router();

    /**
     * POST /webhook/report-created
     * Receives new report notification from PHP site
     */
    router.post('/report-created', hmacSecurity.middleware(), async (req, res) => {
        const reportData = req.body;

        Logger.info(`📨 Received report webhook for #${reportData.report_id}`);

        try {
            // Validate required fields
            if (!reportData.report_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing report_id'
                });
            }

            // Create ticket channel
            const result = await ticketManager.createTicketChannel(reportData);

            res.json({
                success: true,
                channel_id: result.channel_id,
                channel_name: result.channel_name
            });

        } catch (error) {
            Logger.error('Error processing report webhook:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    return router;
}

module.exports = { createReportsRouter };
