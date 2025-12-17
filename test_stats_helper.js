const { normalizePosition, getStatusMetricByPosition } = require('./src/utils/statsHelper');
const assert = require('assert');

console.log('🧪 Iniciando testes do statsHelper...');

// Testes de Normalização
console.log('Teste 1: Normalização de Posições');
assert.strictEqual(normalizePosition('Goleiro'), 'GOLEIRO');
assert.strictEqual(normalizePosition('goleiro'), 'GOLEIRO');
assert.strictEqual(normalizePosition('PIVÔ'), 'PIVO');
assert.strictEqual(normalizePosition('pivo'), 'PIVO');
assert.strictEqual(normalizePosition('GK'), 'GOLEIRO');
assert.strictEqual(normalizePosition('Zagueiro'), 'FIXO'); // Alias definido no helper
assert.strictEqual(normalizePosition('Ala_Of'), 'ALA OF');
assert.strictEqual(normalizePosition('Meia'), 'ALA OF'); // Alias definido
console.log('✅ Normalização OK');

// Testes de Mapeamento de Métricas
console.log('Teste 2: Mapeamento de Métricas');

// Goleiro -> Defesas
const gk = getStatusMetricByPosition('Goleiro');
assert.strictEqual(gk.label, 'Defesas');
assert.strictEqual(gk.key, 'total_defenses');

// Fixo -> Interceptações
const fixo = getStatusMetricByPosition('Fixo');
assert.strictEqual(fixo.label, 'Interceptações');
assert.strictEqual(fixo.key, 'total_intercepts');

// Ala Def -> Passes
const alaDef = getStatusMetricByPosition('Ala Def');
assert.strictEqual(alaDef.label, 'Passes');
assert.strictEqual(alaDef.key, 'total_passes');

// Ala Of -> Assistências
const alaOf = getStatusMetricByPosition('Ala Of');
assert.strictEqual(alaOf.label, 'Assistências');
assert.strictEqual(alaOf.key, 'total_assists');

// Pivo -> Gols
const pivo = getStatusMetricByPosition('Pivô');
assert.strictEqual(pivo.label, 'Gols');
assert.strictEqual(pivo.key, 'total_goals');

// Teste de Fallback (Posição desconhecida)
const unknown = getStatusMetricByPosition('Gandula');
assert.strictEqual(unknown.label, 'Stats'); // Default definido no helper
console.log('✅ Mapeamento OK');

console.log('🎉 Todos os testes passaram!');
