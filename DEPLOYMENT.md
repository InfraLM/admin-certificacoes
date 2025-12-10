# Guia de Deploy - Admin Certificações (CloudLinux Passenger)

## Estrutura no Servidor (cPanel)

```
/home/liberdademedicae/public_html/admin-certificacoes/
├── assets/                 # Arquivos compilados do frontend (CSS, JS, imagens)
├── backend/               # Código do backend Express
│   ├── src/
│   │   ├── index.js
│   │   ├── config/
│   │   └── routes/
│   └── package.json
├── .htaccess             # Configuração Apache + Passenger + SPA Fallback
├── index.html            # Arquivo principal do SPA
├── favicon.ico
└── placeholder.svg
```

## ℹ️ Sobre o Passenger

Seu servidor usa **CloudLinux Passenger**, que gerencia automaticamente a aplicação Node.js. Isso significa:
- ✅ O backend inicia automaticamente quando necessário
- ✅ Reinicia automaticamente em caso de crash
- ✅ As variáveis de ambiente são gerenciadas pelo cPanel
- ✅ Não precisa usar PM2 ou node manualmente

## Passo a Passo para Deploy

### 1. Build do Frontend (Local)

```bash
# No seu ambiente de desenvolvimento
npm run build
```

Isso gera a pasta `dist/` com os arquivos compilados.

### 2. Upload dos Arquivos para Produção

#### 2.1. Frontend (via cPanel File Manager):

1. Acesse **cPanel → Gerenciador de Arquivos**
2. Navegue até `/public_html/admin-certificacoes/`
3. **DELETE** os arquivos antigos do frontend:
   - Pasta `assets/`
   - Arquivo `index.html`
   - Arquivo `favicon.ico`
   - Arquivo `placeholder.svg`
4. Compacte a pasta `dist/` localmente em um arquivo ZIP
5. Faça upload do ZIP para `/public_html/admin-certificacoes/`
6. **Extraia o ZIP** (botão "Extract" no cPanel)
   - IMPORTANTE: Extraia o **conteúdo** da pasta dist, não a pasta em si
   - Os arquivos devem ficar diretamente em `/admin-certificacoes/` (não em `/admin-certificacoes/dist/`)
7. Delete o arquivo ZIP após extrair

#### 2.2. Backend (via cPanel File Manager):

1. Compacte a pasta `backend/` localmente em um arquivo ZIP
2. Faça upload para `/public_html/admin-certificacoes/`
3. **ATENÇÃO**: Faça backup do arquivo `.env` se ele existir!
4. Delete a pasta `backend/` antiga (se fazer backup do .env primeiro)
5. Extraia o novo ZIP
6. Restaure o arquivo `.env` na pasta `backend/`

#### 2.3. Arquivo .htaccess:

1. Faça upload do arquivo `.htaccess` para `/public_html/admin-certificacoes/.htaccess`
2. **IMPORTANTE**: Não apague as linhas do Passenger que já existem!
   - As linhas que começam com "# DO NOT REMOVE. CLOUDLINUX PASSENGER"
   - As variáveis de ambiente SetEnv

### 3. Instalar/Atualizar Dependências do Backend

Via **Terminal do cPanel** ou **SSH**:

```bash
cd /home/liberdademedicae/public_html/admin-certificacoes/backend
npm install --production
```

### 4. Reiniciar a Aplicação

#### Opção A: Via cPanel (Recomendado)

1. Acesse **cPanel → Setup Node.js App**
2. Encontre a aplicação "admin-certificacoes"
3. Clique no botão **"Restart"** ou **"Stop & Start"**

#### Opção B: Criar arquivo restart.txt

```bash
cd /home/liberdademedicae/public_html/admin-certificacoes
touch tmp/restart.txt
```

O Passenger detecta automaticamente esse arquivo e reinicia a aplicação.

### 5. Verificar se está Funcionando

#### 5.1. Testar Backend (API):

Abra o navegador ou use curl:

```bash
curl https://liberdademedicaedu.com.br/admin-certificacoes/api/health
```

Deve retornar JSON com informações de saúde da API e status do banco de dados.

#### 5.2. Testar Frontend (SPA):

1. ✅ Acesse: `https://liberdademedicaedu.com.br/admin-certificacoes/`
   - Deve carregar a tela de login

2. ✅ Acesse: `https://liberdademedicaedu.com.br/admin-certificacoes/login`
   - Deve carregar a tela de login diretamente (NÃO deve dar 404!)

3. ✅ Faça login e navegue para uma página interna (ex: Students)
   - Pressione F5 para refresh
   - A página deve recarregar corretamente (NÃO deve dar 404!)

### 6. Troubleshooting

#### Problema: "404 Not Found" ao acessar /admin-certificacoes/login diretamente

**Causa**: As regras de reescrita do .htaccess não estão funcionando.

**Solução**:
1. Verifique se o arquivo `.htaccess` está na pasta `/admin-certificacoes/`
2. Verifique se contém as regras de RewriteEngine e RewriteRule
3. Teste se mod_rewrite está habilitado (geralmente já está no cPanel)
4. Limpe o cache do navegador (Ctrl+Shift+R)

#### Problema: API retorna erro 502 Bad Gateway

**Causa**: O backend não está rodando ou está com erro.

**Solução**:
1. Acesse cPanel → **Setup Node.js App**
2. Verifique o status da aplicação
3. Clique em **"Restart"**
4. Se continuar com erro, clique em **"Stop"** e depois **"Start"**
5. Verifique os logs do Passenger (via cPanel)

#### Problema: Erro "Cannot find module" no backend

**Causa**: Dependências não foram instaladas.

