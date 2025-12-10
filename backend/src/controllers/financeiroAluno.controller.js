const { query, TABLES } = require('../config/database');
const crypto = require('crypto');
const { formatDate, parseDate } = require('../utils/dateUtils');

const TABLE = TABLES.FINANCEIRO_ALUNO;

// Função para gerar ID único
const generateId = () => crypto.randomUUID();

// Helper to format
const formatFinanceiroAluno = (item) => {
    if (!item) return null;
    return {
        ...item,
        data: formatDate(item.data),
        data_financeiro: item.data_financeiro ? formatDate(item.data_financeiro) : undefined
    };
};

// Listar todas as relações aluno-financeiro
exports.getAll = async (req, res) => {
    try {
        const sql = `
      SELECT 
        fa.*,
        a.nome as aluno_nome,
        a.email as aluno_email,
        f.categoria,
        f.descricao,
        f.valor_total,
        t.nome_turma as turma_nome
      FROM ${TABLE} fa
      LEFT JOIN ${TABLES.ALUNOS} a ON fa.aluno_id = a.id
      LEFT JOIN ${TABLES.FINANCEIRO} f ON fa.financeiro_id = f.id
      LEFT JOIN ${TABLES.TURMAS} t ON fa.turma_id = t.id
      ORDER BY fa.data DESC
    `;
        const result = await query(sql);
        const formatted = result.rows.map(formatFinanceiroAluno);
        res.json(formatted);
    } catch (error) {
        console.error('❌ [FinanceiroAluno] Erro ao buscar relações:', error.message);
        res.status(500).json({ error: 'Erro ao buscar relações aluno-financeiro', details: error.message });
    }
};

// Buscar por aluno
exports.getByAluno = async (req, res) => {
    try {
        const { alunoId } = req.params;
        const sql = `
      SELECT 
        fa.*,
        f.categoria,
        f.descricao,
        f.valor_total,
        f.tipo,
        f.data as data_financeiro,
        t.nome_turma as turma_nome
      FROM ${TABLE} fa
      INNER JOIN ${TABLES.FINANCEIRO} f ON fa.financeiro_id = f.id
      LEFT JOIN ${TABLES.TURMAS} t ON fa.turma_id = t.id
      WHERE fa.aluno_id = $1
      ORDER BY fa.data DESC
    `;
        const result = await query(sql, [alunoId]);
        const formatted = result.rows.map(formatFinanceiroAluno);
        res.json(formatted);
    } catch (error) {
        console.error('❌ [FinanceiroAluno] Erro ao buscar por aluno:', error.message);
        res.status(500).json({ error: 'Erro ao buscar financeiro do aluno' });
    }
};

// Buscar por turma (alunos matriculados)
exports.getByTurma = async (req, res) => {
    try {
        const { turmaId } = req.params;
        const sql = `
      SELECT 
        fa.*,
        a.nome as aluno_nome,
        a.email as aluno_email,
        a.cpf,
        f.categoria,
        f.descricao,
        f.valor_total
      FROM ${TABLE} fa
      INNER JOIN ${TABLES.ALUNOS} a ON fa.aluno_id = a.id
      INNER JOIN ${TABLES.FINANCEIRO} f ON fa.financeiro_id = f.id
      WHERE fa.turma_id = $1
      ORDER BY a.nome
    `;
        const result = await query(sql, [turmaId]);
        const formatted = result.rows.map(formatFinanceiroAluno);
        res.json(formatted);
    } catch (error) {
        console.error('❌ [FinanceiroAluno] Erro ao buscar por turma:', error.message);
        res.status(500).json({ error: 'Erro ao buscar alunos da turma' });
    }
};

// Criar nova relação
exports.create = async (req, res) => {
    try {
        const { aluno_id, financeiro_id, turma_id, valor_matricula, tipo, data } = req.body;

        // Validar campos obrigatórios
        if (!aluno_id || !financeiro_id || !turma_id) {
            return res.status(400).json({
                error: 'Campos obrigatórios não preenchidos',
                details: 'aluno_id, financeiro_id e turma_id são obrigatórios'
            });
        }

        const sql = `
      INSERT INTO ${TABLE} (aluno_id, financeiro_id, turma_id, valor_matricula, tipo, data)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

        const dataDB = parseDate(data);

        const result = await query(sql, [
            aluno_id,
            financeiro_id,
            turma_id,
            valor_matricula,
            tipo || 'Entrada',
            dataDB
        ]);

        res.status(201).json(formatFinanceiroAluno(result.rows[0]));
    } catch (error) {
        console.error('❌ [FinanceiroAluno] Erro ao criar relação:', error.message);
        console.error('   Código:', error.code);

        if (error.code === '23505') {
            res.status(400).json({
                error: 'Relação duplicada',
                details: 'Esta combinação de aluno-financeiro-turma já existe'
            });
        } else if (error.code === '23503') {
            res.status(400).json({
                error: 'Referência inválida',
                details: 'Aluno, financeiro ou turma não encontrados'
            });
        } else {
            res.status(500).json({ error: 'Erro ao criar relação', details: error.message });
        }
    }
};

// Deletar relação
exports.delete = async (req, res) => {
    try {
        const { aluno_id, financeiro_id } = req.params;

        const result = await query(
            `DELETE FROM ${TABLE} WHERE aluno_id = $1 AND financeiro_id = $2 RETURNING *`,
            [aluno_id, financeiro_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Relação não encontrada' });
        }

        res.json({ message: 'Relação deletada com sucesso', relacao: formatFinanceiroAluno(result.rows[0]) });
    } catch (error) {
        console.error('❌ [FinanceiroAluno] Erro ao deletar:', error.message);
        res.status(500).json({ error: 'Erro ao deletar relação' });
    }
};
