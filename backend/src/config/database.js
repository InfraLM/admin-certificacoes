const { Pool } = require('pg');

// ============================================================================
// CONFIGURAÇÃO DO POSTGRESQL
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('🔧 [Database Config] Configurando PostgreSQL...');
console.log('='.repeat(70));
console.log('📋 Configurações carregadas:');
console.log('   Host:     ', process.env.DB_HOST);
console.log('   Port:     ', process.env.DB_PORT);
console.log('   Database: ', process.env.DB_NAME);
console.log('   User:     ', process.env.DB_USER);
console.log('   Password: ', process.env.DB_PASSWORD);
console.log('='.repeat(70) + '\n');

// Criar pool de conexões
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Configurações do pool
  max: 20, // máximo de conexões
  idleTimeoutMillis: 30000, // 30 segundos
  connectionTimeoutMillis: 5000, // 5 segundos para estabelecer conexão
  // SSL desativado (sem certificado)
  ssl: false,
});

// ============================================================================
// EVENT LISTENERS DO POOL
// ============================================================================

pool.on('connect', (client) => {
  console.log('✅ [Database Pool] Nova conexão estabelecida');
});

pool.on('acquire', (client) => {
  console.log('📥 [Database Pool] Cliente adquirido do pool');
});

pool.on('remove', (client) => {
  console.log('📤 [Database Pool] Cliente removido do pool');
});

pool.on('error', (err, client) => {
  console.error('❌ [Database Pool] Erro inesperado:', err.message);
  console.error('   Código:', err.code);
  if (err.code === 'ECONNREFUSED') {
    console.error('   💡 Dica: Verifique se o PostgreSQL está rodando e se o host/porta estão corretos');
  } else if (err.code === '28P01') {
    console.error('   💡 Dica: Verifique usuário e senha (DB_USER e DB_PASSWORD)');
  } else if (err.code === '3D000') {
    console.error('   💡 Dica: O database especificado não existe');
  }
});

// ============================================================================
// FUNÇÃO DE TESTE DE CONEXÃO
// ============================================================================

const testConnection = async () => {
  console.log('🔍 [Database] Testando conexão com PostgreSQL...');

  try {
    const client = await pool.connect();
    console.log('   ✅ Conexão estabelecida com sucesso!');

    // Teste de query
    const result = await client.query(`
      SELECT 
        NOW() as current_time,
        current_database() as database,
        current_user as user,
        version() as pg_version
    `);

    const info = result.rows[0];
    console.log('   ✅ Query de teste executada!');
    console.log('   📊 Informações do servidor:');
    console.log('      - Hora do servidor:', info.current_time);
    console.log('      - Database ativo:  ', info.database);
    console.log('      - Usuário:         ', info.user);
    console.log('      - Versão PG:       ', info.pg_version.split(',')[0]);

    // Verificar tabelas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log('   ✅ Tabelas encontradas:', tablesResult.rows.length);
      tablesResult.rows.forEach((row, index) => {
        console.log(`      ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.warn('   ⚠️  Nenhuma tabela encontrada no schema public');
    }

    client.release();
    console.log('   ✅ Teste de conexão concluído com sucesso!\n');
    return true;

  } catch (error) {
    console.error('   ❌ Falha no teste de conexão!');
    console.error('   📋 Detalhes do erro:');
    console.error('      - Mensagem:', error.message);
    console.error('      - Código:  ', error.code);

    // Mensagens de ajuda específicas
    if (error.code === 'ECONNREFUSED') {
      console.error('\n   💡 SOLUÇÃO:');
      console.error('      1. Verifique se o PostgreSQL está rodando');
      console.error('      2. Verifique se o host está correto:', process.env.DB_HOST);
      console.error('      3. Verifique se a porta está correta:', process.env.DB_PORT);
      console.error('      4. Verifique firewall/segurança de rede');
    } else if (error.code === '28P01') {
      console.error('\n   💡 SOLUÇÃO:');
      console.error('      Erro de autenticação! Verifique:');
      console.error('      - DB_USER:', process.env.DB_USER);
      console.error('      - DB_PASSWORD está correta?');
    } else if (error.code === '3D000') {
      console.error('\n   💡 SOLUÇÃO:');
      console.error('      O database não existe! Verifique:');
      console.error('      - DB_NAME:', process.env.DB_NAME);
      console.error('      - Crie o database se necessário');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n   💡 SOLUÇÃO:');
      console.error('      Timeout de conexão! Possíveis causas:');
      console.error('      - Firewall bloqueando a porta');
      console.error('      - Host incorreto ou inacessível');
      console.error('      - Problemas de rede');
    }

    console.error('\n   📝 Stack trace:');
    console.error(error.stack);
    console.log('');

    return false;
  }
};

// ============================================================================
// HELPER FUNCTION PARA QUERIES
// ============================================================================

const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`⚡ [Query] Executada em ${duration}ms - ${result.rowCount} row(s)`);
    return result;
  } catch (error) {
    console.error('❌ [Query] Erro:', error.message);
    console.error('   SQL:', text);
    if (params) console.error('   Params:', params);
    throw error;
  }
};

// ============================================================================
// NOMES DAS TABELAS
// ============================================================================

const TABLES = {
  ALUNOS: 'ci_alunos',
  TURMAS: 'ci_turmas',
  ALUNO_TURMA: 'ci_aluno_turma',
  FINANCEIRO: 'ci_financeiro',
  FINANCEIRO_ALUNO: 'ci_financeiro_aluno',
  FINANCEIRO_TURMA: 'ci_financeiro_turma',
};

console.log('📋 [Database] Tabelas mapeadas:');
Object.entries(TABLES).forEach(([key, value]) => {
  console.log(`   ${key.padEnd(15)} -> ${value}`);
});
console.log('');

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  pool,
  query,
  testConnection,
  TABLES,
};