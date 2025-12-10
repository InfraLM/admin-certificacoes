require('dotenv').config({ path: '../.env' });
const { pool } = require('../src/config/database');

async function fixData() {
    console.log('🔧 Iniciando correção de dados...');

    try {
        const client = await pool.connect();
        console.log('✅ Conectado ao banco de dados');

        // 1. Corrigir valor 190000.00 para 1900.00
        // O usuário relatou que 1900 virou 190.000. Vamos corrigir para 1900.00.
        const updateResult = await client.query(`
      UPDATE ci_financeiro 
      SET valor_unitario = 1900.00, valor_total = 1900.00
      WHERE valor_unitario = 190000.00
      RETURNING id, categoria, valor_unitario
    `);

        if (updateResult.rowCount > 0) {
            console.log(`✅ Corrigidos ${updateResult.rowCount} registros com valor 190.000 para 1.900`);
            updateResult.rows.forEach(row => {
                console.log(`   - ID: ${row.id}, Categoria: ${row.categoria}, Novo Valor: ${row.valor_unitario}`);
            });
        } else {
            console.log('ℹ️ Nenhum registro com valor 190.000 encontrado.');
        }

        // 2. Remover registro com data inválida '34/44/3242'
        const deleteResult = await client.query(`
      DELETE FROM ci_financeiro 
      WHERE data = '34/44/3242'
      RETURNING id, data, categoria
    `);

        if (deleteResult.rowCount > 0) {
            console.log(`✅ Removidos ${deleteResult.rowCount} registros com data inválida`);
            deleteResult.rows.forEach(row => {
                console.log(`   - ID: ${row.id}, Data: ${row.data}, Categoria: ${row.categoria}`);
            });
        } else {
            console.log('ℹ️ Nenhum registro com data 34/44/3242 encontrado.');
        }

        client.release();
    } catch (err) {
        console.error('❌ Erro ao corrigir dados:', err);
    } finally {
        await pool.end();
        console.log('👋 Conexão encerrada');
    }
}

fixData();
