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
        console.log('📊 Dados recebidos:', JSON.stringify({
            username,
            rank: rank?.full_name,
            mmr,
            wins,
            losses,
            winrate,
            mainRole
        }, null, 2));

        // VALIDAÇÃO: Garantir que os dados não sejam undefined
        const safeWins = wins ?? 0;
        const safeLosses = losses ?? 0;
        const safeWinrate = winrate ?? 0;
        const safeMmr = mmr ?? 0;
        const safeMainRole = mainRole || null;
        const safeRank = rank || { tier: 'BRONZE', full_name: 'Bronze I' };

        console.log('✅ Dados validados:', JSON.stringify({
            safeWins,
            safeLosses,
            safeWinrate,
            safeMmr,
            safeMainRole,
            safeRank: safeRank.full_name
        }, null, 2));

        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');

        const tierColors = TIER_COLORS[safeRank.tier] || TIER_COLORS['BRONZE'];
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

        // FUNÇÃO HELPER: Desenhar texto com contorno ROBUSTO
        const drawText = (text, x, y, fontSize, fillColor, bold = false) => {
            // Forçar fonte sans-serif genérica que sempre existe
            ctx.font = `${bold ? 'bold ' : ''}${fontSize}px sans-serif`;

            // Contorno preto para legibilidade
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = Math.max(2, fontSize / 10);
            ctx.strokeText(text, x, y);

            // Texto principal
            ctx.fillStyle = fillColor;
            ctx.fillText(text, x, y);

            console.log(`📝 Texto renderizado: "${text}" em (${x}, ${y}) com fonte ${fontSize}px`);
        };

        // Nome do usuário - GRANDE e SIMPLES
        drawText(username, textX, currentY, 32, '#FFFFFF', true);

        currentY += 50;

        // Rank - COM ÍCONE
        drawText(`${tierColors.icon} ${safeRank.full_name}`, textX, currentY, 28, tierColors.primary, true);

        currentY += 40;

        // MMR
        drawText(`${safeMmr} MMR`, textX, currentY, 22, '#AAAAAA', false);

        currentY += 50;

        // Stats - Linha 1
        const totalGames = safeWins + safeLosses;
        drawText(`Partidas: ${totalGames}  |  ${safeWins}W - ${safeLosses}L`, textX, currentY, 18, '#FFFFFF', false);

        currentY += 35;

        // Winrate
        const winrateColor = safeWinrate >= 50 ? '#4ade80' : '#f87171';
        drawText(`Winrate: ${safeWinrate}%`, textX, currentY, 18, winrateColor, false);

        // Posição
        if (safeMainRole) {
            drawText(`  |  Posicao: ${safeMainRole}`, textX + 150, currentY, 18, '#a78bfa', false);
        }

        // Marca d'água
        ctx.textAlign = 'right';
        drawText('Rematch Inhouse', this.width - 40, this.height - 20, 12, 'rgba(255, 255, 255, 0.3)', false);

        console.log('✅ Card gerado com sucesso!');

        return canvas.toBuffer('image/png');
    }
}

module.exports = { ProfileCardGenerator };
