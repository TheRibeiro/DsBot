/**
 * Gerador de Card de Perfil PREMIUM - Maneiro Inhouse
 * Design UI/UX profissional com hierarquia visual clara
 */

const { createCanvas, loadImage } = require('@napi-rs/canvas');

// === CORES POR TIER ===
const TIER_COLORS = {
    'BRONZE': { primary: '#CD7F32', secondary: '#8B4513', icon: '🥉' },
    'PRATA': { primary: '#C0C0C0', secondary: '#A8A8A8', icon: '🥈' },
    'OURO': { primary: '#FFD700', secondary: '#FFA500', icon: '🥇' },
    'PLATINA': { primary: '#00CED1', secondary: '#1E90FF', icon: '💠' },
    'DIAMANTE': { primary: '#B9F2FF', secondary: '#4169E1', icon: '💎' },
    'MESTRE': { primary: '#9333EA', secondary: '#7C3AED', icon: '👑' },
    'ELITE': { primary: '#EF4444', secondary: '#DC2626', icon: '🔥' }
};

// === STATS POR POSIÇÃO ===
const POSITION_CONFIG = {
    'Goleiro': {
        icon: '🧤',
        stats: [
            { label: 'DEFESAS', icon: '🧤' },
            { label: 'PASSES', icon: '⚡' },
            { label: 'INTERCEP.', icon: '🛡️' }
        ]
    },
    'Fixo': {
        icon: '🛡️',
        stats: [
            { label: 'INTERCEP.', icon: '🛡️' },
            { label: 'PASSES', icon: '⚡' },
            { label: 'ASSIST.', icon: '🎯' }
        ]
    },
    'Ala Def': {
        icon: '🛡️',
        stats: [
            { label: 'INTERCEP.', icon: '🛡️' },
            { label: 'PASSES', icon: '⚡' },
            { label: 'ASSIST.', icon: '🎯' }
        ]
    },
    'Ala Of': {
        icon: '⚡',
        stats: [
            { label: 'GOLS', icon: '⚽' },
            { label: 'ASSIST.', icon: '🎯' },
            { label: 'PASSES', icon: '⚡' }
        ]
    },
    'Pivô': {
        icon: '⚽',
        stats: [
            { label: 'GOLS', icon: '⚽' },
            { label: 'ASSIST.', icon: '🎯' },
            { label: 'PASSES', icon: '⚡' }
        ]
    }
};

class ProfileCardGenerator {
    constructor() {
        this.width = 1000;
        this.height = 500;
        this.padding = 24;
        this.colors = {
            bg1: '#1a1a2e',
            bg2: '#16213e',
            cardBg: 'rgba(30, 30, 45, 0.85)',
            textPrimary: '#FFFFFF',
            textSecondary: '#B0B3B8',
            textMuted: '#65676B',
            success: '#3DDB84',
            danger: '#FF4757',
            accent: '#4A9EFF'
        };
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

    drawText(ctx, text, x, y, fontSize, color, bold = false, align = 'left', shadow = true) {
        ctx.font = `${bold ? 'bold ' : ''}${fontSize}px sans-serif`;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';

        if (shadow) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = Math.max(2, fontSize / 10);
            ctx.strokeText(text, x, y);
        }

        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    }

