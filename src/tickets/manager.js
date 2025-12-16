/**
 * Ticket Manager Module
 * 
 * Creates and manages Discord ticket channels for reports
 */

const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Logger } = require('../../logger');
const { sanitize } = require('../formatters/audit');
const { getInstance: getState } = require('../storage/state');

class TicketManager {
    constructor(client, options = {}) {
        this.client = client;
        this.guildId = options.guildId;
        this.ticketsCategoryId = options.ticketsCategoryId;
        this.staffRoleId = options.staffRoleId;
        this.logsChannelId = options.logsChannelId;
        this.siteApiUrl = options.siteApiUrl;
        this.siteApiToken = options.siteApiToken;
    }

    /**
     * Create a ticket channel for a report
     */
    async createTicketChannel(reportData) {
        const { report_id, reporter, reported, reason_category, reason_text, description, match_id, severity, admin_url } = reportData;

        Logger.info(`📋 Creating ticket for report #${report_id}`);

        try {
            const guild = await this.client.guilds.fetch(this.guildId);
            const category = await guild.channels.fetch(this.ticketsCategoryId);

            if (!category || category.type !== ChannelType.GuildCategory) {
                throw new Error('Tickets category not found or invalid');
            }

            // Create private text channel
            const channelName = `ticket-denuncia-${report_id}`;

            // Permission overwrites
            const permissionOverwrites = [
                {
                    id: guild.id, // @everyone
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: this.client.user.id, // Bot
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.ManageMessages
                    ]
                }
            ];

            // Add staff role
            if (this.staffRoleId) {
                permissionOverwrites.push({
                    id: this.staffRoleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                });
            }

            // Optionally add reporter
            if (reporter?.discord_id) {
                permissionOverwrites.push({
                    id: reporter.discord_id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.ReadMessageHistory
                    ],
                    deny: [PermissionFlagsBits.SendMessages] // Read-only
                });
            }

