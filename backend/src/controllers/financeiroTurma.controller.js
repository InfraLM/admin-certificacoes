const { query, TABLES } = require('../config/database');
const crypto = require('crypto');
const { formatDate, parseDate } = require('../utils/dateUtils');

const TABLE = TABLES.FINANCEIRO_TURMA;

// Função para gerar ID único
const generateId = () => crypto.randomUUID();

// Helper to format
const formatFinanceiroTurma = (item) => {
    if (!item) return null;
    return {
        ...item,
        data: formatDate(item.data),
        data_financeiro: item.data_financeiro ? formatDate(item.data_financeiro) : undefined,
        data_evento: item.data_evento ? formatDate(item.data_evento) : undefined
    };
};

// Listar todas as relações turma-financeiro
exports.getAll = async (req, res) => {
    try {
        const sql = `
      SELECT 
        ft.*,
        f.categoria,
        f.descricao,
        f.quantidade,
        f.valor_unitario,
        f.valor_total,
        f.data as data_financeiro,
        f.observacoes,
        t.nome_turma as turma_nome,
        t.data_evento
      FROM ${TABLE} ft
      INNER JOIN ${TABLES.FINANCEIRO} f ON ft.financeiro_id = f.id
      INNER JOIN ${TABLES.TURMAS} t ON ft.turma_id = t.id
      ORDER BY ft.data DESC
    `;
        const result = await query(sql);
        const formatted = result.rows.map(formatFinanceiroTurma);
        res.json(formatted);
    } catch (error) {
        console.error('❌ [FinanceiroTurma] Erro ao buscar relações:', error.message);
        res.status(500).json({ error: 'Erro ao buscar relações turma-financeiro', details: error.message });
    }
};

// Buscar por turma (gastos da turma)
exports.getByTurma = async (req, res) => {
    try {
        const { turmaId } = req.params;
        const sql = `
      SELECT 
        ft.*,
        f.categoria,
        f.descricao,
        f.quantidade,
        f.valor_unitario,
        f.valor_total,
        f.tipo,
        f.data as data_financeiro,
        f.observacoes
      FROM ${TABLE} ft
      INNER JOIN ${TABLES.FINANCEIRO} f ON ft.financeiro_id = f.id
      WHERE ft.turma_id = $1
      ORDER BY ft.data DESC
    `;
        const result = await query(sql, [turmaId]);
        const formatted = result.rows.map(formatFinanceiroTurma);
        res.json(formatted);
    } catch (error) {
        console.error('❌ [FinanceiroTurma] Erro ao buscar por turma:', error.message);
        res.status(500).json({ error: 'Erro ao buscar gastos da turma' });
    }
};

// Criar nova relação
exports.create = async (req, res) => {
    try {
        const { financeiro_id, turma_id, tipo, valor, data } = req.body;

        // Validar campos obrigatórios
        if (!financeiro_id || !turma_id) {
            return res.status(400).json({
                error: 'Campos obrigatórios não preenchidos',
                details: 'financeiro_id e turma_id são obrigatórios'
            });
        }

        const sql = `
      INSERT INTO ${TABLE} (financeiro_id, turma_id, tipo, valor, data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const dataDB = parseDate(data);

        const result = await query(sql, [
            financeiro_id,
            turma_id,
            tipo || 'Saída',
            valor,
            dataDB
        ]);

        res.status(201).json(formatFinanceiroTurma(result.rows[0]));
    } catch (error) {
        console.error('❌ [FinanceiroTurma] Erro ao criar relação:', error.message);
        console.error('   Código:', error.code);

        if (error.code === '23505') {
            res.status(400).json({
                error: 'Relação duplicada',
                details: 'Esta combinação de financeiro-turma já existe'
            });
        } else if (error.code === '23503') {
            res.status(400).json({
                error: 'Referência inválida',
                details: 'Financeiro ou turma não encontrados'
            });
        } else {
            res.status(500).json({ error: 'Erro ao criar relação', details: error.message });
        }
    }
};

// Deletar relação
exports.delete = async (req, res) => {
    try {
        const { financeiro_id, turma_id } = req.params;

        const result = await query(
            `DELETE FROM ${TABLE} WHERE financeiro_id = $1 AND turma_id = $2 RETURNING *`,
            [financeiro_id, turma_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Relação não encontrada' });
        }

        res.json({ message: 'Relação deletada com sucesso', relacao: formatFinanceiroTurma(result.rows[0]) });
    } catch (error) {
        console.error('❌ [FinanceiroTurma] Erro ao deletar:', error.message);
        res.status(500).json({ error: 'Erro ao deletar relação' });
    }
};
