
const { ProfileCardGenerator } = require('./src/services/imageGenerator');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const generator = new ProfileCardGenerator();

        const mockData = {
            username: 'TestUser',
            discriminator: '1234',
            avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
            rank: {
                tier: 'OURO',
                full_name: 'Ouro II',
                tier_name: 'Ouro',
                division: 2,
                icon: '🥇'
            },
            mmr: 1250,
            wins: 50,
            losses: 40,
            winrate: 55,
            mainRole: 'Mid',
            progressPercent: 70
        };

        console.log('Generating card...');
        const buffer = await generator.generateProfileCard(mockData);

        const outputPath = path.join(__dirname, 'repro_output.png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`Card saved to ${outputPath}`);
    } catch (error) {
        console.error('Error generating card:', error);
    }
}

run();
