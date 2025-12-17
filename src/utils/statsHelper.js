/**
 * Helper para normalizar posições e mapear estatísticas
 */

/**
 * Normaliza o nome da posição para um formato padrão
 * @param {string} position - Posição bruta do banco
 * @returns {string} Posição normalizada (UPPERCASE)
 */
function normalizePosition(position) {
    if (!position) return 'UNKNOWN';

    // Remover acentos e converter para maiúsculas
    const normalized = position
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();

    // Mapeamento de aliases
    const aliases = {
        'GK': 'GOLEIRO',
        'ZAGUEIRO': 'FIXO', // Se "Zagueiro" for "Fixo" no contexto do Futsal/Inhouse, ajuste conforme necessidade
        'ALA_OF': 'ALA OF',
        'ALA_DEF': 'ALA DEF',
        'PIVO': 'PIVO', // Já está sem acento, mas garante
        'MEIA': 'ALA OF' // Exemplo de alias
    };

    return aliases[normalized] || normalized;
}

/**
 * Retorna a métrica principal baseada na posição
 * @param {string} position - Posição do jogador
 * @returns {Object} { label: string, key: string }
 */
function getStatusMetricByPosition(position) {
    const normalizedPos = normalizePosition(position);

    const metrics = {
        'GOLEIRO': { label: 'Defesas', key: 'total_defenses' },
        'FIXO': { label: 'Interceptações', key: 'total_intercepts' },
        'ALA DEF': { label: 'Passes', key: 'total_passes' },
        'ALA OF': { label: 'Assistências', key: 'total_assists' },
        'PIVO': { label: 'Gols', key: 'total_goals' }
    };

    // Fallback seguro
    return metrics[normalizedPos] || { label: 'Stats', key: 'total_goals' }; // Default para gols ou genérico
}

module.exports = {
    normalizePosition,
    getStatusMetricByPosition
};
