const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

const TABLES = {
    FINANCEIRO: 'ci_financeiro',
    FINANCEIRO_ALUNO: 'ci_financeiro_aluno',
    FINANCEIRO_TURMA: 'ci_financeiro_turma'
};

async function testResumo() {
    console.log('🔌 Connecting to database...');
    try {
        const client = await pool.connect();
        console.log('✅ Connected.');

        console.log('📊 Testing getResumo query...');
        const res = await client.query(`
      SELECT 
        f.tipo,
        SUM(f.valor_total) as total
      FROM ${TABLES.FINANCEIRO} f
      LEFT JOIN ${TABLES.FINANCEIRO_ALUNO} fa ON f.id = fa.financeiro_id
      LEFT JOIN ${TABLES.FINANCEIRO_TURMA} ft ON f.id = ft.financeiro_id
      GROUP BY f.tipo
    `);

        console.log('✅ Query successful!');
        console.log('📋 Results:', res.rows);
        client.release();
    } catch (err) {
        console.error('❌ Query error:', err.message);
    } finally {
        pool.end();
    }
}

testResumo();
