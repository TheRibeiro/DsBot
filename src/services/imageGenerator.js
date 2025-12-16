/**
 * Premium Profile Card Image Generator
 *
 * Gera cards visuais impactantes estilo Faceit/GamersClub com:
 * - Gradientes baseados nas cores do rank
 * - Glassmorphism (vidro fosco)
 * - Barras de progresso animadas
 * - Fontes modernas e sombras suaves
 */

const { createCanvas, loadImage, registerFont } = require('@napi-rs/canvas');
const path = require('path');
const { Logger } = require('../../logger');

/**
 * Configuração de cores dos tiers (sincronizado com Rank.php)
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
        this.width = 900;
        this.height = 500;
        this.loaded = false;

        // Tentar registrar fontes customizadas (opcional)
        try {
            const fontsDir = path.join(__dirname, '../../assets/fonts');
            // Você pode baixar fontes como Inter, Poppins, etc. e colocar aqui
            // registerFont(path.join(fontsDir, 'Inter-Bold.ttf'), { family: 'Inter', weight: 'bold' });
            // registerFont(path.join(fontsDir, 'Inter-Regular.ttf'), { family: 'Inter' });
        } catch (error) {
            Logger.warn('⚠️ Fontes customizadas não encontradas, usando fontes do sistema');
        }
    }

    /**
     * Converte HEX para RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    /**
     * Desenha background com gradiente baseado no rank
     */
    drawBackground(ctx, tierColors) {
        const { primary, secondary } = tierColors;

        // Fundo escuro base
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, this.width, this.height);

        // Gradiente radial do rank (top-right)
        const gradient = ctx.createRadialGradient(this.width * 0.8, this.height * 0.2, 0, this.width * 0.8, this.height * 0.2, this.width * 0.7);
        const primaryRgb = this.hexToRgb(primary);
        const secondaryRgb = this.hexToRgb(secondary);

        gradient.addColorStop(0, `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3)`);
        gradient.addColorStop(0.5, `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.15)`);
        gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Efeito de noise/textura (opcional)
        this.drawNoise(ctx, 0.03);
    }

    /**
     * Adiciona textura de ruído sutil
     */
    drawNoise(ctx, opacity = 0.03) {
        const imageData = ctx.getImageData(0, 0, this.width, this.height);
        const pixels = imageData.data;

        for (let i = 0; i < pixels.length; i += 4) {
            const noise = (Math.random() - 0.5) * 255 * opacity;
            pixels[i] += noise;
            pixels[i + 1] += noise;
            pixels[i + 2] += noise;
        }

        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Desenha card com glassmorphism
     */
    drawGlassCard(ctx, x, y, width, height, borderColor, blur = 20) {
        // Sombra externa
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;

        // Background semi-transparente (vidro fosco)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.roundRect(ctx, x, y, width, height, 20, true, false);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Borda com cor do rank
        const borderRgb = this.hexToRgb(borderColor);
        ctx.strokeStyle = `rgba(${borderRgb.r}, ${borderRgb.g}, ${borderRgb.b}, 0.3)`;
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, y, width, height, 20, false, true);

        // Brilho interno (top)
        const innerGlow = ctx.createLinearGradient(x, y, x, y + 100);
        innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = innerGlow;
        this.roundRect(ctx, x, y, width, 100, 20, true, false);
    }

    /**
     * Desenha retângulo com bordas arredondadas
     */
    roundRect(ctx, x, y, width, height, radius, fill, stroke) {
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
     * Desenha avatar circular com borda colorida
     */
    async drawAvatar(ctx, avatarUrl, x, y, size, borderColor) {
        try {
            const avatar = await loadImage(avatarUrl);

            // Sombra do avatar
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 8;

            // Borda colorida
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2 + 5, 0, Math.PI * 2);
            const borderRgb = this.hexToRgb(borderColor);
            ctx.fillStyle = `rgba(${borderRgb.r}, ${borderRgb.g}, ${borderRgb.b}, 0.8)`;
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
            // Fallback: círculo cinza
            ctx.fillStyle = '#2a2e3a';
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Desenha barra de progresso moderna
     */
    drawProgressBar(ctx, x, y, width, height, percent, color) {
        // Background da barra
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.roundRect(ctx, x, y, width, height, height / 2, true, false);

        // Borda
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, width, height, height / 2, false, true);

        // Barra de progresso
        const fillWidth = (width - 4) * (percent / 100);
        if (fillWidth > 0) {
            const gradient = ctx.createLinearGradient(x, y, x + fillWidth, y);
            const rgb = this.hexToRgb(color);
            gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`);
            gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`);

            ctx.fillStyle = gradient;
            this.roundRect(ctx, x + 2, y + 2, fillWidth, height - 4, (height - 4) / 2, true, false);

            // Glow effect
            ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
            ctx.shadowBlur = 15;
            this.roundRect(ctx, x + 2, y + 2, fillWidth, height - 4, (height - 4) / 2, true, false);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }
    }

    /**
     * Formata número com separador de milhares
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
            kda,
            mainRole,
            progressPercent = 0
        } = userData;

        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');

        // Configuração de texto
        ctx.textBaseline = 'top';

        // Obter cores do tier
        const tierColors = TIER_COLORS[rank.tier] || TIER_COLORS['BRONZE'];

        // 1. Background
        this.drawBackground(ctx, tierColors);

        // 2. Card principal com glassmorphism
        const cardX = 40;
        const cardY = 40;
        const cardWidth = this.width - 80;
        const cardHeight = this.height - 80;
        this.drawGlassCard(ctx, cardX, cardY, cardWidth, cardHeight, tierColors.primary);

        // 3. Avatar (esquerda)
        const avatarSize = 140;
        const avatarX = cardX + 40;
        const avatarY = cardY + 40;
        await this.drawAvatar(ctx, avatarUrl, avatarX, avatarY, avatarSize, tierColors.primary);

        // 4. Nome do usuário
        const textX = avatarX + avatarSize + 30;
        let currentY = avatarY;

        ctx.font = 'bold 36px Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${username}`, textX, currentY);

        if (discriminator && discriminator !== '0') {
            ctx.font = '24px Arial, sans-serif';
            ctx.fillStyle = '#888888';
            ctx.fillText(`#${discriminator}`, textX + ctx.measureText(username).width + 10, currentY + 8);
        }

        currentY += 50;

        // 5. Título do Rank (GRANDE e impactante)
        ctx.font = 'bold 48px Arial, sans-serif';
        const gradient = ctx.createLinearGradient(textX, currentY, textX + 300, currentY);
        const primaryRgb = this.hexToRgb(tierColors.primary);
        const secondaryRgb = this.hexToRgb(tierColors.secondary);
        gradient.addColorStop(0, tierColors.primary);
        gradient.addColorStop(1, tierColors.secondary);
        ctx.fillStyle = gradient;

        // Ícone + Nome do Rank
        ctx.fillText(`${tierColors.icon} ${rank.full_name.toUpperCase()}`, textX, currentY);

        // Glow no rank
        ctx.shadowColor = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8)`;
        ctx.shadowBlur = 25;
        ctx.fillText(`${tierColors.icon} ${rank.full_name.toUpperCase()}`, textX, currentY);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        currentY += 60;

        // 6. MMR
        ctx.font = '20px Arial, sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`${this.formatNumber(mmr)} MMR`, textX, currentY);

        currentY += 40;

        // 7. Barra de Progresso
        if (progressPercent > 0 && rank.tier !== 'ELITE') {
            const barWidth = 400;
            const barHeight = 16;
            this.drawProgressBar(ctx, textX, currentY, barWidth, barHeight, progressPercent, tierColors.primary);

            // Label do progresso
            ctx.font = '14px Arial, sans-serif';
            ctx.fillStyle = '#cccccc';
            ctx.fillText(`${progressPercent}% para próxima divisão`, textX + barWidth + 15, currentY);

            currentY += 35;
        }

        // 8. Stats (parte inferior)
        const statsY = cardY + cardHeight - 120;
        const statsStartX = cardX + 40;

        // Container de stats com fundo levemente diferente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.roundRect(ctx, statsStartX, statsY, cardWidth - 80, 80, 12, true, false);

        // Estatísticas (simplificado: só winrate e posição)
        const stats = [
            { label: 'WINRATE', value: `${winrate}%`, color: winrate >= 50 ? '#4ade80' : '#f87171' }
        ];

        if (mainRole) {
            stats.push({ label: 'POSIÇÃO', value: mainRole, color: '#a78bfa' });
        }

        const statSpacing = (cardWidth - 80) / stats.length;

        stats.forEach((stat, index) => {
            const statX = statsStartX + (index * statSpacing) + (statSpacing / 2);

            // Label
            ctx.font = 'bold 12px Arial, sans-serif';
            ctx.fillStyle = '#888888';
            ctx.textAlign = 'center';
            ctx.fillText(stat.label, statX, statsY + 20);

            // Value
            ctx.font = 'bold 28px Arial, sans-serif';
            ctx.fillStyle = stat.color;
            ctx.fillText(stat.value.toString(), statX, statsY + 40);
        });

        // Reset text align
        ctx.textAlign = 'left';

        // 9. Marca d'água
        ctx.font = '10px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.textAlign = 'right';
        ctx.fillText('Generated by Rematch Inhouse Bot', this.width - 50, this.height - 20);

        return canvas.toBuffer('image/png');
    }
}

module.exports = { ProfileCardGenerator };
