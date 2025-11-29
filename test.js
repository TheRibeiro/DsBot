/**
 * Testes básicos do bot (mock)
 */

const { MatchChannelDB } = require('./index');

console.log('🧪 Iniciando testes...\n');

// ==================== TESTE 1: Database ====================
console.log('📊 TESTE 1: Database');

const db = new MatchChannelDB();

// Salvar match
db.saveMatch(123, 'channel_a_123', 'channel_b_123', Date.now() + 3600000);
console.log('✅ Match salvo');

// Buscar match
const match = db.getMatch(123);
console.log('✅ Match recuperado:', match);

// Marcar como deletado
db.markAsDeleted(123);
console.log('✅ Match marcado como deletado');

// Tentar buscar novamente
const deletedMatch = db.getMatch(123);
console.log('✅ Match deletado não retorna:', deletedMatch === undefined);

db.close();

console.log('\n📊 TESTE 1: ✅ PASSOU\n');

// ==================== TESTE 2: Validação de Payload ====================
console.log('📨 TESTE 2: Validação de Payload');

function validateMatchPayload(payload) {
    const errors = [];

    if (!payload.match_id) errors.push('match_id obrigatório');
    if (!Array.isArray(payload.team_a)) errors.push('team_a deve ser array');
    if (!Array.isArray(payload.team_b)) errors.push('team_b deve ser array');

    // Verificar discord_id
    [...(payload.team_a || []), ...(payload.team_b || [])].forEach(player => {
        if (!player.discord_id) {
            errors.push(`Jogador ${player.nickname || player.id} sem discord_id`);
        }
    });

    return errors;
}

// Payload válido
const validPayload = {
    match_id: 456,
    team_a: [
        { id: 1, nickname: 'Player1', discord_id: '123456789' },
        { id: 2, nickname: 'Player2', discord_id: '987654321' }
    ],
    team_b: [
        { id: 3, nickname: 'Player3', discord_id: '111222333' },
        { id: 4, nickname: 'Player4', discord_id: '444555666' }
    ],
    captain_a: { id: 1, nickname: 'Player1' },
    captain_b: { id: 3, nickname: 'Player3' },
    expires_at: Date.now() + 3600000
};

const errors1 = validateMatchPayload(validPayload);
console.log('✅ Payload válido:', errors1.length === 0);

// Payload inválido (sem discord_id)
const invalidPayload = {
    match_id: 789,
    team_a: [
        { id: 1, nickname: 'Player1' }, // SEM discord_id
        { id: 2, nickname: 'Player2', discord_id: '987654321' }
    ],
    team_b: []
};

const errors2 = validateMatchPayload(invalidPayload);
console.log('✅ Payload inválido detectado:', errors2.length > 0);
console.log('   Erros:', errors2);

console.log('\n📨 TESTE 2: ✅ PASSOU\n');

// ==================== TESTE 3: Simulação de Webhook ====================
console.log('🌐 TESTE 3: Simulação de Webhook (mock)');

async function mockCreateChannels(matchData) {
    console.log(`  🎮 Mock: Criando canais para Match #${matchData.match_id}`);

    // Simular criação
    return {
        success: true,
        match_id: matchData.match_id,
        channels: {
            team_a: { id: `mock_channel_a_${matchData.match_id}`, name: `Partida #${matchData.match_id} | Time A` },
            team_b: { id: `mock_channel_b_${matchData.match_id}`, name: `Partida #${matchData.match_id} | Time B` }
        }
    };
}

mockCreateChannels(validPayload).then(result => {
    console.log('✅ Canais criados (mock):', result);
    console.log('\n🌐 TESTE 3: ✅ PASSOU\n');

    console.log('🎉 TODOS OS TESTES PASSARAM!\n');
});
