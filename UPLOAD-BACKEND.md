# 🚀 Guia Rápido - Upload do Backend Atualizado

## ⚠️ IMPORTANTE: Faça isso AGORA para resolver o erro 503!

O backend no servidor está **crashando** porque está faltando uma linha no arquivo `index.js`. Você precisa fazer o upload do arquivo atualizado.

## Opção 1: Upload via cPanel (RECOMENDADO - Mais Rápido)

### Passo 1: Baixe o arquivo do repositório

1. Acesse o repositório no GitHub
2. Navegue até: `backend/src/index.js`
3. Clique em "Raw" ou "Download"
4. Salve o arquivo no seu computador

### Passo 2: Faça Upload no cPanel

1. Acesse **cPanel → Gerenciador de Arquivos**
2. Navegue até: `/public_html/admin-certificacoes/backend/src/`
3. **DELETE** o arquivo `index.js` antigo
4. Clique em **"Upload"** (botão no topo)
5. Selecione o arquivo `index.js` que você baixou
6. Aguarde o upload completar

### Passo 3: Reinicie a Aplicação

1. Acesse **cPanel → Setup Node.js App**
2. Encontre a aplicação "admin-certificacoes"
3. Clique em **"Restart"**
4. Aguarde alguns segundos

### Passo 4: Teste

Abra o navegador e acesse:
- ✅ https://liberdademedicaedu.com.br/admin-certificacoes/api/health
  - Deve retornar JSON com status "ok"
- ✅ https://liberdademedicaedu.com.br/admin-certificacoes
  - Deve redirecionar para /admin-certificacoes/ e carregar o login
- ✅ https://liberdademedicaedu.com.br/admin-certificacoes/login
  - Deve carregar a tela de login diretamente

## Opção 2: Editar Diretamente no cPanel (Alternativa)

Se não conseguir baixar o arquivo, você pode editar diretamente:

1. Acesse **cPanel → Gerenciador de Arquivos**
2. Navegue até: `/public_html/admin-certificacoes/backend/src/index.js`
3. Clique com botão direito → **"Edit"**
4. Certifique-se que **linha 4** tem:
   ```javascript
   const path = require('path');
   ```
5. Adicione após a linha 289 (após o fechamento da rota `/admin-certificacoes/api`):
   ```javascript

   // ============================================================================
   // REDIRECIONAR /admin-certificacoes (sem barra) PARA /admin-certificacoes/
   // ============================================================================

   // Capturar /admin-certificacoes sem barra final e redirecionar para versão com barra
   app.get('/admin-certificacoes', (req, res) => {
     console.log('🔄 [Redirect] Redirecionando /admin-certificacoes para /admin-certificacoes/');
     res.redirect(301, '/admin-certificacoes/');
   });
   ```
6. Clique em **"Save Changes"**
7. Vá para **cPanel → Setup Node.js App** e clique em **"Restart"**

## O que foi corrigido:

### 1. Adicionado `const path = require('path');` (linha 4)
Essa linha estava faltando e causava o erro:
```
ReferenceError: path is not defined
```

### 2. Adicionado redirecionamento para `/admin-certificacoes` sem barra
Agora a URL sem barra final redireciona corretamente para a versão com barra, em vez de retornar erro 404 JSON.

## Verificação de Sucesso

Após fazer o upload e reiniciar:

### ✅ Backend funcionando:
```bash
curl https://liberdademedicaedu.com.br/admin-certificacoes/api/health
```
Deve retornar JSON com `"status": "ok"`

### ✅ Frontend funcionando:
- https://liberdademedicaedu.com.br/admin-certificacoes/ → Carrega login
- https://liberdademedicaedu.com.br/admin-certificacoes → Redireciona para versão com barra
- https://liberdademedicaedu.com.br/admin-certificacoes/login → Carrega login diretamente

### ❌ Se ainda der erro 503:

1. Verifique os logs: **cPanel → Setup Node.js App → View Logs**
2. Certifique-se que a linha `const path = require('path');` está presente
3. Tente **Stop** e depois **Start** (em vez de apenas Restart)
4. Verifique se as dependências estão instaladas:
   ```bash
   cd /home/liberdademedicae/public_html/admin-certificacoes/backend
   npm install --production
   ```

---

**Tempo estimado**: 5 minutos

**Prioridade**: 🔴 ALTA - Sistema não funciona sem isso!
