/**
 * Premium Profile Card Image Generator
 * Using Puppeteer for 100% HTML/CSS fidelity
 *
 * Este gerador usa Puppeteer (navegador headless Chrome) para:
 * 1. Carregar o template HTML profile-card.html
 * 2. Substituir placeholders com dados reais do jogador
 * 3. Tirar screenshot do elemento
 * 4. Retornar a imagem PNG
 *
 * Vantagens:
 * - Resultado IDÊNTICO ao HTML de referência
 * - Suporta sombras, blur, gradientes, emojis coloridos
 * - Fontes customizadas (Inter via Google Fonts)
 * - Glassmorphism perfeito
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
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

/**
 * Ícones de posições
 */
const ROLE_ICONS = {
    'Goleiro': '🧤',
    'Zagueiro': '🛡️',
    'Lateral': '⚡',
    'Volante': '⚙️',
    'Meia': '🎯',
    'Atacante': '⚽'
};

class ProfileCardGenerator {
    constructor() {
        this.browser = null;
        this.templatePath = path.join(__dirname, '../templates/profile-card.html');
    }

    /**
     * Inicializa o navegador Puppeteer (reusável)
     */
    async initBrowser() {
        if (!this.browser) {
            Logger.info('🌐 Inicializando Puppeteer...');
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            });
            Logger.info('✅ Puppeteer inicializado');
        }
        return this.browser;
    }

    /**
     * Fecha o navegador
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            Logger.info('🔒 Puppeteer fechado');
        }
    }

    /**
     * Carrega o template HTML e substitui placeholders
     */
    async loadTemplate(userData) {
        const {
            username,
            discriminator,
            avatarUrl,
            rank,
            mmr,
            wins,
            losses,
            winrate,
            kda = 0,
            mainRole,
            progressPercent = 0
        } = userData;

        const totalGames = wins + losses;
        const tierColors = TIER_COLORS[rank.tier] || TIER_COLORS['BRONZE'];
        const roleIcon = ROLE_ICONS[mainRole] || '⚽';

        // Calcular win streak (exemplo simples - você pode melhorar isso)
        const winStreak = wins >= 5 ? Math.min(wins, 10) : 0;

        // Ler template
        let html = await fs.readFile(this.templatePath, 'utf-8');

        // Substituir placeholders
        html = html
            .replace(/{{AVATAR_URL}}/g, avatarUrl)
            .replace(/{{USERNAME}}/g, username)
            .replace(/{{DISCRIMINATOR}}/g, discriminator || '')
            .replace(/{{MAIN_ROLE}}/g, mainRole || '')
            .replace(/{{ROLE_ICON}}/g, roleIcon)
            .replace(/{{WIN_STREAK}}/g, winStreak > 0 ? winStreak : '')
            .replace(/{{WINRATE}}/g, winrate)
            .replace(/{{WINS}}/g, wins)
            .replace(/{{LOSSES}}/g, losses)
            .replace(/{{TOTAL_GAMES}}/g, totalGames)
            .replace(/{{MMR}}/g, mmr)
            .replace(/{{RANK_NAME}}/g, rank.full_name)
            .replace(/{{PROGRESS_PERCENT}}/g, progressPercent)
            .replace(/{{KDA}}/g, kda || '0.0')
            .replace(/{{DIVISION}}/g, rank.division || '-')
            .replace(/{{TIER_PRIMARY}}/g, tierColors.primary)
            .replace(/{{TIER_SECONDARY}}/g, tierColors.secondary)
            .replace(/{{TIER_ICON}}/g, tierColors.icon);

        // Remover blocos condicionais vazios (handlebars simples)
        html = html.replace(/{{#if \w+}}[\s\S]*?{{\/if}}/g, (match) => {
            // Se o placeholder ainda existe, remover o bloco
            if (match.includes('{{') && !match.includes('{{#if')) {
                return '';
            }
            // Remover as tags de controle
            return match.replace(/{{#if \w+}}/g, '').replace(/{{\/if}}/g, '');
        });

        return html;
    }

    /**
     * Gera o card de perfil usando Puppeteer
     */
    async generateProfileCard(userData) {
        const {
            username,
            rank,
            mmr,
            wins,
            losses,
            winrate
        } = userData;

        console.log('🎨 Gerando card com Puppeteer (100% HTML fidelity)');
        console.log(`   - ${username} | ${rank?.full_name} | ${mmr} MMR | ${winrate}% WR`);

        try {
            // Inicializar navegador
            const browser = await this.initBrowser();

            // Carregar template com dados
            const html = await this.loadTemplate(userData);

            // Criar nova página
            const page = await browser.newPage();

            // Configurar viewport (tamanho da tela)
            await page.setViewport({
                width: 1200,
                height: 1000,
                deviceScaleFactor: 2 // Retina quality
            });

            // Carregar HTML
            await page.setContent(html, {
                waitUntil: 'networkidle0' // Aguardar fontes e imagens
            });

            // Aguardar elemento do card estar visível
            await page.waitForSelector('#profile-card', { timeout: 5000 });

            // Tirar screenshot do elemento específico
            const element = await page.$('#profile-card');
            const screenshot = await element.screenshot({
                type: 'png',
                omitBackground: false
            });

            // Fechar página (mas manter navegador aberto para próximas gerações)
            await page.close();

            console.log('✅ Card gerado com sucesso via Puppeteer!');
            return screenshot;

        } catch (error) {
            Logger.error(`❌ Erro ao gerar card com Puppeteer: ${error.message}`);
            console.error(error.stack);
            throw error;
        }
    }

    /**
     * Método para gerar e salvar localmente (debug)
     */
    async generateAndSave(userData, outputPath) {
        const buffer = await this.generateProfileCard(userData);
        await fs.writeFile(outputPath, buffer);
        console.log(`💾 Card salvo em: ${outputPath}`);
    }
}

// Singleton instance
let generatorInstance = null;

/**
 * Retorna instância singleton do gerador
 */
function getGenerator() {
    if (!generatorInstance) {
        generatorInstance = new ProfileCardGenerator();
    }
    return generatorInstance;
}

/**
 * Fecha o gerador (cleanup)
 */
async function closeGenerator() {
    if (generatorInstance) {
        await generatorInstance.close();
        generatorInstance = null;
    }
}

module.exports = {
    ProfileCardGenerator: getGenerator,
    closeGenerator
};
