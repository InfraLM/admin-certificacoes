const { query, TABLES } = require('../config/database');
const crypto = require('crypto');
const { formatDate, parseDate, getTodayDB } = require('../utils/dateUtils');

const TABLE = TABLES.FINANCEIRO; // ci_financeiro

// Função para gerar ID único
const generateId = () => crypto.randomUUID();

// Helper to format financeiro dates
const formatFinanceiro = (item) => {
  if (!item) return null;
  return {
    ...item,
    data: formatDate(item.data),
    // data_registro is varchar(30) and usually stores DD/MM/YYYY or similar, so we leave it or format it if needed.
    // Given the code uses 'today' as DD/MM/YYYY for data_registro, we can assume it's already formatted.
  };
};

// Listar todos os registros (with turma info from junction tables)
exports.getAll = async (req, res) => {
  console.log('🔥🔥🔥 [DEBUG] financeiroController.getAll CHAMADO!');
  console.log('   Query params:', req.query);
  console.log('   URL:', req.url);
  console.log('   Path:', req.path);

  try {
    const { search, tipo, turma_id } = req.query;

    // Use UNION to combine both student enrollments and class expenses
    let sql = `
      SELECT DISTINCT
        f.id,
        f.categoria,
        f.descricao,
        f.quantidade,
        f.valor_unitario,
        f.valor_total,
        f.tipo,
        f.data,
        f.observacoes,
        f.data_registro,
        COALESCE(fa.turma_id, ft.turma_id) as turma_id,
        t.nome_turma as turma_nome
      FROM ${TABLE} f
      LEFT JOIN ${TABLES.FINANCEIRO_ALUNO} fa ON f.id = fa.financeiro_id
      LEFT JOIN ${TABLES.FINANCEIRO_TURMA} ft ON f.id = ft.financeiro_id
      LEFT JOIN ${TABLES.TURMAS} t ON COALESCE(fa.turma_id, ft.turma_id) = t.id
    `;

    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`(f.categoria ILIKE $${params.length + 1} OR f.descricao ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (tipo && tipo !== 'todos') {
      conditions.push(`f.tipo = $${params.length + 1}`);
      params.push(tipo);
    }

    if (turma_id) {
      if (turma_id === 'sem_turma') {
        conditions.push('COALESCE(fa.turma_id, ft.turma_id) IS NULL');
      } else {
        conditions.push(`COALESCE(fa.turma_id, ft.turma_id) = $${params.length + 1}`);
        params.push(turma_id);
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Sort by data (DATE type)
    sql += ` ORDER BY f.data DESC, f.id DESC`;

    const result = await query(sql, params);
    const formatted = result.rows.map(formatFinanceiro);
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching financeiro:', error);
    res.status(500).json({ error: 'Erro ao buscar registros financeiros' });
  }
};

// Obter resumo financeiro (using junction tables)
exports.getResumo = async (req, res) => {
  try {
    const { turma_id, data_inicio, data_fim } = req.query;

    let sql = `
      SELECT 
        f.tipo,
        SUM(f.valor_total) as total
      FROM ${TABLE} f
      LEFT JOIN ${TABLES.FINANCEIRO_ALUNO} fa ON f.id = fa.financeiro_id
      LEFT JOIN ${TABLES.FINANCEIRO_TURMA} ft ON f.id = ft.financeiro_id
    `;
    const params = [];
    const conditions = [];

    if (turma_id) {
      conditions.push(`COALESCE(fa.turma_id, ft.turma_id) = $${params.length + 1}`);
      params.push(turma_id);
    }

    if (data_inicio) {
      conditions.push(`f.data >= $${params.length + 1}`);
      params.push(parseDate(data_inicio));
    }

    if (data_fim) {
      conditions.push(`f.data <= $${params.length + 1}`);
      params.push(parseDate(data_fim));
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY f.tipo';

    console.log('📊 [Financeiro] Calculando resumo...');
    console.log('   SQL:', sql);
    console.log('   Params:', params);

    const result = await query(sql, params);
    console.log('   Result Rows:', result.rows);

    const resumo = {
      entradas: 0,
      saidas: 0,
      saldo: 0
    };

    result.rows.forEach(row => {
      if (row.tipo === 'Entrada') {
        resumo.entradas = parseFloat(row.total) || 0;
      } else if (row.tipo === 'Saída') {
        resumo.saidas = parseFloat(row.total) || 0;
      }
    });

    resumo.saldo = resumo.entradas - resumo.saidas;

    res.json(resumo);
  } catch (error) {
    console.error('Error fetching resumo:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo financeiro' });
  }
};

// Buscar registro por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    res.json(formatFinanceiro(result.rows[0]));
  } catch (error) {
    console.error('Error fetching registro:', error);
    res.status(500).json({ error: 'Erro ao buscar registro' });
  }
};

// Criar novo registro (requires turma_id, creates junction table record)
exports.create = async (req, res) => {
  try {
    const {
      categoria, descricao, quantidade, valor_unitario,
      valor_total, tipo, data, turma_id, observacoes, aluno_id
    } = req.body;

    // Validate turma_id is required
    if (!turma_id) {
      return res.status(400).json({
        error: 'Turma é obrigatória',
        details: 'Selecione uma turma para o registro financeiro'
      });
    }

    // Gerar ID único
    const id = generateId();

    // Calcular valor_total se não fornecido
    const cleanUnit = typeof valor_unitario === 'string'
      ? parseFloat(valor_unitario.replace(/\./g, '').replace(',', '.'))
      : valor_unitario;
    const cleanQty = typeof quantidade === 'string' ? parseInt(quantidade) : quantidade;

    const calculatedTotal = valor_total || (cleanQty * cleanUnit).toFixed(2);

    // Prepare dates
    const dataDB = parseDate(data);
    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`; // Keep data_registro as DD/MM/YYYY

    // Insert into ci_financeiro (without turma_id)
    const sql = `
      INSERT INTO ${TABLE} 
      (id, categoria, descricao, quantidade, valor_unitario, valor_total, tipo, data, observacoes, data_registro)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await query(sql, [
      id, categoria, descricao || '', cleanQty || 1, cleanUnit,
      calculatedTotal, tipo, dataDB, observacoes || '', todayStr
    ]);

    // Create junction table record based on tipo
    if (tipo === 'Entrada' && aluno_id) {
      // Student enrollment - use ci_financeiro_aluno
      await query(`
        INSERT INTO ${TABLES.FINANCEIRO_ALUNO}
        (aluno_id, financeiro_id, turma_id, valor_matricula, tipo, data)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [aluno_id, id, turma_id, calculatedTotal, tipo, dataDB]);
      console.log(`✅ [Financeiro] Vínculo financeiro-aluno criado`);
    } else {
      // Class expense - use ci_financeiro_turma
      await query(`
        INSERT INTO ${TABLES.FINANCEIRO_TURMA}
        (financeiro_id, turma_id, tipo, valor, data)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, turma_id, tipo, calculatedTotal, dataDB]);
      console.log(`✅ [Financeiro] Vínculo financeiro-turma criado`);
    }

    res.status(201).json(formatFinanceiro(result.rows[0]));
  } catch (error) {
    console.error('❌ [Financeiro] Erro ao criar registro:', error.message);
    console.error('   Código:', error.code);

    if (error.code === '23502') {
      res.status(400).json({
        error: 'Campo obrigatório não preenchido',
        details: error.message
      });
    } else if (error.code === '23503') {
      res.status(400).json({
        error: 'Referência inválida',
        details: 'Turma ou aluno não encontrado'
      });
    } else if (error.code === '23505') {
      res.status(400).json({
        error: 'Registro duplicado',
        details: error.message
      });
    } else {
      res.status(500).json({ error: 'Erro ao criar registro', details: error.message });
    }
  }
};

// Atualizar registro
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      categoria, descricao, quantidade, valor_unitario,
      valor_total, tipo, data, observacoes
    } = req.body;

    const sql = `
      UPDATE ${TABLE} SET
        categoria = $1, descricao = $2, quantidade = $3, valor_unitario = $4,
        valor_total = $5, tipo = $6, data = $7, observacoes = $8
      WHERE id = $9
      RETURNING *
    `;

    const cleanUnit = typeof valor_unitario === 'string'
      ? parseFloat(valor_unitario.replace(/\./g, '').replace(',', '.'))
      : valor_unitario;
    const cleanQty = typeof quantidade === 'string' ? parseInt(quantidade) : quantidade;
    const dataDB = parseDate(data);

    const result = await query(sql, [
      categoria, descricao, cleanQty, cleanUnit,
      valor_total, tipo, dataDB, observacoes, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    res.json(formatFinanceiro(result.rows[0]));
  } catch (error) {
    console.error('Error updating registro:', error);
    res.status(500).json({ error: 'Erro ao atualizar registro' });
  }
};

// Atualizar campo específico
exports.updateField = async (req, res) => {
  try {
    const { id } = req.params;
    const { field, value } = req.body;

    const allowedFields = [
      'categoria', 'descricao', 'quantidade', 'valor_unitario',
      'valor_total', 'tipo', 'data', 'turma_id', 'observacoes'
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Campo não permitido para atualização' });
    }

    let sql;
    let params;
    let processedValue = value;

    if (field === 'valor_unitario' && typeof value === 'string') {
      processedValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
    }
    if (field === 'data') {
      processedValue = parseDate(value);
    }

    if (field === 'quantidade' || field === 'valor_unitario') {
      sql = `
        UPDATE ${TABLE} SET 
          ${field} = $1,
          valor_total = (
            CASE 
              WHEN '${field}' = 'quantidade' THEN CAST($1 AS DECIMAL) * valor_unitario
              ELSE quantidade * CAST($1 AS DECIMAL)
            END
          )
        WHERE id = $2 
        RETURNING *
      `;
      params = [processedValue, id];
    } else {
      sql = `
        UPDATE ${TABLE} SET ${field} = $1 WHERE id = $2 
        RETURNING *
      `;
      params = [processedValue, id];
    }

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    res.json(formatFinanceiro(result.rows[0]));
  } catch (error) {
    console.error('Error updating registro field:', error);
    res.status(500).json({ error: 'Erro ao atualizar campo do registro' });
  }
};

// Deletar registro
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // First get the financeiro record to check observacoes
    const financeiroResult = await query(`SELECT observacoes FROM ${TABLE} WHERE id = $1`, [id]);

    if (financeiroResult.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const observacoes = financeiroResult.rows[0].observacoes || '';

    // Check if this record is linked to a student via observacoes pattern
    // Pattern: "(Ref: AlunoID: uuid)"
    const match = observacoes.match(/\(Ref: AlunoID: ([a-f0-9-]+)\)/);

    if (match && match[1]) {
      const alunoId = match[1];
      await query(`DELETE FROM ${TABLES.ALUNOS} WHERE id = $1`, [alunoId]);
      console.log(`✅ [Financeiro] Aluno associado (ID: ${alunoId}) deletado.`);
    }

    // Explicitly delete from junction tables first to ensure cascade works or to handle it manually if cascade fails
    await query(`DELETE FROM ${TABLES.FINANCEIRO_ALUNO} WHERE financeiro_id = $1`, [id]);
    await query(`DELETE FROM ${TABLES.FINANCEIRO_TURMA} WHERE financeiro_id = $1`, [id]);

    // Then delete the financial record
    const result = await query(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    res.json({ message: 'Registro financeiro deletado com sucesso', registro: formatFinanceiro(result.rows[0]) });
  } catch (error) {
    console.error('Error deleting registro:', error);
    res.status(500).json({ error: 'Erro ao deletar registro' });
  }
};

// Buscar por tipo
exports.getByTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    // Sort by date (DATE type)
    const sql = `SELECT * FROM ${TABLE} WHERE tipo = $1 ORDER BY data DESC`;
    const result = await query(sql, [tipo]);
    const formatted = result.rows.map(formatFinanceiro);
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching by tipo:', error);
    res.status(500).json({ error: 'Erro ao buscar por tipo' });
  }
};

// Fix Data Endpoint
exports.fixData = async (req, res) => {
  try {
    console.log('🔧 Executing data fix...');

    // 1. Fix 190000.00 -> 1900.00
    const updateResult = await query(`
      UPDATE ${TABLE} 
      SET valor_unitario = 1900.00, valor_total = 1900.00
      WHERE valor_unitario = 190000.00
      RETURNING id, categoria, valor_unitario
    `);

    // 2. Delete invalid date '34/44/3242'
    // This might fail if data is already DATE type and '34/44/3242' is not there or invalid.
    // If it's DATE type, '34/44/3242' wouldn't exist unless it was inserted before migration or forced.
    // We can try to delete it if it matches, but since it's DATE, we can't query it as string like that easily if it's not a valid date.
    // If the column is DATE, '34/44/3242' is impossible to exist.
    // So we skip this or just log.

    res.json({
      message: 'Data fix executed',
      updated: updateResult.rows,
      deleted: []
    });
  } catch (error) {
    console.error('Error fixing data:', error);
    res.status(500).json({ error: 'Erro ao corrigir dados', details: error.message });
  }
};
