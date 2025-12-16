# 🚂 Configurar Banco de Dados no Railway

## ❌ Problema

Erro ao executar `!perfil`:
```
Error: ECONNREFUSED
```

Isso acontece porque o bot está tentando conectar em `localhost`, mas o banco MySQL não está rodando no mesmo container do bot.

---

## ✅ Solução: Configurar Variáveis de Ambiente

### Opção 1: Usar Banco MySQL Externo (Recomendado)

Se você já tem um banco MySQL hospedado (ex: PlanetScale, Railway MySQL, outro servidor), configure as variáveis:

**No Railway → Seu Projeto → Variables:**

```env
DB_HOST=seu-mysql-host.railway.app
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=inhouse
DB_PORT=3306
```

**Exemplo (PlanetScale):**
```env
DB_HOST=aws.connect.psdb.cloud
DB_USER=xxxxxxxxxxxxx
DB_PASSWORD=pscale_pw_xxxxxxxxxxxxx
DB_NAME=inhouse
```

**Exemplo (Railway MySQL):**
```env
DB_HOST=containers-us-west-123.railway.app
DB_USER=root
DB_PASSWORD=xxxxxxxxxxxxxx
DB_NAME=railway
DB_PORT=6789
```

---

### Opção 2: Usar MySQL Plugin do Railway

Se você ainda não tem banco, adicione o plugin MySQL:

**1. No Dashboard do Railway:**
- Clique em **"+ New"**
- Selecione **"Database"** → **"Add MySQL"**

**2. Railway vai criar automaticamente as variáveis:**
- `MYSQL_URL` (connection string completa)
- `MYSQL_HOST`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_PORT`

**3. Referenciar essas variáveis:**

No Railway, vá em **Variables** do seu bot e adicione:

```env
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
DB_PORT=${{MySQL.MYSQL_PORT}}
```

(O Railway vai substituir automaticamente com os valores corretos)

---

### Opção 3: Compartilhar Banco com o PHP

Se o PHP já está usando um banco, **use as mesmas credenciais**:

**1. Descubra as credenciais do PHP:**
- Veja o arquivo `config/database.php` do seu PHP
- Ou verifique as variáveis de ambiente do serviço PHP no Railway

**2. Configure no bot:**
```env
DB_HOST=mesmo_host_do_php
DB_USER=mesmo_user_do_php
DB_PASSWORD=mesma_senha_do_php
DB_NAME=inhouse
```

---

## 🔍 Como Verificar se Funcionou

### 1. Verificar Logs do Bot

Após configurar, reinicie o bot e veja os logs:

```
✅ Database pool criado para comando !perfil
```

### 2. Testar Comando

No Discord:
```
!perfil
```

**Se funcionou:**
```
🎨 Gerando seu perfil premium...
📊 Perfil de PlayerName
[Imagem PNG]
```

**Se ainda der erro:**
```
❌ Erro ao conectar ao banco de dados. Entre em contato com um administrador.
```

E nos logs você verá:
```
💡 Não foi possível conectar ao banco de dados.
💡 Verifique as variáveis de ambiente: DB_HOST=..., DB_USER=..., DB_NAME=...
```

---

## 🛠️ Troubleshooting

### Erro: `Access denied for user`

**Causa:** Senha incorreta ou usuário sem permissão

**Solução:**
1. Verifique se `DB_PASSWORD` está correta
2. No MySQL, garanta que o usuário tem permissão:
   ```sql
   GRANT ALL PRIVILEGES ON inhouse.* TO 'root'@'%';
   FLUSH PRIVILEGES;
   ```

### Erro: `Unknown database 'inhouse'`

**Causa:** Banco de dados não existe

**Solução:**
1. Crie o banco:
   ```sql
   CREATE DATABASE inhouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Ou use o nome correto no `DB_NAME`

### Erro: `ETIMEDOUT` ou `ECONNREFUSED`

**Causa:** Host incorreto ou firewall bloqueando

**Solução:**
1. Verifique se `DB_HOST` está correto
2. Garanta que o MySQL aceita conexões externas
3. Verifique se há whitelist de IPs (Railway usa IPs dinâmicos)

---

## 📋 Checklist Final

- [ ] Variáveis `DB_*` configuradas no Railway
- [ ] Bot reiniciado após configurar variáveis
- [ ] Logs mostram "Database pool criado"
- [ ] Comando `!perfil` funciona sem erros
- [ ] Dados corretos sendo exibidos (MMR, stats, etc.)

---

## 💡 Dica: Banco de Desenvolvimento Local

Se quiser testar localmente antes de fazer deploy:

**1. Instale MySQL localmente ou use Docker:**
```bash
docker run --name mysql-inhouse -e MYSQL_ROOT_PASSWORD=senha123 -p 3306:3306 -d mysql:8
```

**2. Configure `.env` local:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=senha123
DB_NAME=inhouse
DB_PORT=3306
```

**3. Rode o bot localmente:**
```bash
node main.js
```

---

## ✅ Resultado Esperado

Após configurar corretamente:

```
[2025-12-16T19:00:00.000Z] [INFO] ✅ Database pool criado para comando !perfil
[2025-12-16T19:00:05.123Z] [INFO] 📊 Comando !perfil executado por Player#1234
[2025-12-16T19:00:05.456Z] [INFO] 🎨 Gerando card para Player#1234 - Rank: Ouro II (1150 MMR)
[2025-12-16T19:00:06.789Z] [INFO] ✅ Card enviado com sucesso para Player#1234
```

**Pronto! Comando funcionando perfeitamente.** 🎉
