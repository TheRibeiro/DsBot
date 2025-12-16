/**
 * Teste da query SQL do perfil
 * Execute: node test-query.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'blaidds.com',
    user: process.env.DB_USER || 'blaiddsc_Maneiro',
    password: process.env.DB_PASSWORD || 'Maneiro123',
    database: process.env.DB_NAME || 'blaiddsc_inhouse',
    port: 3306
};

async function testQuery() {
    console.log('🧪 Testando query do perfil...\n');
    console.log('📊 Conectando ao banco:', dbConfig.host, '/', dbConfig.database);

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Use seu Discord ID aqui
        const discordId = '617472064319651841'; // Seu Discord ID

        console.log(`\n🔍 Buscando dados para Discord ID: ${discordId}\n`);

        const [rows] = await connection.query(`
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

        console.log('📊 Resultado da query:');
        console.log(JSON.stringify(rows, null, 2));

        if (rows.length === 0) {
            console.log('\n❌ Nenhum usuário encontrado com esse Discord ID');
        } else {
            const user = rows[0];
            console.log('\n✅ Usuário encontrado:');
            console.log(`   - ID: ${user.id}`);
            console.log(`   - Nickname: ${user.nickname}`);
            console.log(`   - MMR: ${user.mmr}`);
            console.log(`   - Posição: ${user.position || 'Não definida'}`);
            console.log(`   - Vitórias: ${user.wins}`);
            console.log(`   - Derrotas: ${user.losses}`);
            console.log(`   - Total: ${user.wins + user.losses} partidas`);
        }

        await connection.end();

    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    }
}

testQuery();
