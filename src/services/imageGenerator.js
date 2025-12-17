/**
 * Gerador de Card de Perfil PREMIUM - Maneiro Inhouse
 * Design UI/UX profissional - ZERO problemas de alinhamento
 */

const { createCanvas, loadImage } = require('@napi-rs/canvas');

// === PALETA DE CORES POR TIER ===
const TIER_THEMES = {
    'BRONZE': {
        primary: '#CD7F32',
        secondary: '#A0522D',
        glow: 'rgba(205, 127, 50, 0.3)',
        bg: 'rgba(205, 127, 50, 0.08)'
    },
    'PRATA': {
        primary: '#C0C0C0',
        secondary: '#A8A8A8',
        glow: 'rgba(192, 192, 192, 0.3)',
        bg: 'rgba(192, 192, 192, 0.08)'
    },
    'OURO': {
        primary: '#FFD700',
        secondary: '#FFA500',
        glow: 'rgba(255, 215, 0, 0.4)',
        bg: 'rgba(255, 215, 0, 0.08)'
    },
    'PLATINA': {
        primary: '#00CED1',
        secondary: '#20B2AA',
        glow: 'rgba(0, 206, 209, 0.3)',
        bg: 'rgba(0, 206, 209, 0.08)'
    },
    'DIAMANTE': {
        primary: '#B9F2FF',
        secondary: '#00BFFF',
        glow: 'rgba(185, 242, 255, 0.3)',
        bg: 'rgba(185, 242, 255, 0.08)'
    },
    'MESTRE': {
        primary: '#9333EA',
        secondary: '#7C3AED',
        glow: 'rgba(147, 51, 234, 0.4)',
        bg: 'rgba(147, 51, 234, 0.08)'
    },
    'ELITE': {
        primary: '#EF4444',
        secondary: '#DC2626',
        glow: 'rgba(239, 68, 68, 0.4)',
        bg: 'rgba(239, 68, 68, 0.08)'
    }
};

class ProfileCardGenerator {
    constructor() {
        // Dimensões otimizadas para Discord
        this.width = 1200;
        this.height = 600;

        // Sistema de Grid de 8px (garante alinhamento perfeito)
        this.grid = 8;

        // Paleta base
        this.colors = {
            bg: {
                primary: '#0D1117',
                secondary: '#161B22',
                card: '#1C2128'
            },
            text: {
                primary: '#E6EDF3',
                secondary: '#7D8590',
                muted: '#484F58'
            },
            success: '#3FB950',
            danger: '#F85149',
            info: '#58A6FF'
        };
    }

    getGrid(multiplier) {
        return this.grid * multiplier;
    }

    drawText(ctx, text, x, y, options = {}) {
        const {
            size = 16,
            weight = 'normal',
            color = this.colors.text.primary,
            align = 'left',
            baseline = 'alphabetic',
            maxWidth = null
        } = options;

        ctx.save();
        ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;

        if (maxWidth) {
            ctx.fillText(text, x, y, maxWidth);
        } else {
            ctx.fillText(text, x, y);
        }

        ctx.restore();
    }

    roundRect(ctx, x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
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
            mainRole,
            avatarUrl
        } = userData;

        console.log('🎨 Gerando card profissional:', username);

        // Validação e defaults
        const data = {
            username: username || 'Jogador',
            rank: rank || { tier: 'BRONZE', full_name: 'Bronze I' },
            mmr: mmr ?? 0,
            wins: wins ?? 0,
            losses: losses ?? 0,
            winrate: winrate ?? 0,
            mainRole: mainRole || 'Jogador',
            avatarUrl: avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'
        };

        const totalGames = data.wins + data.losses;
        const theme = TIER_THEMES[data.rank.tier] || TIER_THEMES['BRONZE'];

        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');

        // ============================================================
        // 1. BACKGROUND (gradiente suave)
        // ============================================================
        const bgGrad = ctx.createLinearGradient(0, 0, this.width, this.height);
        bgGrad.addColorStop(0, this.colors.bg.primary);
        bgGrad.addColorStop(0.5, this.colors.bg.secondary);
        bgGrad.addColorStop(1, this.colors.bg.primary);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Glow sutil do tier
        const glowGrad = ctx.createRadialGradient(
            this.width * 0.85, this.height * 0.3, 0,
            this.width * 0.85, this.height * 0.3, this.width * 0.5
        );
        glowGrad.addColorStop(0, theme.glow);
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // ============================================================
        // 2. CONTAINER PRINCIPAL
        // ============================================================
        const padding = this.getGrid(4); // 32px
        const containerX = padding;
        const containerY = padding;
        const containerW = this.width - padding * 2;
        const containerH = this.height - padding * 2;

