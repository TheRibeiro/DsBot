/**
 * Rematch Discord Bot
 * Cria salas de voz automáticas para partidas
 */

require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, Events } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { Logger } = require('./logger');

// ==================== CONFIGURAÇÃO ====================

const config = {
    token: process.env.DISCORD_TOKEN,
    guildId: process.env.GUILD_ID,
    categoryId: process.env.VOICE_CATEGORY_ID,
    webhookPort: parseInt(process.env.WEBHOOK_PORT || process.env.PORT || '3001'),
    webhookSecret: process.env.WEBHOOK_SECRET,
    botPrefix: process.env.BOT_PREFIX || '/',
    channelLifetime: parseInt(process.env.CHANNEL_LIFETIME_MINUTES || '120'),
    autoDeleteOnEmpty: process.env.AUTO_DELETE_ON_EMPTY === 'true',
    logLevel: process.env.LOG_LEVEL || 'info'
};

// Validar configuração obrigatória
function validateConfig() {
    const required = ['token', 'guildId', 'categoryId', 'webhookSecret'];
    const missing = required.filter(key => !config[key]);

    if (missing.length > 0) {
        Logger.error('❌ Variáveis de ambiente obrigatórias faltando:', missing);
        process.exit(1);
    }

    Logger.info('✅ Configuração validada');
}

// ==================== DATABASE ====================

class MatchChannelDB {
    constructor() {
        this.dbFile = path.join(__dirname, 'match_channels.json');
        this.data = { match_channels: [] };
        this.init();
    }

    init() {
        try {
            if (fs.existsSync(this.dbFile)) {
                const raw = fs.readFileSync(this.dbFile, 'utf-8');
                const parsed = raw ? JSON.parse(raw) : {};
                this.data = { match_channels: parsed.match_channels || [] };
            } else {
                this.persist();
            }
            Logger.info('DB inicializado (arquivo JSON)');
        } catch (error) {
            Logger.error('Erro ao carregar DB, recriando arquivo:', error.message);
            this.data = { match_channels: [] };
            this.persist();
        }
    }

    persist() {
        fs.writeFileSync(this.dbFile, JSON.stringify(this.data, null, 2));
    }

    saveMatch(matchId, teamAChannelId, teamBChannelId, expiresAt) {
        const match = {
            match_id: matchId,
            team_a_channel_id: teamAChannelId,
            team_b_channel_id: teamBChannelId,
            created_at: Date.now(),
            expires_at: expiresAt,
            status: 'ACTIVE'
        };

        // Substituir se ja existir
        this.data.match_channels = this.data.match_channels.filter(m => m.match_id !== matchId);
        this.data.match_channels.push(match);
        this.persist();

        Logger.info(`Match #${matchId} salvo no DB`);
    }

    getMatch(matchId) {
        return this.data.match_channels.find(m => m.match_id === matchId && m.status === 'ACTIVE');
    }

    getExpiredMatches() {
        const now = Date.now();
        return this.data.match_channels.filter(
            m => m.status === 'ACTIVE' && typeof m.expires_at === 'number' && m.expires_at < now
        );
    }

    markAsDeleted(matchId) {
        const match = this.data.match_channels.find(m => m.match_id === matchId);
        if (match) {
            match.status = 'DELETED';
            this.persist();
        }
    }

    close() {
        this.persist();
    }
}

// ==================== DISCORD CLIENT ====================

class DiscordMatchBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages
            ]
        });

        this.db = new MatchChannelDB();
        this.guild = null;
        this.category = null;

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.client.once(Events.ClientReady, () => this.onReady());
        this.client.on(Events.VoiceStateUpdate, (oldState, newState) => this.onVoiceStateUpdate(oldState, newState));
        this.client.on(Events.InteractionCreate, interaction => this.onInteraction(interaction));
    }

    async onReady() {
        Logger.info(`✅ Bot logado como ${this.client.user.tag}`);

        // Obter guild e categoria
        try {
            this.guild = await this.client.guilds.fetch(config.guildId);
            this.category = await this.guild.channels.fetch(config.categoryId);

            if (!this.category || this.category.type !== ChannelType.GuildCategory) {
                throw new Error('Categoria de voz não encontrada ou inválida');
            }

            Logger.info(`✅ Guild: ${this.guild.name}`);
            Logger.info(`✅ Categoria: ${this.category.name}`);

            // Iniciar cleanup job
            this.startCleanupJob();

        } catch (error) {
            Logger.error('❌ Erro ao buscar guild/categoria:', error.message);
            process.exit(1);
        }
    }

    async createMatchChannels(matchData) {
        const { match_id, expires_at } = matchData;

        // Apenas precisamos do ID da partida para nomear os canais
        if (!match_id) {
            throw new Error('match_id é obrigatório');
        }

        Logger.info(`🎮 Criando canais para Match #${match_id}`);

        try {
            const channelA = await this.createVoiceChannel(`Partida #${match_id} | Time A`);
            const channelB = await this.createVoiceChannel(`Partida #${match_id} | Time B`);

            // Salvar no “banco” (arquivo JSON)
            this.db.saveMatch(match_id, channelA.id, channelB.id, expires_at);

            Logger.info(`✅ Canais criados para Match #${match_id}`);
            Logger.info(`   Team A: ${channelA.name} (${channelA.id})`);
            Logger.info(`   Team B: ${channelB.name} (${channelB.id})`);

            return {
                success: true,
                match_id,
                channels: {
                    team_a: { id: channelA.id, name: channelA.name },
                    team_b: { id: channelB.id, name: channelB.name }
                }
            };

        } catch (error) {
            Logger.error(`❌ Erro ao criar canais para Match #${match_id}:`, error.message);
            throw error;
        }
    }

    async createVoiceChannel(name) {
        // Criar canal de voz herdando permissões da categoria
        const channel = await this.guild.channels.create({
            name,
            type: ChannelType.GuildVoice,
            parent: this.category.id
        });

        return channel;
    }

    async deleteMatchChannels(matchId) {
        Logger.info(`🗑️ Deletando canais da Match #${matchId}`);

        try {
            const match = this.db.getMatch(matchId);

            if (!match) {
                Logger.warn(`⚠️ Match #${matchId} não encontrado no DB`);
                return { success: false, error: 'Match não encontrado' };
            }

            // Deletar canal Team A
            try {
                const channelA = await this.guild.channels.fetch(match.team_a_channel_id);
                if (channelA) await channelA.delete();
                Logger.info(`  ✅ Canal Team A deletado`);
            } catch (error) {
                Logger.warn(`  ⚠️ Erro ao deletar canal Team A:`, error.message);
            }

            // Deletar canal Team B
            try {
                const channelB = await this.guild.channels.fetch(match.team_b_channel_id);
                if (channelB) await channelB.delete();
                Logger.info(`  ✅ Canal Team B deletado`);
            } catch (error) {
                Logger.warn(`  ⚠️ Erro ao deletar canal Team B:`, error.message);
            }

            // Marcar como deletado no DB
            this.db.markAsDeleted(matchId);

            Logger.info(`✅ Canais da Match #${matchId} deletados`);

            return { success: true, match_id: matchId };

        } catch (error) {
            Logger.error(`❌ Erro ao deletar canais da Match #${matchId}:`, error.message);
            throw error;
        }
    }

    onVoiceStateUpdate(oldState, newState) {
        // Auto-delete canal vazio (opcional)
        if (!config.autoDeleteOnEmpty) return;

        // Se alguém saiu de um canal
        if (oldState.channel && oldState.channel.members.size === 0) {
            const channelName = oldState.channel.name;

            // Verificar se é um canal de partida
            if (channelName.startsWith('Partida #')) {
                Logger.info(`👋 Canal ${channelName} ficou vazio, será deletado em 1 minuto`);

                // Esperar 1 minuto antes de deletar (caso alguém volte)
                setTimeout(async () => {
                    try {
                        const channel = await this.guild.channels.fetch(oldState.channel.id);
                        if (channel && channel.members.size === 0) {
                            await channel.delete();
                            Logger.info(`🗑️ Canal ${channelName} deletado (vazio)`);
                        }
                    } catch (error) {
                        Logger.debug(`Canal já foi deletado ou não existe mais`);
                    }
                }, 60000);
            }
        }
    }

    async onInteraction(interaction) {
        if (!interaction.isChatInputCommand()) return;

        if (interaction.commandName === 'ping') {
            await interaction.reply({ content: '🏓 Pong! Bot está online.', ephemeral: true });
        }
    }

    startCleanupJob() {
        // Executar a cada 5 minutos
        setInterval(() => {
            this.cleanupExpiredMatches();
        }, 5 * 60 * 1000);

        Logger.info('✅ Cleanup job iniciado (5 min)');
    }

    async cleanupExpiredMatches() {
        const expired = this.db.getExpiredMatches();

        if (expired.length === 0) return;

        Logger.info(`🧹 Limpando ${expired.length} match(es) expirada(s)`);

        for (const match of expired) {
            try {
                await this.deleteMatchChannels(match.match_id);
            } catch (error) {
                Logger.error(`Erro ao limpar Match #${match.match_id}:`, error.message);
            }
        }
    }

    async start() {
        await this.client.login(config.token);
    }

    async stop() {
        Logger.info('🛑 Encerrando bot...');
        this.db.close();
        await this.client.destroy();
    }
}

