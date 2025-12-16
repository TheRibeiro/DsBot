/**
 * Role Sync Webhook - Sincronização automática de cargos baseada em MMR/Rank
 *
 * Recebe webhooks do PHP quando um usuário muda de rank e atualiza os cargos no Discord.
 * Remove cargos antigos de rank, posição e permissão de fila, e adiciona os novos.
 */

const express = require('express');
const { Logger } = require('../../logger');

/**
 * Mapeamento de Tiers para nomes de cargos no Discord
 * Ajuste conforme os nomes dos cargos no seu servidor
 */
const TIER_ROLE_MAPPING = {
    'BRONZE': 'Bronze',
    'PRATA': 'Prata',
    'OURO': 'Ouro',
    'PLATINA': 'Platina',
    'DIAMANTE': 'Diamante',
    'MESTRE': 'Mestre',
    'ELITE': 'Elite'
};

/**
 * Mapeamento de divisões (I, II, III)
 * Se quiser ter cargos separados por divisão, como "Ouro I", "Ouro II", etc.
 */
const USE_DIVISION_ROLES = false; // Mude para true se quiser divisões separadas

/**
 * Mapeamento de posições
 */
const POSITION_ROLE_MAPPING = {
    'TOP': 'Top',
    'JUNGLE': 'Jungle',
    'MID': 'Mid',
    'ADC': 'ADC',
    'SUPPORT': 'Support'
};

/**
 * Mapeamento de permissões de fila
 */
const PERMISSION_ROLE_MAPPING = {
    'ALLOWED': 'Fila Liberada',
    'RESTRICTED': 'Fila Restrita',
    'BANNED': 'Banido da Fila'
};

class RoleSyncHandler {
    constructor(discordClient, guildId) {
        this.client = discordClient;
        this.guildId = guildId;
        this.guild = null;

        // Cache de cargos do servidor
        this.rolesCache = {
            tiers: {},
            positions: {},
            permissions: {}
        };
    }

    /**
     * Inicializa o cache de cargos
     */
    async init() {
        try {
            this.guild = await this.client.guilds.fetch(this.guildId);
            await this.refreshRolesCache();
            Logger.info('✅ RoleSyncHandler inicializado');
        } catch (error) {
            Logger.error('❌ Erro ao inicializar RoleSyncHandler:', error.message);
            throw error;
        }
    }

    /**
     * Atualiza o cache de cargos do servidor
     */
    async refreshRolesCache() {
        const roles = await this.guild.roles.fetch();

        // Mapear cargos de tier
        for (const [tierKey, roleName] of Object.entries(TIER_ROLE_MAPPING)) {
            const role = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
            if (role) {
                this.rolesCache.tiers[tierKey] = role.id;
            } else {
                Logger.warn(`⚠️ Cargo de tier não encontrado: ${roleName}`);
            }

            // Se usar divisões, procurar por "Ouro I", "Ouro II", etc.
            if (USE_DIVISION_ROLES) {
                for (let div = 1; div <= 3; div++) {
                    const divNumeral = ['I', 'II', 'III'][div - 1];
                    const divRoleName = `${roleName} ${divNumeral}`;
                    const divRole = roles.find(r => r.name === divRoleName);
                    if (divRole) {
                        this.rolesCache.tiers[`${tierKey}_${div}`] = divRole.id;
                    }
                }
            }
        }

        // Mapear cargos de posição
        for (const [posKey, roleName] of Object.entries(POSITION_ROLE_MAPPING)) {
            const role = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
            if (role) {
                this.rolesCache.positions[posKey] = role.id;
            }
        }

        // Mapear cargos de permissão
        for (const [permKey, roleName] of Object.entries(PERMISSION_ROLE_MAPPING)) {
            const role = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
            if (role) {
                this.rolesCache.permissions[permKey] = role.id;
            }
        }

        Logger.info(`📦 Cache de cargos atualizado: ${Object.keys(this.rolesCache.tiers).length} tiers, ${Object.keys(this.rolesCache.positions).length} posições, ${Object.keys(this.rolesCache.permissions).length} permissões`);
    }

