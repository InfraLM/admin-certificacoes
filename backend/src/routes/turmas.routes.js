const express = require('express');
const router = express.Router();
const turmasController = require('../controllers/turmas.controller');

// GET /api/turmas - Listar todas as turmas
router.get('/', turmasController.getAll);

// GET /api/turmas/:id - Buscar turma por ID
router.get('/:id', turmasController.getById);

// POST /api/turmas - Criar nova turma
router.post('/', turmasController.create);

// PUT /api/turmas/:id - Atualizar turma
router.put('/:id', turmasController.update);

// PATCH /api/turmas/:id - Atualizar campo específico
router.patch('/:id', turmasController.updateField);

// DELETE /api/turmas/:id - Deletar turma
router.delete('/:id', turmasController.delete);

// GET /api/turmas/:id/alunos - Buscar alunos da turma
router.get('/:id/alunos', turmasController.getAlunos);

// GET /api/turmas/:id/financeiro - Buscar financeiro da turma
router.get('/:id/financeiro', turmasController.getFinanceiro);

module.exports = router;
