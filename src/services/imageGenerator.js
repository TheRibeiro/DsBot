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

    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
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
        // Substituindo roundRect por desenho manual para garantir compatibilidade
        this.drawRoundedRect(ctx, 30, 30, this.width - 60, this.height - 60, 20);
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

        // 4. Configurar texto - FORÇAR fonte padrão segura
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        const textX = avatarX + avatarSize + 40;
        let currentY = 80;

        // FUNÇÃO HELPER: Desenhar texto com contorno
        const drawText = (text, x, y, fillColor, strokeColor = 'rgba(0,0,0,0.5)', strokeWidth = 2) => {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.strokeText(text, x, y);
            ctx.fillStyle = fillColor;
            ctx.fillText(text, x, y);
        };

        // Nome do usuário - GRANDE e SIMPLES
        ctx.font = 'bold 32px "Segoe UI", "Arial", sans-serif';
        drawText(username, textX, currentY, '#FFFFFF');

        currentY += 50;

        // Rank - COM ÍCONE
        ctx.font = 'bold 28px "Segoe UI", "Arial", sans-serif';
        drawText(`${tierColors.icon} ${rank.full_name}`, textX, currentY, tierColors.primary);

        currentY += 40;

        // MMR
        ctx.font = '22px "Segoe UI", "Arial", sans-serif';
        drawText(`${mmr} MMR`, textX, currentY, '#AAAAAA');

        currentY += 50;

        // Stats - Linha 1
        ctx.font = '18px "Segoe UI", "Arial", sans-serif';
        const totalGames = wins + losses;
        drawText(`Partidas: ${totalGames}  |  ${wins}W - ${losses}L`, textX, currentY, '#FFFFFF');

        currentY += 35;

        // Winrate
        const winrateColor = winrate >= 50 ? '#4ade80' : '#f87171';
        drawText(`Winrate: ${winrate}%`, textX, currentY, winrateColor);

        // Posição
        if (mainRole) {
            drawText(`  |  Posicao: ${mainRole}`, textX + 150, currentY, '#a78bfa');
        }

        // Marca d'água
        ctx.font = '12px "Segoe UI", "Arial", sans-serif';
        ctx.textAlign = 'right';
        drawText('Rematch Inhouse', this.width - 40, this.height - 20, 'rgba(255, 255, 255, 0.3)', 'transparent', 0);

        console.log('✅ Card gerado com sucesso!');

        return canvas.toBuffer('image/png');
    }
}

module.exports = { ProfileCardGenerator };