    async generateProfileCard(userData) {
        const {
            username,
            rank,
            mmr,
            wins,
            losses,
            winrate,
            mainRole,
            avatarUrl
        } = userData;

        console.log('🎨 Gerando card PREMIUM para:', username);
        console.log('📊 Dados:', JSON.stringify({ username, rank: rank?.full_name, mmr, wins, losses, winrate, mainRole }, null, 2));

        // VALIDAÇÃO
        const safeWins = wins ?? 0;
        const safeLosses = losses ?? 0;
        const safeWinrate = winrate ?? 0;
        const safeMmr = mmr ?? 0;
        const safeMainRole = mainRole || 'Jogador';
        const safeRank = rank || { tier: 'BRONZE', full_name: 'Bronze I' };
        const totalGames = safeWins + safeLosses;

        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');

        const tierColors = TIER_COLORS[safeRank.tier] || TIER_COLORS['BRONZE'];
        const rgb = this.hexToRgb(tierColors.primary);
        const posConfig = POSITION_CONFIG[safeMainRole] || POSITION_CONFIG['Goleiro'];

        // ====== 1. BACKGROUND GRADIENT ======
        const bgGradient = ctx.createLinearGradient(0, 0, this.width, this.height);
        bgGradient.addColorStop(0, this.colors.bg1);
        bgGradient.addColorStop(1, this.colors.bg2);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Adicionar subtle pattern (noise)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            ctx.fillRect(x, y, 1, 1);
        }

        // ====== 2. CARD PRINCIPAL (GLASSMORPHISM) ======
        const cardX = this.padding;
        const cardY = this.padding;
        const cardW = this.width - (this.padding * 2);
        const cardH = this.height - (this.padding * 2);

        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 32;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8;