            const channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites,
                topic: `Denúncia #${report_id} | ${reported?.nickname || 'Desconhecido'} | ${reason_category}`
            });

            Logger.info(`✅ Created channel ${channel.name} (${channel.id})`);

            // Send initial embed
            const embed = this.buildReportEmbed(reportData);
            const buttons = this.buildActionButtons(report_id);

            await channel.send({
                content: this.staffRoleId ? `<@&${this.staffRoleId}> Nova denúncia!` : '📢 Nova denúncia!',
                embeds: [embed],
                components: [buttons]
            });

            // Update stats
            getState().incrementTicketStat('created');

            return {
                success: true,
                channel_id: channel.id,
                channel_name: channel.name
            };

        } catch (error) {
            Logger.error(`❌ Failed to create ticket for report #${report_id}:`, error.message);
            throw error;
        }
    }

    /**
     * Build the report embed
     */
    buildReportEmbed(reportData) {
        const { report_id, reporter, reported, reason_category, reason_text, description, match_id, severity, created_at, admin_url } = reportData;

        const severityColor = {
            'high': 0xef4444,
            'medium': 0xeab308,
            'low': 0x22c55e
        }[severity] || 0x3b82f6;

        const embed = new EmbedBuilder()
            .setColor(severityColor)
            .setTitle(`📢 Denúncia #${report_id}`)
            .setDescription(`**Motivo:** ${sanitize(reason_category)}${reason_text !== reason_category ? `\n${sanitize(reason_text)}` : ''}`)
            .setTimestamp(new Date(created_at));

        // Reporter info
        const reporterText = reporter?.discord_id
            ? `<@${reporter.discord_id}> (${sanitize(reporter.nickname)})`
            : sanitize(reporter?.nickname || 'Desconhecido');

        embed.addFields({
            name: '👤 Denunciante',
            value: reporterText,
            inline: true
        });

        // Reported info
        const reportedText = reported?.discord_id
            ? `<@${reported.discord_id}> (${sanitize(reported.nickname)})`
            : sanitize(reported?.nickname || 'Desconhecido');

        embed.addFields({
            name: '🎯 Denunciado',
            value: reportedText,
            inline: true
        });

        // Severity
        const severityEmoji = { 'high': '🔴', 'medium': '🟡', 'low': '🟢' }[severity] || '⚪';
        embed.addFields({
            name: '⚠️ Gravidade',
            value: `${severityEmoji} ${severity?.toUpperCase() || 'N/A'}`,
            inline: true
        });

        // Description
        if (description) {
            embed.addFields({
                name: '📝 Descrição',
                value: sanitize(description).substring(0, 1024),
                inline: false
            });
        }

        // Match link
        if (match_id) {
            embed.addFields({
                name: '🎮 Partida',
                value: `[Partida #${match_id}](https://inhouse.blaidds.com/match.php?id=${match_id})`,
                inline: true
            });
        }

        // Admin panel link
        if (admin_url) {
            embed.addFields({
                name: '🔗 Painel Admin',
                value: `[Abrir no Admin](${admin_url})`,
                inline: true
            });
        }

        embed.setFooter({ text: `Report ID: ${report_id}` });

        return embed;
    }

    /**
     * Build action buttons
     */
    buildActionButtons(reportId) {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_assign_${reportId}`)
                    .setLabel('Assumir')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId(`ticket_close_${reportId}`)
                    .setLabel('Fechar')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔒'),
                new ButtonBuilder()
                    .setCustomId(`ticket_punish_${reportId}`)
                    .setLabel('Punir')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🚫'),
                new ButtonBuilder()
                    .setCustomId(`ticket_evidence_${reportId}`)
                    .setLabel('Mais Evidências')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📌'),
                new ButtonBuilder()
                    .setCustomId(`ticket_suspect_${reportId}`)
                    .setLabel('Suspeito')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👀')
            );
    }

    /**
     * Close a ticket channel
     */
    async closeTicket(channelId, reason = null, closedBy = null) {
        try {
            const channel = await this.client.channels.fetch(channelId);

            if (!channel) {
                Logger.warn(`Channel ${channelId} not found for closing`);
                return { success: false, error: 'Channel not found' };
            }

            // Send closing message
            await channel.send({
                embeds: [{
                    color: 0x6b7280,
                    title: '🔒 Ticket Fechado',
                    description: reason ? `**Motivo:** ${sanitize(reason)}` : 'Ticket encerrado pela staff.',
                    fields: closedBy ? [{ name: 'Fechado por', value: `<@${closedBy}>` }] : [],
                    timestamp: new Date().toISOString()
                }]
            });

            // Archive or delete (configurable)
            // For now, just rename and lock
            await channel.setName(`closed-${channel.name}`);
            await channel.permissionOverwrites.edit(channel.guild.id, {
                [PermissionFlagsBits.SendMessages]: false
            });

            // Update stats
            getState().incrementTicketStat('closed');

            Logger.info(`🔒 Closed ticket channel ${channel.name}`);
            return { success: true };

        } catch (error) {
            Logger.error(`Failed to close ticket ${channelId}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sync action back to PHP site
     */
    async syncToSite(reportId, action, discordUser, extra = {}) {
        if (!this.siteApiUrl || !this.siteApiToken) {
            Logger.warn('Site API not configured, skipping sync');
            return null;
        }

        try {
            const { createOutgoingSignature } = require('../security/hmac');

            const payload = {
                report_id: reportId,
                action,
                discord_user_id: discordUser.id,
                discord_username: discordUser.username,
                ...extra
            };

            const { signature, timestamp } = createOutgoingSignature(payload, this.siteApiToken);

            const response = await fetch(`${this.siteApiUrl}/api/discord/ticket_sync.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Signature': signature,
                    'X-Timestamp': timestamp.toString()
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            Logger.info(`Synced action "${action}" for report #${reportId} to site: ${data.success ? 'OK' : data.error}`);
            return data;

        } catch (error) {
            Logger.error(`Failed to sync to site: ${error.message}`);
            return null;
        }
    }
}

module.exports = { TicketManager };
