#!/usr/bin/env node



/**

 * Script de Diagnóstico para cPanel

 * Executa verificações essenciais antes de iniciar o backend

 */



console.log('\n' + '='.repeat(70));

console.log('🔍 DIAGNÓSTICO DO BACKEND - Admin Certificações');

console.log('='.repeat(70) + '\n');



const fs = require('fs');

const path = require('path');



let errors = 0;

let warnings = 0;



// ============================================================================

// 1. VERIFICAR NODE VERSION

// ============================================================================

console.log('📌 1. Verificando versão do Node.js...');

const nodeVersion = process.version;

console.log(`   Node.js: ${nodeVersion}`);

const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {

    console.log('   ❌ ERRO: Node.js 16+ é recomendado');

    errors++;

} else {

    console.log('   ✅ Versão OK');

}

console.log('');



// ============================================================================

// 2. VERIFICAR DEPENDÊNCIAS

// ============================================================================

console.log('📌 2. Verificando dependências instaladas...');

const requiredDeps = ['express', 'pg', 'cors', 'dotenv', 'date-fns'];

const missingDeps = [];



for (const dep of requiredDeps) {

    try {

        require.resolve(dep);

        console.log(`   ✅ ${dep.padEnd(15)} - instalado`);

    } catch (e) {

        console.log(`   ❌ ${dep.padEnd(15)} - NÃO ENCONTRADO`);

        missingDeps.push(dep);

        errors++;

    }

}



if (missingDeps.length > 0) {

    console.log('\n   💡 Execute: npm install');

}

console.log('');



// ============================================================================

// 3. VERIFICAR ARQUIVOS ESSENCIAIS

// ============================================================================

console.log('📌 3. Verificando arquivos essenciais...');

const requiredFiles = [

    'src/index.js',

    'src/config/database.js',

    'src/controllers/alunos.controller.js',

    'src/controllers/turmas.controller.js',

    'src/controllers/financeiro.controller.js',

    'src/routes/alunos.routes.js',

    'src/routes/turmas.routes.js',

    'src/routes/financeiro.routes.js',

    'src/utils/dateUtils.js',

    'package.json',

    '.env'

];



for (const file of requiredFiles) {

    const fullPath = path.join(__dirname, file);

    if (fs.existsSync(fullPath)) {

        console.log(`   ✅ ${file}`);

    } else {

        console.log(`   ❌ ${file} - NÃO ENCONTRADO`);

        errors++;

    }

}

console.log('');



// ============================================================================

// 4. VERIFICAR VARIÁVEIS DE AMBIENTE

// ============================================================================

console.log('📌 4. Verificando variáveis de ambiente...');



// Carregar .env

try {

    require('dotenv').config();

    console.log('   ✅ Arquivo .env carregado');

} catch (e) {

    console.log('   ❌ Erro ao carregar .env:', e.message);

    errors++;

}



const requiredEnvVars = {

    'DB_HOST': 'Host do banco de dados',

    'DB_PORT': 'Porta do banco de dados',

    'DB_NAME': 'Nome do banco de dados',

    'DB_USER': 'Usuário do banco de dados',

    'DB_PASSWORD': 'Senha do banco de dados'

};



for (const [envVar, description] of Object.entries(requiredEnvVars)) {

    const value = process.env[envVar];

    if (!value || value.trim() === '') {

        console.log(`   ❌ ${envVar.padEnd(15)} - NÃO DEFINIDA (${description})`);

        errors++;

    } else {

        // Ocultar senha

        const displayValue = envVar === 'DB_PASSWORD' ? '***' : value;

        console.log(`   ✅ ${envVar.padEnd(15)} = ${displayValue}`);

    }

}



// Variáveis opcionais

const optionalEnvVars = ['PORT', 'NODE_ENV', 'CORS_ORIGINS'];

