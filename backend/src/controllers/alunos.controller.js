const { query, TABLES } = require('../config/database');
const crypto = require('crypto');
const { formatDate, parseDate, getTodayDB } = require('../utils/dateUtils');

const TABLE = TABLES.ALUNOS; // ci_alunos

// Função para gerar ID único
const generateId = () => crypto.randomUUID();

// Helper to format aluno dates for frontend
const formatAluno = (aluno) => {
  if (!aluno) return null;
  return {
    ...aluno,
    data_nascimento: formatDate(aluno.data_nascimento),
    data_cadastro: formatDate(aluno.data_cadastro),
    data_matricula: formatDate(aluno.data_matricula),
  };
};

// Listar todos os alunos
exports.getAll = async (req, res) => {
  try {
    const { search, status, vendedor } = req.query;
    let sql = `SELECT * FROM ${TABLE}`;
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`(nome ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1} OR cpf ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (status) {
      if (status.includes(',')) {
        const statuses = status.split(',').map(s => s.trim());
        conditions.push(`status = ANY($${params.length + 1})`);
        params.push(statuses);
      } else {
        conditions.push(`status = $${params.length + 1}`);
        params.push(status);
      }
    }

    if (vendedor) {
      conditions.push(`vendedor = $${params.length + 1}`);
      params.push(vendedor);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Sort by data_matricula (DATE type)
    sql += ` ORDER BY data_matricula DESC`;

    const result = await query(sql, params);
    const formatted = result.rows.map(formatAluno);
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching alunos:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    res.json(formatAluno(result.rows[0]));
  } catch (error) {
    console.error('Error fetching aluno:', error);
    res.status(500).json({ error: 'Erro ao buscar aluno' });
  }
};

// Criar novo aluno
exports.create = async (req, res) => {
  try {
    const {
      nome, email, telefone, data_nascimento, cpf, endereco,
      status, data_matricula, observacoes, vendedor, valor_venda,
      parcelas, pos_graduacao, turma_id
    } = req.body;

    // Gerar ID único
    const id = generateId();

    const sql = `
      INSERT INTO ${TABLE} 
      (id, nome, email, telefone, data_nascimento, cpf, endereco, status, 
       data_matricula, observacoes, vendedor, valor_venda, parcelas, pos_graduacao, data_cadastro)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    // Prepare dates
    const todayDB = getTodayDB();
    const dataNascimentoDB = parseDate(data_nascimento);
    const dataMatriculaDB = parseDate(data_matricula) || todayDB;

    // Ensure numeric values are cleaned
    let cleanValorVenda = valor_venda;
    if (typeof valor_venda === 'string') {
      if (valor_venda.includes(',')) {
        cleanValorVenda = parseFloat(valor_venda.replace(/\./g, '').replace(',', '.'));
      } else {
        cleanValorVenda = parseFloat(valor_venda);
      }
    }

    const cleanParcelas = typeof parcelas === 'string' ? parseInt(parcelas) : parcelas;

    // Validate turma_id is required
    if (!turma_id) {
      return res.status(400).json({
        error: 'Turma é obrigatória',
        details: 'Selecione uma turma para o aluno'
      });
    }

    // Create financeiro record for this student
    if (cleanValorVenda) {
      const financeiroId = crypto.randomUUID();
      const financeiroObs = `Matrícula de ${nome}`;

      // Insert into ci_financeiro (without turma_id)
      await query(`
        INSERT INTO ${TABLES.FINANCEIRO} 
        (id, categoria, descricao, quantidade, valor_unitario, valor_total, tipo, data, observacoes, data_registro)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        financeiroId,
        'Venda de Curso',
        `Matrícula ${nome}`,
        1,
        cleanValorVenda,
        cleanValorVenda,
        'Entrada',
        todayDB,
        financeiroObs,
        todayDB // data_registro is varchar(30) but we can store YYYY-MM-DD or whatever. User said "data_registro varchar(30)". Let's keep it simple.
      ]);

      // Create link in ci_financeiro_aluno
      await query(`
        INSERT INTO ${TABLES.FINANCEIRO_ALUNO}
        (aluno_id, financeiro_id, turma_id, valor_matricula, tipo, data)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        id,
        financeiroId,
        turma_id,
        cleanValorVenda,
        'Entrada',
        todayDB
      ]);

      console.log(`✅ [Alunos] Registro financeiro criado: ${financeiroId} para aluno ${id}`);
      console.log(`✅ [Alunos] Vínculo financeiro-aluno criado na turma ${turma_id}`);
    }

    const result = await query(sql, [
      id, nome, email, telefone, dataNascimentoDB, cpf, endereco,
      status || 'Em Onboarding', dataMatriculaDB, observacoes || '',
      vendedor, cleanValorVenda, cleanParcelas, pos_graduacao || false, todayDB
    ]);

    // Se houver turma_id, criar o vínculo na tabela ci_aluno_turma
    if (turma_id) {
      const alunoTurmaId = crypto.randomUUID();
      const alunoTurmaSql = `
        INSERT INTO ${TABLES.ALUNO_TURMA} (id, aluno_id, turma_id, data_matricula, status)
        VALUES ($1, $2, $3, $4, $5)
      `;

      await query(alunoTurmaSql, [
        alunoTurmaId, id, turma_id, dataMatriculaDB, 'Inscrito'
      ]);

      console.log(`✅ [Alunos] Aluno ${id} vinculado à turma ${turma_id}`);
    }

    res.status(201).json(formatAluno(result.rows[0]));
  } catch (error) {
    console.error('❌ [Alunos] Erro ao criar aluno:', error.message);
    console.error('   Código:', error.code);

    if (error.code === '23502') {
      res.status(400).json({
        error: 'Campo obrigatório não preenchido',
        details: error.message
      });
    } else if (error.code === '23505') {
      res.status(400).json({
        error: 'Este email já está cadastrado',
        details: 'Use um email diferente'
      });
    } else {
      res.status(500).json({ error: 'Erro ao criar aluno', details: error.message });
    }
  }
};

