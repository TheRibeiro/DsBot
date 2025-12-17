# Comando !perfil - Documentação Técnica

## Visão Geral

O comando `!perfil` gera uma imagem premium do perfil do jogador com estatísticas do sistema Inhouse.

## Uso

```
!perfil              # Ver próprio perfil
!perfil @usuario     # Ver perfil de outro jogador
!perfil 123456789    # Ver perfil por Discord ID
```

## Arquitetura

### Fluxo de Dados

```
Discord → profile.js → MySQL → calculateRank() → imageGenerator.js → Canvas → PNG → Discord
```

### Componentes

1. **`src/commands/profile.js`**
   - Lida com o comando do Discord
   - Busca dados do MySQL
   - Calcula rank e estatísticas
   - Invoca o gerador de imagem

2. **`src/services/imageGenerator.js`**
   - Gera imagem usando @napi-rs/canvas
   - Renderiza avatar, rank, stats
   - Aplica cores por tier (Bronze, Prata, etc.)

## Sistema de Ranks

```javascript
BRONZE   → 0-799 MMR    → 3 divisões (I, II, III)
PRATA    → 800-999 MMR  → 3 divisões
OURO     → 1000-1299    → 3 divisões
PLATINA  → 1300-1599    → 3 divisões
DIAMANTE → 1600-1899    → 3 divisões
MESTRE   → 1900-2199    → 3 divisões
ELITE    → 2200+ MMR    → Global (sem divisões)
```

## Query do Banco

```sql
SELECT
    u.id,
    u.nickname,
    u.discord_id,
    u.mmr,
    u.position,
    COUNT(DISTINCT CASE WHEN mp.team = m.winner_team THEN m.id END) as wins,
    COUNT(DISTINCT CASE WHEN mp.team != m.winner_team AND m.winner_team IS NOT NULL THEN m.id END) as losses
FROM users u
LEFT JOIN match_players mp ON u.id = mp.user_id
LEFT JOIN matches m ON mp.match_id = m.id AND m.status = 'FINALIZADA'
WHERE u.discord_id = ?
GROUP BY u.id
```

## Conversão de Tipos (Railway Fix)

O Railway/MySQL retorna `COUNT()` como `BigInt`. A conversão é feita assim:

```javascript
const safeWins = user.wins !== null && user.wins !== undefined
    ? (typeof user.wins === 'bigint' ? Number(user.wins) : parseInt(user.wins) || 0)
    : 0;
```

## Renderização de Imagem

### Dimensões
- Canvas: 800x400px
- Avatar: 120x120px circular
- Fontes: sans-serif genérico (compatível com Railway)

### Cores por Tier

```javascript
BRONZE   → #CD7F32
PRATA    → #C0C0C0
OURO     → #FFD700
PLATINA  → #00CED1
DIAMANTE → #B9F2FF
MESTRE   → #9333EA
ELITE    → #EF4444
```

### Elementos Renderizados

1. Background com gradiente radial (cor do tier)
2. Card principal (glassmorphism)
3. Avatar circular com borda colorida
4. Nome do usuário (32px bold)
5. Rank com ícone (28px bold)
6. MMR (22px)
7. Estatísticas de partidas (18px)
8. Winrate com cor dinâmica (verde ≥50%, vermelho <50%)
9. Posição principal (se disponível)
10. Marca d'água "Rematch Inhouse"

## Logs de Debug

### Profile.js
```
📊 Dados do banco para [nickname]
   - ID, Discord ID, MMR, Position, Wins, Losses
🔧 Valores convertidos
   - safeWins, safeLosses, safeMmr
📈 Estatísticas calculadas
   - Total de jogos, Winrate, Rank
```

### ImageGenerator.js
```
🎨 Gerando card simplificado para: [username]
📊 Dados recebidos: { ... }
✅ Dados validados: { ... }
📝 Texto renderizado: "[text]" em (x, y) com fonte Npx
✅ Card gerado com sucesso!
```

## Troubleshooting

### Problema: Imagem gerada sem dados (apenas fundo + avatar)

**Causa:** Fontes não disponíveis no Railway

**Solução:**
1. Usar Dockerfile com fontes instaladas
2. Verificar logs para confirmar renderização de texto

### Problema: Usuário não encontrado

**Causa:** Discord ID não cadastrado no banco

**Solução:**
- Usuário deve se cadastrar no site Inhouse
- Vincular conta do Discord

### Problema: Stats erradas

**Causa:** Query retornando dados incorretos ou conversão de tipos

**Solução:**
- Verificar logs "Valores convertidos"
- Confirmar que não há `NaN` nos valores

## Dependências

```json
{
  "@napi-rs/canvas": "^0.1.56",
  "discord.js": "^14.14.1",
  "mysql2": "^3.15.3"
}
```

## Variáveis de Ambiente

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=inhouse
```

## Performance

- Pool de conexões MySQL (10 conexões)
- Geração de canvas: ~500ms
- Query banco: ~50-100ms
- Total: ~600-700ms por comando

## Limitações

- Sem cache (cada execução gera nova imagem)
- Requer conexão ao MySQL
- Usuário deve estar cadastrado no sistema
