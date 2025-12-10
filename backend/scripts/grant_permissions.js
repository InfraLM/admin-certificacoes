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

async function checkOwnership() {
    console.log('🔌 Connecting to database...');
    try {
        const client = await pool.connect();
        console.log('✅ Connected.');

        const res = await client.query(`
      SELECT tablename, tableowner 
      FROM pg_catalog.pg_tables 
      WHERE tablename IN ('ci_financeiro_aluno', 'ci_financeiro_turma');
    `);

        console.log('📋 Table Ownership:', res.rows);
        client.release();
    } catch (err) {
        console.error('❌ Connection error:', err);
    } finally {
        pool.end();
    }
}

checkOwnership();
