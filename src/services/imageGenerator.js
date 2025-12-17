/**
 * Premium Profile Card Image Generator
 * Based on profile-card-reference.html design
 *
 * Layout:
 * - Hexagonal pattern background
 * - Glassmorphism card with gradient border
 * - Header: MANEIRO INHOUSE branding
 * - Player Identity: Avatar + Name + Badges
 * - Main Stats Grid: Winrate (left) + MMR (right)
 * - Bottom Stats Grid: 3 stat cards
 */

const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { Logger } = require('../../logger');

/**
 * Configuração de cores dos tiers
 */
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
        this.width = 1160; // 580px * 2 (para qualidade HD)
        this.height = 900; // Proporção ajustada
        this.scale = 2; // Renderizar em 2x para qualidade
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    /**
     * Desenha padrão hexagonal de fundo
     */
    drawHexPattern(ctx) {
        const baseColor = '#0a0e1a';
        const pattern1 = '#1a1f2e';

        // Fundo base
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, this.width, this.height);

        // Padrão hexagonal simplificado (usando retângulos para canvas)
        ctx.fillStyle = pattern1;
        const hexSize = 80;

        for (let y = 0; y < this.height; y += hexSize) {
            for (let x = 0; x < this.width; x += hexSize) {
                if ((x + y) % (hexSize * 2) === 0) {
                    ctx.globalAlpha = 0.3;
                    ctx.fillRect(x, y, hexSize / 2, hexSize / 2);
                }
            }
        }

        ctx.globalAlpha = 1;
    }

    /**
     * Desenha retângulo com bordas arredondadas
     */
    roundRect(ctx, x, y, width, height, radius, fill = true, stroke = false) {
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

        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    /**
     * Desenha card principal com glassmorphism
     */
    drawMainCard(ctx, x, y, width, height, tierColors) {
        // Sombra do card
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 60;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 20;

        // Background glassmorphism
        ctx.fillStyle = 'rgba(30, 35, 48, 0.7)';
        this.roundRect(ctx, x, y, width, height, 32, true, false);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Gradient border
        const primaryRgb = this.hexToRgb(tierColors.primary);
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)`);
        gradient.addColorStop(1, 'rgba(147, 51, 234, 0.2)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, y, width, height, 32, false, true);
    }

    /**
     * Desenha header com branding
     */
    drawHeader(ctx, x, y) {
        // Logo box (gradiente azul/roxo)
        const logoSize = 80;
        const logoGradient = ctx.createLinearGradient(x, y, x + logoSize, y + logoSize);
        logoGradient.addColorStop(0, '#3b82f6');
        logoGradient.addColorStop(1, '#9333ea');

        ctx.fillStyle = logoGradient;
        this.roundRect(ctx, x, y, logoSize, logoSize, 16, true, false);

        // Letra "M"
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', x + logoSize / 2, y + logoSize / 2);

        // Texto "MANEIRO INHOUSE"
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = '0.1em';
        ctx.fillText('MANEIRO INHOUSE', x + logoSize + 24, y + logoSize / 2);
    }

    /**
     * Desenha avatar circular com borda
     */
    async drawAvatar(ctx, avatarUrl, x, y, size, borderColor) {
        try {
            const avatar = await loadImage(avatarUrl);

            // Borda colorida (sombra + glow)
            ctx.shadowColor = `rgba(${this.hexToRgb(borderColor).r}, ${this.hexToRgb(borderColor).g}, ${this.hexToRgb(borderColor).b}, 0.4)`;
            ctx.shadowBlur = 40;

            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2 + 8, 0, Math.PI * 2);
            const borderRgb = this.hexToRgb(borderColor);
            ctx.fillStyle = `rgba(${borderRgb.r}, ${borderRgb.g}, ${borderRgb.b}, 0.5)`;
            ctx.fill();

            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Avatar circular
            ctx.save();
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, x, y, size, size);
            ctx.restore();

        } catch (error) {
            Logger.warn(`⚠️ Erro ao carregar avatar: ${error.message}`);
            ctx.fillStyle = '#2a2e3a';
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Desenha badge (estilo Tailwind)
     */
    drawBadge(ctx, text, x, y, color, icon = '') {
        const padding = { x: 24, y: 12 };
        const rgb = this.hexToRgb(color);

        // Medir texto
        ctx.font = '600 20px sans-serif';
        const textWidth = ctx.measureText(icon + ' ' + text).width;
        const badgeWidth = textWidth + padding.x * 2;
        const badgeHeight = 40;

        // Background
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
        this.roundRect(ctx, x, y, badgeWidth, badgeHeight, 16, true, false);

        // Border
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, y, badgeWidth, badgeHeight, 16, false, true);

        // Text
        ctx.fillStyle = color;
        ctx.font = '600 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon + ' ' + text, x + badgeWidth / 2, y + badgeHeight / 2);

        return badgeWidth;
    }

    /**
     * Desenha bloco de winrate (destaque verde)
     */
    drawWinrateBlock(ctx, x, y, width, height, winrate, wins, losses) {
        const totalGames = wins + losses;

        // Background com destaque verde
        const bgGradient = ctx.createLinearGradient(x, y, x + width, y + height);
        bgGradient.addColorStop(0, 'rgba(34, 197, 94, 0.15)');
        bgGradient.addColorStop(1, 'rgba(22, 163, 74, 0.05)');

        ctx.fillStyle = bgGradient;
        this.roundRect(ctx, x, y, width, height, 24, true, false);

        // Border verde
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.lineWidth = 4;
        this.roundRect(ctx, x, y, width, height, 24, false, true);

        // Label "WINRATE"
        ctx.fillStyle = '#22c55e';
        ctx.font = '600 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('WINRATE', x + 48, y + 48);

        // Winrate % (grande)
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 96px sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText(`${winrate}%`, x + 48, y + 80);

        // Matches info
        ctx.fillStyle = '#9ca3af';
        ctx.font = '500 18px sans-serif';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${totalGames} Matches ${wins}W - ${losses}L`, x + 48, y + height - 48);
    }

    /**
     * Desenha bloco de MMR
     */
    drawMMRBlock(ctx, x, y, width, height, mmr, rankName, tierColors, progressPercent) {
        // Background escuro
        ctx.fillStyle = 'rgba(20, 25, 35, 0.8)';
        this.roundRect(ctx, x, y, width, height, 24, true, false);

        // Border sutil
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, y, width, height, 24, false, true);

        // Label "MMR"
        ctx.fillStyle = '#9ca3af';
        ctx.font = '600 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('MMR', x + 48, y + 48);

        // MMR número
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px sans-serif';
        ctx.fillText(mmr.toString(), x + 48, y + 80);

        // Rank name
        ctx.fillStyle = tierColors.primary;
        ctx.font = '500 18px sans-serif';
        ctx.fillText(rankName, x + 48, y + 170);

        // Progress bar
        if (progressPercent > 0) {
            const barY = y + 210;
            const barWidth = width - 96;
            const barHeight = 12;

            // Background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.roundRect(ctx, x + 48, barY, barWidth, barHeight, 10, true, false);

            // Fill
            const fillWidth = barWidth * (progressPercent / 100);
            const barGradient = ctx.createLinearGradient(x + 48, barY, x + 48 + fillWidth, barY);
            const rgb = this.hexToRgb(tierColors.primary);
            barGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
            barGradient.addColorStop(1, tierColors.primary);

            ctx.fillStyle = barGradient;
            this.roundRect(ctx, x + 48, barY, fillWidth, barHeight, 10, true, false);

            // Glow
            ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
            ctx.shadowBlur = 20;
            this.roundRect(ctx, x + 48, barY, fillWidth, barHeight, 10, true, false);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }
    }

    /**
     * Desenha stat card (bottom grid)
     */
    drawStatCard(ctx, x, y, width, height, label, value, suffix = '') {
        // Background
        ctx.fillStyle = 'rgba(20, 25, 35, 0.6)';
        this.roundRect(ctx, x, y, width, height, 16, true, false);

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, y, width, height, 16, false, true);

        // Label
        ctx.fillStyle = '#9ca3af';
        ctx.font = '600 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label.toUpperCase(), x + width / 2, y + 32);

        // Value
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), x + width / 2, y + height / 2 + 10);

        // Suffix
        if (suffix) {
            ctx.fillStyle = '#6b7280';
            ctx.font = '500 16px sans-serif';
            ctx.textBaseline = 'top';
            ctx.fillText(suffix, x + width / 2, y + height - 48);
        }
    }

    /**
     * Gera o card de perfil completo
     */
    async generateProfileCard(userData) {
        const {
            username,
            discriminator,
            avatarUrl,
            rank,
            mmr,
            wins,
            losses,
            winrate,
            mainRole,
            progressPercent = 0
        } = userData;

        console.log('🎨 Gerando card baseado em profile-card-reference.html');
        console.log(`   - ${username} | ${rank?.full_name} | ${mmr} MMR | ${winrate}% WR`);

        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');

        // Cores do tier
        const tierColors = TIER_COLORS[rank.tier] || TIER_COLORS['BRONZE'];

        // 1. Background hexagonal
        this.drawHexPattern(ctx);

        // 2. Card principal (centralizado com padding)
        const cardPadding = 64;
        const cardWidth = this.width - cardPadding * 2;
        const cardHeight = this.height - cardPadding * 2;
        this.drawMainCard(ctx, cardPadding, cardPadding, cardWidth, cardHeight, tierColors);

        // 3. Header (MANEIRO INHOUSE)
        this.drawHeader(ctx, cardPadding + 64, cardPadding + 64);

        // 4. Player Identity Section
        const identityY = cardPadding + 200;
        const avatarSize = 192;
        const avatarX = cardPadding + 64;

        await this.drawAvatar(ctx, avatarUrl, avatarX, identityY, avatarSize, tierColors.primary);

        // Nome e tag
        const nameX = avatarX + avatarSize + 48;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 56px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(username, nameX, identityY);

        if (discriminator && discriminator !== '0') {
            const nameWidth = ctx.measureText(username).width;
            ctx.fillStyle = '#6b7280';
            ctx.font = '500 32px sans-serif';
            ctx.fillText(`[${discriminator}]`, nameX + nameWidth + 16, identityY + 8);
        }

        // Badges
        const badgeY = identityY + 80;
        let badgeX = nameX;

        // Badge de posição
        if (mainRole) {
            const badge1Width = this.drawBadge(ctx, mainRole, badgeX, badgeY, '#3b82f6', '');
            badgeX += badge1Width + 16;
        }

        // Badge de streak (exemplo)
        const totalGames = wins + losses;
        if (totalGames >= 5) {
            this.drawBadge(ctx, `${wins}W Streak`, badgeX, badgeY, '#f97316', '🔥');
        }

        // 5. Main Stats Grid (2 colunas)
        const statsY = identityY + 200;
        const statsGap = 32;
        const blockWidth = (cardWidth - 128 - statsGap) / 2;
        const blockHeight = 300;

        // Winrate block (left)
        this.drawWinrateBlock(
            ctx,
            cardPadding + 64,
            statsY,
            blockWidth,
            blockHeight,
            winrate,
            wins,
            losses
        );

        // MMR block (right)
        this.drawMMRBlock(
            ctx,
            cardPadding + 64 + blockWidth + statsGap,
            statsY,
            blockWidth,
            blockHeight,
            mmr,
            rank.full_name,
            tierColors,
            progressPercent
        );

        // 6. Bottom Stats Grid (3 colunas)
        const bottomY = statsY + blockHeight + 32;
        const statCardWidth = (cardWidth - 128 - statsGap * 2) / 3;
        const statCardHeight = 200;

        // Stat 1: KDA ou placeholder
        this.drawStatCard(
            ctx,
            cardPadding + 64,
            bottomY,
            statCardWidth,
            statCardHeight,
            'KDA',
            '3.2',
            '/avg'
        );

        // Stat 2: Partidas
        this.drawStatCard(
            ctx,
            cardPadding + 64 + statCardWidth + statsGap,
            bottomY,
            statCardWidth,
            statCardHeight,
            'Partidas',
            totalGames,
            ''
        );

        // Stat 3: Divisão ou placeholder
        this.drawStatCard(
            ctx,
            cardPadding + 64 + (statCardWidth + statsGap) * 2,
            bottomY,
            statCardWidth,
            statCardHeight,
            'Divisão',
            rank.division || '-',
            ''
        );

        console.log('✅ Card gerado com sucesso!');
        return canvas.toBuffer('image/png');
    }
}

module.exports = { ProfileCardGenerator };
