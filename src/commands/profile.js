/**
 * Comando !perfil - Exibe card premium de perfil do jogador
 *
 * Design visual impactante estilo Faceit/GamersClub
 * Usa Canvas para gerar imagem com glassmorphism e gradientes
 *
 * Uso:
 *   !perfil              → Ver próprio perfil
 *   !perfil @usuario     → Ver perfil de outro jogador
 *   !perfil 123456789    → Ver perfil por Discord ID
 */

const { AttachmentBuilder } = require('discord.js');
const { ProfileCardGenerator } = require('../services/imageGenerator');
const { Logger } = require('../../logger');
const mysql = require('mysql2/promise');

// Configuração do banco de dados (usar as mesmas credenciais do PHP)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inhouse',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let dbPool = null;

/**
 * Inicializa o pool de conexões do banco
 */
function initDatabase() {
    if (!dbPool) {
        dbPool = mysql.createPool(dbConfig);
        Logger.info('✅ Database pool criado para comando !perfil');
    }
    return dbPool;
}

/**
 * Mapeamento de tiers (sincronizado com Rank.php)
 */
const TIERS = {
    'BRONZE': { name: 'Bronze', mmr_min: 0, mmr_max: 799, division_range: 266, icon: '🥉' },
    'PRATA': { name: 'Prata', mmr_min: 800, mmr_max: 999, division_range: 66, icon: '🥈' },
    'OURO': { name: 'Ouro', mmr_min: 1000, mmr_max: 1299, division_range: 100, icon: '🥇' },
    'PLATINA': { name: 'Platina', mmr_min: 1300, mmr_max: 1599, division_range: 100, icon: '💠' },
    'DIAMANTE': { name: 'Diamante', mmr_min: 1600, mmr_max: 1899, division_range: 100, icon: '💎' },
    'MESTRE': { name: 'Mestre', mmr_min: 1900, mmr_max: 2199, division_range: 100, icon: '👑' },
    'ELITE': { name: 'Elite', mmr_min: 2200, mmr_max: 9999, division_range: 9999, icon: '🔥' }
};

const DIVISION_NUMERALS = { 1: 'I', 2: 'II', 3: 'III' };

/**
 * Calcula rank a partir do MMR (lógica do Rank.php)
 */
function calculateRank(mmr) {
    mmr = parseInt(mmr);

    for (const [tierKey, tierData] of Object.entries(TIERS)) {
        if (mmr >= tierData.mmr_min && mmr <= tierData.mmr_max) {
            const progress = mmr - tierData.mmr_min;
            const divisionRange = tierData.division_range;

            let division, divisionNumeral, percentInDivision;

            if (tierKey === 'ELITE') {
                division = 1;
                divisionNumeral = 'Global';
                percentInDivision = 100;
            } else {
                division = Math.min(3, Math.floor(progress / divisionRange) + 1);
                divisionNumeral = DIVISION_NUMERALS[division] || 'I';

                const progressInDivision = progress % divisionRange;
                percentInDivision = divisionRange > 0 ? Math.round((progressInDivision / divisionRange) * 100) : 0;
            }

            return {
                tier: tierKey,
                tier_name: tierData.name,
                division,
                division_numeral: divisionNumeral,
                full_name: tierKey === 'ELITE' ? `${tierData.name} ${divisionNumeral}` : `${tierData.name} ${divisionNumeral}`,
                percent_in_division: percentInDivision,
                icon: tierData.icon
            };
        }
    }

    // Fallback para Bronze
    return {
        tier: 'BRONZE',
        tier_name: 'Bronze',
        division: 1,
        division_numeral: 'I',
        full_name: 'Bronze I',
        percent_in_division: 0,
        icon: '🥉'
    };
}

/**
 * Busca dados do usuário no banco de dados
 */
