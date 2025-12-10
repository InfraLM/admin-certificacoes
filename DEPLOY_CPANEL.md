# 🚀 Guia de Deploy no cPanel - Admin Certificações

## 📋 Problemas Identificados e Soluções

### ❌ Problema Principal
O backend está crashando com erro:
```
Error: Route.get() requires a callback function but got a [object Undefined]
```

### 🔍 Causas Identificadas

1. **Dependências não instaladas** - `npm install` não foi executado no servidor
2. **Ordem incorreta de rotas** - Rotas específicas após rotas genéricas
3. **Variáveis de ambiente incorretas** - `VITE_API_URL` não deve estar no backend

---

## ✅ Passo a Passo para Corrigir

### 1️⃣ **Atualizar os Arquivos no Servidor**

Primeiro, faça upload dos arquivos corrigidos para o cPanel:

**Arquivos modificados:**
- `backend/src/routes/alunos.routes.js` ✅
- `backend/src/routes/financeiro.routes.js` ✅
- `backend/diagnose.js` (novo arquivo) ✅

### 2️⃣ **Configurar Variáveis de Ambiente**

No cPanel, edite o arquivo `.env` do **backend** e remova a linha `VITE_API_URL`:

```env
# ❌ REMOVA ESTA LINHA:
VITE_API_URL=https://liberdademedicaedu.com.br/admin-certificacoes/api

# ✅ Mantenha apenas estas:
DB_HOST=seu-host
DB_PORT=5432
DB_NAME=seu-database
DB_USER=seu-usuario
DB_PASSWORD=sua-senha

PORT=3001
NODE_ENV=production
CORS_ORIGINS=https://liberdademedicaedu.com.br,http://localhost:5173
```

**Importante:** `VITE_API_URL` é **apenas para o frontend**, não para o backend!

### 3️⃣ **Instalar Dependências no cPanel**

Via Terminal SSH ou Node.js App do cPanel:

```bash
cd /home/liberdademedicae/public_html/admin-certificacoes/backend
npm install
```

**Dependências necessárias:**
- express
- pg
- cors
- dotenv
- date-fns

### 4️⃣ **Executar Diagnóstico**

Antes de iniciar o backend, execute o diagnóstico:

```bash
cd /home/liberdademedicae/public_html/admin-certificacoes/backend
node diagnose.js
```

O script irá verificar:
- ✅ Versão do Node.js
- ✅ Dependências instaladas
- ✅ Arquivos essenciais
- ✅ Variáveis de ambiente
- ✅ Conexão com banco de dados
- ✅ Tabelas no banco

**Se houver erros, corrija antes de continuar!**

### 5️⃣ **Configurar o Node.js App no cPanel**

No painel Node.js do cPanel:

**Application root:** `/home/liberdademedicae/public_html/admin-certificacoes/backend`

**Application URL:** `https://liberdademedicaedu.com.br/admin-certificacoes/api`

**Application startup file:** `src/index.js`

**Node.js version:** 16.x ou superior

**Variáveis de ambiente:** Usar o arquivo `.env` ou configurar manualmente:
```
DB_HOST=...
DB_PORT=5432
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
PORT=3001
NODE_ENV=production
CORS_ORIGINS=https://liberdademedicaedu.com.br,http://localhost:5173
```

### 6️⃣ **Reiniciar o Backend**

No painel Node.js do cPanel, clique em **"Restart"** ou via terminal:

```bash
cd /home/liberdademedicae/public_html/admin-certificacoes/backend
pkill -f "node src/index.js"  # Matar processo anterior
npm start &  # Iniciar em background
```

### 7️⃣ **Verificar Logs**

Verifique se o backend iniciou corretamente:

```bash
# Ver logs de erro
cat /home/liberdademedicae/public_html/admin-certificacoes/backend/stderr.log

# Ver logs de saída
cat /home/liberdademedicae/public_html/admin-certificacoes/backend/stdout.log
```

**O que você DEVE ver:**
```
✅ [Server] Conexão com banco estabelecida!
✅ Backend Server - ONLINE
✅ Port: 3001
```

**O que você NÃO DEVE ver:**
```
❌ Error: Route.get() requires a callback function
❌ Cannot find module 'date-fns'
❌ ECONNREFUSED
```

### 8️⃣ **Testar a API**

Teste os endpoints principais:

```bash
# Health check
curl https://liberdademedicaedu.com.br/admin-certificacoes/api/health

# Deve retornar:
# {"status":"ok","timestamp":"...","database":{"connected":true}}

# Teste do banco
curl https://liberdademedicaedu.com.br/admin-certificacoes/api/db-test

# Listar alunos
curl https://liberdademedicaedu.com.br/admin-certificacoes/api/alunos
```

### 9️⃣ **Atualizar Frontend (se necessário)**

No arquivo `.env` do **frontend**, certifique-se que:

```env
VITE_API_URL=https://liberdademedicaedu.com.br/admin-certificacoes/api
```

Rebuild o frontend:

```bash
cd /home/user/admin-certificacoes/frontend
npm run build
```

Faça upload da pasta `dist` para o cPanel em:
```
/home/liberdademedicae/public_html/admin-certificacoes/
```

---

## 🔧 Troubleshooting

### Erro: "Cannot find module 'date-fns'"

**Solução:**
```bash
cd backend
npm install date-fns --save
```

### Erro: "ECONNREFUSED" ou erro de conexão com banco

**Causas possíveis:**
1. PostgreSQL não está rodando
2. Host/porta incorretos
3. Firewall bloqueando conexão
4. Credenciais inválidas

**Solução:**
- Verifique as variáveis de ambiente
- Execute `node diagnose.js` para diagnóstico completo
- Teste a conexão diretamente via psql

### Erro 503 - Service Unavailable

**Causas:**
1. Backend não está rodando
2. Backend crashou durante inicialização
3. Porta incorreta

**Solução:**
```bash
# Verificar se o processo está rodando
ps aux | grep "node"

# Ver logs de erro
cat backend/stderr.log

# Reiniciar
npm start
```

### Rotas retornam 404

**Verifique:**
1. Base path está correto: `/admin-certificacoes/api`
2. Frontend está chamando a URL correta
3. CORS está configurado corretamente

---

## 📊 Checklist Final

Antes de considerar o deploy concluído:

- [ ] `npm install` executado no backend
- [ ] `node diagnose.js` sem erros
- [ ] Variáveis de ambiente corretas (sem `VITE_API_URL` no backend)
- [ ] Backend iniciado sem erros
- [ ] `/health` retorna status OK
- [ ] `/db-test` conecta com banco
- [ ] Endpoints de API funcionando
- [ ] Frontend conectando com backend
- [ ] Login funcionando
- [ ] Operações CRUD funcionando

---

## 🆘 Suporte

Se após seguir todos os passos ainda houver problemas:

1. Execute: `node diagnose.js > diagnostico.txt`
2. Anexe o arquivo `diagnostico.txt`
3. Anexe os logs: `stderr.log` e `stdout.log`
4. Descreva o comportamento esperado vs. atual

---

## 📝 Notas Importantes

- **NUNCA** coloque credenciais de banco de dados no código
- **SEMPRE** use variáveis de ambiente (`.env`)
- O arquivo `.env` **NÃO** deve estar no Git
- Mantenha backups do banco de dados antes de mudanças
- Use `NODE_ENV=production` em produção

---

**Última atualização:** 2025-12-10
