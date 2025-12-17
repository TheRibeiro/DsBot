/**
 * Gerador de Card de Perfil PREMIUM - Maneiro Inhouse
 * Design profissional inspirado em plataformas competitivas
 */

const { createCanvas, loadImage } = require('@napi-rs/canvas');

// === CORES POR TIER ===
const TIER_COLORS = {
    'BRONZE': { primary: '#CD7F32', glow: 'rgba(205, 127, 50, 0.4)', icon: '🥉' },
    'PRATA': { primary: '#C0C0C0', glow: 'rgba(192, 192, 192, 0.4)', icon: '🥈' },
    'OURO': { primary: '#FFD700', glow: 'rgba(255, 215, 0, 0.5)', icon: '🥇' },
    'PLATINA': { primary: '#00CED1', glow: 'rgba(0, 206, 209, 0.4)', icon: '💠' },
    'DIAMANTE': { primary: '#B9F2FF', glow: 'rgba(185, 242, 255, 0.4)', icon: '💎' },
    'MESTRE': { primary: '#9333EA', glow: 'rgba(147, 51, 234, 0.5)', icon: '👑' },
    'ELITE': { primary: '#EF4444', glow: 'rgba(239, 68, 68, 0.5)', icon: '🔥' }
};

class ProfileCardGenerator {
    constructor() {
        this.width = 1400;
        this.height = 700;
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

        console.log('🎨 Gerando card PREMIUM:', username);

        // Validação
        const safe = {
            username: username || 'Jogador',
            rank: rank || { tier: 'BRONZE', full_name: 'Bronze I' },
            mmr: mmr ?? 0,
            wins: wins ?? 0,
            losses: losses ?? 0,
            winrate: winrate ?? 0,
            mainRole: mainRole || 'Jogador',
            avatarUrl: avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'
        };

        const totalGames = safe.wins + safe.losses;
        const tierColor = TIER_COLORS[safe.rank.tier] || TIER_COLORS['BRONZE'];

        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');

        // =============================================
        // 1. BACKGROUND ESCURO COM GRADIENTE
        // =============================================
        const bgGradient = ctx.createLinearGradient(0, 0, this.width, this.height);
        bgGradient.addColorStop(0, '#0a0e1a');
        bgGradient.addColorStop(0.5, '#0f1419');
        bgGradient.addColorStop(1, '#1a1f2e');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Overlay do tier (canto superior direito)
        const tierGlow = ctx.createRadialGradient(this.width * 0.8, 200, 0, this.width * 0.8, 200, 600);
        tierGlow.addColorStop(0, tierColor.glow);
        tierGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = tierGlow;
        ctx.fillRect(0, 0, this.width, this.height);

        // =============================================
        // 2. CARD PRINCIPAL (CONTAINER)
        // =============================================
        const margin = 40;
        const cardX = margin;
        const cardY = margin;
        const cardW = this.width - margin * 2;
        const cardH = this.height - margin * 2;

        // Shadow profunda
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 60;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 20;

        // Card background
        ctx.fillStyle = 'rgba(15, 20, 30, 0.85)';
        this.roundRect(ctx, cardX, cardY, cardW, cardH, 32);
        ctx.fill();

        // Border dourada sutil
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255, 215, 0, 0.15)`;
        ctx.lineWidth = 2;
        this.roundRect(ctx, cardX, cardY, cardW, cardH, 32);
        ctx.stroke();

        // =============================================
        // 3. HEADER COM BRANDING
        // =============================================
        const headerY = cardY + 50;

        // Logo placeholder (círculo esquerdo)
        const logoSize = 60;
        const logoX = cardX + 60;

        ctx.beginPath();
        ctx.arc(logoX, headerY, logoSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.fill();
        ctx.strokeStyle = tierColor.primary;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Texto "MANEIRO INHOUSE"
        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 8;
        ctx.fillText('MANEIRO INHOUSE', logoX + 50, headerY);
        ctx.shadowBlur = 0;

        // =============================================
        // 4. RANK BADGE (DIREITA)
        // =============================================
        const badgeW = 220;
        const badgeH = 80;
        const badgeX = cardX + cardW - badgeW - 60;
        const badgeY = headerY - badgeH / 2;

        // Background do badge
        const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
        badgeGrad.addColorStop(0, tierColor.primary);
        badgeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

        ctx.shadowColor = tierColor.glow;
        ctx.shadowBlur = 30;
        ctx.fillStyle = badgeGrad;
        this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 16);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Border do badge
        ctx.strokeStyle = tierColor.primary;
        ctx.lineWidth = 2;
        this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 16);
        ctx.stroke();

        // Texto do rank
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(safe.rank.full_name.toUpperCase(), badgeX + badgeW / 2, badgeY + 28);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(`${safe.mmr} MMR`, badgeX + badgeW / 2, badgeY + 54);

        // =============================================
        // 5. AVATAR + INFO DO PLAYER (ESQUERDA)
        // =============================================
        const avatarY = headerY + 100;
        const avatarSize = 180;
        const avatarX = cardX + 80;

        // Avatar com glow
        try {
            const avatar = await loadImage(safe.avatarUrl);

            // Glow effect intenso
            ctx.shadowColor = tierColor.primary;
            ctx.shadowBlur = 40;
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = tierColor.primary;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Avatar circular
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2 - 6, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
            ctx.restore();

            // Border dupla
            ctx.strokeStyle = tierColor.primary;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2 - 3, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2 + 2, 0, Math.PI * 2);
            ctx.stroke();
        } catch (error) {
            console.error('❌ Erro ao carregar avatar:', error);
        }

        // Nome e posição (ao lado do avatar)
        const infoX = avatarX + 140;
        let infoY = avatarY - 40;

        // Nome
        let nameSize = 56;
        if (safe.username.length > 12) nameSize = 48;
        if (safe.username.length > 18) nameSize = 40;

        ctx.font = `bold ${nameSize}px sans-serif`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 12;
        ctx.fillText(safe.username, infoX, infoY);

        // Posição
        infoY += nameSize + 20;
        ctx.font = '28px sans-serif';
        ctx.fillStyle = '#A0AEC0';
        ctx.shadowBlur = 6;
        ctx.fillText(`⚽ ${safe.mainRole}`, infoX, infoY);
        ctx.shadowBlur = 0;

        // =============================================
        // 6. STATS PRINCIPAIS (3 CARDS)
        // =============================================
        const statsStartY = avatarY + 140;
        const gap = 30;
        const cardWidth = (cardW - 160 - gap * 2) / 3;
        const cardHeight = 160;

        // CARD 1: WINRATE
        const card1X = cardX + 80;
        this.drawStatCard(ctx, {
            x: card1X,
            y: statsStartY,
            width: cardWidth,
            height: cardHeight,
            label: 'WINRATE',
            value: `${safe.winrate}%`,
            color: safe.winrate >= 50 ? '#48BB78' : '#F56565',
            showBar: true,
            percentage: safe.winrate,
            tierColor: tierColor.primary
        });

        // CARD 2: PARTIDAS
        const card2X = card1X + cardWidth + gap;
        this.drawStatCard(ctx, {
            x: card2X,
            y: statsStartY,
            width: cardWidth,
            height: cardHeight,
            label: 'PARTIDAS',
            value: `${totalGames}`,
            color: '#4299E1',
            showBar: false,
            tierColor: tierColor.primary
        });

        // CARD 3: W-L
        const card3X = card2X + cardWidth + gap;
        this.drawWLCard(ctx, {
            x: card3X,
            y: statsStartY,
            width: cardWidth,
            height: cardHeight,
            wins: safe.wins,
            losses: safe.losses,
            tierColor: tierColor.primary
        });

        // =============================================
        // 7. MINI STATS (3 CARDS PEQUENOS)
        // =============================================
        const miniY = statsStartY + cardHeight + 30;
        const miniH = 120;

        const miniStats = [
            { icon: '🧤', label: 'DEFESAS', value: '—' },
            { icon: '⚡', label: 'PASSES', value: '—' },
            { icon: '🛡️', label: 'INTERCEP.', value: '—' }
        ];

        for (let i = 0; i < 3; i++) {
            this.drawMiniCard(ctx, {
                x: card1X + i * (cardWidth + gap),
                y: miniY,
                width: cardWidth,
                height: miniH,
                icon: miniStats[i].icon,
                label: miniStats[i].label,
                value: miniStats[i].value,
                tierColor: tierColor.primary
            });
        }

        console.log('✅ Card PREMIUM gerado!');
        return canvas.toBuffer('image/png');
    }

    // =============================================
    // UTILITÁRIOS
    // =============================================

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    drawStatCard(ctx, { x, y, width, height, label, value, color, showBar, percentage, tierColor }) {
        // Background
        const grad = ctx.createLinearGradient(x, y, x, y + height);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = grad;
        this.roundRect(ctx, x, y, width, height, 20);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, y, width, height, 20);
        ctx.stroke();

        // Label
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#718096';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, x + width / 2, y + 20);

        // Value
        ctx.font = 'bold 52px sans-serif';
        ctx.fillStyle = color;
        ctx.shadowColor = `${color}80`;
        ctx.shadowBlur = 20;
        ctx.fillText(value, x + width / 2, y + 50);
        ctx.shadowBlur = 0;

        // Progress bar
        if (showBar) {
            const barY = y + height - 35;
            const barW = width - 40;
            const barX = x + 20;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.roundRect(ctx, barX, barY, barW, 10, 5);
            ctx.fill();

            // Fill
            const fillW = (barW * percentage) / 100;
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
            this.roundRect(ctx, barX, barY, fillW, 10, 5);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    drawWLCard(ctx, { x, y, width, height, wins, losses, tierColor }) {
        // Background
        const grad = ctx.createLinearGradient(x, y, x, y + height);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = grad;
        this.roundRect(ctx, x, y, width, height, 20);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, y, width, height, 20);
        ctx.stroke();

        // Label
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#718096';
        ctx.textAlign = 'center';
        ctx.fillText('DESEMPENHO', x + width / 2, y + 20);

        // W-L
        const centerY = y + 80;
        ctx.font = 'bold 40px sans-serif';

        ctx.fillStyle = '#48BB78';
        ctx.textAlign = 'right';
        ctx.fillText(`${wins}W`, x + width / 2 - 20, centerY);

        ctx.fillStyle = '#718096';
        ctx.textAlign = 'center';
        ctx.fillText('-', x + width / 2, centerY);

        ctx.fillStyle = '#F56565';
        ctx.textAlign = 'left';
        ctx.fillText(`${losses}L`, x + width / 2 + 20, centerY);
    }

    drawMiniCard(ctx, { x, y, width, height, icon, label, value, tierColor }) {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.roundRect(ctx, x, y, width, height, 16);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, y, width, height, 16);
        ctx.stroke();

        // Icon
        ctx.font = '36px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(icon, x + width / 2, y + 35);

        // Value
        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(value, x + width / 2, y + 70);

        // Label
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#718096';
        ctx.fillText(label, x + width / 2, y + height - 20);
    }
}

module.exports = { ProfileCardGenerator };