**Solução**:
```bash
cd /home/liberdademedicae/public_html/admin-certificacoes/backend
npm install --production
# Reiniciar a aplicação via cPanel
```

#### Problema: Erro de conexão com o banco de dados

**Causa**: Variáveis de ambiente incorretas.

**Solução**:
1. Acesse cPanel → **Setup Node.js App**
2. Clique na aplicação "admin-certificacoes"
3. Verifique as **Environment Variables**:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
4. Corrija se necessário e clique em **"Save"**
5. Reinicie a aplicação

#### Problema: Erro de CORS

**Causa**: Domínio não está na lista de origens permitidas.

**Solução**:
1. Edite o `.htaccess`
2. Procure pela linha `SetEnv CORS_ORIGINS`
3. Adicione o domínio necessário separado por vírgula
4. Reinicie a aplicação

### 7. Atualizações Futuras

Para fazer deploy de novas versões:

#### Frontend:
```bash
# 1. Local - Build
npm run build

# 2. Servidor - Via cPanel File Manager:
#    a. Delete: assets/, index.html, favicon.ico
#    b. Upload do ZIP com conteúdo da dist/
#    c. Extraia na pasta admin-certificacoes/
#    d. Delete o ZIP
#    e. Limpe o cache do navegador (Ctrl+Shift+R)
```

#### Backend:
```bash
# 1. Upload dos arquivos alterados via cPanel

# 2. Via Terminal/SSH:
cd /home/liberdademedicae/public_html/admin-certificacoes/backend
npm install --production

# 3. Via cPanel → Setup Node.js App → Restart
# OU
touch /home/liberdademedicae/public_html/admin-certificacoes/tmp/restart.txt
```

## Estrutura do .htaccess (Resumo)

O arquivo `.htaccess` faz 3 coisas importantes:

1. **Configuração do Passenger** (gerenciada automaticamente pelo cPanel)
   - Define onde está o backend e como rodá-lo

2. **Variáveis de Ambiente** (gerenciadas no cPanel)
   - Configurações do banco, CORS, etc.

3. **SPA Fallback** (adicionado por nós)
   - Regras de reescrita para redirecionar rotas do frontend para index.html
   - Permite que o React Router funcione corretamente

## Gerenciamento via cPanel

### Setup Node.js App

Acesse **cPanel → Setup Node.js App** para:
- ✅ Ver status da aplicação (Running/Stopped)
- ✅ Iniciar/Parar/Reiniciar o backend
- ✅ Editar variáveis de ambiente
- ✅ Ver logs de erro
- ✅ Alterar versão do Node.js

### Variáveis de Ambiente Importantes

Configuradas em **Setup Node.js App → Environment Variables**:

```
NODE_ENV=production
PORT=3001
DB_HOST=35.199.101.38
DB_PORT=5432
DB_NAME=liberdade-medica
DB_USER=lovable
DB_PASSWORD=XqH+B5tdvyR-AebQ
CORS_ORIGINS=https://liberdademedicaedu.com.br,http://localhost:5173
VITE_API_URL=https://liberdademedicaedu.com.br/admin-certificacoes/api
```

## Monitoramento

### Logs

- **Logs do Backend**: Via cPanel → Setup Node.js App → View Logs
- **Logs do Apache**: Via cPanel → Errors
- **Console do Browser**: Abra DevTools (F12) para ver erros do frontend

### Verificação de Saúde

Monitore a API periodicamente:
```bash
curl https://liberdademedicaedu.com.br/admin-certificacoes/api/health
```

Verifique:
- `status: "ok"` ou `"degraded"`
- `database.connected: true`
- Sem erros no campo `database.error`

## Segurança

- ✅ SSL/HTTPS configurado no domínio
- ✅ Variáveis de ambiente gerenciadas de forma segura pelo cPanel
- ✅ Senhas do banco de dados não expostas no código
- ✅ CORS configurado apenas para domínios permitidos
- ⚠️ **NUNCA commite senhas ou .env no Git**

## Comandos Úteis (SSH/Terminal)

```bash
# Ver estrutura de pastas
ls -la /home/liberdademedicae/public_html/admin-certificacoes/

# Verificar instalação do Node.js
node --version
npm --version

# Instalar dependências
cd /home/liberdademedicae/public_html/admin-certificacoes/backend
npm install --production

# Reiniciar aplicação (criar arquivo restart.txt)
touch /home/liberdademedicae/public_html/admin-certificacoes/tmp/restart.txt

# Ver conteúdo do .htaccess
cat /home/liberdademedicae/public_html/admin-certificacoes/.htaccess

# Testar API localmente do servidor
curl http://localhost:3001/admin-certificacoes/api/health
```

## Checklist Rápido de Deploy

- [ ] Build do frontend local (`npm run build`)
- [ ] Upload e extração dos arquivos do frontend
- [ ] Upload dos arquivos do backend (se houver mudanças)
- [ ] Upload/atualização do .htaccess
- [ ] Instalar dependências do backend (`npm install --production`)
- [ ] Reiniciar aplicação (via cPanel ou `touch tmp/restart.txt`)
- [ ] Testar API: `/admin-certificacoes/api/health`
- [ ] Testar frontend: `/admin-certificacoes/` e `/admin-certificacoes/login`
- [ ] Limpar cache do navegador (Ctrl+Shift+R)
- [ ] Fazer login e testar funcionalidades principais

## Contato e Suporte

Em caso de problemas:
1. Verifique os logs no cPanel → Setup Node.js App → View Logs
2. Verifique o console do navegador (F12)
3. Teste a API diretamente: `/admin-certificacoes/api/health`
4. Reinicie a aplicação pelo cPanel

---

**Última atualização**: 2025-12-10