        // Card background
        ctx.fillStyle = this.colors.cardBg;
        this.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        this.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20);
        ctx.stroke();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // ====== 3. HEADER - BRANDING + RANK BADGE ======
        const headerY = cardY + 20;

        // Branding (esquerda)
        this.drawText(ctx, '🏆 MANEIRO INHOUSE', cardX + 24, headerY + 10, 14, this.colors.textSecondary, true, 'left', false);

        // Rank Badge (direita)
        const badgeW = 160;
        const badgeH = 60;
        const badgeX = cardX + cardW - badgeW - 24;
        const badgeY = headerY - 10;

        // Badge gradient
        const badgeGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeH);
        badgeGradient.addColorStop(0, tierColors.primary);
        badgeGradient.addColorStop(1, tierColors.secondary);

        ctx.fillStyle = badgeGradient;
        this.drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 12);
        ctx.fill();

        // Badge shadow
        ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`;
        ctx.shadowBlur = 12;
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
        ctx.shadowBlur = 0;

        // Badge text
        this.drawText(ctx, safeRank.full_name.toUpperCase(), badgeX + badgeW / 2, badgeY + 20, 14, '#FFFFFF', true, 'center', true);
        this.drawText(ctx, `${safeMmr} MMR`, badgeX + badgeW / 2, badgeY + 40, 12, 'rgba(255, 255, 255, 0.8)', false, 'center', false);

        // ====== 4. PLAYER IDENTITY ======
        const identityY = headerY + 80;
        const avatarSize = 120;
        const avatarX = cardX + 40;
        const avatarY = identityY;

        // Avatar circle com glow
        try {
            const avatar = await loadImage(avatarUrl);

            // Glow effect
            ctx.shadowColor = tierColors.primary;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            // Avatar
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();

            // Border
            ctx.strokeStyle = tierColors.primary;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.stroke();
        } catch (error) {
            console.error('❌ Erro ao carregar avatar:', error);
        }

        // Player info (ao lado do avatar)
        const infoX = avatarX + avatarSize + 24;
        let infoY = avatarY + 30;

        // Nome (adaptativo para nomes longos)
        let nameFontSize = 40;
        if (username.length > 15) nameFontSize = 32;
        if (username.length > 25) nameFontSize = 28;

        this.drawText(ctx, username, infoX, infoY, nameFontSize, this.colors.textPrimary, true, 'left', true);

        infoY += 50;

        // Posição com ícone
        this.drawText(ctx, `${posConfig.icon} ${safeMainRole}`, infoX, infoY, 20, this.colors.textSecondary, false, 'left', false);

        // ====== 5. PERFORMANCE METRICS (3 CARDS) ======
        const metricsY = identityY + 160;
        const metricsX = cardX + 40;
        const metricCardW = (cardW - 80 - 32) / 3; // 3 cards com gap de 16px
        const metricCardH = 100;
        const metricGap = 16;

        // CARD 1: WINRATE (DESTAQUE)
        let card1X = metricsX;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.drawRoundedRect(ctx, card1X, metricsY, metricCardW, metricCardH, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        this.drawText(ctx, 'WINRATE', card1X + metricCardW / 2, metricsY + 20, 12, this.colors.textSecondary, true, 'center', false);

        const winrateColor = safeWinrate >= 50 ? this.colors.success : this.colors.danger;
        this.drawText(ctx, `${safeWinrate}%`, card1X + metricCardW / 2, metricsY + 50, 48, winrateColor, true, 'center', true);

        // Progress bar
        const progressY = metricsY + 80;
        const progressW = metricCardW - 40;
        const progressX = card1X + 20;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.drawRoundedRect(ctx, progressX, progressY, progressW, 6, 3);
        ctx.fill();

        const fillW = (progressW * safeWinrate) / 100;
        const fillGradient = ctx.createLinearGradient(progressX, progressY, progressX + fillW, progressY);
        fillGradient.addColorStop(0, winrateColor);
        fillGradient.addColorStop(1, winrateColor + '80');
        ctx.fillStyle = fillGradient;
        this.drawRoundedRect(ctx, progressX, progressY, fillW, 6, 3);
        ctx.fill();

        // CARD 2: PARTIDAS
        let card2X = card1X + metricCardW + metricGap;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.drawRoundedRect(ctx, card2X, metricsY, metricCardW, metricCardH, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        this.drawText(ctx, 'PARTIDAS', card2X + metricCardW / 2, metricsY + 20, 12, this.colors.textSecondary, true, 'center', false);
        this.drawText(ctx, `${totalGames}`, card2X + metricCardW / 2, metricsY + 55, 36, this.colors.textPrimary, true, 'center', true);

        // CARD 3: W-L RECORD
        let card3X = card2X + metricCardW + metricGap;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.drawRoundedRect(ctx, card3X, metricsY, metricCardW, metricCardH, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        this.drawText(ctx, 'DESEMPENHO', card3X + metricCardW / 2, metricsY + 20, 12, this.colors.textSecondary, true, 'center', false);

        // W-L lado a lado
        const recordY = metricsY + 55;
        const centerX = card3X + metricCardW / 2;

        this.drawText(ctx, `${safeWins}W`, centerX - 30, recordY, 28, this.colors.success, true, 'right', true);
        this.drawText(ctx, '-', centerX, recordY, 28, this.colors.textMuted, false, 'center', false);
        this.drawText(ctx, `${safeLosses}L`, centerX + 30, recordY, 28, this.colors.danger, true, 'left', true);

        // ====== 6. FEATURED STATS (3 CARDS) ======
        const statsY = metricsY + metricCardH + 20;
        const statCardW = metricCardW - 20;
        const statCardH = 100;

        for (let i = 0; i < 3; i++) {
            const statX = metricsX + (i * (statCardW + metricGap + 20));
            const stat = posConfig.stats[i];

            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            this.drawRoundedRect(ctx, statX, statsY, statCardW, statCardH, 12);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.stroke();

            // Ícone
            this.drawText(ctx, stat.icon, statX + statCardW / 2, statsY + 25, 32, this.colors.textPrimary, false, 'center', false);

            // Valor (placeholder - você pode adicionar stats reais)
            const mockValue = Math.floor(Math.random() * 150) + 50;
            this.drawText(ctx, `${mockValue}`, statX + statCardW / 2, statsY + 55, 28, this.colors.textPrimary, true, 'center', true);

            // Label
            this.drawText(ctx, stat.label, statX + statCardW / 2, statsY + 80, 11, this.colors.textSecondary, true, 'center', false);
        }

        console.log('✅ Card PREMIUM gerado com sucesso!');
        return canvas.toBuffer('image/png');
    }
}

module.exports = { ProfileCardGenerator };