        // Card com shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 10;

        ctx.fillStyle = this.colors.bg.card;
        this.roundRect(ctx, containerX, containerY, containerW, containerH, 16);
        ctx.fill();

        // Border sutil
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = theme.primary + '40'; // 25% opacity
        ctx.lineWidth = 1;
        this.roundRect(ctx, containerX, containerY, containerW, containerH, 16);
        ctx.stroke();

        // ============================================================
        // 3. HEADER (Grid: linha 1)
        // ============================================================
        const headerY = containerY + this.getGrid(5); // 40px
        const contentX = containerX + this.getGrid(5);

        // Logo texto
        this.drawText(ctx, '🏆 MANEIRO INHOUSE', contentX, headerY, {
            size: 14,
            weight: 'bold',
            color: this.colors.text.secondary,
            baseline: 'top'
        });

        // Rank badge (direita)
        const badgeW = 200;
        const badgeH = 64;
        const badgeX = containerX + containerW - badgeW - this.getGrid(5);
        const badgeY = headerY - 8;

        // Badge background
        const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
        badgeGrad.addColorStop(0, theme.primary);
        badgeGrad.addColorStop(1, theme.secondary);

        ctx.fillStyle = badgeGrad;
        this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 12);
        ctx.fill();

        // Badge text
        this.drawText(ctx, data.rank.full_name.toUpperCase(), badgeX + badgeW / 2, badgeY + 22, {
            size: 18,
            weight: 'bold',
            color: '#000000',
            align: 'center',
            baseline: 'top'
        });

        this.drawText(ctx, `${data.mmr} MMR`, badgeX + badgeW / 2, badgeY + 43, {
            size: 14,
            color: 'rgba(0, 0, 0, 0.7)',
            align: 'center',
            baseline: 'top'
        });

        // ============================================================
        // 4. PLAYER SECTION (Grid: linha 2)
        // ============================================================
        const playerY = headerY + this.getGrid(12); // ~96px
        const avatarSize = 120;
        const avatarX = contentX + avatarSize / 2;
        const avatarY = playerY + avatarSize / 2;

        // Avatar com glow
        try {
            const avatar = await loadImage(data.avatarUrl);

            // Glow
            ctx.shadowColor = theme.primary;
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = theme.primary;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Avatar
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2 - 4, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(
                avatar,
                avatarX - avatarSize / 2,
                avatarY - avatarSize / 2,
                avatarSize,
                avatarSize
            );
            ctx.restore();

            // Border
            ctx.strokeStyle = theme.primary;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2 - 2, 0, Math.PI * 2);
            ctx.stroke();
        } catch (error) {
            console.error('❌ Avatar:', error.message);
        }

        // Nome e posição (ao lado do avatar)
        const infoX = contentX + avatarSize + this.getGrid(4);

        // Nome
        let nameSize = 44;
        if (data.username.length > 12) nameSize = 36;
        if (data.username.length > 18) nameSize = 28;

        this.drawText(ctx, data.username, infoX, playerY + 20, {
            size: nameSize,
            weight: 'bold',
            color: this.colors.text.primary,
            baseline: 'top'
        });

        // Posição
        this.drawText(ctx, data.mainRole, infoX, playerY + 20 + nameSize + 12, {
            size: 18,
            color: theme.primary,
            baseline: 'top'
        });

        // ============================================================
        // 5. STATS GRID (Grid: linhas 3 e 4)
        // ============================================================
        const statsY = playerY + avatarSize + this.getGrid(5);
        const statGap = this.getGrid(3); // 24px
        const statCardW = (containerW - this.getGrid(10) - statGap * 2) / 3;
        const statCardH = 140;

        // Card 1: WINRATE
        const stat1X = contentX;
        this.drawStatBox(ctx, {
            x: stat1X,
            y: statsY,
            width: statCardW,
            height: statCardH,
            label: 'WINRATE',
            value: `${data.winrate}%`,
            color: data.winrate >= 50 ? this.colors.success : this.colors.danger,
            theme,
            showBar: true,
            barProgress: data.winrate
        });

        // Card 2: PARTIDAS
        const stat2X = stat1X + statCardW + statGap;
        this.drawStatBox(ctx, {
            x: stat2X,
            y: statsY,
            width: statCardW,
            height: statCardH,
            label: 'PARTIDAS',
            value: `${totalGames}`,
            color: this.colors.info,
            theme,
            showBar: false
        });

        // Card 3: DESEMPENHO
        const stat3X = stat2X + statCardW + statGap;
        this.drawWLBox(ctx, {
            x: stat3X,
            y: statsY,
            width: statCardW,
            height: statCardH,
            wins: data.wins,
            losses: data.losses,
            theme
        });

        // ============================================================
        // 6. MINI STATS (Grid: linha 5)
        // ============================================================
        const miniY = statsY + statCardH + statGap;
        const miniH = 100;

        const miniStats = [
            { icon: '🧤', label: 'DEFESAS', value: 0 },
            { icon: '⚡', label: 'PASSES', value: 0 },
            { icon: '🛡️', label: 'INTERCEP.', value: 0 }
        ];

        for (let i = 0; i < 3; i++) {
            this.drawMiniBox(ctx, {
                x: stat1X + i * (statCardW + statGap),
                y: miniY,
                width: statCardW,
                height: miniH,
                icon: miniStats[i].icon,
                label: miniStats[i].label,
                value: miniStats[i].value,
                theme
            });
        }

        console.log('✅ Card profissional gerado!');
        return canvas.toBuffer('image/png');
    }

    // ============================================================
    // COMPONENTES
    // ============================================================

    drawStatBox(ctx, { x, y, width, height, label, value, color, theme, showBar, barProgress }) {
        // Background
        ctx.fillStyle = theme.bg;
        this.roundRect(ctx, x, y, width, height, 12);
        ctx.fill();

        // Border
        ctx.strokeStyle = theme.primary + '30';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, width, height, 12);
        ctx.stroke();

        // Label
        this.drawText(ctx, label, x + width / 2, y + 20, {
            size: 11,
            weight: 'bold',
            color: this.colors.text.secondary,
            align: 'center',
            baseline: 'top'
        });

        // Value
        this.drawText(ctx, value, x + width / 2, y + 50, {
            size: 48,
            weight: 'bold',
            color: color,
            align: 'center',
            baseline: 'top'
        });

        // Progress bar
        if (showBar && barProgress > 0) {
            const barY = y + height - 28;
            const barW = width - 32;
            const barX = x + 16;
            const barH = 8;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.roundRect(ctx, barX, barY, barW, barH, 4);
            ctx.fill();

            // Fill
            const fillW = (barW * Math.min(barProgress, 100)) / 100;
            ctx.fillStyle = color;
            this.roundRect(ctx, barX, barY, fillW, barH, 4);
            ctx.fill();
        }
    }

    drawWLBox(ctx, { x, y, width, height, wins, losses, theme }) {
        // Background
        ctx.fillStyle = theme.bg;
        this.roundRect(ctx, x, y, width, height, 12);
        ctx.fill();

        // Border
        ctx.strokeStyle = theme.primary + '30';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, width, height, 12);
        ctx.stroke();

        // Label
        this.drawText(ctx, 'DESEMPENHO', x + width / 2, y + 20, {
            size: 11,
            weight: 'bold',
            color: this.colors.text.secondary,
            align: 'center',
            baseline: 'top'
        });

        // W-L
        const centerY = y + 70;
        const centerX = x + width / 2;

        this.drawText(ctx, `${wins}W`, centerX - 25, centerY, {
            size: 36,
            weight: 'bold',
            color: this.colors.success,
            align: 'right',
            baseline: 'middle'
        });

        this.drawText(ctx, '-', centerX, centerY, {
            size: 36,
            color: this.colors.text.muted,
            align: 'center',
            baseline: 'middle'
        });

        this.drawText(ctx, `${losses}L`, centerX + 25, centerY, {
            size: 36,
            weight: 'bold',
            color: this.colors.danger,
            align: 'left',
            baseline: 'middle'
        });
    }

    drawMiniBox(ctx, { x, y, width, height, icon, label, value, theme }) {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.roundRect(ctx, x, y, width, height, 10);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, width, height, 10);
        ctx.stroke();

        // Icon
        this.drawText(ctx, icon, x + width / 2, y + 20, {
            size: 28,
            align: 'center',
            baseline: 'top'
        });

        // Value
        const displayValue = value > 0 ? value.toString() : '—';
        this.drawText(ctx, displayValue, x + width / 2, y + 52, {
            size: 24,
            weight: 'bold',
            color: value > 0 ? this.colors.text.primary : this.colors.text.muted,
            align: 'center',
            baseline: 'top'
        });

        // Label
        this.drawText(ctx, label, x + width / 2, y + height - 16, {
            size: 10,
            weight: 'bold',
            color: this.colors.text.secondary,
            align: 'center',
            baseline: 'top'
        });
    }
}

module.exports = { ProfileCardGenerator };