for (const envVar of optionalEnvVars) {

    const value = process.env[envVar];

    if (!value) {

        console.log(`   ⚠️  ${envVar.padEnd(15)} - não definida (opcional)`);

        warnings++;

    } else {

        console.log(`   ℹ️  ${envVar.padEnd(15)} = ${value}`);

    }

}

console.log('');



// ============================================================================

// 5. TESTAR CONEXÃO COM BANCO DE DADOS

// ============================================================================

console.log('📌 5. Testando conexão com banco de dados...');



if (errors > 0) {

    console.log('   ⏭️  Pulando teste (corrija os erros acima primeiro)');

} else {

    const { Pool } = require('pg');

    const pool = new Pool({

        host: process.env.DB_HOST,

        port: parseInt(process.env.DB_PORT),

        database: process.env.DB_NAME,

        user: process.env.DB_USER,

        password: process.env.DB_PASSWORD,

        ssl: false,

        connectionTimeoutMillis: 5000,

    });



    (async () => {

        try {

            const client = await pool.connect();

            console.log('   ✅ Conexão estabelecida com sucesso!');



            const result = await client.query('SELECT NOW(), version()');

            console.log('   ✅ Query executada com sucesso!');

            console.log(`   📊 PostgreSQL: ${result.rows[0].version.split(',')[0]}`);



            // Verificar tabelas

            const tablesResult = await client.query(`

        SELECT table_name

        FROM information_schema.tables

        WHERE table_schema = 'public'

        ORDER BY table_name

      `);



            if (tablesResult.rows.length === 0) {

                console.log('   ⚠️  Nenhuma tabela encontrada no banco de dados');

                warnings++;

            } else {

                console.log(`   ✅ ${tablesResult.rows.length} tabelas encontradas:`);

                tablesResult.rows.forEach(row => {

                    console.log(`      - ${row.table_name}`);

                });

            }



            client.release();

            await pool.end();



            console.log('');

            printSummary();



        } catch (error) {

            console.log('   ❌ Erro ao conectar com o banco de dados!');

            console.log(`   📋 Mensagem: ${error.message}`);

            console.log(`   📋 Código: ${error.code}`);



            if (error.code === 'ECONNREFUSED') {

                console.log('\n   💡 SOLUÇÃO:');

                console.log('      - Verifique se o PostgreSQL está rodando');

                console.log('      - Verifique o host e porta nas variáveis de ambiente');

            } else if (error.code === '28P01') {

                console.log('\n   💡 SOLUÇÃO:');

                console.log('      - Verifique o usuário e senha (DB_USER e DB_PASSWORD)');

            } else if (error.code === '3D000') {

                console.log('\n   💡 SOLUÇÃO:');

                console.log('      - O banco de dados não existe. Crie-o primeiro.');

            }



            errors++;

            console.log('');

            printSummary();

            await pool.end();

        }

    })();

}



// ============================================================================

// RESUMO

// ============================================================================

function printSummary() {

    console.log('='.repeat(70));

    console.log('📊 RESUMO DO DIAGNÓSTICO');

    console.log('='.repeat(70));



    if (errors === 0 && warnings === 0) {

        console.log('✅ Tudo OK! O backend está pronto para iniciar.');

        console.log('\n💡 Execute: npm start');

        console.log('='.repeat(70) + '\n');

        process.exit(0);

    } else {

        if (errors > 0) {
            console.log(`❌ ${errors} erro(s) encontrado(s) - CORRIJA ANTES DE INICIAR`);
        }
        if (warnings > 0) {
            console.log(`⚠️  ${warnings} aviso(s) encontrado(s)`);
        }
        console.log('\n📋 PRÓXIMOS PASSOS:');

        if (missingDeps.length > 0) {
            console.log('   1. Instale as dependências: npm install');
        }
        console.log('   2. Verifique o arquivo .env e configure corretamente');
        console.log('   3. Verifique se o PostgreSQL está acessível');
        console.log('   4. Execute este diagnóstico novamente');
        console.log('='.repeat(70) + '\n');

        process.exit(errors > 0 ? 1 : 0);
    }
}