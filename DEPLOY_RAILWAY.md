# 🚂 Deploy do Bot Discord no Railway.app

## 📋 Pré-requisitos

- Conta no GitHub (grátis)
- Conta no Railway (grátis, $5 de crédito)

---

## 🚀 Passo a Passo

### 1. Preparar Projeto para GitHub

```bash
cd C:\Users\LEOZI\Desktop\classes\discord-bot

# Inicializar Git
git init
git add .
git commit -m "Discord bot inicial"
```

### 2. Criar Repositório no GitHub

1. Acesse https://github.com/new
2. Nome: `rematch-discord-bot`
3. Visibilidade: **Private** (recomendado)
4. Clique em "Create repository"

### 3. Enviar Código para GitHub

```bash
# Adicionar remote (substituir SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/rematch-discord-bot.git

# Enviar código
git branch -M main
git push -u origin main
```

### 4. Deploy no Railway

1. **Acesse:** https://railway.app
2. **Login** com GitHub
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha `rematch-discord-bot`
6. Railway vai detectar automaticamente que é Node.js

### 5. Configurar Variáveis de Ambiente

1. No Railway, clique no projeto
2. Vá em **"Variables"**
3. Adicione as variáveis:

```
DISCORD_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.ABCDEF.XYZ123...
GUILD_ID=987654321098765432
VOICE_CATEGORY_ID=123456789012345678
WEBHOOK_PORT=3001
WEBHOOK_SECRET=seu_segredo_super_secreto_aqui
BOT_PREFIX=/
CHANNEL_LIFETIME_MINUTES=120
AUTO_DELETE_ON_EMPTY=true
LOG_LEVEL=info
```

### 6. Obter URL Pública

1. No Railway, clique em **"Settings"**
2. Em **"Networking"**, clique em **"Generate Domain"**
3. Copie a URL gerada (ex: `rematch-bot.up.railway.app`)

### 7. Atualizar Integração PHP

Edite `integration-example.php`:

```php
public function __construct($pdo, $webhookUrl = null, $secret = null)
{
    $this->pdo = $pdo;
    // URL do Railway
    $this->webhookUrl = $webhookUrl ?? 'https://rematch-bot.up.railway.app';
    $this->secret = $secret ?? getenv('DISCORD_WEBHOOK_SECRET') ?? 'seu_segredo';
}
```

### 8. Testar

```bash
# Health check
curl https://rematch-bot.up.railway.app/health
```

**Resposta esperada:**
```json
{"status":"ok","bot":"RematchBot#1234"}
```

---

## 📊 Monitoramento

### Ver Logs em Tempo Real

1. No Railway, clique no projeto
2. Vá em **"Deployments"**
3. Clique no deployment ativo
4. Veja os logs em tempo real

### Comandos Úteis

**Ver logs:**
```
No painel do Railway → Deployments → View Logs
```

**Reiniciar bot:**
```
Settings → Redeploy
```

**Parar bot:**
```
Settings → Service → Remove
```

---

## 💰 Custos

### Plano Grátis
- ✅ **$5 de crédito** ao criar conta
- ✅ Dura **~1 mês** para este bot
- ✅ **500 horas** de execução/mês

### Plano Pago (após crédito acabar)
- 💳 **$5/mês** (fixo)
- ✅ Execução ilimitada
- ✅ Mais memória/CPU
- ✅ Suporte

**Comparação:**
- Railway: $5/mês
- VPS DigitalOcean: $6/mês
- Heroku: $7/mês
- AWS: ~$10/mês

---

## 🔧 Troubleshooting

### Bot não inicia

**Erro:** `Application failed to respond`
- ✅ Verifique se todas as variáveis de ambiente estão corretas
- ✅ Veja os logs: pode ser token inválido

### Webhook não funciona

**Erro:** `Cannot POST /webhook/partida-criada`
- ✅ Verifique se a URL está correta
- ✅ Use HTTPS (não HTTP)
- ✅ Verifique o `Authorization` header

### Bot desconecta

- ✅ Railway pode hibernar app sem uso
- ✅ Solução: fazer um ping a cada 10 min (cron job no cPanel)

---

## 🎯 Alternativa: Render.com

Se preferir outra opção gratuita:

### Deploy no Render

1. **Acesse:** https://render.com
2. **Conecte** GitHub
3. **New → Web Service**
4. Selecione repositório
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
6. Adicione variáveis de ambiente

**Diferenças:**
- ✅ Sempre grátis (com limitações)
- ⚠️ Hiberna após 15 min sem uso
- ⚠️ Demora ~30s para "acordar"

---

## 📝 Resumo

1. ✅ Criar repo no GitHub
2. ✅ Push do código
3. ✅ Deploy no Railway
4. ✅ Configurar variáveis
5. ✅ Obter URL pública
6. ✅ Atualizar PHP para usar URL
7. ✅ Testar webhook

**Tempo estimado:** 15 minutos

**Custo:** $5/mês após crédito grátis acabar

---

**Deploy feito!** 🚀
