/**
 * Script de Teste - Geração de Card de Perfil
 *
 * Testa o gerador de imagens sem precisar do Discord
 * Execute: node test-profile-command.js
 */

const { ProfileCardGenerator } = require('./src/services/imageGenerator');
const fs = require('fs');
const path = require('path');

async function testProfileCard() {
    console.log('🧪 Testando gerador de card de perfil...\n');

    const generator = new ProfileCardGenerator();

    // Dados de exemplo
    const testData = {
        username: 'TestPlayer',
        discriminator: '1234',
        avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png', // Avatar padrão do Discord
        rank: {
            tier: 'DIAMANTE',
            tier_name: 'Diamante',
            division: 2,
            division_numeral: 'II',
            full_name: 'Diamante II',
            icon: '💎'
        },
        mmr: 1750,
        wins: 145,
        losses: 98,
        winrate: 59,
        kda: '3.2',
        mainRole: 'Mid',
        progressPercent: 75
    };

    try {
        console.log('📊 Gerando card com os seguintes dados:');
        console.log(`   - Jogador: ${testData.username}#${testData.discriminator}`);
        console.log(`   - Rank: ${testData.rank.full_name} (${testData.mmr} MMR)`);
        console.log(`   - W/L: ${testData.wins}/${testData.losses} (${testData.winrate}% WR)`);
        console.log(`   - KDA: ${testData.kda}`);
        console.log(`   - Main Role: ${testData.mainRole}`);
        console.log(`   - Progresso: ${testData.progressPercent}%\n`);

        console.log('🎨 Gerando imagem...');
        const imageBuffer = await generator.generateProfileCard(testData);

        // Salvar em arquivo
        const outputPath = path.join(__dirname, 'test-profile-output.png');
        fs.writeFileSync(outputPath, imageBuffer);

        console.log(`✅ Imagem gerada com sucesso!`);
        console.log(`📁 Salvo em: ${outputPath}`);
        console.log(`📏 Tamanho: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);

        console.log('💡 Abra o arquivo test-profile-output.png para visualizar o resultado.');

    } catch (error) {
        console.error('❌ Erro ao gerar card:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Testar vários ranks
async function testAllRanks() {
    console.log('🧪 Testando todos os ranks...\n');

    const generator = new ProfileCardGenerator();

    const ranks = [
        { tier: 'BRONZE', tier_name: 'Bronze', division: 1, full_name: 'Bronze I', icon: '🥉', mmr: 500 },
        { tier: 'PRATA', tier_name: 'Prata', division: 2, full_name: 'Prata II', icon: '🥈', mmr: 900 },
        { tier: 'OURO', tier_name: 'Ouro', division: 3, full_name: 'Ouro III', icon: '🥇', mmr: 1250 },
        { tier: 'PLATINA', tier_name: 'Platina', division: 1, full_name: 'Platina I', icon: '💠', mmr: 1400 },
        { tier: 'DIAMANTE', tier_name: 'Diamante', division: 2, full_name: 'Diamante II', icon: '💎', mmr: 1750 },
        { tier: 'MESTRE', tier_name: 'Mestre', division: 3, full_name: 'Mestre III', icon: '👑', mmr: 2100 },
        { tier: 'ELITE', tier_name: 'Elite', division: 1, full_name: 'Elite Global', icon: '🔥', mmr: 2500 }
    ];

    for (const rank of ranks) {
        const testData = {
            username: 'TestPlayer',
            discriminator: '1234',
            avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
            rank,
            mmr: rank.mmr,
            wins: 100,
            losses: 50,
            winrate: 67,
            kda: '3.5',
            mainRole: 'Top',
            progressPercent: rank.tier === 'ELITE' ? 0 : 50
        };

        try {
            console.log(`🎨 Gerando ${rank.full_name}...`);
            const imageBuffer = await generator.generateProfileCard(testData);

            const filename = `test-profile-${rank.tier.toLowerCase()}.png`;
            fs.writeFileSync(path.join(__dirname, filename), imageBuffer);

            console.log(`   ✅ ${filename} (${(imageBuffer.length / 1024).toFixed(2)} KB)`);

        } catch (error) {
            console.error(`   ❌ Erro: ${error.message}`);
        }
    }

    console.log('\n✅ Todos os ranks foram testados!');
}

// Menu de testes
const args = process.argv.slice(2);

if (args.includes('--all-ranks')) {
    testAllRanks();
} else {
    testProfileCard();
}
