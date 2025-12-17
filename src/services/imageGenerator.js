/**
 * Gerador de Card de Perfil PREMIUM - Maneiro Inhouse
 * Design UI/UX profissional de verdade - NADA TORTO, TUDO ALINHADO
 */

const { createCanvas, loadImage } = require('@napi-rs/canvas');

// === CORES POR TIER ===
const TIER_COLORS = {
    'BRONZE': { primary: '#CD7F32', secondary: '#964B00', icon: '🥉' },
    'PRATA': { primary: '#C0C0C0', secondary: '#A8A8A8', icon: '🥈' },
    'OURO': { primary: '#FFD700', secondary: '#DAA520', icon: '🥇' },
    'PLATINA': { primary: '#00CED1', secondary: '#008B8B', icon: '💠' },
    'DIAMANTE': { primary: '#B9F2FF', secondary: '#00BFFF', icon: '💎' },
    'MESTRE': { primary: '#9333EA', secondary: '#7C3AED', icon: '👑' },
    'ELITE': { primary: '#EF4444', secondary: '#DC2626', icon: '🔥' }
};

// === ÍCONES POR POSIÇÃO ===
const POSITION_ICONS = {
    'Goleiro': '🧤',
    'Fixo': '🛡️',
    'Ala Def': '🛡️',
    'Ala Of': '⚡',
    'Pivô': '⚽'
};

class ProfileCardGenerator {
    constructor() {
        // Dimensões perfeitas para Discord
        this.width = 1200;
        this.height = 600;

        // Sistema de Grid de 8px
        this.unit = 8;

        // Paleta de cores profissional
        this.colors = {
            bg: {
                dark: '#0F0F1E',
                medium: '#1A1A2E',
                light: '#25254A'
            },
            card: 'rgba(20, 20, 35, 0.95)',
            text: {
                primary: '#FFFFFF',
                secondary: '#A0AEC0',
                muted: '#718096'
            },
            accent: {
                success: '#48BB78',
                danger: '#F56565',
                info: '#4299E1',
                warning: '#ECC94B'
            },
            overlay: 'rgba(0, 0, 0, 0.3)'
        };
    }

