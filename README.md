# 🎮 Rematch Discord Bot

Bot Discord que cria automaticamente salas de voz temporárias para partidas do sistema Rematch.

## 📋 Funcionalidades

- ✅ Cria 2 canais de voz (Team A e Team B) quando uma partida é criada
- ✅ Permissões automáticas: só jogadores da partida podem entrar
- ✅ Capitães têm **Priority Speaker**
- ✅ Auto-delete de canais expirados ou quando partida é finalizada
- ✅ Auto-delete quando canal fica vazio (opcional)
- ✅ Webhook server para integração com backend PHP
- ✅ Logs estruturados e rastreáveis
- ✅ Storage em SQLite para mapeamento match_id → channels

---

## 🚀 Instalação

### 1. Criar Bot no Discord

1. Acesse https://discord.com/developers/applications
2. Clique em **New Application**
3. Dê um nome (ex: "Rematch Bot")
4. Vá em **Bot** → **Add Bot**
5. Copie o **Token** (guarde com segurança!)
6. Em **Privileged Gateway Intents**, habilite:
   - ✅ **Server Members Intent**
   - ✅ **Presence Intent** (opcional)
   - ✅ **Message Content Intent** (opcional)

### 2. Adicionar Bot ao Servidor

1. Vá em **OAuth2** → **URL Generator**
2. Selecione scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Selecione permissões:
   - ✅ `Manage Channels`
   - ✅ `Connect` (Voice)
   - ✅ `Speak` (Voice)
   - ✅ `Move Members` (Voice)
4. Copie a URL gerada e cole no navegador
5. Selecione seu servidor e autorize

### 3. Obter IDs Necessários

**Guild ID (Server ID):**
1. Ative o Modo Desenvolvedor: `Configurações do Usuário` → `Avançado` → `Modo Desenvolvedor`
2. Clique com botão direito no servidor → `Copiar ID do Servidor`

**Category ID:**
1. Crie uma categoria para os canais de partida (ex: "🎮 Partidas Ativas")
2. Clique com botão direito na categoria → `Copiar ID do Canal`

### 4. Configurar Bot

```bash
# Clonar/baixar arquivos
cd discord-bot

# Instalar dependências
npm install

# Criar arquivo .env (copiar de .env.sample)
cp .env.sample .env

# Editar .env com seus dados
nano .env
```

**Exemplo `.env`:**
```env
DISCORD_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.ABCDEF.XYZ123...
GUILD_ID=987654321098765432
VOICE_CATEGORY_ID=123456789012345678

WEBHOOK_PORT=3001
WEBHOOK_SECRET=meu_segredo_super_secreto_aqui

BOT_PREFIX=/
CHANNEL_LIFETIME_MINUTES=120
AUTO_DELETE_ON_EMPTY=true
LOG_LEVEL=info
```

### 5. Rodar Bot

```bash
# Modo produção
npm start

# Modo desenvolvimento (auto-restart)
npm run dev

# Testes
npm test
```

---

## 📡 Integração com Backend PHP

### Endpoint: Criar Canais

**POST** `http://localhost:3001/webhook/partida-criada`

**Headers:**
```
Authorization: Bearer SEU_WEBHOOK_SECRET
Content-Type: application/json
```

**Body:**
```json
{
  "match_id": 123,
  "team_a": [
    {
      "id": 1,
      "nickname": "Player1",
      "discord_id": "123456789012345678"
    },
    {
      "id": 2,
      "nickname": "Player2",
      "discord_id": "987654321098765432"
    }
  ],
  "team_b": [
    {
      "id": 3,
      "nickname": "Player3",
      "discord_id": "111222333444555666"
    },
    {
      "id": 4,
      "nickname": "Player4",
      "discord_id": "777888999000111222"
    }
  ],
  "captain_a": {
    "id": 1,
    "nickname": "Player1"
  },
  "captain_b": {
    "id": 3,
    "nickname": "Player3"
  },
  "expires_at": 1701234567890
}
```

**Response (Success):**
```json
{
  "success": true,
  "match_id": 123,
  "channels": {
    "team_a": {
      "id": "123456789012345678",
      "name": "Partida #123 | Time A"
    },
    "team_b": {
      "id": "987654321098765432",
      "name": "Partida #123 | Time B"
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Jogadores sem discord_id: Player1, Player2"
}
```

---

### Endpoint: Deletar Canais

**POST** `http://localhost:3001/webhook/partida-finalizada`