async function fetchUserData(discordId) {
    const db = initDatabase();

    try {
        const [rows] = await db.query(`
            SELECT
                u.id,
                u.nickname,
                u.discord_id,
                u.mmr,
                u.position,
                COUNT(DISTINCT CASE WHEN mp.team = m.winner_team THEN m.id END) as wins,
                COUNT(DISTINCT CASE WHEN mp.team != m.winner_team AND m.winner_team IS NOT NULL THEN m.id END) as losses
            FROM users u
            LEFT JOIN match_players mp ON u.id = mp.user_id
            LEFT JOIN matches m ON mp.match_id = m.id AND m.status = 'FINALIZADA'
            WHERE u.discord_id = ?
            GROUP BY u.id
        `, [discordId]);

        if (rows.length === 0) {
            return null;
        }

        const user = rows[0];

        // Calcular estatísticas
        const totalGames = user.wins + user.losses;
        const winrate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;

        // Calcular rank
        const rank = calculateRank(user.mmr);

        return {
            id: user.id,
            nickname: user.nickname,
            discord_id: user.discord_id,
            mmr: user.mmr,
            rank,
            wins: user.wins,
            losses: user.losses,
            winrate,
            kda: '-', // Não usado
            mainRole: user.position || null,
            progressPercent: rank.percent_in_division
        };

    } catch (error) {
        Logger.error('❌ Erro ao buscar dados do usuário:', error.message);

        // Erro de conexão ao banco
        if (error.code === 'ECONNREFUSED') {
            Logger.error('💡 Não foi possível conectar ao banco de dados.');
            Logger.error(`💡 Verifique as variáveis de ambiente: DB_HOST=${dbConfig.host}, DB_USER=${dbConfig.user}, DB_NAME=${dbConfig.database}`);
            const dbError = new Error('DATABASE_CONNECTION_ERROR');
            dbError.userMessage = '❌ Erro ao conectar ao banco de dados. Entre em contato com um administrador.';
            throw dbError;
        }

        throw error;
    }
}

module.exports = {
    name: 'perfil',
    description: 'Exibe seu perfil premium de jogador com estatísticas',
    aliases: ['profile', 'stats', 'me'],

    async execute(message, args) {
        try {
            // Determinar qual usuário exibir
            let targetUser = message.author;

            // Se mencionou alguém
            if (message.mentions.users.size > 0) {
                targetUser = message.mentions.users.first();
            }
            // Se passou um Discord ID
            else if (args.length > 0 && /^\d+$/.test(args[0])) {
                try {
                    targetUser = await message.client.users.fetch(args[0]);
                } catch (error) {
                    return message.reply('❌ Usuário não encontrado com esse ID.');
                }
            }

            Logger.info(`📊 Comando !perfil executado por ${message.author.tag} para ver ${targetUser.tag}`);

            // Enviar "carregando..."
            const loadingMsg = await message.reply('🎨 Gerando seu perfil premium...');

            // Buscar dados do usuário no banco
            const userData = await fetchUserData(targetUser.id);

            if (!userData) {
                return loadingMsg.edit(`❌ **${targetUser.username}** não está registrado no sistema Inhouse.\n\nPara se registrar, acesse o site e vincule sua conta do Discord.`);
            }

            // Gerar card de perfil
            const generator = new ProfileCardGenerator();

            const cardData = {
                username: targetUser.username,
                discriminator: targetUser.discriminator,
                avatarUrl: targetUser.displayAvatarURL({ extension: 'png', size: 256 }),
                rank: userData.rank,
                mmr: userData.mmr,
                wins: userData.wins,
                losses: userData.losses,
                winrate: userData.winrate,
                kda: userData.kda,
                mainRole: userData.mainRole,
                progressPercent: userData.progressPercent
            };

            Logger.info(`🎨 Gerando card para ${targetUser.tag} - Rank: ${userData.rank.full_name} (${userData.mmr} MMR)`);

            const imageBuffer = await generator.generateProfileCard(cardData);

            // Criar attachment
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'profile.png' });

            // Enviar card
            await loadingMsg.edit({
                content: `📊 **Perfil de ${targetUser.username}**`,
                files: [attachment]
            });

            Logger.info(`✅ Card enviado com sucesso para ${targetUser.tag}`);

        } catch (error) {
            Logger.error('❌ Erro ao executar comando !perfil:', error);

            // Mensagem específica para erro de banco
            const errorMsg = error.userMessage || '❌ Ocorreu um erro ao gerar o perfil. Tente novamente mais tarde.';

            try {
                if (loadingMsg) {
                    await loadingMsg.edit(errorMsg);
                } else {
                    await message.reply(errorMsg);
                }
            } catch (replyError) {
                Logger.error('❌ Erro ao enviar mensagem de erro:', replyError.message);
            }
        }
    }
};