    // Utilitários de desenho
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    roundRect(ctx, x, y, width, height, radius) {
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

    drawText(ctx, text, x, y, size, color, weight = 'normal', align = 'left', baseline = 'top') {
        ctx.font = `${weight === 'bold' ? 'bold ' : ''}${size}px sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;

        // Sombra sutil para legibilidade
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        ctx.fillText(text, x, y);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
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

        console.log('🎨 [PREMIUM] Gerando card para:', username);

        // Validação robusta
        const safeData = {
            username: username || 'Jogador',
            rank: rank || { tier: 'BRONZE', full_name: 'Bronze I' },
            mmr: mmr ?? 0,
            wins: wins ?? 0,
            losses: losses ?? 0,
            winrate: winrate ?? 0,
            mainRole: mainRole || 'Jogador',
            avatarUrl: avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'
        };

        const totalGames = safeData.wins + safeData.losses;
        const tierColor = TIER_COLORS[safeData.rank.tier] || TIER_COLORS['BRONZE'];
        const posIcon = POSITION_ICONS[safeData.mainRole] || '⚽';

        // Criar canvas
        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');

        // ========================================
        // 1. BACKGROUND COM GRADIENTE DIAGONAL
        // ========================================
        const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, this.colors.bg.dark);
        gradient.addColorStop(0.5, this.colors.bg.medium);
        gradient.addColorStop(1, this.colors.bg.light);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Overlay sutil do tier
        const rgb = this.hexToRgb(tierColor.primary);
        const tierOverlay = ctx.createRadialGradient(
            this.width * 0.7, this.height * 0.3, 0,
            this.width * 0.7, this.height * 0.3, this.width * 0.6
        );
        tierOverlay.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
        tierOverlay.addColorStop(1, 'transparent');
        ctx.fillStyle = tierOverlay;
        ctx.fillRect(0, 0, this.width, this.height);

        // ========================================
        // 2. CONTAINER PRINCIPAL (CARD)
        // ========================================
        const margin = this.unit * 4; // 32px
        const cardX = margin;
        const cardY = margin;
        const cardW = this.width - (margin * 2);
        const cardH = this.height - (margin * 2);
        const radius = this.unit * 3; // 24px

        // Shadow do card
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;

        ctx.fillStyle = this.colors.card;
        this.roundRect(ctx, cardX, cardY, cardW, cardH, radius);
        ctx.fill();

        // Border sutil
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, cardX, cardY, cardW, cardH, radius);
        ctx.stroke();

        // ========================================
        // 3. LAYOUT INTERNO (GRID SYSTEM)
        // ========================================
        const contentPadding = this.unit * 5; // 40px
        const contentX = cardX + contentPadding;
        const contentY = cardY + contentPadding;
        const contentW = cardW - (contentPadding * 2);
        const contentH = cardH - (contentPadding * 2);

        // ========================================
        // 4. HEADER (BRANDING + RANK)
        // ========================================
        const headerH = this.unit * 8; // 64px

        // Branding
        this.drawText(
            ctx,
            '🏆 MANEIRO INHOUSE',
            contentX,
            contentY + this.unit,
            12,
            this.colors.text.muted,
            'bold',
            'left',
            'top'
        );

        // Rank Badge (direita)
        const badgeW = 180;
        const badgeH = 56;
        const badgeX = contentX + contentW - badgeW;
        const badgeY = contentY;

        // Badge background com gradiente
        const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeH);
        badgeGrad.addColorStop(0, tierColor.primary);
        badgeGrad.addColorStop(1, tierColor.secondary);

        ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`;
        ctx.shadowBlur = 16;
        ctx.fillStyle = badgeGrad;
        this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 12);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Badge text
        this.drawText(
            ctx,
            safeData.rank.full_name.toUpperCase(),
            badgeX + badgeW / 2,
            badgeY + 16,
            14,
            '#FFFFFF',
            'bold',
            'center',
            'top'
        );
        this.drawText(
            ctx,
            `${safeData.mmr} MMR`,
            badgeX + badgeW / 2,
            badgeY + 34,
            11,
            'rgba(255, 255, 255, 0.85)',
            'normal',
            'center',
            'top'
        );

        // ========================================
        // 5. PLAYER SECTION (AVATAR + INFO)
        // ========================================
        const playerY = contentY + headerH + (this.unit * 4); // 32px gap
        const avatarSize = 140;
        const avatarX = contentX;

        // Avatar com borda e glow
        try {
            const avatar = await loadImage(safeData.avatarUrl);

            // Glow effect
            ctx.shadowColor = tierColor.primary;
            ctx.shadowBlur = 24;
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, playerY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = tierColor.primary;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Avatar circular
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, playerY + avatarSize / 2, avatarSize / 2 - 4, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX, playerY, avatarSize, avatarSize);
            ctx.restore();

            // Border
            ctx.strokeStyle = tierColor.primary;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, playerY + avatarSize / 2, avatarSize / 2 - 2.5, 0, Math.PI * 2);
            ctx.stroke();
        } catch (error) {
            console.error('❌ Erro ao carregar avatar:', error);
        }

        // Player info (ao lado do avatar)
        const infoX = avatarX + avatarSize + (this.unit * 4); // 32px gap
        let infoY = playerY + this.unit * 2;

        // Nome (adaptativo)
        let nameSize = 48;
        if (safeData.username.length > 15) nameSize = 40;
        if (safeData.username.length > 20) nameSize = 32;

        this.drawText(
            ctx,
            safeData.username,
            infoX,
            infoY,
            nameSize,
            this.colors.text.primary,
            'bold',
            'left',
            'top'
        );

        infoY += nameSize + this.unit * 2;

        // Posição
        this.drawText(
            ctx,
            `${posIcon} ${safeData.mainRole}`,
            infoX,
            infoY,
            22,
            this.colors.text.secondary,
            'normal',
            'left',
            'top'
        );

        // ========================================
        // 6. STATS SECTION (3 CARDS ALINHADOS)
        // ========================================
        const statsY = playerY + avatarSize + (this.unit * 5); // 40px gap
        const statCardH = 120;
        const gap = this.unit * 3; // 24px
        const statCardW = (contentW - (gap * 2)) / 3; // 3 cards com 2 gaps

        // CARD 1: WINRATE
        const card1X = contentX;
        this.drawStatCard(ctx, {
            x: card1X,
            y: statsY,
            width: statCardW,
            height: statCardH,
            label: 'WINRATE',
            value: `${safeData.winrate}%`,
            color: safeData.winrate >= 50 ? this.colors.accent.success : this.colors.accent.danger,
            showProgress: true,
            progress: safeData.winrate
        });

        // CARD 2: PARTIDAS
        const card2X = card1X + statCardW + gap;
        this.drawStatCard(ctx, {
            x: card2X,
            y: statsY,
            width: statCardW,
            height: statCardH,
            label: 'PARTIDAS',
            value: `${totalGames}`,
            color: this.colors.accent.info,
            showProgress: false
        });

        // CARD 3: W-L
        const card3X = card2X + statCardW + gap;
        this.drawWLCard(ctx, {
            x: card3X,
            y: statsY,
            width: statCardW,
            height: statCardH,
            wins: safeData.wins,
            losses: safeData.losses
        });

        // ========================================
        // 7. MINI STATS (3 CARDS PEQUENOS)
        // ========================================
        const miniStatsY = statsY + statCardH + (this.unit * 3); // 24px gap
        const miniCardH = 90;
        const miniCardW = statCardW;

        const miniStats = [
            { icon: '🧤', label: 'DEFESAS', value: '--' },
            { icon: '⚡', label: 'PASSES', value: '--' },
            { icon: '🛡️', label: 'INTERCEP.', value: '--' }
        ];

        for (let i = 0; i < 3; i++) {
            const x = contentX + (i * (miniCardW + gap));
            this.drawMiniStatCard(ctx, {
                x,
                y: miniStatsY,
                width: miniCardW,
                height: miniCardH,
                icon: miniStats[i].icon,
                label: miniStats[i].label,
                value: miniStats[i].value
            });
        }

        console.log('✅ [PREMIUM] Card gerado com sucesso!');
        return canvas.toBuffer('image/png');
    }

    // ========================================
    // COMPONENTES REUTILIZÁVEIS
    // ========================================

    drawStatCard(ctx, config) {
        const { x, y, width, height, label, value, color, showProgress, progress } = config;

        // Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        this.roundRect(ctx, x, y, width, height, 16);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, width, height, 16);
        ctx.stroke();

        // Label
        this.drawText(
            ctx,
            label,
            x + width / 2,
            y + 16,
            11,
            this.colors.text.muted,
            'bold',
            'center',
            'top'
        );

        // Value
        this.drawText(
            ctx,
            value,
            x + width / 2,
            y + 42,
            42,
            color,
            'bold',
            'center',
            'top'
        );

        // Progress bar (opcional)
        if (showProgress) {
            const barY = y + height - 24;
            const barW = width - 32;
            const barX = x + 16;
            const barH = 6;

            // Background bar
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.roundRect(ctx, barX, barY, barW, barH, 3);
            ctx.fill();

            // Fill bar
            const fillW = (barW * progress) / 100;
            ctx.fillStyle = color;
            this.roundRect(ctx, barX, barY, fillW, barH, 3);
            ctx.fill();
        }
    }

    drawWLCard(ctx, config) {
        const { x, y, width, height, wins, losses } = config;

        // Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        this.roundRect(ctx, x, y, width, height, 16);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, width, height, 16);
        ctx.stroke();

        // Label
        this.drawText(
            ctx,
            'DESEMPENHO',
            x + width / 2,
            y + 16,
            11,
            this.colors.text.muted,
            'bold',
            'center',
            'top'
        );

        // W-L centralizado
        const centerX = x + width / 2;
        const centerY = y + 60;

        this.drawText(ctx, `${wins}W`, centerX - 24, centerY, 32, this.colors.accent.success, 'bold', 'right', 'middle');
        this.drawText(ctx, '-', centerX, centerY, 32, this.colors.text.muted, 'normal', 'center', 'middle');
        this.drawText(ctx, `${losses}L`, centerX + 24, centerY, 32, this.colors.accent.danger, 'bold', 'left', 'middle');
    }

    drawMiniStatCard(ctx, config) {
        const { x, y, width, height, icon, label, value } = config;

        // Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        this.roundRect(ctx, x, y, width, height, 12);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, width, height, 12);
        ctx.stroke();

        // Icon
        this.drawText(
            ctx,
            icon,
            x + width / 2,
            y + 16,
            28,
            this.colors.text.primary,
            'normal',
            'center',
            'top'
        );

        // Value
        this.drawText(
            ctx,
            value,
            x + width / 2,
            y + 50,
            22,
            this.colors.text.primary,
            'bold',
            'center',
            'top'
        );

        // Label
        this.drawText(
            ctx,
            label,
            x + width / 2,
            y + height - 14,
            10,
            this.colors.text.muted,
            'bold',
            'center',
            'top'
        );
    }
}

module.exports = { ProfileCardGenerator };
