const express = require('express');
const router = express.Router();
const financeiroController = require('../controllers/financeiro.controller');

// GET /api/financeiro/fix-data - Corrigir dados (Temporário)
router.get('/fix-data', financeiroController.fixData);

// GET /api/financeiro - Listar todos os registros
router.get('/', financeiroController.getAll);

// GET /api/financeiro/resumo - Obter resumo financeiro
router.get('/resumo', financeiroController.getResumo);

// GET /api/financeiro/:id - Buscar registro por ID
router.get('/:id', financeiroController.getById);

// POST /api/financeiro - Criar novo registro
router.post('/', financeiroController.create);

// PUT /api/financeiro/:id - Atualizar registro
router.put('/:id', financeiroController.update);

// PATCH /api/financeiro/:id - Atualizar campo específico
router.patch('/:id', financeiroController.updateField);

// DELETE /api/financeiro/:id - Deletar registro
router.delete('/:id', financeiroController.delete);

// GET /api/financeiro/tipo/:tipo - Buscar por tipo (Entrada/Saída)
router.get('/tipo/:tipo', financeiroController.getByTipo);

module.exports = router;
