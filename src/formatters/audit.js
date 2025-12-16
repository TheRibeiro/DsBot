/**
 * Log Formatter Module
 * 
 * Formats audit logs as Discord embeds with consistent styling
 * Sanitizes content to prevent @everyone/@here mentions
 */

const { EmbedBuilder } = require('discord.js');

// Event type to emoji mapping
const EVENT_EMOJIS = {
    'LOGIN_SUCCESS': '✅',
    'LOGIN_FAIL': '❌',
    'LOGOUT': '👋',
    'USER_NICK_CHANGED': '✏️',
    'USER_PROFILE_UPDATED': '👤',
    'ADMIN_ACTION_BAN': '🔨',
    'ADMIN_ACTION_UNBAN': '🔓',
    'ADMIN_ACTION_TIMEOUT': '⏰',
    'REPORT_CREATED': '📢',
    'MATCH_CREATED': '🎮',
    'MATCH_RESULT_SUBMITTED': '🏆',
    'OCR_UPLOAD': '📷',
    'DISCORD_TICKET_ASSIGNED': '📌',
    'DISCORD_TICKET_CLOSED': '🔒',
    'DISCORD_PUNISHMENT_APPLIED': '⚖️',
    'VPN_SUSPECT': '🕵️',
    'ALT_SUSPECT': '👥',
    'IMPERSONATION_SUSPECT': '🎭',
    'GENERAL_SUSPECT': '⚠️'
};

// Severity to color mapping
const SEVERITY_COLORS = {
    'info': 0x22c55e,      // green
    'warn': 0xeab308,      // yellow
    'critical': 0xef4444   // red
};

/**
 * Sanitize text to prevent Discord exploits
 */
function sanitize(text) {
    if (!text) return '';

    return String(text)
        .replace(/@everyone/gi, '@\u200beveryone')
        .replace(/@here/gi, '@\u200bhere')
        .replace(/<@&?\d+>/g, '[mention]')
        .replace(/```/g, '`\u200b`\u200b`')
        .substring(0, 1024); // Discord field limit
}

/**
 * Format a single audit log as Discord embed
 */
function formatAuditLogEmbed(log) {
    const emoji = EVENT_EMOJIS[log.event_type] || '📋';
    const color = SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.info;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${emoji} ${formatEventType(log.event_type)}`)
        .setTimestamp(new Date(log.timestamp_utc))
        .setFooter({ text: `Audit ID: ${log.id}` });

    // Actor (who did the action)
    if (log.actor_nickname) {
        embed.addFields({
            name: '👤 Usuário',
            value: sanitize(log.actor_nickname) + (log.actor_user_id ? ` (#${log.actor_user_id})` : ''),
            inline: true
        });
    }

    // Target (who was affected)
    if (log.target_nickname) {
        embed.addFields({
            name: '🎯 Alvo',
            value: sanitize(log.target_nickname) + (log.target_user_id ? ` (#${log.target_user_id})` : ''),
            inline: true
        });
    }

    // IP Hash (truncated)
    if (log.ip_hash) {
        embed.addFields({
            name: '🌐 IP',
            value: `\`${log.ip_hash}\``,
            inline: true
        });
    }

    // Changes (before/after)
    if (log.changes && Object.keys(log.changes).length > 0) {
        const changesText = formatChanges(log.changes);
        if (changesText) {
            embed.addFields({
                name: '📝 Mudanças',
                value: changesText,
                inline: false
            });
        }
    }

    // Extra info
    if (log.extra && Object.keys(log.extra).length > 0) {
        const extraText = formatExtra(log.extra);
        if (extraText) {
            embed.addFields({
                name: '📋 Detalhes',
                value: extraText,
                inline: false
            });
        }
    }

    // Entity reference
    if (log.entity_type && log.entity_id) {
        embed.addFields({
            name: '🔗 Referência',
            value: `${log.entity_type} #${log.entity_id}`,
            inline: true
        });
    }

    return embed;
}

/**
 * Format event type for display
 */
function formatEventType(eventType) {
    return eventType
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Format changes object
 */
function formatChanges(changes) {
    const lines = [];

    for (const [field, change] of Object.entries(changes)) {
        if (change && typeof change === 'object' && 'before' in change && 'after' in change) {
            lines.push(`**${field}**: \`${sanitize(String(change.before))}\` → \`${sanitize(String(change.after))}\``);
        }
    }

    return lines.slice(0, 5).join('\n') || null;
}

/**
 * Format extra info object
 */
function formatExtra(extra) {
    const lines = [];

    for (const [key, value] of Object.entries(extra)) {
        if (value !== null && value !== undefined) {
            const displayValue = typeof value === 'object'
                ? JSON.stringify(value).substring(0, 100)
                : String(value);
            lines.push(`**${key}**: ${sanitize(displayValue)}`);
        }
    }

    return lines.slice(0, 5).join('\n') || null;
}

/**
 * Format multiple logs for batch sending (aggregated)
 */
function formatBatchSummary(logs, timeWindowMinutes = 2) {
    if (logs.length <= 3) {
        return null; // Don't batch small numbers
    }

    // Count by event type
    const counts = {};
    for (const log of logs) {
        counts[log.event_type] = (counts[log.event_type] || 0) + 1;
    }

    const embed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle(`📊 Resumo de Atividade (${logs.length} eventos)`)
        .setDescription(`Últimos ${timeWindowMinutes} minutos`)
        .setTimestamp();

    const summaryLines = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([type, count]) => {
            const emoji = EVENT_EMOJIS[type] || '📋';
            return `${emoji} **${formatEventType(type)}**: ${count}`;
        });

    embed.addFields({
        name: 'Eventos',
        value: summaryLines.join('\n')
    });

    return embed;
}

/**
 * Check if event type should be sent to Discord
 */
function shouldLogEvent(eventType) {
    // Events to always log
    const alwaysLog = [
        'LOGIN_SUCCESS',
        'LOGIN_FAIL',
        'LOGOUT',
        'USER_NICK_CHANGED',
        'ADMIN_ACTION_BAN',
        'ADMIN_ACTION_UNBAN',
        'REPORT_CREATED',
        'MATCH_RESULT_SUBMITTED',
        'VPN_SUSPECT',
        'ALT_SUSPECT',
        'IMPERSONATION_SUSPECT',
        'DISCORD_TICKET_ASSIGNED',
        'DISCORD_TICKET_CLOSED',
        'DISCORD_PUNISHMENT_APPLIED'
    ];

    // Events to skip (too noisy)
    const skipLog = [
        'PAGE_VIEW',
        'API_CALL'
    ];

    if (skipLog.some(s => eventType.includes(s))) {
        return false;
    }

    return true;
}

module.exports = {
    formatAuditLogEmbed,
    formatBatchSummary,
    sanitize,
    shouldLogEvent,
    EVENT_EMOJIS,
    SEVERITY_COLORS
};
