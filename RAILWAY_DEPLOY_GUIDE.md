# Guia Rápido: Deploy da Correção no Railway

## ✅ Passo a Passo

### 1. Acesse o Railway
- Vá para https://railway.app
- Entre no seu projeto do bot

### 2. Configure o Build para usar Dockerfile

1. Clique no serviço do bot
2. Vá em **Settings** (engrenagem)
3. Role até a seção **Build**
4. Marque a opção **"Use Dockerfile"**
5. Clique em **Save** ou aguarde salvar automaticamente

### 3. Aguarde o Redeploy Automático

O Railway detectará a mudança e iniciará um novo deploy automaticamente.

Você verá no console:
```
Building...
Installing fonts-dejavu-core...
Installing fontconfig...
Regenerating font cache...
npm ci --only=production
Starting application...
```

### 4. Verifique os Logs

Após o deploy, execute `!perfil` no Discord e verifique os logs no Railway:

**Logs esperados:**
```
📊 Dados do banco para [nickname]:
   - Wins: 47 (type: number)
   - Losses: 58 (type: number)
🔧 Valores convertidos:
   - safeWins: 47 (type: number)
   - safeLosses: 58 (type: number)
📈 Estatísticas calculadas:
   - Total de jogos: 105
   - Winrate: 45%
📝 Texto renderizado: "leomaineiro" em (220, 80) com fonte 32px
📝 Texto renderizado: "🥈 Prata II" em (220, 130) com fonte 28px
📝 Texto renderizado: "873 MMR" em (220, 170) com fonte 22px
✅ Card gerado com sucesso!
```

### 5. Teste o Comando

No Discord:
```
!perfil
```

Você deve ver uma imagem completa com:
- ✅ Avatar
- ✅ Nome do usuário
- ✅ Rank com ícone
- ✅ MMR
- ✅ Estatísticas (vitórias, derrotas)
- ✅ Winrate
- ✅ Posição

## 🔧 Alternativa: Usar Nixpacks

Se preferir não usar Dockerfile:

1. No Railway, vá em **Settings** → **Build**
2. **Desmarque** "Use Dockerfile"
3. O Railway usará automaticamente o `nixpacks.toml`

## ❌ Troubleshooting

### Problema: Build falhou

**Solução 1: Verificar logs do build**
- Vá em **Deployments**
- Clique no deployment que falhou
- Verifique os logs de build

**Solução 2: Forçar rebuild**
- Settings → Deployment → Redeploy

### Problema: Fontes ainda não funcionam

**Solução: Verificar se o Dockerfile está sendo usado**
1. Logs de build devem mostrar:
   ```
   Installing fonts-dejavu-core...
   Regenerating font cache...
   ```

2. Se não aparecer, certifique-se que "Use Dockerfile" está marcado

### Problema: Imagem ainda sem dados

**Diagnóstico:**
1. Verifique os logs do Railway quando executar `!perfil`
2. Procure por linhas com `📊 Dados recebidos`
3. Se aparecer `null` ou `undefined`, o problema é no banco

**Solução:**
- Verifique variáveis de ambiente no Railway:
  ```
  DB_HOST=...
  DB_USER=...
  DB_PASSWORD=...
  DB_NAME=inhouse
  ```

## 📊 Tempo Estimado

- Push para GitHub: ✅ Concluído
- Railway detecta mudança: ~30 segundos
- Build com Dockerfile: ~2-3 minutos
- Deploy: ~30 segundos
- **Total: ~3-4 minutos**

## 🎯 Verificação Final

Execute este checklist:

- [ ] Push realizado com sucesso
- [ ] Railway iniciou novo deploy
- [ ] Build completou sem erros
- [ ] Fontes instaladas (ver logs de build)
- [ ] Bot online no Discord
- [ ] Comando `!perfil` retorna imagem completa
- [ ] Logs mostram "Texto renderizado"
- [ ] Dados corretos (wins, losses, MMR, rank)

## 📞 Suporte

Se o problema persistir após seguir todos os passos:

1. Capture os logs completos do Railway
2. Capture a imagem gerada
3. Verifique se há erros de conexão ao banco
4. Teste localmente com `node reproduce_bug.js`