// Atualizar aluno
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, email, telefone, data_nascimento, cpf, endereco,
      status, data_matricula, observacoes, vendedor, valor_venda,
      parcelas, pos_graduacao, turma_id
    } = req.body;

    const sql = `
      UPDATE ${TABLE} SET
        nome = $1, email = $2, telefone = $3, data_nascimento = $4,
        cpf = $5, endereco = $6, status = $7, data_matricula = $8,
        observacoes = $9, vendedor = $10, valor_venda = $11,
        parcelas = $12, pos_graduacao = $13
      WHERE id = $14
      RETURNING *
    `;

    // Ensure numeric values are cleaned
    let cleanValorVenda = valor_venda;
    if (typeof valor_venda === 'string') {
      if (valor_venda.includes(',')) {
        cleanValorVenda = parseFloat(valor_venda.replace(/\./g, '').replace(',', '.'));
      } else {
        cleanValorVenda = parseFloat(valor_venda);
      }
    }
    const cleanParcelas = typeof parcelas === 'string' ? parseInt(parcelas) : parcelas;

    const dataNascimentoDB = parseDate(data_nascimento);
    const dataMatriculaDB = parseDate(data_matricula);

    const result = await query(sql, [
      nome, email, telefone, dataNascimentoDB, cpf, endereco,
      status, dataMatriculaDB, observacoes, vendedor, cleanValorVenda,
      cleanParcelas, pos_graduacao, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    // Handle turma transfer if turma_id is provided
    if (turma_id) {
      // Check if student already has a record in ci_aluno_turma
      const existingRecord = await query(
        `SELECT id FROM ${TABLES.ALUNO_TURMA} WHERE aluno_id = $1`,
        [id]
      );

      const todayDB = getTodayDB();

      if (existingRecord.rows.length > 0) {
        // UPDATE existing record with new turma_id
        // This prevents duplicate entries in class occupancy views
        await query(`
          UPDATE ${TABLES.ALUNO_TURMA} 
          SET turma_id = $1, data_matricula = $2
          WHERE aluno_id = $3
        `, [turma_id, todayDB, id]);

        console.log(`✅ [Alunos] Aluno ${id} transferido para turma ${turma_id} (UPDATE)`);
      } else {
        // INSERT new record if student doesn't have one yet
        const alunoTurmaId = crypto.randomUUID();
        await query(`
          INSERT INTO ${TABLES.ALUNO_TURMA} (id, aluno_id, turma_id, data_matricula, status)
          VALUES ($1, $2, $3, $4, $5)
        `, [alunoTurmaId, id, turma_id, todayDB, 'Inscrito']);

        console.log(`✅ [Alunos] Aluno ${id} vinculado à turma ${turma_id} (INSERT)`);
      }
    }

    res.json(formatAluno(result.rows[0]));
  } catch (error) {
    console.error('Error updating aluno:', error);
    res.status(500).json({ error: 'Erro ao atualizar aluno' });
  }
};

// Atualizar campo específico
exports.updateField = async (req, res) => {
  try {
    const { id } = req.params;
    const { field, value } = req.body;

    // Campos permitidos para atualização
    const allowedFields = [
      'nome', 'email', 'telefone', 'data_nascimento', 'cpf', 'endereco',
      'status', 'observacoes', 'vendedor', 'valor_venda', 'parcelas', 'pos_graduacao'
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Campo não permitido para atualização' });
    }

    let processedValue = value;
    if (field === 'data_nascimento' || field === 'data_matricula') {
      processedValue = parseDate(value);
    }

    const sql = `UPDATE ${TABLE} SET ${field} = $1 WHERE id = $2 RETURNING *`;
    const result = await query(sql, [processedValue, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    res.json(formatAluno(result.rows[0]));
  } catch (error) {
    console.error('Error updating aluno field:', error);
    res.status(500).json({ error: 'Erro ao atualizar campo do aluno' });
  }
};

// Deletar aluno
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    console.log(`✅ [Alunos] Aluno ${id} deletado (cascades handled automatically)`);
    res.json({ message: 'Aluno deletado com sucesso', aluno: formatAluno(result.rows[0]) });
  } catch (error) {
    console.error('Error deleting aluno:', error);
    res.status(500).json({ error: 'Erro ao deletar aluno' });
  }
};

// Buscar por status
exports.getByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const result = await query(`SELECT * FROM ${TABLE} WHERE status = $1 ORDER BY nome`, [status]);
    const formatted = result.rows.map(formatAluno);
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching alunos by status:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos por status' });
  }
};

// Buscar por vendedor
exports.getByVendedor = async (req, res) => {
  try {
    const { vendedor } = req.params;
    // Sort by data_matricula (DATE type)
    const result = await query(`SELECT * FROM ${TABLE} WHERE vendedor = $1 
      ORDER BY data_matricula DESC`, [vendedor]);
    const formatted = result.rows.map(formatAluno);
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching alunos by vendedor:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos por vendedor' });
  }
};
