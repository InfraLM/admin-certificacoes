const { query, TABLES } = require('../config/database');
const crypto = require('crypto');
const { formatDate, parseDate, getTodayDB } = require('../utils/dateUtils');

const TABLE = TABLES.ALUNO_TURMA; // ci_aluno_turma

// Função para gerar ID único
const generateId = () => crypto.randomUUID();

// Helper to format aluno_turma dates
const formatAlunoTurma = (item) => {
  if (!item) return null;
  return {
    ...item,
    data_matricula: formatDate(item.data_matricula),
  };
};

// Listar todas as inscrições
exports.getAll = async (req, res) => {
  try {
    const sql = `
      SELECT 
        at.*,
        a.nome as aluno_nome,
        a.email as aluno_email,
        t.nome_turma as turma_nome
      FROM ${TABLE} at
      LEFT JOIN ${TABLES.ALUNOS} a ON at.aluno_id = a.id
      LEFT JOIN ${TABLES.TURMAS} t ON at.turma_id = t.id
      ORDER BY at.data_matricula DESC
    `;
    const result = await query(sql);
    const formatted = result.rows.map(formatAlunoTurma);
    res.json(formatted);
  } catch (error) {
    console.error('❌ [AlunoTurma] Erro ao buscar inscrições:', error.message);
    console.error('   Código:', error.code);
    res.status(500).json({ error: 'Erro ao buscar inscrições', details: error.message });
  }
};

// Buscar inscrição por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        at.*,
        a.nome as aluno_nome,
        t.nome_turma as turma_nome
      FROM ${TABLE} at
      LEFT JOIN ${TABLES.ALUNOS} a ON at.aluno_id = a.id
      LEFT JOIN ${TABLES.TURMAS} t ON at.turma_id = t.id
      WHERE at.id = $1
    `;
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }

    res.json(formatAlunoTurma(result.rows[0]));
  } catch (error) {
    console.error('Error fetching inscricao:', error);
    res.status(500).json({ error: 'Erro ao buscar inscrição' });
  }
};

// Criar nova inscrição
exports.create = async (req, res) => {
  try {
    const { aluno_id, turma_id, data_matricula, status } = req.body;

    // Verificar se já existe inscrição
    const existingCheck = await query(
      `SELECT id FROM ${TABLE} WHERE aluno_id = $1 AND turma_id = $2`,
      [aluno_id, turma_id]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Aluno já está inscrito nesta turma' });
    }

    // Gerar ID único
    const id = generateId();

    const sql = `
      INSERT INTO ${TABLE} (id, aluno_id, turma_id, data_matricula, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const dataMatriculaDB = parseDate(data_matricula) || getTodayDB();

    const result = await query(sql, [
      id, aluno_id, turma_id, dataMatriculaDB, status || 'Inscrito'
    ]);

    res.status(201).json(formatAlunoTurma(result.rows[0]));
  } catch (error) {
    console.error('❌ [AlunoTurma] Erro ao criar inscrição:', error.message);
    console.error('   Código:', error.code);

    if (error.code === '23502') {
      res.status(400).json({
        error: 'Campo obrigatório não preenchido',
        details: error.message
      });
    } else {
      res.status(500).json({ error: 'Erro ao criar inscrição', details: error.message });
    }
  }
};

// Atualizar inscrição
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { aluno_id, turma_id, data_matricula, status } = req.body;

    const sql = `
      UPDATE ${TABLE} SET
        aluno_id = $1, turma_id = $2, data_matricula = $3, status = $4
      WHERE id = $5
      RETURNING *
    `;

    const dataMatriculaDB = parseDate(data_matricula);

    const result = await query(sql, [aluno_id, turma_id, dataMatriculaDB, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }

    res.json(formatAlunoTurma(result.rows[0]));
  } catch (error) {
    console.error('Error updating inscricao:', error);
    res.status(500).json({ error: 'Erro ao atualizar inscrição' });
  }
};

// Deletar inscrição
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }

    res.json({ message: 'Inscrição deletada com sucesso', inscricao: formatAlunoTurma(result.rows[0]) });
  } catch (error) {
    console.error('Error deleting inscricao:', error);
    res.status(500).json({ error: 'Erro ao deletar inscrição' });
  }
};

// Buscar turmas do aluno
exports.getByAluno = async (req, res) => {
  try {
    const { alunoId } = req.params;
    const sql = `
      SELECT 
        at.*,
        t.nome_turma as turma_nome,
        t.data_evento as data_inicio, -- data_evento is the main date for turma
        t.horario,
        t.status as turma_status,
        t.capacidade -- valor is not in turma table directly usually, unless added. User schema says 'capacidade', 'instrutor'. No 'valor' in ci_turmas.
      FROM ${TABLE} at
      INNER JOIN ${TABLES.TURMAS} t ON at.turma_id = t.id
      WHERE at.aluno_id = $1
      ORDER BY at.data_matricula DESC
    `;
    const result = await query(sql, [alunoId]);

    const formatted = result.rows.map(row => ({
      ...formatAlunoTurma(row),
      data_inicio: formatDate(row.data_inicio)
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching turmas do aluno:', error);
    res.status(500).json({ error: 'Erro ao buscar turmas do aluno' });
  }
};

// Buscar alunos da turma
exports.getByTurma = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const sql = `
      SELECT 
        at.*,
        a.nome as aluno_nome,
        a.email as aluno_email,
        a.telefone as aluno_telefone,
        a.status as aluno_status
      FROM ${TABLE} at
      INNER JOIN ${TABLES.ALUNOS} a ON at.aluno_id = a.id
      WHERE at.turma_id = $1
      ORDER BY a.nome
    `;
    const result = await query(sql, [turmaId]);
    const formatted = result.rows.map(formatAlunoTurma);
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching alunos da turma:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos da turma' });
  }
};