**Headers:**
```
Authorization: Bearer SEU_WEBHOOK_SECRET
Content-Type: application/json
```

**Body:**
```json
{
  "match_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "match_id": 123
}
```

---

## 🔧 Exemplo de Integração PHP

```php
<?php
// DraftService.php - após criar partida

function notifyDiscordBot($matchId, $teamA, $teamB, $captainA, $captainB) {
    $url = 'http://localhost:3001/webhook/partida-criada';
    $secret = 'SEU_WEBHOOK_SECRET';

    $payload = [
        'match_id' => $matchId,
        'team_a' => $teamA, // Array com id, nickname, discord_id
        'team_b' => $teamB,
        'captain_a' => $captainA,
        'captain_b' => $captainB,
        'expires_at' => time() + (120 * 60) * 1000 // 2 horas em ms
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $secret
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        error_log("[DISCORD] Canais criados para Match #$matchId");
        return json_decode($response, true);
    } else {
        error_log("[DISCORD] Erro ao criar canais: $response");
        return false;
    }
}

// Chamar quando draft for concluído
$result = notifyDiscordBot($matchId, $teamAPlayers, $teamBPlayers, $captainA, $captainB);
```

---

## 🗄️ Estrutura do Banco (SQLite)

```sql
CREATE TABLE match_channels (
    match_id INTEGER PRIMARY KEY,
    team_a_channel_id TEXT NOT NULL,
    team_b_channel_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER,
    status TEXT DEFAULT 'ACTIVE'
);
```

---

## 📊 Logs

Logs estruturados com timestamp:

```
[2024-11-29T15:30:00.000Z] [INFO] 🚀 Iniciando Rematch Discord Bot...
[2024-11-29T15:30:01.000Z] [INFO] ✅ Configuração validada
[2024-11-29T15:30:02.000Z] [INFO] ✅ Database inicializado
[2024-11-29T15:30:05.000Z] [INFO] ✅ Bot logado como RematchBot#1234
[2024-11-29T15:30:05.000Z] [INFO] ✅ Guild: Meu Servidor
[2024-11-29T15:30:05.000Z] [INFO] ✅ Categoria: 🎮 Partidas Ativas
[2024-11-29T15:30:05.000Z] [INFO] ✅ Cleanup job iniciado (5 min)
[2024-11-29T15:30:05.000Z] [INFO] ✅ Webhook server rodando na porta 3001
```

---

## ❓ Troubleshooting

### Bot não inicia

**Erro:** `Error: An invalid token was provided`
- ✅ Verifique se o `DISCORD_TOKEN` está correto no `.env`
- ✅ Copie o token diretamente do Discord Developer Portal

**Erro:** `Categoria de voz não encontrada`
- ✅ Verifique se o `VOICE_CATEGORY_ID` está correto
- ✅ Certifique-se de que o bot tem acesso à categoria

### Canais não são criados

**Erro:** `Missing Access`
- ✅ Bot precisa da permissão `Manage Channels`
- ✅ Revise as permissões do bot no servidor

**Erro:** `Jogadores sem discord_id`
- ✅ Todos os jogadores devem ter `discord_id` cadastrado no banco
- ✅ Adicione campo `discord_id` na tabela `users`

### Webhook retorna 401

- ✅ Verifique se o header `Authorization: Bearer SEU_SECRET` está correto
- ✅ Secret deve ser o mesmo do `.env`

---

## 📝 Adicionar discord_id aos Usuários

```sql
-- Adicionar coluna discord_id
ALTER TABLE users ADD COLUMN discord_id VARCHAR(20) NULL;

-- Criar índice
CREATE INDEX idx_discord_id ON users(discord_id);
```

**Formulário de perfil (edit_profile.php):**
```php
<input type="text" name="discord_id" placeholder="Discord ID" value="<?= $user['discord_id'] ?>">
```

**Como obter Discord ID:**
1. Ativar Modo Desenvolvedor no Discord
2. Clicar com botão direito no usuário → `Copiar ID do Usuário`

---

## 🎯 Próximos Passos

- [ ] Adicionar coluna `discord_id` na tabela `users`
- [ ] Criar formulário para usuários inserirem Discord ID
- [ ] Integrar chamada webhook no `DraftService.php`
- [ ] Testar criação de canais com 10 jogadores reais
- [ ] Configurar auto-delete quando partida for finalizada

---

## 📄 Licença

MIT

---

**Bot criado para o sistema Rematch** 🎮
