/**
 * Gerador de Card de Perfil SIMPLIFICADO
 * Focado em funcionar no Railway sem depender de fontes do sistema
 */

const { createCanvas, loadImage } = require('@napi-rs/canvas');

const TIER_COLORS = {
    'BRONZE': { primary: '#CD7F32', secondary: '#8B4513', icon: '🥉' },
    'PRATA': { primary: '#C0C0C0', secondary: '#A8A8A8', icon: '🥈' },
    'OURO': { primary: '#FFD700', secondary: '#FFA500', icon: '🥇' },
    'PLATINA': { primary: '#00CED1', secondary: '#1E90FF', icon: '💠' },
    'DIAMANTE': { primary: '#B9F2FF', secondary: '#4169E1', icon: '💎' },
    'MESTRE': { primary: '#9333EA', secondary: '#7C3AED', icon: '👑' },
    'ELITE': { primary: '#EF4444', secondary: '#DC2626', icon: '🔥' }
};

class ProfileCardGenerator {
    constructor() {
        this.width = 800;
        this.height = 400;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    async generateProfileCard(userData) {
        const {
            username,
            rank,
            mmr,
            wins,
            losses,
            winrate,
            mainRole
        } = userData;

        console.log('🎨 Gerando card simplificado para:', username);

        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');

        const tierColors = TIER_COLORS[rank.tier] || TIER_COLORS['BRONZE'];
        const rgb = this.hexToRgb(tierColors.primary);

        // 1. Background com gradiente
        const bgGradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width / 2
        );
        bgGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
        bgGradient.addColorStop(1, 'rgba(20, 20, 30, 1)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Card principal
        ctx.fillStyle = 'rgba(30, 30, 40, 0.9)';
        ctx.roundRect(30, 30, this.width - 60, this.height - 60, 20);
        ctx.fill();

        // 3. Avatar
        const avatarSize = 120;
        const avatarX = 60;
        const avatarY = 60;

        try {
            const avatar = await loadImage(userData.avatarUrl);
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();

            // Borda do avatar
            ctx.strokeStyle = tierColors.primary;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.stroke();
        } catch (error) {
            console.error('Erro ao carregar avatar:', error);
        }

        // 4. Configurar texto - FORÇAR fonte padrão
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        const textX = avatarX + avatarSize + 40;
        let currentY = 80;

        // Nome do usuário - GRANDE e SIMPLES
        ctx.font = '32px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(username, textX, currentY);

        currentY += 50;

        // Rank - COM ÍCONE
        ctx.font = '28px sans-serif';
        ctx.fillStyle = tierColors.primary;
        ctx.fillText(`${tierColors.icon} ${rank.full_name}`, textX, currentY);

        currentY += 40;

        // MMR
        ctx.font = '22px sans-serif';
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText(`${mmr} MMR`, textX, currentY);

        currentY += 50;

        // Stats - Linha 1
        ctx.font = '18px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        const totalGames = wins + losses;
        ctx.fillText(`Partidas: ${totalGames}  |  ${wins}W - ${losses}L`, textX, currentY);

        currentY += 35;

        // Winrate
        const winrateColor = winrate >= 50 ? '#4ade80' : '#f87171';
        ctx.fillStyle = winrateColor;
        ctx.fillText(`Winrate: ${winrate}%`, textX, currentY);

        // Posição
        if (mainRole) {
            ctx.fillStyle = '#a78bfa';
            ctx.fillText(`  |  Posicao: ${mainRole}`, textX + 150, currentY);
        }

        // Marca d'água
        ctx.font = '12px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.textAlign = 'right';
        ctx.fillText('Rematch Inhouse', this.width - 40, this.height - 20);

        console.log('✅ Card gerado com sucesso!');

        return canvas.toBuffer('image/png');
    }
}

module.exports = { ProfileCardGenerator };
