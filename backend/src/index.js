require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ============================================================================
// IMPORTAR DATABASE - ISSO É CRÍTICO!
// ============================================================================
const { pool, testConnection } = require('./config/database');

// Importar rotas
const alunosRoutes = require('./routes/alunos.routes');
const turmasRoutes = require('./routes/turmas.routes');
const financeiroRoutes = require('./routes/financeiro.routes');
const alunoTurmaRoutes = require('./routes/alunoTurma.routes');
const financeiroAlunoRoutes = require('./routes/financeiroAluno.routes');
const financeiroTurmaRoutes = require('./routes/financeiroTurma.routes');

console.log('🚀 [Server] Iniciando backend...');
console.log('🔧 [Server] NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('🔧 [Server] PORT:', process.env.PORT || 3001);
console.log('🔧 [Server] CORS Origins:', process.env.CORS_ORIGINS || 'http://localhost:5173');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// CORS CONFIGURATION
// ============================================================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'https://liberdademedicaedu.com.br',
  'https://www.liberdademedicaedu.com.br',
  'http://192.168.1.232:8080',
  ...(process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [])
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requisições sem origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || /^http:\/\/192\.168\.1\.\d+(:\d+)?$/.test(origin)) {
      console.log('✅ [CORS] Origin permitida:', origin);
      callback(null, true);
    } else {
      console.warn('⚠️  [CORS] Origin bloqueada (mas permitida):', origin);
      callback(null, true); // Permitir mesmo assim para facilitar dev
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================
app.use((req, res, next) => {
  console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (Object.keys(req.body || {}).length > 0) {
    console.log('   Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// ============================================================================
// ROTAS DA API
// ============================================================================

// Health check COM TESTE DE BANCO
app.get('/admin-certificacoes/api/health', async (req, res) => {
  console.log('🏥 [Health Check] Requisição recebida');

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      name: process.env.DB_NAME,
      connected: false,
      error: null,
    },
  };

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as db_time, version() as pg_version');
    client.release();

    health.database.connected = true;
    health.database.serverTime = result.rows[0].db_time;
    health.database.version = result.rows[0].pg_version.split(',')[0];
    console.log('✅ [Health Check] Database: CONECTADO');

    res.json(health);
  } catch (err) {
    console.error('❌ [Health Check] Database: ERRO -', err.message);
    console.error('   Stack:', err.stack);
    health.status = 'degraded';
    health.database.connected = false;
    health.database.error = err.message;
    health.database.code = err.code;

    res.status(503).json(health);
  }
});

// Database test endpoint
app.get('/admin-certificacoes/api/db-test', async (req, res) => {
  console.log('🔬 [DB Test] Requisição recebida');

  const tests = {
    timestamp: new Date().toISOString(),
    config: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      passwordSet: !!process.env.DB_PASSWORD,
    },
    results: [],
  };

  // Teste 1: Conexão básica
  try {
    const client = await pool.connect();
    tests.results.push({
      test: 'Conexão básica',
      status: 'success',
      message: 'Pool de conexões OK',
    });

    // Teste 2: Query simples
    try {
      const result = await client.query(`
        SELECT 
          version() as pg_version,
          current_database() as database_name,
          current_user as current_user,
          NOW() as current_time
      `);
      tests.results.push({
        test: 'Query simples',
        status: 'success',
        data: result.rows[0],
      });
    } catch (err) {
      tests.results.push({
        test: 'Query simples',
        status: 'error',
        error: err.message,
      });
    }

    // Teste 3: Listar tabelas
    try {
      const tablesResult = await client.query(`
        SELECT 
          table_name,
          table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      tests.results.push({
        test: 'Listar tabelas',
        status: 'success',
        count: tablesResult.rows.length,
        tables: tablesResult.rows.map(r => ({
          name: r.table_name,
          type: r.table_type
        })),
      });
    } catch (err) {
      tests.results.push({
        test: 'Listar tabelas',
        status: 'error',
        error: err.message,
      });
    }

    // Teste 4: Verificar tabelas específicas
    const expectedTables = ['ci_alunos_pacientes', 'ci_turmas_tratamentos', 'ci_aluno_turma', 'ci_financeiro'];
    try {
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY($1)
      `, [expectedTables]);

      const foundTables = result.rows.map(r => r.table_name);
      const missingTables = expectedTables.filter(t => !foundTables.includes(t));

      tests.results.push({
        test: 'Verificar tabelas do sistema',
        status: missingTables.length === 0 ? 'success' : 'warning',
        found: foundTables,
        missing: missingTables,
      });
    } catch (err) {
      tests.results.push({
        test: 'Verificar tabelas do sistema',
        status: 'error',
        error: err.message,
      });
    }

    client.release();
  } catch (err) {
    tests.results.push({
      test: 'Conexão básica',
      status: 'error',
      error: err.message,
      code: err.code,
      detail: err.detail,
    });
  }

  const allSuccess = tests.results.every(r => r.status === 'success');
  res.status(allSuccess ? 200 : 500).json(tests);
});

// Rotas principais
app.use('/admin-certificacoes/api/alunos', alunosRoutes);
app.use('/admin-certificacoes/api/turmas', turmasRoutes);
app.use('/admin-certificacoes/api/financeiro', financeiroRoutes);
app.use('/admin-certificacoes/api/aluno-turma', alunoTurmaRoutes);
app.use('/admin-certificacoes/api/financeiro-aluno', financeiroAlunoRoutes);
app.use('/admin-certificacoes/api/financeiro-turma', financeiroTurmaRoutes);

// Auth endpoint
app.post('/admin-certificacoes/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log('🔐 [Auth] Tentativa de login:', username);

  const USERS = {
    admin: { password: 'adminlm', role: 'admin' },
    comercial: { password: 'comerciallm', role: 'comercial' },
    cx: { password: 'cxlm', role: 'cx' },
  };

  const user = USERS[username?.toLowerCase()];

  if (!user) {
    console.log('❌ [Auth] Usuário não encontrado:', username);
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }

  if (user.password !== password) {
    console.log('❌ [Auth] Senha incorreta para:', username);
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  console.log('✅ [Auth] Login realizado:', username, '- Role:', user.role);
  res.json({
    success: true,
    user: {
      username: username.toLowerCase(),
      role: user.role
    }
  });
});

// Root endpoint
app.get('/admin-certificacoes/api', (req, res) => {
  console.log('📍 [Root] Requisição na raiz da API');
  res.json({
    message: 'API Admin Certificações - Liberdade Médica',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/admin-certificacoes/api/health',
      dbTest: '/admin-certificacoes/api/db-test',
      auth: '/admin-certificacoes/api/auth/login',
      alunos: '/admin-certificacoes/api/alunos',
      turmas: '/admin-certificacoes/api/turmas',
      financeiro: '/admin-certificacoes/api/financeiro',
      alunoTurma: '/admin-certificacoes/api/aluno-turma',
    },
  });
});

