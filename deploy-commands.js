/**
 * Deploy Commands - Registra comandos slash na API do Discord
 *
 * Execute este script sempre que adicionar ou modificar comandos:
 *   node deploy-commands.js
 */

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { Logger } = require('./logger');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');

// Verificar se a pasta de comandos existe
if (!fs.existsSync(commandsPath)) {
    Logger.error('❌ Pasta de comandos não encontrada:', commandsPath);
    process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

Logger.info(`📦 Encontrados ${commandFiles.length} arquivos de comando`);

// Carregar todos os comandos
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        Logger.info(`  ✅ Carregado: ${command.data.name}`);
    } else {
        Logger.warn(`  ⚠️ Ignorado: ${file} (falta 'data' ou 'execute')`);
    }
}

// Validar variáveis de ambiente
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token) {
    Logger.error('❌ DISCORD_TOKEN não configurado no .env');
    process.exit(1);
}

if (!clientId) {
    Logger.error('❌ CLIENT_ID não configurado no .env');
    process.exit(1);
}

// Criar REST client
const rest = new REST().setToken(token);

// Deploy dos comandos
(async () => {
    try {
        Logger.info(`🚀 Iniciando deploy de ${commands.length} comandos...`);

        if (guildId) {
            // Deploy para um servidor específico (instantâneo, ideal para desenvolvimento)
            Logger.info(`📍 Deploy para servidor específico (Guild ID: ${guildId})`);

            const data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            );

            Logger.info(`✅ ${data.length} comandos registrados com sucesso no servidor!`);
        } else {
            // Deploy global (pode levar até 1 hora para propagar)
            Logger.warn('⚠️ GUILD_ID não configurado, fazendo deploy GLOBAL (pode levar até 1 hora)');

            const data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );

            Logger.info(`✅ ${data.length} comandos registrados globalmente!`);
        }

        // Listar comandos registrados
        Logger.info('\n📋 Comandos registrados:');
        commands.forEach(cmd => {
            Logger.info(`   /${cmd.name} - ${cmd.description}`);
        });

    } catch (error) {
        Logger.error('❌ Erro ao fazer deploy dos comandos:', error);

        if (error.code === 50001) {
            Logger.error('💡 Erro 50001: Bot não tem acesso ao servidor. Verifique se o bot está no servidor correto.');
        } else if (error.code === 10002) {
            Logger.error('💡 Erro 10002: Guild ID inválido. Verifique o GUILD_ID no .env');
        }

        process.exit(1);
    }
})();
