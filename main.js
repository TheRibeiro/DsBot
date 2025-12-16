/**
 * Rematch Discord Bot - Extended Entry Point
 * 
 * This file extends the base bot with:
 * - Ticket system for report handling
 * - Audit log sync to Discord
 * - HMAC-secured webhooks
 * 
 * Use this file instead of index.js for full functionality:
 *   node main.js
 */

require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, Events, Collection } = require('discord.js');
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Logger } = require('./logger');

// Import integration modules
const { HmacSecurity } = require('./src/security/hmac');
const { TicketManager } = require('./src/tickets/manager');
const { setupButtonHandlers } = require('./src/tickets/buttons');
const { createReportsRouter } = require('./src/webhooks/reports');
const { AuditPoller, ReportPoller } = require('./src/webhooks/audit');
const { createRoleSyncRouter } = require('./src/webhooks/roleSync');

// Import base bot components
const { DiscordMatchBot, MatchChannelDB } = require('./index');

// ==================== EXTENDED CONFIG ====================

const extendedConfig = {
    // Ticket integration
    ticketsCategoryId: process.env.DISCORD_TICKETS_CATEGORY_ID,
    staffRoleId: process.env.DISCORD_STAFF_ROLE_ID,
    logsChannelId: process.env.DISCORD_LOGS_CHANNEL_ID,
    securityLogsChannelId: process.env.DISCORD_SECURITY_LOGS_CHANNEL_ID,

    // Site API
    siteApiUrl: process.env.SITE_API_URL || 'https://inhouse.blaidds.com',
    siteApiToken: process.env.SITE_API_TOKEN || process.env.WEBHOOK_SECRET,

    // Modes
    reportSyncMode: process.env.REPORT_SYNC_MODE || 'webhook', // 'webhook' or 'polling'
    auditPollInterval: parseInt(process.env.AUDIT_POLL_INTERVAL_MS || '30000'),

    // Core
    webhookSecret: process.env.WEBHOOK_SECRET,
    webhookPort: parseInt(process.env.WEBHOOK_PORT || process.env.PORT || '3001'),
    guildId: process.env.GUILD_ID
};

// ==================== EXTENDED BOT ====================

class ExtendedRematchBot extends DiscordMatchBot {
    constructor() {
        super();

        // Override client with additional intents
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        // Slash commands collection
        this.client.commands = new Collection();

        // Re-setup handlers with new client
        this.setupEventHandlers();

        // Integration components (initialized after ready)
        this.ticketManager = null;
        this.auditPoller = null;
        this.reportPoller = null;
        this.hmacSecurity = null;
    }

    setupEventHandlers() {
        this.client.once(Events.ClientReady, () => this.onExtendedReady());
        this.client.on(Events.VoiceStateUpdate, (oldState, newState) => this.onVoiceStateUpdate(oldState, newState));
        this.client.on(Events.InteractionCreate, interaction => this.onInteraction(interaction));

        // Load slash commands
        this.loadSlashCommands();
    }