// ==================== WEBHOOK SERVER ====================

class WebhookServer {
    constructor(bot) {
        this.bot = bot;
        this.app = express();

        this.app.use(express.json());
        this.setupRoutes();
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', bot: this.bot.client.user?.tag || 'offline' });
        });

        // Criar canais para partida
        this.app.post('/webhook/partida-criada', async (req, res) => {
            try {
                // Validar secret
                const authHeader = req.headers.authorization;
                if (authHeader !== `Bearer ${config.webhookSecret}`) {
                    Logger.warn('⚠️ Tentativa de acesso não autorizado ao webhook');
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const matchData = req.body;
                Logger.info(`📨 Webhook recebido para Match #${matchData.match_id}`);

                // Criar canais
                const result = await this.bot.createMatchChannels(matchData);

                res.json(result);

            } catch (error) {
                Logger.error('❌ Erro no webhook:', error.message);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Deletar canais de partida
        this.app.post('/webhook/partida-finalizada', async (req, res) => {
            try {
                // Validar secret
                const authHeader = req.headers.authorization;
                if (authHeader !== `Bearer ${config.webhookSecret}`) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const { match_id } = req.body;
                Logger.info(`📨 Webhook de finalização para Match #${match_id}`);

                // Deletar canais
                const result = await this.bot.deleteMatchChannels(match_id);

                res.json(result);

            } catch (error) {
                Logger.error('❌ Erro no webhook:', error.message);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    start() {
        this.app.listen(config.webhookPort, () => {
            Logger.info(`✅ Webhook server rodando na porta ${config.webhookPort}`);
        });
    }
}

// ==================== MAIN ====================

async function main() {
    Logger.info('🚀 Iniciando Rematch Discord Bot...');

    // Validar configuração
    validateConfig();

    // Criar bot
    const bot = new DiscordMatchBot();
    await bot.start();

    // Criar webhook server
    const webhookServer = new WebhookServer(bot);
    webhookServer.start();

    // Graceful shutdown
    process.on('SIGINT', async () => {
        await bot.stop();
        process.exit(0);
    });
}

// Executar somente quando chamado diretamente
if (require.main === module) {
    main().catch(error => {
        Logger.error('Erro fatal:', error);
        process.exit(1);
    });
}

// Export para testes
module.exports = { DiscordMatchBot, MatchChannelDB };
