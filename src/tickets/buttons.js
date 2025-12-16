/**
 * Ticket Button Handlers
 * 
 * Handles button interactions for ticket management
 */

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { Logger } = require('../../logger');

/**
 * Setup button interaction handlers
 */
function setupButtonHandlers(client, ticketManager) {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        const customId = interaction.customId;

        // Parse button ID: ticket_action_reportId
        const match = customId.match(/^ticket_(assign|close|punish|evidence|suspect)_(\d+)$/);
        if (!match) return;

        const action = match[1];
        const reportId = parseInt(match[2], 10);

        try {
            switch (action) {
                case 'assign':
                    await handleAssign(interaction, reportId, ticketManager);
                    break;
                case 'close':
                    await handleClose(interaction, reportId, ticketManager);
                    break;
                case 'punish':
                    await handlePunish(interaction, reportId, ticketManager);
                    break;
                case 'evidence':
                    await handleEvidence(interaction, reportId, ticketManager);
                    break;
                case 'suspect':
                    await handleSuspect(interaction, reportId, ticketManager);
                    break;
            }
        } catch (error) {
            Logger.error(`Button handler error for ${action}:`, error.message);
            await interaction.reply({
                content: `❌ Erro ao processar ação: ${error.message}`,
                ephemeral: true
            }).catch(() => { });
        }
    });

    // Handle modal submissions
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isModalSubmit()) return;

        const customId = interaction.customId;

        if (customId.startsWith('punish_modal_')) {
            await handlePunishModal(interaction, ticketManager);
        } else if (customId.startsWith('close_modal_')) {
            await handleCloseModal(interaction, ticketManager);
        }
    });
}

/**
 * Handle "Assumir" button
 */
async function handleAssign(interaction, reportId, ticketManager) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.user;

    // Sync to site
    await ticketManager.syncToSite(reportId, 'assign', user);

    // Update channel topic
    const channel = interaction.channel;
    await channel.setTopic(`Denúncia #${reportId} | Assumido por ${user.username}`);

    // Send confirmation
    await channel.send({
        embeds: [{
            color: 0x22c55e,
            title: '✅ Ticket Assumido',
            description: `<@${user.id}> assumiu este ticket.`,
            timestamp: new Date().toISOString()
        }]
    });

    await interaction.editReply({
        content: '✅ Você assumiu este ticket!'
    });
}

/**
 * Handle "Fechar" button
 */
async function handleClose(interaction, reportId, ticketManager) {
    // Show modal for reason
    const modal = new ModalBuilder()
        .setCustomId(`close_modal_${reportId}`)
        .setTitle('Fechar Ticket');

    const reasonInput = new TextInputBuilder()
        .setCustomId('close_reason')
        .setLabel('Motivo do fechamento')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Descreva o resultado da análise...')
        .setRequired(false)
        .setMaxLength(500);

    modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

    await interaction.showModal(modal);
}

/**
 * Handle close modal submission
 */
async function handleCloseModal(interaction, ticketManager) {
    await interaction.deferReply({ ephemeral: true });

    const reportId = parseInt(interaction.customId.replace('close_modal_', ''), 10);
    const reason = interaction.fields.getTextInputValue('close_reason') || 'Sem motivo especificado';
    const user = interaction.user;

    // Sync to site
    await ticketManager.syncToSite(reportId, 'close', user, { notes: reason });

    // Close channel
    await ticketManager.closeTicket(interaction.channelId, reason, user.id);

    await interaction.editReply({
        content: '🔒 Ticket fechado com sucesso!'
    });
}

/**
 * Handle "Punir" button
 */
async function handlePunish(interaction, reportId, ticketManager) {
    const modal = new ModalBuilder()
        .setCustomId(`punish_modal_${reportId}`)
        .setTitle('Aplicar Punição');

    const typeInput = new TextInputBuilder()
        .setCustomId('punish_type')
        .setLabel('Tipo de punição')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('warning / ban / timeout')
        .setRequired(true)
        .setMaxLength(50);

    const durationInput = new TextInputBuilder()
        .setCustomId('punish_duration')
        .setLabel('Duração (se aplicável)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('7d / permanente / etc')
        .setRequired(false)
        .setMaxLength(50);

    const reasonInput = new TextInputBuilder()
        .setCustomId('punish_reason')
        .setLabel('Motivo da punição')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Descreva o motivo...')
        .setRequired(true)
        .setMaxLength(500);

    modal.addComponents(
        new ActionRowBuilder().addComponents(typeInput),
        new ActionRowBuilder().addComponents(durationInput),
        new ActionRowBuilder().addComponents(reasonInput)
    );

    await interaction.showModal(modal);
}

/**
 * Handle punish modal submission
 */
async function handlePunishModal(interaction, ticketManager) {
    await interaction.deferReply({ ephemeral: true });

    const reportId = parseInt(interaction.customId.replace('punish_modal_', ''), 10);
    const punishType = interaction.fields.getTextInputValue('punish_type');
    const punishDuration = interaction.fields.getTextInputValue('punish_duration') || null;
    const punishReason = interaction.fields.getTextInputValue('punish_reason');
    const user = interaction.user;

    // Sync to site
    const result = await ticketManager.syncToSite(reportId, 'punish', user, {
        punishment: {
            type: punishType,
            duration: punishDuration,
            reason: punishReason
        }
    });

    // Send confirmation in channel
    const channel = interaction.channel;
    await channel.send({
        embeds: [{
            color: 0xef4444,
            title: '⚖️ Punição Aplicada',
            fields: [
                { name: 'Tipo', value: punishType, inline: true },
                { name: 'Duração', value: punishDuration || 'N/A', inline: true },
                { name: 'Por', value: `<@${user.id}>`, inline: true },
                { name: 'Motivo', value: punishReason }
            ],
            timestamp: new Date().toISOString()
        }]
    });

    await interaction.editReply({
        content: result?.success
            ? '⚖️ Punição aplicada e sincronizada com o site!'
            : '⚠️ Punição registrada mas falha ao sincronizar com site'
    });
}

/**
 * Handle "Mais Evidências" button
 */
async function handleEvidence(interaction, reportId, ticketManager) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.user;

    // Sync to site
    await ticketManager.syncToSite(reportId, 'request_evidence', user);

    // Send message in channel
    const channel = interaction.channel;
    await channel.send({
        embeds: [{
            color: 0x3b82f6,
            title: '📌 Solicitação de Evidências',
            description: `<@${user.id}> solicitou mais evidências para este caso.\n\nSe você tem mais provas, por favor envie prints ou vídeos relevantes.`,
            timestamp: new Date().toISOString()
        }]
    });

    await interaction.editReply({
        content: '📌 Solicitação de evidências enviada!'
    });
}

/**
 * Handle "Suspeito" button
 */
async function handleSuspect(interaction, reportId, ticketManager) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.user;

    // Sync to site with suspect flag
    await ticketManager.syncToSite(reportId, 'mark_suspect', user, {
        suspect_type: 'GENERAL_SUSPECT',
        notes: 'Marcado como suspeito via Discord'
    });

    // Send message in channel
    const channel = interaction.channel;
    await channel.send({
        embeds: [{
            color: 0xeab308,
            title: '👀 Marcado como Suspeito',
            description: `<@${user.id}> marcou este caso para investigação adicional.\n\nPossíveis indícios de VPN, conta alternativa ou impersonação.`,
            timestamp: new Date().toISOString()
        }]
    });

    await interaction.editReply({
        content: '👀 Caso marcado como suspeito!'
    });
}

module.exports = { setupButtonHandlers };
