# 🎯 Comandos com Prefixo `!` - Guia Rápido

## ✅ Mudanças Implementadas

O sistema foi **convertido de Slash Commands (`/`) para Prefix Commands (`!`)** para evitar conflitos com outros bots.

---

## 📝 Como Usar

### Comando Principal: `!perfil`

**Sintaxe:**
```
!perfil              → Ver seu próprio perfil
!perfil @usuario     → Ver perfil de outro jogador (menção)
!perfil 123456789    → Ver perfil por Discord ID
```

**Aliases (comandos alternativos):**
- `!profile`
- `!stats`
- `!me`

**Exemplos:**
```
!perfil
!perfil @NinjaPlayer
!profile @ProGamer
!stats
!me
```

---

## ⚙️ Configuração

### 1. Arquivo `.env`

Certifique-se que o `.env` tem:

```env
BOT_PREFIX=!
```

Se quiser usar outro prefixo (ex: `?`, `>`, `.`), basta alterar:

```env
BOT_PREFIX=?
```

### 2. Não Precisa Registrar Comandos

❌ **NÃO** execute `node deploy-commands.js`
✅ Comandos com prefixo funcionam **automaticamente**

---

## 🔧 Como Funciona

### 1. Bot Detecta Mensagens com Prefixo

Quando alguém envia uma mensagem começando com `!`, o bot:
1. Verifica se é um comando válido
2. Extrai argumentos (ex: menções, IDs)
3. Executa o comando

### 2. Sistema de Aliases

O comando `!perfil` aceita aliases:
- `!perfil` (nome principal)
- `!profile` (inglês)
- `!stats` (atalho)
- `!me` (rápido)

---

## 📊 Logs Esperados

Quando o bot iniciar, você verá:

```
✅ Bot logado como RematchBot#1234
📦 Carregando 1 comandos...
  ✅ Comando carregado: !perfil
```

Quando alguém usar o comando:

```
📊 Comando !perfil executado por Player#1234 para ver ProGamer#5678
🎨 Gerando card para ProGamer#5678 - Rank: Diamante II (1750 MMR)
✅ Card enviado com sucesso para ProGamer#5678
```

---

## 🆚 Diferenças: Slash vs Prefix

| Aspecto | Slash Commands (`/`) | Prefix Commands (`!`) |
|---------|---------------------|----------------------|
| Conflitos | Pode conflitar com outros bots | Não conflita (cada bot usa seu prefixo) |
| Registro | Precisa registrar na API Discord | Não precisa registro |
| Auto-complete | Sim (Discord mostra sugestões) | Não |
| Permissões | Configurável por servidor | Controlado por permissões de canal |
| Velocidade | Mesma | Mesma |

---

## 🎨 Visual do Comando

### Antes (Slash):
```
Usuário digita: /perfil @Player
Bot responde: [Embed ou Imagem]
```

### Agora (Prefix):
```
Usuário digita: !perfil @Player
Bot responde: 🎨 Gerando seu perfil premium...
             [Edita para]: 📊 Perfil de Player
                          [Imagem PNG anexada]
```

---

## 🚀 Deploy

**1. Fazer commit e push:**
```bash
git add .
git commit -m "Convertido para prefix commands (!perfil)"
git push
```

**2. Reiniciar bot:**
No Railway/servidor, o bot vai reiniciar automaticamente.

**3. Testar:**
No Discord, digite:
```
!perfil
```

---

## 🔒 Segurança e Permissões

### Permissões Necessárias no Bot:

- ✅ **Read Messages/View Channels** (para ler `!comando`)
- ✅ **Send Messages** (para responder)
- ✅ **Attach Files** (para enviar imagem do perfil)
- ✅ **Embed Links** (opcional, para rich embeds)

### Controlar Quem Usa:

Se quiser restringir uso a um canal específico, adicione no início do `execute()`:

```javascript
// Exemplo: só permitir em #comandos
if (message.channel.name !== 'comandos') {
    return message.reply('❌ Use este comando apenas em #comandos');
}
```

---

## 🛠️ Adicionar Novos Comandos

### Exemplo: Criar `!ranking`

1. **Criar arquivo:** `src/commands/ranking.js`

```javascript
module.exports = {
    name: 'ranking',
    description: 'Mostra top 10 jogadores',
    aliases: ['top', 'leaderboard'],

    async execute(message, args) {
        message.reply('🏆 Top 10 em desenvolvimento!');
    }
};
```

2. **Reiniciar bot**

3. **Usar:**
```
!ranking
!top
!leaderboard
```

---

## ❓ Troubleshooting

### Bot não responde ao `!perfil`

**Causas possíveis:**
1. Bot não tem permissão de ler mensagens no canal
2. Prefixo diferente no `.env` (verifique `BOT_PREFIX`)
3. Bot offline

**Solução:**
```bash
# Verificar logs
tail -f logs/bot-YYYY-MM-DD.log

# Verificar se bot está online
curl http://localhost:3001/health
```

### Comando funciona mas não gera imagem

**Causas:**
1. Credenciais do banco incorretas (`.env` → `DB_*`)
2. Usuário não tem `discord_id` vinculado no banco
3. Erro no Canvas (falta dependência)

**Solução:**
```bash
# Verificar instalação do Canvas
npm list @napi-rs/canvas

# Reinstalar se necessário
npm install @napi-rs/canvas
```

---

## 📞 Resumo

| Item | Valor |
|------|-------|
| Prefixo padrão | `!` |
| Comando principal | `!perfil` |
| Aliases | `!profile`, `!stats`, `!me` |
| Registro necessário | ❌ Não |
| Conflita com outros bots | ❌ Não |
| Funciona | ✅ Sim |

**Pronto para usar!** 🎉