    /**
     * Sincroniza os cargos de um usuário
     */
    async syncUserRoles(payload) {
        const { discord_id, nickname, rank, main_role, position, queue_permission, tier_change } = payload;

        try {
            // Buscar membro no servidor
            const member = await this.guild.members.fetch(discord_id);

            if (!member) {
                Logger.warn(`⚠️ Membro não encontrado no servidor: ${discord_id} (${nickname})`);
                return { success: false, error: 'Member not found in guild' };
            }

            // Determinar cargo de tier correto
            let targetTierRoleId = null;
            if (USE_DIVISION_ROLES) {
                targetTierRoleId = this.rolesCache.tiers[`${rank.tier}_${rank.division}`];
            }
            if (!targetTierRoleId) {
                targetTierRoleId = this.rolesCache.tiers[rank.tier];
            }

            // Remover todos os cargos de tier antigos
            const oldTierRoles = Object.values(this.rolesCache.tiers).filter(roleId =>
                member.roles.cache.has(roleId) && roleId !== targetTierRoleId
            );

            // Remover todos os cargos de posição antigos (se houver main_role)
            const oldPositionRoles = Object.values(this.rolesCache.positions).filter(roleId =>
                member.roles.cache.has(roleId)
            );

            // Remover todos os cargos de permissão antigos
            const oldPermissionRoles = Object.values(this.rolesCache.permissions).filter(roleId =>
                member.roles.cache.has(roleId)
            );

            // Remover cargos antigos
            const rolesToRemove = [...oldTierRoles, ...oldPositionRoles, ...oldPermissionRoles];
            if (rolesToRemove.length > 0) {
                await member.roles.remove(rolesToRemove, `Auto-role sync: atualização de rank para ${rank.full_name}`);
                Logger.info(`🗑️ Removidos ${rolesToRemove.length} cargos antigos de ${nickname}`);
            }

            // Adicionar novos cargos
            const rolesToAdd = [];

            // Adicionar cargo de tier
            if (targetTierRoleId) {
                rolesToAdd.push(targetTierRoleId);
            } else {
                Logger.warn(`⚠️ Cargo de tier não encontrado para ${rank.tier}`);
            }

            // Adicionar cargo de posição (se houver)
            if (position && this.rolesCache.positions[position]) {
                rolesToAdd.push(this.rolesCache.positions[position]);
            }

            // Adicionar cargo de permissão (se houver)
            if (queue_permission && this.rolesCache.permissions[queue_permission]) {
                rolesToAdd.push(this.rolesCache.permissions[queue_permission]);
            }

            if (rolesToAdd.length > 0) {
                await member.roles.add(rolesToAdd, `Auto-role sync: ${rank.full_name}`);
                Logger.info(`✅ Adicionados ${rolesToAdd.length} novos cargos para ${nickname}`);
            }

            // Se houve mudança de tier, logar mensagem especial
            if (tier_change && tier_change.changed) {
                const emoji = tier_change.is_promotion ? '🎉' : '📉';
                const action = tier_change.is_promotion ? 'PROMOVIDO' : 'REBAIXADO';
                Logger.info(`${emoji} ${nickname} foi ${action}: ${tier_change.old.full_name} → ${tier_change.new.full_name}`);
            }

            return {
                success: true,
                roles_removed: rolesToRemove.length,
                roles_added: rolesToAdd.length,
                current_rank: rank.full_name
            };

        } catch (error) {
            Logger.error(`❌ Erro ao sincronizar cargos de ${nickname}:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

/**
 * Cria o router Express para o webhook de sincronização de cargos
 */
function createRoleSyncRouter(discordClient, guildId, webhookSecret) {
    const router = express.Router();
    const handler = new RoleSyncHandler(discordClient, guildId);

    // Inicializar handler (precisa estar ready)
    discordClient.once('ready', async () => {
        await handler.init();
    });

    /**
     * POST /webhook/sync-role
     * Sincroniza cargo de um único usuário
     */
    router.post('/sync-role', async (req, res) => {
        try {
            // Verificar autenticação
            const authHeader = req.headers.authorization;
            if (authHeader !== `Bearer ${webhookSecret}`) {
                Logger.warn('⚠️ Tentativa não autorizada de acesso ao webhook sync-role');
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const payload = req.body;

            // Validar payload
            if (!payload.discord_id || !payload.rank) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: discord_id, rank'
                });
            }

            // Verificar se guild está pronta
            if (!handler.guild) {
                return res.status(503).json({
                    success: false,
                    error: 'Guild not ready yet, try again later'
                });
            }

            // Executar sincronização
            const result = await handler.syncUserRoles(payload);
            res.json(result);

        } catch (error) {
            Logger.error('❌ Erro no webhook sync-role:', error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * POST /webhook/refresh-roles-cache
     * Atualiza o cache de cargos (útil se você criar/renomear cargos)
     */
    router.post('/refresh-roles-cache', async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader !== `Bearer ${webhookSecret}`) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            await handler.refreshRolesCache();
            res.json({ success: true, message: 'Roles cache refreshed' });

        } catch (error) {
            Logger.error('❌ Erro ao atualizar cache de cargos:', error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
}

module.exports = { createRoleSyncRouter, RoleSyncHandler };