// ============================================================================
// ERROR HANDLERS
// ============================================================================

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 [Error]:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  console.warn('⚠️  [404] Rota não encontrada:', req.method, req.path);
  res.status(404).json({
    error: 'Not Found',
    message: `Rota ${req.method} ${req.path} não encontrada`,
    availableEndpoints: '/admin-certificacoes/api',
  });
});

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================================

async function startServer() {
  try {
    // Testa a conexão antes de iniciar
    console.log('\n🔍 [Server] Testando conexão com banco de dados...');

    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.warn('\n⚠️  [Server] SERVIDOR INICIANDO SEM CONEXÃO COM BANCO!');
      console.warn('   As rotas funcionarão, mas operações de banco falharão.\n');
    } else {
      console.log('\n✅ [Server] Conexão com banco estabelecida!\n');
    }

    app.listen(PORT, () => {
      console.log('='.repeat(70));
      console.log('🚀 Backend Server - ONLINE');
      console.log('='.repeat(70));
      console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
      console.log('🔌 Port:', PORT);
      console.log('📊 API Base URL:');
      console.log(`   Local:      http://localhost:${PORT}/admin-certificacoes/api`);
      console.log(`   Production: https://liberdademedicaedu.com.br/admin-certificacoes/api`);
      console.log('\n📋 Key Endpoints:');
      console.log(`   Health:  /admin-certificacoes/api/health`);
      console.log(`   DB Test: /admin-certificacoes/api/db-test`);
      console.log(`   Login:   /admin-certificacoes/api/auth/login`);
      console.log('\n💾 Database:');
      console.log(`   Host:     ${process.env.DB_HOST}`);
      console.log(`   Port:     ${process.env.DB_PORT}`);
      console.log(`   Database: ${process.env.DB_NAME}`);
      console.log(`   Status:   ${dbConnected ? '✅ CONECTADO' : '❌ DESCONECTADO'}`);
      console.log('='.repeat(70) + '\n');
    });
  } catch (err) {
    console.error('❌ [Server] ERRO FATAL ao iniciar:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 [Server] SIGTERM recebido, encerrando...');
  try {
    await pool.end();
    console.log('✅ [Database] Pool encerrado');
    process.exit(0);
  } catch (err) {
    console.error('❌ [Server] Erro ao encerrar:', err);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('\n🛑 [Server] SIGINT recebido, encerrando...');
  try {
    await pool.end();
    console.log('✅ [Database] Pool encerrado');
    process.exit(0);
  } catch (err) {
    console.error('❌ [Server] Erro ao encerrar:', err);
    process.exit(1);
  }
});

// Inicia o servidor
startServer();