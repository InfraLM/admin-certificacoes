const { query, TABLES } = require('../config/database');
const crypto = require('crypto');
const { formatDate, parseDate } = require('../utils/dateUtils');

const TABLE = TABLES.TURMAS; // ci_turmas

// Função para gerar ID único
const generateId = () => crypto.randomUUID();

// Helper to format turma dates
const formatTurma = (turma) => {
  if (!turma) return null;
  return {
    ...turma,
    data_evento: formatDate(turma.data_evento),
  };
};

// Listar todas as turmas
exports.getAll = async (req, res) => {
  console.log('🔥🔥🔥 [DEBUG] turmasController.getAll CHAMADO!');
  console.log('   Query params:', req.query);
  console.log('   URL:', req.url);
  console.log('   Path:', req.path);

  try {
    const { search, status } = req.query;
    let sql = `SELECT 
      id, nome_turma as nome, descricao, data_evento, horario, 
      "local", capacidade, instrutor, status
      FROM ${TABLE}`;
    const params = [];
    const conditions = [];

    console.log('📖 [Turmas] Buscando todas as turmas...');
    console.log('   Tabela:', TABLE);
    console.log('   Filtros:', { search, status });

    if (search) {
      conditions.push(`(nome_turma ILIKE $${params.length + 1} OR instrutor ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Sort by date (DATE type)
    sql += ` ORDER BY data_evento DESC`;

    const result = await query(sql, params);
    console.log('✅ [Turmas] Encontradas', result.rows.length, 'turmas');

    const formatted = result.rows.map(formatTurma);
    res.json(formatted);
  } catch (error) {
    console.error('❌ [Turmas] Erro ao buscar turmas:', error.message);
    console.error('   Código:', error.code);
    console.error('   SQL:', error.query);

    if (error.code === '42P01') {
      res.status(500).json({
        error: 'Erro ao buscar turmas',
        details: `Tabela '${TABLE}' não existe no banco de dados`
      });
    } else if (error.code === '42703') {
      res.status(500).json({
        error: 'Erro na estrutura das colunas',
        details: error.message
      });
    } else if (error.code === 'ECONNREFUSED') {
      res.status(500).json({
        error: 'Erro ao conectar ao banco de dados',
        details: 'Verifique as credenciais e se o banco está acessível'
      });
    } else {
      res.status(500).json({
        error: 'Erro ao buscar turmas',
        details: error.message
      });
    }
  }
};

// Buscar turma por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }

    res.json(formatTurma(result.rows[0]));
  } catch (error) {
    console.error('Error fetching turma:', error);
    res.status(500).json({ error: 'Erro ao buscar turma' });
  }
};

// Criar nova turma
exports.create = async (req, res) => {
  try {
    const {
      nome, descricao, data_evento, horario,
      local, capacidade, instrutor, status
    } = req.body;

    // Gerar ID único
    const id = generateId();

    console.log('📝 [Turmas] Criando nova turma...');
    console.log('   ID gerado:', id);
    console.log('   Dados recebidos:', {
      nome, descricao, data_evento, horario,
      local, capacidade, instrutor, status
    });

    const sql = `
      INSERT INTO ${TABLE} 
      (id, nome_turma, descricao, data_evento, horario, "local", capacidade, instrutor, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, nome_turma as nome, descricao, data_evento, horario, 
                "local", capacidade, instrutor, status
    `;

    // Clean numeric inputs
    const cleanCapacidade = typeof capacidade === 'string' ? parseInt(capacidade) : capacidade;
    const dataEventoDB = parseDate(data_evento);

    const result = await query(sql, [
      id, nome, descricao || '', dataEventoDB, horario || '',
      local || '', cleanCapacidade || 10, instrutor, status || 'Aberta'
    ]);

    console.log('✅ [Turmas] Turma criada com sucesso:', result.rows[0].id);
    res.status(201).json(formatTurma(result.rows[0]));
  } catch (error) {
    console.error('❌ [Turmas] Erro ao criar turma:', error.message);
    console.error('   Código:', error.code);
    console.error('   Stack:', error.stack);

    if (error.code === '42P01') {
      res.status(500).json({
        error: 'Erro ao criar turma',
        details: `Tabela '${TABLE}' não existe no banco de dados`
      });
    } else if (error.code === '42703') {
      res.status(500).json({
        error: 'Erro na estrutura das colunas',
        details: error.message + ' - Verifique os nomes das colunas no banco'
      });
    } else if (error.code === '23505') {
      res.status(400).json({
        error: 'Esta turma já existe',
        details: 'Verifique se todos os dados estão corretos'
      });
    } else if (error.code === '23502') {
      res.status(400).json({
        error: 'Campo obrigatório não preenchido',
        details: error.message
      });
    } else {
      res.status(500).json({
        error: 'Erro ao criar turma',
        details: error.message
      });
    }
  }
};

// Atualizar turma
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, descricao, data_evento, horario,
      local, capacidade, instrutor, status
    } = req.body;

    const sql = `
      UPDATE ${TABLE} SET
        nome_turma = $1, descricao = $2, data_evento = $3,
        horario = $4, "local" = $5, capacidade = $6, instrutor = $7,
        status = $8
      WHERE id = $9
      RETURNING id, nome_turma as nome, descricao, data_evento, horario,
                "local", capacidade, instrutor, status
    `;

    // Clean numeric inputs
    const cleanCapacidade = typeof capacidade === 'string' ? parseInt(capacidade) : capacidade;
    const dataEventoDB = parseDate(data_evento);

    const result = await query(sql, [
      nome, descricao, dataEventoDB, horario,
      local, cleanCapacidade, instrutor, status, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }

    res.json(formatTurma(result.rows[0]));
  } catch (error) {
    console.error('Error updating turma:', error);
    res.status(500).json({ error: 'Erro ao atualizar turma' });
  }
};

// Atualizar campo específico
exports.updateField = async (req, res) => {
  try {
    const { id } = req.params;
    const { field, value } = req.body;

    // Mapear campos do frontend para o banco de dados
    const fieldMapping = {
      'nome': 'nome_turma',
      'descricao': 'descricao',
      'data_evento': 'data_evento',
      'horario': 'horario',
      'local': '"local"',
      'capacidade': 'capacidade',
      'instrutor': 'instrutor',
      'status': 'status'
    };

    const dbField = fieldMapping[field];
    if (!dbField) {
      return res.status(400).json({ error: 'Campo não permitido para atualização' });
    }

    let processedValue = value;
    if (field === 'data_evento') {
      processedValue = parseDate(value);
    }

    const sql = `UPDATE ${TABLE} SET ${dbField} = $1 WHERE id = $2 
                 RETURNING id, nome_turma as nome, descricao, data_evento, horario,
                           "local", capacidade, instrutor, status`;
    const result = await query(sql, [processedValue, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }

    res.json(formatTurma(result.rows[0]));
  } catch (error) {
    console.error('Error updating turma field:', error);
    res.status(500).json({ error: 'Erro ao atualizar campo da turma' });
  }
};

// Deletar turma
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }

    res.json({ message: 'Turma deletada com sucesso', turma: formatTurma(result.rows[0]) });
  } catch (error) {
    console.error('Error deleting turma:', error);
    res.status(500).json({ error: 'Erro ao deletar turma' });
  }
};

// Buscar alunos da turma
exports.getAlunos = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT a.*, at.data_matricula as data_inscricao, at.status as inscricao_status
      FROM ${TABLES.ALUNOS} a
      INNER JOIN ${TABLES.ALUNO_TURMA} at ON a.id = at.aluno_id
      WHERE at.turma_id = $1
      ORDER BY a.nome
    `;
    const result = await query(sql, [id]);

    // Format dates for each student
    const formatted = result.rows.map(row => ({
      ...row,
      data_nascimento: formatDate(row.data_nascimento),
      data_cadastro: formatDate(row.data_cadastro),
      data_matricula: formatDate(row.data_matricula),
      data_inscricao: formatDate(row.data_inscricao)
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching turma alunos:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos da turma' });
  }
};

// Buscar financeiro da turma
exports.getFinanceiro = async (req, res) => {
  try {
    const { id } = req.params;

    // Fix: Join with junction tables to find financeiro for this turma
    const sql = `
      SELECT f.* 
      FROM ${TABLES.FINANCEIRO} f
      INNER JOIN ${TABLES.FINANCEIRO_TURMA} ft ON f.id = ft.financeiro_id
      WHERE ft.turma_id = $1
      UNION
      SELECT f.*
      FROM ${TABLES.FINANCEIRO} f
      INNER JOIN ${TABLES.FINANCEIRO_ALUNO} fa ON f.id = fa.financeiro_id
      WHERE fa.turma_id = $1
      ORDER BY data DESC
    `;

    const result = await query(sql, [id]);

    // Format dates
    const formattedRows = result.rows.map(row => ({
      ...row,
      data: formatDate(row.data)
    }));

    // Calcular totais
    const entradas = formattedRows
      .filter(r => r.tipo === 'Entrada')
      .reduce((acc, r) => acc + parseFloat(r.valor_total || 0), 0);

    const saidas = formattedRows
      .filter(r => r.tipo === 'Saída')
      .reduce((acc, r) => acc + parseFloat(r.valor_total || 0), 0);

    res.json({
      registros: formattedRows,
      resumo: {
        entradas,
        saidas,
        saldo: entradas - saidas
      }
    });
  } catch (error) {
    console.error('Error fetching turma financeiro:', error);
    res.status(500).json({ error: 'Erro ao buscar financeiro da turma' });
  }
};
