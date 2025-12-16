/**
 * Comando /perfil - Exibe card premium de perfil do jogador
 *
 * Design visual impactante estilo Faceit/GamersClub
 * Usa Canvas para gerar imagem com glassmorphism e gradientes
 */

const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
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
        Logger.info('✅ Database pool criado para comando /perfil');
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
                u.main_role,
                u.position,
                COUNT(DISTINCT CASE WHEN mp.team = 'A' AND m.winner = 'A' THEN m.id
                                   WHEN mp.team = 'B' AND m.winner = 'B' THEN m.id END) as wins,
                COUNT(DISTINCT CASE WHEN mp.team = 'A' AND m.winner = 'B' THEN m.id
                                   WHEN mp.team = 'B' AND m.winner = 'A' THEN m.id END) as losses,
                AVG(mp.kills) as avg_kills,
                AVG(mp.deaths) as avg_deaths,
                AVG(mp.assists) as avg_assists
            FROM users u
            LEFT JOIN match_players mp ON u.id = mp.user_id
            LEFT JOIN matches m ON mp.match_id = m.id AND m.status = 'FINISHED'
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

        // Calcular KDA
        let kda = 'N/A';
        if (user.avg_deaths > 0) {
            const kdaValue = (user.avg_kills + user.avg_assists) / user.avg_deaths;
            kda = kdaValue.toFixed(2);
        } else if (user.avg_kills > 0 || user.avg_assists > 0) {
            kda = 'Perfect';
        }

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
            kda,
            mainRole: user.main_role || user.position || null,
            progressPercent: rank.percent_in_division
        };

    } catch (error) {
        Logger.error('❌ Erro ao buscar dados do usuário:', error.message);
        throw error;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Exibe seu perfil premium de jogador com estatísticas')
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription('Usuário para ver o perfil (deixe vazio para ver o seu)')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            // Determinar qual usuário exibir
            const targetUser = interaction.options.getUser('usuario') || interaction.user;

            Logger.info(`📊 Comando /perfil executado por ${interaction.user.tag} para ver ${targetUser.tag}`);

            // Buscar dados do usuário no banco
            const userData = await fetchUserData(targetUser.id);

            if (!userData) {
                return await interaction.editReply({
                    content: `❌ **${targetUser.username}** não está registrado no sistema Inhouse.\n\nPara se registrar, acesse o site e vincule sua conta do Discord.`,
                    ephemeral: true
                });
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
            await interaction.editReply({
                files: [attachment]
            });

            Logger.info(`✅ Card enviado com sucesso para ${targetUser.tag}`);

        } catch (error) {
            Logger.error('❌ Erro ao executar comando /perfil:', error);

            try {
                await interaction.editReply({
                    content: '❌ Ocorreu um erro ao gerar seu perfil. Tente novamente mais tarde.',
                    ephemeral: true
                });
            } catch (editError) {
                Logger.error('❌ Erro ao editar reply:', editError.message);
            }
        }
    }
};
