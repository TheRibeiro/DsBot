# Correção do Problema de Perfil sem Dados no Railway

## Problema Identificado

O comando `!perfil` estava gerando imagens sem dados (apenas fundo e avatar) no Railway devido a **dois problemas principais**:

### 1. Conversão de Tipos BigInt
- O Railway/MySQL retorna contagens (`COUNT`) como `BigInt`
- O código estava usando `parseInt()` direto, causando valores `NaN`

### 2. Fontes Não Disponíveis no Railway
- O `@napi-rs/canvas` no Railway não tinha acesso a fontes do sistema
- Os textos não eram renderizados por falta de fontes

## Correções Aplicadas

### Arquivos Modificados:

1. **`src/commands/profile.js`** (linhas 144-183)
   - Adicionada conversão robusta de BigInt para Number
   - Adicionados logs detalhados para debug
   - Validação de valores nulos/undefined

2. **`src/services/imageGenerator.js`** (linhas 59-189)
   - Validação de dados com valores padrão seguros
   - Função `drawText` simplificada usando apenas `sans-serif` genérico
   - Logs de renderização para debug
   - Remoção de dependências de fontes específicas (Segoe UI, Arial)

### Novos Arquivos Criados:

3. **`Dockerfile`**
   - Instala fontes do sistema (DejaVu, Liberation)
   - Executa `fc-cache` para registrar fontes
   - Base: Node 18 slim

4. **`nixpacks.toml`**
   - Configuração alternativa para Nixpacks (builder padrão do Railway)
   - Instala `fonts-dejavu-core` e `fontconfig`

5. **`.dockerignore`**
   - Otimiza o build excluindo arquivos desnecessários

## Como Fazer o Deploy no Railway

### Opção 1: Usando Dockerfile (Recomendado)

1. Faça commit das mudanças:
```bash
cd "c:\Users\Autbank\Desktop\program\bot\DsBot"
git add .
git commit -m "Fix: Corrigir perfil sem dados - BigInt + fontes Railway

- Adicionar conversão BigInt para Number
- Instalar fontes no Railway via Dockerfile
- Validar dados antes de renderizar
- Adicionar logs detalhados para debug"
git push
```

2. No painel do Railway:
   - Vá em **Settings** → **Build**
   - Marque **Use Dockerfile**
   - Salve as configurações
   - O Railway fará redeploy automaticamente

### Opção 2: Usando Nixpacks

Se preferir usar Nixpacks (sem Dockerfile):

1. Faça o commit (mesmo comando acima)
2. No Railway:
   - Vá em **Settings** → **Build**
   - Certifique-se que **Dockerfile** está desmarcado
   - O Railway usará automaticamente o `nixpacks.toml`

## Verificação Pós-Deploy

Após o deploy, execute `!perfil` no Discord e verifique os logs no Railway:

### Logs Esperados:
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
📝 Texto renderizado: "Partidas: 105  |  47W - 58L" em (220, 220) com fonte 18px
📝 Texto renderizado: "Winrate: 45%" em (220, 255) com fonte 18px
✅ Card gerado com sucesso!
```

Se você ver todos esses logs, significa que:
- ✅ Dados estão sendo lidos corretamente do banco
- ✅ Conversão de tipos está funcionando
- ✅ Textos estão sendo renderizados no canvas

## Troubleshooting

### Se o problema persistir:

1. **Verificar variáveis de ambiente:**
   ```
   DB_HOST=<seu-host-mysql>
   DB_USER=<seu-usuario>
   DB_PASSWORD=<sua-senha>
   DB_NAME=inhouse
   ```

2. **Verificar logs no Railway:**
   - Procure por erros relacionados a fontes
   - Verifique se as fontes foram instaladas: procure por "fc-cache"

3. **Forçar rebuild:**
   - No Railway: Settings → Deployment → Redeploy

## Arquivos de Teste (Locais)

Criados para debug local, **não fazer commit**:
- `test-bigint.js` - Testa conversão BigInt
- `diagnose-fonts.js` - Testa renderização de fontes
- `*.png` (outputs dos testes)

## Resumo Técnico

**Antes:**
- `parseInt(BigInt)` → `NaN`
- Fontes específicas não disponíveis no Railway
- Sem validação de dados

**Depois:**
- Conversão robusta: `BigInt` → `Number` → validação
- Uso de fonte genérica `sans-serif` sempre disponível
- Validação com valores padrão seguros (`?? 0`)
- Logs detalhados em cada etapa