    /**
     * Carrega todos os comandos slash da pasta src/commands
     */
    loadSlashCommands() {
        const commandsPath = path.join(__dirname, 'src', 'commands');

        // Verificar se a pasta existe
        if (!fs.existsSync(commandsPath)) {
            Logger.warn('⚠️ Pasta de comandos não encontrada, comandos slash desabilitados');
            return;
        }

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        Logger.info(`📦 Carregando ${commandFiles.length} comandos slash...`);

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                this.client.commands.set(command.data.name, command);
                Logger.info(`  ✅ Comando carregado: /${command.data.name}`);
            } else {
                Logger.warn(`  ⚠️ Comando ignorado: ${file} (falta 'data' ou 'execute')`);
            }
        }
    }

    /**
     * Handler de interações (sobrescreve o método do pai)
     * Processa tanto comandos slash customizados quanto o comando ping padrão
     */
    async onInteraction(interaction) {
        if (!interaction.isChatInputCommand()) return;

        // Comando padrão ping (do bot base)
        if (interaction.commandName === 'ping') {
            await interaction.reply({ content: '🏓 Pong! Bot está online.', ephemeral: true });
            return;
        }

        // Processar comandos slash customizados
        const command = this.client.commands.get(interaction.commandName);

        if (!command) {
            Logger.warn(`⚠️ Comando desconhecido: ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            Logger.error(`❌ Erro ao executar comando /${interaction.commandName}:`, error);

            const errorMessage = {
                content: '❌ Ocorreu um erro ao executar este comando.',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }

    async onExtendedReady() {
        // Call parent ready logic
        await this.onReady();

        Logger.info('🔌 Initializing extended integrations...');

        // Initialize HMAC security
        this.hmacSecurity = new HmacSecurity(extendedConfig.webhookSecret, {
            discordClient: this.client,
            securityLogsChannelId: extendedConfig.securityLogsChannelId
        });

        // Initialize Ticket Manager
        if (extendedConfig.ticketsCategoryId) {
            this.ticketManager = new TicketManager(this.client, {
                guildId: extendedConfig.guildId,
                ticketsCategoryId: extendedConfig.ticketsCategoryId,
                staffRoleId: extendedConfig.staffRoleId,
                logsChannelId: extendedConfig.logsChannelId,
                siteApiUrl: extendedConfig.siteApiUrl,
                siteApiToken: extendedConfig.siteApiToken
            });

            // Setup button handlers
            setupButtonHandlers(this.client, this.ticketManager);

            Logger.info('✅ Ticket Manager initialized');
        } else {
            Logger.warn('⚠️ DISCORD_TICKETS_CATEGORY_ID not set, ticket system disabled');
        }

        // Initialize Audit Poller
        if (extendedConfig.logsChannelId && extendedConfig.siteApiToken) {
            this.auditPoller = new AuditPoller(this.client, {
                apiUrl: extendedConfig.siteApiUrl,
                apiToken: extendedConfig.siteApiToken,
                logsChannelId: extendedConfig.logsChannelId,
                pollIntervalMs: extendedConfig.auditPollInterval
            });
            this.auditPoller.start();
            Logger.info('✅ Audit Poller started');
        } else {
            Logger.warn('⚠️ Audit poller not configured (missing LOGS_CHANNEL_ID or SITE_API_TOKEN)');
        }

        // Initialize Report Poller (if in polling mode)
        if (extendedConfig.reportSyncMode === 'polling' && this.ticketManager) {
            this.reportPoller = new ReportPoller(this.ticketManager, {
                apiUrl: extendedConfig.siteApiUrl,
                apiToken: extendedConfig.siteApiToken,
                pollIntervalMs: extendedConfig.auditPollInterval
            });
            this.reportPoller.start();
            Logger.info('✅ Report Poller started (polling mode)');
        } else if (extendedConfig.reportSyncMode === 'webhook') {
            Logger.info('ℹ️ Report sync mode: webhook (waiting for incoming webhooks)');
        }

        Logger.info('🎉 Extended bot fully initialized!');
    }

    async stop() {
        Logger.info('🛑 Shutting down extended bot...');

        if (this.auditPoller) this.auditPoller.stop();
        if (this.reportPoller) this.reportPoller.stop();

        await super.stop();
    }
}

// ==================== EXTENDED WEBHOOK SERVER ====================

class ExtendedWebhookServer {
    constructor(bot) {
        this.bot = bot;
        this.app = express();

        // Parse JSON bodies
        this.app.use(express.json());

        this.setupRoutes();
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            const stats = {
                status: 'ok',
                bot: this.bot.client.user?.tag || 'offline',
                integrations: {
                    ticketManager: !!this.bot.ticketManager,
                    auditPoller: !!this.bot.auditPoller,
                    reportPoller: !!this.bot.reportPoller
                },
                mode: extendedConfig.reportSyncMode
            };
            res.json(stats);
        });

        // Original match webhooks (existing functionality)
        this.app.post('/webhook/partida-criada', async (req, res) => {
            try {
                const authHeader = req.headers.authorization;
                if (authHeader !== `Bearer ${extendedConfig.webhookSecret}`) {
                    Logger.warn('⚠️ Tentativa de acesso não autorizado ao webhook partida-criada');
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const matchData = req.body;
                const result = await this.bot.createMatchChannels(matchData);
                res.json(result);
            } catch (error) {
                Logger.error('Erro no webhook partida-criada:', error.message);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/webhook/partida-finalizada', async (req, res) => {
            try {
                const authHeader = req.headers.authorization;
                if (authHeader !== `Bearer ${extendedConfig.webhookSecret}`) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const { match_id, channels } = req.body;
                const result = await this.bot.deleteMatchChannels(match_id, channels);
                res.json(result);
            } catch (error) {
                Logger.error('Erro no webhook partida-finalizada:', error.message);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // NEW: Report webhook (HMAC secured)
        if (this.bot.hmacSecurity && this.bot.ticketManager) {
            const reportsRouter = createReportsRouter(this.bot.ticketManager, this.bot.hmacSecurity);
            this.app.use('/webhook', reportsRouter);
            Logger.info('✅ Report webhook endpoint registered: /webhook/report-created');
        }

        // NEW: Role Sync webhook
        const roleSyncRouter = createRoleSyncRouter(this.bot.client, extendedConfig.guildId, extendedConfig.webhookSecret);
        this.app.use('/webhook', roleSyncRouter);
        Logger.info('✅ Role sync webhook endpoint registered: /webhook/sync-role');
    }

    start() {
        this.app.listen(extendedConfig.webhookPort, () => {
            Logger.info(`✅ Extended webhook server rodando na porta ${extendedConfig.webhookPort}`);
        });
    }
}

// ==================== MAIN ====================

async function main() {
    Logger.info('🚀 Iniciando Rematch Discord Bot (Extended)...');
    Logger.info(`📋 Report sync mode: ${extendedConfig.reportSyncMode}`);

    // Validate required config
    const required = ['webhookSecret', 'guildId'];
    const missing = required.filter(key => !extendedConfig[key]);
    if (missing.length > 0) {
        Logger.error('❌ Missing required config:', missing);
        process.exit(1);
    }

    // Create and start bot
    const bot = new ExtendedRematchBot();
    await bot.start();

    // Create webhook server (wait a bit for bot to be ready)
    setTimeout(() => {
        const webhookServer = new ExtendedWebhookServer(bot);
        webhookServer.start();
    }, 2000);

    // Graceful shutdown
    process.on('SIGINT', async () => {
        await bot.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        await bot.stop();
        process.exit(0);
    });
}

// Run
main().catch(error => {
    Logger.error('Erro fatal:', error);
    process.exit(1);
});
